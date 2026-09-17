from __future__ import annotations

import io
import json
import re
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.models.presentation import Presentation

_ASSET_RE = re.compile(r"/static/uploads/([a-zA-Z0-9._-]+)")

_UPLOAD_DIR = Path(settings.database_url.replace("sqlite+aiosqlite:///", "")).parent / "uploads" if settings.database_url.replace("sqlite+aiosqlite:///", "") else Path("instance/uploads")


def _collect_asset_filenames(data: dict[str, Any]) -> set[str]:
    """Collect asset filenames referenced in presentation data."""
    raw = json.dumps(data)
    return set(_ASSET_RE.findall(raw))


def _rewrite_asset_urls(obj: Any, mapping: dict[str, str]) -> Any:
    """Rewrite /static/uploads/... URLs using filename mapping."""
    if isinstance(obj, str):
        def repl(m: re.Match[str]) -> str:
            fname = m.group(1)
            new_name = mapping.get(fname, fname)
            return f"/static/uploads/{new_name}"
        return _ASSET_RE.sub(repl, obj)
    if isinstance(obj, list):
        return [_rewrite_asset_urls(item, mapping) for item in obj]
    if isinstance(obj, dict):
        return {k: _rewrite_asset_urls(v, mapping) for k, v in obj.items()}
    return obj


async def build_export_zip(presentation: Presentation) -> tuple[bytes, str]:
    """Build zip package for a presentation.

    Structure:
      manifest.json
      variables/variables.json
      slices/{index:03d}-{slideId}.json
      assets/{filename}

    Returns zip bytes and filename.
    """
    try:
        data = json.loads(presentation.data) if isinstance(presentation.data, str) else presentation.data
        if not isinstance(data, dict):
            data = {}
    except json.JSONDecodeError:
        data = {}

    slides: list[dict[str, Any]] = data.get("slides", []) if isinstance(data.get("slides"), list) else []
    variables: list[dict[str, Any]] = data.get("variables", []) if isinstance(data.get("variables"), list) else []
    theme = data.get("theme", {"primary": "#18181b", "accent": "#18181b"})
    width = data.get("width", 1280)
    height = data.get("height", 720)

    asset_names = _collect_asset_filenames(data)

    manifest = {
        "title": presentation.title,
        "presentation_id": presentation.id,
        "owner_id": presentation.owner_id,
        "width": width,
        "height": height,
        "theme": theme,
        "slidesCount": len(slides),
        "variablesCount": len(variables),
        "created_at": presentation.created_at.isoformat() if presentation.created_at else None,
        "updated_at": presentation.updated_at.isoformat() if presentation.updated_at else None,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "version": 1,
    }

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False))
        zf.writestr("variables/variables.json", json.dumps(variables, indent=2, ensure_ascii=False))
        for idx, slide in enumerate(slides):
            slide_id = slide.get("id", f"slide-{idx}")
            name = f"slices/{idx:03d}-{slide_id}.json"
            zf.writestr(name, json.dumps(slide, indent=2, ensure_ascii=False))
        for fname in asset_names:
            src = _UPLOAD_DIR / fname
            if src.exists() and src.is_file():
                zf.write(src, arcname=f"assets/{fname}")

    filename = f"{presentation.title.replace(' ', '_') or 'presentacion'}.zip"
    return buf.getvalue(), filename


async def import_presentation_zip(file: UploadFile, owner_id: str) -> tuple[str, dict[str, Any]]:
    """Validate and import a zip package.

    Returns new title and data dict to create presentation.

    Raises HTTPException on invalid package.
    """
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Se requiere archivo .zip")

    raw = await file.read()
    if len(raw) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Archivo excede 200MB")
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    try:
        buf = io.BytesIO(raw)
        with zipfile.ZipFile(buf, "r") as zf:
            namelist = zf.namelist()
            if "manifest.json" not in namelist:
                raise HTTPException(status_code=400, detail="manifest.json no encontrado")
            if "variables/variables.json" not in namelist:
                raise HTTPException(status_code=400, detail="variables/variables.json no encontrado")

            try:
                manifest = json.loads(zf.read("manifest.json").decode("utf-8"))
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"manifest.json inválido: {exc}") from exc

            title = str(manifest.get("title") or "Importada").strip() or "Importada"
            width = manifest.get("width", 1280)
            height = manifest.get("height", 720)
            theme = manifest.get("theme", {"primary": "#18181b", "accent": "#18181b"})
            try:
                width = int(width)
                height = int(height)
            except Exception:
                width, height = 1280, 720

            try:
                variables = json.loads(zf.read("variables/variables.json").decode("utf-8"))
                if not isinstance(variables, list):
                    variables = []
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"variables.json inválido: {exc}") from exc

            slice_names = sorted([n for n in namelist if n.startswith("slices/") and n.endswith(".json")])
            if not slice_names and manifest.get("slidesCount", 0) > 0:
                raise HTTPException(status_code=400, detail="No se encontraron slices")

            slides: list[dict[str, Any]] = []
            for sname in slice_names:
                try:
                    slide = json.loads(zf.read(sname).decode("utf-8"))
                    if not isinstance(slide, dict) or "id" not in slide:
                        raise ValueError("slice sin id")
                    slides.append(slide)
                except Exception as exc:
                    raise HTTPException(status_code=400, detail=f"Slice {sname} inválido: {exc}") from exc

            asset_names = [n for n in namelist if n.startswith("assets/") and not n.endswith("/")]
            mapping: dict[str, str] = {}
            _UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            for aname in asset_names:
                fname = Path(aname).name
                if not fname or ".." in aname or fname.startswith("."):
                    continue
                if len(fname) > 255:
                    continue
                try:
                    data_bytes = zf.read(aname)
                except Exception:
                    continue
                if len(data_bytes) > 100 * 1024 * 1024:
                    continue
                ext = Path(fname).suffix
                new_name = f"{uuid.uuid4().hex}{ext}" if ext else fname
                dest = _UPLOAD_DIR / new_name
                orig = Path(aname).name
                mapping[orig] = new_name
                dest.write_bytes(data_bytes)

            if mapping:
                slides = _rewrite_asset_urls(slides, mapping)  # type: ignore[assignment]

            data: dict[str, Any] = {
                "slides": slides,
                "variables": variables,
                "width": width,
                "height": height,
                "theme": theme if isinstance(theme, dict) else {"primary": "#18181b", "accent": "#18181b"},
            }
            return title, data
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="Archivo zip corrupto") from exc

import { useMemo, useState } from "react";
import { FiAlignCenter, FiAlignLeft, FiAlignRight, FiCode, FiPlus, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CodeEditorModal } from "@/components/ui/CodeEditorModal";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { resolveLang } from "@/lib/prism";
import type { PresentationData, SlideElement, SpecialsElementProps } from "@/types/presentation";

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Element */
  element: SlideElement;
  /** Patch handler */
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  /** Presentation data */
  data?: PresentationData | null;
}

type Tab = "general" | "pregunta" | "respuestas";

/**
 * Config modal for specials-answers with sidebar tabs.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param element - Specials element
 * @param onPatch - Patch handler
 * @param data - Presentation data for variables
 */
export function SpecialsConfigModal({ open, onClose, element, onPatch, data }: Props): React.ReactNode {
  const props = element.props as Partial<SpecialsElementProps>;
  const [tab, setTab] = useState<Tab>("general");
  const [codeModalIdx, setCodeModalIdx] = useState<number | null>(null);

  const variables = data?.variables ?? [];
  const variableOptions = useMemo(
    () =>
      variables
        .filter((v) => v.varType === "array" && (v.arrayType === "string" || v.arrayType === "any"))
        .map((v) => ({ value: v.id, label: `${v.name} (${Array.isArray(v.value) ? (v.value as unknown[]).length : 0} items)` })),
    [variables],
  );

  const answers = (props.answers as string[]) ?? [];
  const extraBlocks = (props.extraCodeBlocks as Array<{ language: string; code: string }>) ?? [];

  /**
   * Update answers count.
   * @param count - New count
   */
  function setAnswersCount(count: number): void {
    const current = [...answers];
    if (count > current.length) {
      for (let i = current.length; i < count; i++) current.push(`Respuesta ${i + 1}`);
    } else {
      current.length = count;
    }
    let correct = (props.correctAnswerIndex as number | null) ?? 0;
    if (correct !== null && correct >= count) correct = 0;
    onPatch({ propsPatch: { answersCount: count, answers: current, correctAnswerIndex: correct } });
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-5xl max-h-[85vh]">
      <ModalHeader title="Configurar elemento" subtitle={props.kind ?? "specials-answers"} onClose={onClose} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-44 shrink-0 flex-col gap-1 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2">
          {(
            [
              { id: "general", label: "General" },
              { id: "pregunta", label: "Pregunta" },
              { id: "respuestas", label: "Respuestas" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${tab === t.id ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "general" && (
            <div className="space-y-4">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nombre / ID de la pregunta
                <input
                  value={props.questionId ?? ""}
                  onChange={(e) => onPatch({ propsPatch: { questionId: e.target.value } })}
                  placeholder="q-123"
                  className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Identificador usado en el controlador</span>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Variable de nombres
                <Select
                  value={props.variableId ?? ""}
                  options={[{ value: "", label: "Sin variable" }, ...variableOptions]}
                  onChange={(v) => onPatch({ propsPatch: { variableId: v || undefined } })}
                  placeholder="Seleccionar variable array de strings"
                />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Debe ser array de strings</span>
              </label>

              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3">
                <Checkbox
                  checked={Boolean(props.randomSelection)}
                  onChange={(c) => onPatch({ propsPatch: { randomSelection: c } })}
                  label="Selección aleatoria de nombre"
                  description="Al iniciar la pregunta se escoge un nombre aleatorio de la lista"
                />
                {props.randomSelection && (
                  <Checkbox
                    checked={Boolean(props.discardAfterPick)}
                    onChange={(c) => onPatch({ propsPatch: { discardAfterPick: c } })}
                    label="Descartar persona tras selección"
                    description="No se repite en futuras preguntas (estado atómico por presentación, no borra el array)"
                  />
                )}
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Elemento selector
                <Select
                  value={props.selectorType ?? "strip"}
                  options={[
                    { value: "strip", label: "Recuadro deslizante" },
                    { value: "wheel", label: "Ruleta circular" },
                  ]}
                  onChange={(v) => onPatch({ propsPatch: { selectorType: v } })}
                  placeholder="Selector"
                />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Recuadro mueve nombres y frena en el centro; ruleta gira con cada nombre</span>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Duración del selector (segundos)
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={props.selectorDuration ?? 5}
                  onChange={(e) => onPatch({ propsPatch: { selectorDuration: Math.max(2, Math.min(12, Number(e.target.value) || 5)) } })}
                  className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Cuánto dura girando; cada segundo disminuye velocidad hasta seleccionar</span>
              </label>
            </div>
          )}

          {tab === "pregunta" && (
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Pregunta
                <textarea
                  value={props.questionText ?? ""}
                  onChange={(e) => onPatch({ propsPatch: { questionText: e.target.value } })}
                  rows={3}
                  placeholder="Escribe la pregunta..."
                  className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Color pregunta
                  <input type="color" value={props.questionColor ?? "#18181b"} onChange={(e) => onPatch({ propsPatch: { questionColor: e.target.value } })} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Alineación</span>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: "left", icon: FiAlignLeft },
                        { id: "center", icon: FiAlignCenter },
                        { id: "right", icon: FiAlignRight },
                      ] as const
                    ).map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onPatch({ propsPatch: { questionAlign: id } })}
                        className={`flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg border text-sm ${props.questionAlign === id ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "respuestas" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Número de respuestas
                  <Select
                    value={String(props.answersCount ?? 4)}
                    options={["2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }))}
                    onChange={(v) => setAnswersCount(Number(v))}
                    placeholder="Cantidad"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Formato
                  <Select
                    value={props.answersFormat ?? "letters"}
                    options={[
                      { value: "letters", label: "Letras A, B, C..." },
                      { value: "numbers", label: "Números 1, 2, 3..." },
                      { value: "text", label: "Texto libre" },
                    ]}
                    onChange={(v) => onPatch({ propsPatch: { answersFormat: v } })}
                    placeholder="Formato"
                  />
                </label>
              </div>

              <div className="space-y-2">
                {Array.from({ length: props.answersCount ?? 4 }, (_, i) => {
                  const prefix = props.answersFormat === "letters" ? `${String.fromCharCode(65 + i)}.` : props.answersFormat === "numbers" ? `${i + 1}.` : "";
                  return (
                    <label key={i} className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-2">
                        {prefix} Respuesta {i + 1}
                        {props.correctAnswerIndex === i && <span className="rounded bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">Correcta</span>}
                      </span>
                      <input
                        value={answers[i] ?? ""}
                        onChange={(e) => {
                          const next = [...answers];
                          next[i] = e.target.value;
                          onPatch({ propsPatch: { answers: next } });
                        }}
                        placeholder={`Respuesta ${i + 1}`}
                        className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                      />
                    </label>
                  );
                })}
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Respuesta correcta
                <Select
                  value={props.correctAnswerIndex !== null && props.correctAnswerIndex !== undefined ? String(props.correctAnswerIndex) : ""}
                  options={Array.from({ length: props.answersCount ?? 4 }, (_, i) => ({
                    value: String(i),
                    label: props.answersFormat === "letters" ? String.fromCharCode(65 + i) : props.answersFormat === "numbers" ? String(i + 1) : `Respuesta ${i + 1}`,
                  }))}
                  onChange={(v) => onPatch({ propsPatch: { correctAnswerIndex: Number(v) } })}
                  placeholder="Seleccionar correcta"
                />
              </label>

              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Bloques de código adicionales (máx. 2)</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={extraBlocks.length >= 2}
                    onClick={() => onPatch({ propsPatch: { extraCodeBlocks: [...extraBlocks, { language: "javascript", code: "console.log('hola')" }] } })}
                    className="cursor-pointer"
                  >
                    <FiPlus /> Añadir
                  </Button>
                </div>
                {extraBlocks.length === 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400">Sin bloques adicionales</p>}
                {extraBlocks.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
                    <FiCode className="shrink-0 text-zinc-500" size={14} />
                    <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">{b.language} · {(b.code ?? "").slice(0, 40)}</span>
                    <Button variant="secondary" size="sm" onClick={() => setCodeModalIdx(idx)} className="cursor-pointer px-2 py-1 text-xs">
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onPatch({ propsPatch: { extraCodeBlocks: extraBlocks.filter((_, i) => i !== idx) } })}
                      className="cursor-pointer px-2 py-1 text-xs"
                    >
                      <FiTrash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>

              {codeModalIdx !== null && extraBlocks[codeModalIdx] && (
                <CodeEditorModal
                  open={codeModalIdx !== null}
                  value={extraBlocks[codeModalIdx].code ?? ""}
                  language={resolveLang(extraBlocks[codeModalIdx].language)}
                  onClose={() => setCodeModalIdx(null)}
                  onSave={(val, lang) => {
                    const next = [...extraBlocks];
                    next[codeModalIdx] = { language: lang, code: val };
                    onPatch({ propsPatch: { extraCodeBlocks: next } });
                    setCodeModalIdx(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

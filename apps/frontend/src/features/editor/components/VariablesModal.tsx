import { useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { Variable } from "@/types/presentation";

type VarType = Variable["varType"];
type ArrayType = NonNullable<Variable["arrayType"]>;

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current variables */
  variables: Variable[];
  /** Update handler */
  onChange: (variables: Variable[]) => void;
}

const VAR_TYPE_OPTIONS: { value: VarType; label: string }[] = [
  { value: "number", label: "Numérica" },
  { value: "boolean", label: "Booleana" },
  { value: "string", label: "String" },
  { value: "array", label: "Array" },
  { value: "object", label: "Objeto" },
];

const ARRAY_TYPE_OPTIONS: { value: ArrayType; label: string }[] = [
  { value: "string", label: "Array de strings" },
  { value: "number", label: "Array de números" },
  { value: "boolean", label: "Array de booleanos" },
  { value: "array", label: "Array de arrays" },
  { value: "object", label: "Array de objetos" },
  { value: "any", label: "Array de cualquier tipo" },
];

/**
 * Validate value against variable type.
 * @param varType - Variable type
 * @param arrayType - Array item type
 * @param raw - Raw JSON text or simple value
 * @returns Parsed value or error message
 */
function validateValue(varType: VarType, arrayType: ArrayType | undefined, raw: string): { value: unknown; error: string | null } {
  try {
    if (varType === "boolean") {
      if (raw !== "true" && raw !== "false") return { value: null, error: "Debe ser true o false" };
      return { value: raw === "true", error: null };
    }
    if (varType === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) return { value: null, error: "Número inválido" };
      return { value: n, error: null };
    }
    if (varType === "string") {
      return { value: raw, error: null };
    }
    const parsed = JSON.parse(raw);
    if (varType === "object") {
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { value: null, error: "Debe ser un objeto JSON" };
      return { value: parsed, error: null };
    }
    if (varType === "array") {
      if (!Array.isArray(parsed)) return { value: null, error: "Debe ser un array JSON" };
      if (!arrayType || arrayType === "any") return { value: parsed, error: null };
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (arrayType === "string" && typeof item !== "string") return { value: null, error: `Elemento ${i} debe ser string` };
        if (arrayType === "number" && typeof item !== "number") return { value: null, error: `Elemento ${i} debe ser número` };
        if (arrayType === "boolean" && typeof item !== "boolean") return { value: null, error: `Elemento ${i} debe ser boolean` };
        if (arrayType === "array" && !Array.isArray(item)) return { value: null, error: `Elemento ${i} debe ser array` };
        if (arrayType === "object" && (typeof item !== "object" || item === null || Array.isArray(item))) return { value: null, error: `Elemento ${i} debe ser objeto` };
      }
      return { value: parsed, error: null };
    }
    return { value: parsed, error: null };
  } catch {
    return { value: null, error: "JSON inválido" };
  }
}

/**
 * Modal to manage presentation variables.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param variables - Current variables
 * @param onChange - Update handler
 */
export function VariablesModal({ open, onClose, variables, onChange }: Props): React.ReactNode {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [varType, setVarType] = useState<VarType>("string");
  const [arrayType, setArrayType] = useState<ArrayType>("string");
  const [rawValue, setRawValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingId !== null;
  const activeVar = useMemo(() => variables.find((v) => v.id === editingId) ?? null, [variables, editingId]);

  /**
   * Start creating new variable.
   */
  function startCreate(): void {
    setEditingId("new");
    setName("");
    setVarType("string");
    setArrayType("string");
    setRawValue("");
    setError(null);
  }

  /**
   * Start editing existing variable.
   * @param v - Variable
   */
  function startEdit(v: Variable): void {
    setEditingId(v.id);
    setName(v.name);
    setVarType(v.varType);
    setArrayType((v.arrayType as ArrayType) ?? "string");
    if (v.varType === "boolean") setRawValue(String(Boolean(v.value)));
    else if (v.varType === "number") setRawValue(String(v.value as number));
    else if (v.varType === "string") setRawValue(String(v.value ?? ""));
    else setRawValue(JSON.stringify(v.value, null, 2));
    setError(null);
  }

  /**
   * Cancel editing.
   */
  function cancelEdit(): void {
    setEditingId(null);
    setError(null);
  }

  /**
   * Save variable.
   */
  function handleSave(): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nombre requerido");
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      setError("Nombre debe empezar con letra o _ y solo alfanumérico");
      return;
    }
    const exists = variables.some((v) => v.name === trimmedName && v.id !== editingId);
    if (exists) {
      setError("Ya existe una variable con ese nombre");
      return;
    }
    const { value, error: valError } = validateValue(varType, arrayType, rawValue);
    if (valError) {
      setError(valError);
      return;
    }
    if (isEditing && activeVar) {
      const updated: Variable = { ...activeVar, name: trimmedName, varType, arrayType: varType === "array" ? arrayType : undefined, value };
      onChange(variables.map((v) => (v.id === activeVar.id ? updated : v)));
    } else {
      const created: Variable = { id: `var-${Date.now()}`, name: trimmedName, varType, arrayType: varType === "array" ? arrayType : undefined, value };
      onChange([...variables, created]);
    }
    setEditingId(null);
    setError(null);
  }

  /**
   * Delete variable.
   * @param id - Variable id
   */
  function handleDelete(id: string): void {
    onChange(variables.filter((v) => v.id !== id));
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-3xl max-h-[85vh]">
      <ModalHeader title="Variables" subtitle="Gestiona variables del proyecto" onClose={onClose} />
      <ModalBody>
        {editingId ? (
          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. contador" className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Tipo
                <Select value={varType} options={VAR_TYPE_OPTIONS} onChange={(v) => setVarType(v as VarType)} placeholder="Tipo" />
              </label>
              {varType === "array" && (
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tipo de array
                  <Select value={arrayType} options={ARRAY_TYPE_OPTIONS} onChange={(v) => setArrayType(v as ArrayType)} placeholder="Tipo array" />
                </label>
              )}
            </div>

            {varType === "boolean" ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Valor
                <Select value={rawValue} options={[{ value: "true", label: "true" }, { value: "false", label: "false" }]} onChange={setRawValue} placeholder="Valor" />
              </label>
            ) : varType === "number" ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Valor
                <input type="number" value={rawValue} onChange={(e) => setRawValue(e.target.value)} className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
              </label>
            ) : varType === "string" ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Valor
                <input value={rawValue} onChange={(e) => setRawValue(e.target.value)} placeholder="Texto" className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Valor (JSON)
                <textarea
                  value={rawValue}
                  onChange={(e) => setRawValue(e.target.value)}
                  placeholder={varType === "array" ? 'Ej. ["hola","hellow"]' : 'Ej. {"clave":"valor"}'}
                  rows={6}
                  className="w-full resize-none rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 font-mono text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Debe ser JSON válido según el tipo seleccionado</span>
              </label>
            )}

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={cancelEdit} className="cursor-pointer">
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="cursor-pointer">
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {variables.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-6 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay variables</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Crea la primera para empezar</p>
                <Button variant="primary" size="sm" onClick={startCreate} className="cursor-pointer">
                  <FiPlus /> Crear primera variable
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={startCreate} className="cursor-pointer">
                    <FiPlus /> Nueva variable
                  </Button>
                </div>
                <ul className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {variables.map((v) => (
                    <li key={v.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{v.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {v.varType}
                          {v.varType === "array" && v.arrayType ? ` · ${v.arrayType}[]` : ""} · {JSON.stringify(v.value).slice(0, 60)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(v)} className="cursor-pointer px-2 py-1 text-xs">
                          <FiEdit2 size={12} />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(v.id)} className="cursor-pointer px-2 py-1 text-xs">
                          <FiTrash2 size={12} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
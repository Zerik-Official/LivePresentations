import { useMemo, useState } from "react";
import { FiCheck, FiPlay, FiRefreshCw, FiRotateCcw, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { SlideElement, Variable } from "@/types/presentation";

interface Props {
  /** Target specials element */
  element: SlideElement;
  /** Variables list */
  variables: Variable[];
  /** WS send */
  send: (type: string, payload: Record<string, unknown>) => void;
  /** WS specials state */
  state: Record<string, unknown> | undefined;
}

type Phase = "idle" | "picking" | "picked" | "question" | "answers" | "checked" | "finalized";

/**
 * Phased controller for specials-answers: controls appear step by step.
 * Includes finalizar and reiniciar actions.
 * @param element - Specials element
 * @param variables - Variables
 * @param send - WS send
 * @param state - WS state
 */
export function SpecialsController({ element, variables, send, state }: Props): React.ReactNode {
  const props = element.props as {
    questionId?: string;
    variableId?: string;
    randomSelection?: boolean;
    discardAfterPick?: boolean;
    selectorType?: string;
    selectorDuration?: number;
    answers?: string[];
    answersFormat?: string;
    correctAnswerIndex?: number | null;
  };

  const varData = useMemo(() => variables.find((v) => v.id === props.variableId), [variables, props.variableId]);
  const names = useMemo(() => (Array.isArray(varData?.value) ? (varData.value as string[]) : []), [varData]);
  const discarded = (state?.discarded as string[]) ?? [];
  const picked = (state?.pickedName as string) ?? null;
  const phaseRaw = (state?.type as string) ?? "";

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const available = names.filter((n) => !discarded.includes(n));

  const phase: Phase = (() => {
    if (phaseRaw === "SPECIALS_FINALIZED") return "finalized";
    if (phaseRaw === "SPECIALS_CHECK") return "checked";
    if (phaseRaw === "SPECIALS_SHOW_ANSWERS") return "answers";
    if (phaseRaw === "SPECIALS_SHOW_QUESTION") return "question";
    if (phaseRaw === "SPECIALS_PICKED") return "picked";
    if (phaseRaw === "SPECIALS_PICKING") return "picking";
    if (phaseRaw === "SPECIALS_START") return "idle";
    return "idle";
  })();

  const isStarted = Boolean(phaseRaw);

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-100">Pregunta: {props.questionId ?? element.id.slice(0, 6)}</h4>
        <span className="rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">Fase: {phase}</span>
      </div>

      {phase === "idle" && !isStarted && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">Inicia la pregunta para comenzar el sorteo.</p>
          <Button variant="primary" size="sm" onClick={() => send("SPECIALS_START", { elementId: element.id, questionId: props.questionId })} className="w-full cursor-pointer">
            <FiPlay /> Iniciar pregunta
          </Button>
        </div>
      )}

      {phase === "idle" && isStarted && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">Pregunta iniciada. Sortea un nombre.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (available.length === 0) return;
              const idx = Math.floor(Math.random() * available.length);
              const name = available[idx] as string;
              const duration = props.selectorDuration ?? 5;
              send("SPECIALS_PICKING", { elementId: element.id, questionId: props.questionId, pickedName: name, selectorType: props.selectorType, duration });
              window.setTimeout(() => {
                send("SPECIALS_PICKED", { elementId: element.id, questionId: props.questionId, pickedName: name, discarded });
              }, duration * 1000);
            }}
            disabled={available.length === 0}
            className="w-full cursor-pointer"
          >
            <FiRefreshCw /> Sortear nombre
          </Button>
        </div>
      )}

      {phase === "picking" && (
        <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Sorteando...</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 animate-pulse">Eligiendo persona</p>
        </div>
      )}

      {phase === "picked" && picked && (
        <div className="space-y-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Seleccionado</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{picked}</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const nextDiscarded = props.discardAfterPick ? [...discarded, picked] : discarded;
                send("SPECIALS_SHOW_QUESTION", { elementId: element.id, questionId: props.questionId, pickedName: picked, discarded: nextDiscarded });
              }}
              className="flex-1 cursor-pointer"
            >
              <FiCheck /> Continuar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const nextDiscarded = [...discarded, picked];
                const duration = props.selectorDuration ?? 5;
                send("SPECIALS_PICKING", { elementId: element.id, questionId: props.questionId, discarded: nextDiscarded, duration, pickedName: picked });
                window.setTimeout(() => {
                  if (available.length <= 1) return;
                  const remaining = names.filter((n) => !nextDiscarded.includes(n));
                  if (remaining.length === 0) return;
                  const idx = Math.floor(Math.random() * remaining.length);
                  const name = remaining[idx] as string;
                  send("SPECIALS_PICKED", { elementId: element.id, questionId: props.questionId, pickedName: name, discarded: nextDiscarded });
                }, duration * 1000);
              }}
              className="cursor-pointer"
            >
              <FiTrash2 /> Otro
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Disponibles: {available.length} · Descartados: {discarded.length}</p>
        </div>
      )}

      {(phase === "question" || phase === "picked") && phase !== "picked" && (
        <div className="flex gap-2">
          {phase === "question" ? (
            <Button variant="primary" size="sm" onClick={() => send("SPECIALS_SHOW_ANSWERS", { elementId: element.id, questionId: props.questionId, pickedName: picked })} className="w-full cursor-pointer">
              Mostrar respuestas
            </Button>
          ) : null}
        </div>
      )}

      {phase === "question" && (
        <div className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 text-xs text-zinc-600 dark:text-zinc-400">
          Pregunta visible en presentación. Pulsa mostrar respuestas cuando estén listos.
        </div>
      )}

      {phase === "answers" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Responder según alumno</p>
          <Select
            value={selectedAnswer !== null ? String(selectedAnswer) : ""}
            options={(props.answers ?? []).map((_, i) => ({
              value: String(i),
              label: props.answersFormat === "letters" ? String.fromCharCode(65 + i) : props.answersFormat === "numbers" ? String(i + 1) : `Resp ${i + 1}`,
            }))}
            onChange={(v) => setSelectedAnswer(Number(v))}
            placeholder="Respuesta dicha"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={selectedAnswer === null}
            onClick={() => send("SPECIALS_CHECK", { elementId: element.id, questionId: props.questionId, selectedIndex: selectedAnswer, correctIndex: props.correctAnswerIndex, pickedName: picked })}
            className="w-full cursor-pointer"
          >
            <FiCheck /> Comprobar
          </Button>
        </div>
      )}

      {phase === "checked" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">Respuesta comprobada</p>
            <p className="text-emerald-700 dark:text-emerald-300">Correcta: {props.answersFormat === "letters" ? String.fromCharCode(65 + (props.correctAnswerIndex ?? 0)) : String((props.correctAnswerIndex ?? 0) + 1)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => send("SPECIALS_FINALIZED", { elementId: element.id, questionId: props.questionId })} className="flex-1 cursor-pointer">
              <FiCheck /> Finalizar pregunta
            </Button>
            <Button variant="secondary" size="sm" onClick={() => send("SPECIALS_RESTART", { elementId: element.id, questionId: props.questionId })} className="cursor-pointer">
              <FiRotateCcw /> Reiniciar
            </Button>
          </div>
        </div>
      )}

      {phase === "finalized" && (
        <div className="space-y-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 text-center">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Pregunta finalizada ✓</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Ya puedes pasar a otra diapositiva o reiniciar.</p>
          <Button variant="secondary" size="sm" onClick={() => send("SPECIALS_RESTART", { elementId: element.id, questionId: props.questionId })} className="w-full cursor-pointer">
            <FiRotateCcw /> Reiniciar pregunta
          </Button>
        </div>
      )}

      {phase !== "idle" && phase !== "finalized" && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => send("SPECIALS_RESTART", { elementId: element.id, questionId: props.questionId })} className="flex-1 cursor-pointer text-xs">
            <FiRotateCcw /> Reiniciar
          </Button>
        </div>
      )}

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Disponibles: {available.length} · Total: {names.length}</p>
    </div>
  );
}
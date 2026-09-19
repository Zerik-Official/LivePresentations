import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";

interface Props {
  /** Join code value */
  joinCode: string;
  /** Join code setter */
  onJoinCodeChange: (v: string) => void;
  /** Join handler */
  onJoin: () => void;
  /** Last room code for hint */
  roomCode: string | null;
}

/**
 * Card for joining as controller via room code.
 * @param joinCode - Current code
 * @param onJoinCodeChange - Setter
 * @param onJoin - Join action
 * @param roomCode - Last room code
 */
export function ControllerJoinCard({ joinCode, onJoinCodeChange, onJoin, roomCode }: Props): React.ReactNode {
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Soy controlador</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Únete con el código del presentador.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
          placeholder="Código (ej. AB12CD)"
          maxLength={6}
          className="flex-1 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm tracking-widest outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
        />
        <TooltipSimple content="Unirse a sala" side="top">
          <Button variant="primary" size="md" onClick={() => void onJoin()} className="cursor-pointer">
            Unirse
          </Button>
        </TooltipSimple>
      </div>
      {roomCode && <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">Última sala: {roomCode}</p>}
    </section>
  );
}

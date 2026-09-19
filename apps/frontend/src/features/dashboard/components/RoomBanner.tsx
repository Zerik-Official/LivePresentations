import { FiCopy } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";

interface Props {
  /** Current room code */
  code: string | null;
}

/**
 * Banner showing last created room code with copy action.
 * @param code - Room code
 */
export function RoomBanner({ code }: Props): React.ReactNode {
  if (!code) return null;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3">
      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Código de sala: {code}</span>
      <TooltipSimple content="Copiar código" side="top">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void navigator.clipboard.writeText(code)}
          className="cursor-pointer bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 px-2 py-1 text-xs"
        >
          <FiCopy /> Copiar
        </Button>
      </TooltipSimple>
      <span className="ml-auto text-xs text-emerald-700 dark:text-emerald-300">Comparte este código con el controlador</span>
    </div>
  );
}

import { FiEye, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { Room } from "@/types/backend";

interface Props {
  /** Active rooms */
  rooms: Room[];
  /** Present handler */
  onPresent: (code: string) => void;
  /** Room modal opener */
  onOpenRoom: (code: string) => void;
  /** Delete handler */
  onDeleteRoom: (code: string) => void;
}

/**
 * List of active rooms with actions.
 * @param rooms - Rooms
 * @param onPresent - Present callback
 * @param onOpenRoom - Open modal callback
 * @param onDeleteRoom - Delete callback
 */
export function ActiveRoomsSection({ rooms, onPresent, onOpenRoom, onDeleteRoom }: Props): React.ReactNode {
  const navigate = useNavigate();

  if (rooms.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Salas activas</h3>
      <ul className="mt-3 space-y-2">
        {rooms.map((r) => (
          <li key={r.code} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs">
            <span className="font-mono tracking-widest text-zinc-900 dark:text-zinc-100">{r.code}</span>
            <span className="text-zinc-500 dark:text-zinc-400">Slide {r.current_slide + 1}</span>
            <div className="flex gap-2">
              <TooltipSimple content="Ver QR y configuración" side="top">
                <Button variant="secondary" size="sm" onClick={() => onOpenRoom(r.code)} className="cursor-pointer px-2 py-1 text-xs">
                  <FiEye /> <FiSettings size={10} />
                </Button>
              </TooltipSimple>
              <TooltipSimple content="Presentar sala" side="top">
                <Button variant="primary" size="sm" onClick={() => onPresent(r.code)} className="cursor-pointer px-3 py-1 text-xs">
                  Presentar
                </Button>
              </TooltipSimple>
              <TooltipSimple content="Controlar sala" side="top">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/control/${r.code}`)} className="cursor-pointer px-3 py-1 text-xs">
                  Control
                </Button>
              </TooltipSimple>
              <TooltipSimple content="Borrar sala" side="top">
                <Button variant="danger" size="sm" onClick={() => void onDeleteRoom(r.code)} className="cursor-pointer px-2 py-1 text-xs">
                  Borrar
                </Button>
              </TooltipSimple>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

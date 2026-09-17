import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { TbNumber, TbNumber0, TbNumber1, TbNumber2, TbNumber3, TbNumber4, TbNumber5, TbNumber6, TbNumber7, TbNumber8, TbNumber9, TbNumbers } from "react-icons/tb";

import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal"

const ALL_ICONS = Object.keys(FaIcons).filter((k) => k.startsWith("Fa"));
const TbIconsMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  TbNumber0,
  TbNumber1,
  TbNumber2,
  TbNumber3,
  TbNumber4,
  TbNumber5,
  TbNumber6,
  TbNumber7,
  TbNumber8,
  TbNumber9,
  TbNumbers,
  TbNumber,
};
const ALL_TB_ICONS = Object.keys(TbIconsMap);
const NUMERIC_ICONS = ["TbNumber0", "TbNumber1", "TbNumber2", "TbNumber3", "TbNumber4", "TbNumber5", "TbNumber6", "TbNumber7", "TbNumber8", "TbNumber9", "TbNumbers", "TbNumber", "FaSortNumericUp", "FaSortNumericDown", "FaDiceOne", "FaDiceTwo", "FaDiceThree", "FaDiceFour", "FaDiceFive", "FaDiceSix", "FaHashtag"].filter(
  (n) => (FaIcons as Record<string, unknown>)[n] || TbIconsMap[n],
);

const COMMON_ICONS = [
  "FaStar",
  "FaRegStar",
  "FaHeart",
  "FaRegHeart",
  "FaBell",
  "FaRegBell",
  "FaBookmark",
  "FaRegBookmark",
  "FaFlag",
  "FaExclamation",
  "FaExclamationCircle",
  "FaExclamationTriangle",
  "FaInfo",
  "FaInfoCircle",
  "FaQuestion",
  "FaQuestionCircle",
  "FaCheck",
  "FaCheckCircle",
  "FaCheckSquare",
  "FaTimes",
  "FaTimesCircle",
  "FaPlus",
  "FaPlusCircle",
  "FaMinus",
  "FaMinusCircle",
  "FaArrowUp",
  "FaArrowDown",
  "FaArrowLeft",
  "FaArrowRight",
  "FaArrowCircleUp",
  "FaArrowCircleDown",
  "FaThumbsUp",
  "FaRegThumbsUp",
  "FaThumbsDown",
  "FaRegThumbsDown",
  "FaSmile",
  "FaRegSmile",
  "FaFrown",
  "FaMeh",
  "FaEye",
  "FaEyeSlash",
  "FaLock",
  "FaUnlock",
  "FaKey",
  "FaSearch",
  "FaCog",
  "FaWrench",
  "FaTools",
  "FaTrash",
  "FaEdit",
  "FaPen",
  "FaSave",
  "FaDownload",
  "FaUpload",
  "FaLink",
  "FaUnlink",
  "FaHome",
  "FaUser",
  "FaUsers",
  "FaGraduationCap",
  "FaTrophy",
  "FaGift",
  "FaFire",
  "FaBolt",
  "FaCloud",
  "FaSun",
  "FaMoon",
  "FaLightbulb",
  "FaRegLightbulb",
  "FaBook",
  "FaCalendar",
  "FaClock",
  "FaRegClock",
  "FaComment",
  "FaRegComment",
  "FaEnvelope",
  "FaRegEnvelope",
  "FaPhone",
  "FaMapMarkerAlt",
  "FaRocket",
  "FaShieldAlt",
  "FaMedal",
  "FaBullhorn",
  "FaChartBar",
  "FaChartLine",
  "FaHandPaper",
  "FaRegHandPaper",
  "FaHandPointUp",
  "FaSignOutAlt",
  "FaSignInAlt",
].filter((n) => ALL_ICONS.includes(n));

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}

/**
 * Modal to search and pick a FontAwesome icon.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param onSelect - Icon name selected (e.g. FaStar)
 */
export function IconPickerModal({ open, onClose, onSelect }: Props): React.ReactNode {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().replace(/^(fa|tb)/, "");
    if (!q) return COMMON_ICONS.length > 0 ? COMMON_ICONS : ALL_ICONS.slice(0, 80);
    const all = [...ALL_ICONS, ...ALL_TB_ICONS];
    return all.filter((n) => n.toLowerCase().includes(q)).slice(0, 80);
  }, [query]);

  const numericFiltered = useMemo(() => {
    const q = query.toLowerCase().replace(/^(fa|tb)/, "");
    if (!q) return NUMERIC_ICONS;
    return NUMERIC_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  /**
   * Resolve icon component from Fa or Tb packs.
   * @param name - Icon name
   * @returns Icon component or null
   */
  function resolveIcon(name: string): React.ComponentType<{ size?: number }> | null {
    return (
      (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name] ??
      TbIconsMap[name] ??
      null
    );
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl max-h-[85vh]">
      <ModalHeader title="Elegir icono" subtitle="Busca por nombre (ej. star, rocket, number, 1)" onClose={onClose} />
      <ModalBody>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar icono... (ej. star, number, 5)"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400 text-zinc-900 dark:text-zinc-100"
        />
        {numericFiltered.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Números · 0-9</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {numericFiltered.map((name) => {
                const Icon = resolveIcon(name);
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onSelect(name);
                      onClose();
                    }}
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <Icon size={22} />
                    <span className="truncate w-full text-center text-[9px] text-zinc-500 dark:text-zinc-400">{name.replace(/^Tb/, "")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid max-h-[40vh] grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8">
          {filtered.map((name) => {
            const Icon = resolveIcon(name);
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelect(name);
                  onClose();
                }}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <Icon size={20} />
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate w-full text-center">{name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-zinc-500">Sin resultados</p>}
        </div>
      </ModalBody>
    </Modal>
  );
}
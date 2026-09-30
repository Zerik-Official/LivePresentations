import type { IconType } from "react-icons";
import { FiCode, FiHelpCircle, FiLayout, FiMaximize, FiPackage, FiShuffle, FiSmartphone } from "react-icons/fi";

export const LANDING_SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "funciones", label: "Funciones" },
  { id: "flujo", label: "Flujo" },
  { id: "empezar", label: "Empezar" },
] as const;

export const LANDING_SECTION_IDS = LANDING_SECTIONS.map((s) => s.id);

export interface LandingFeature {
  icon: IconType;
  title: string;
  description: string;
  tag: string;
  span: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: FiLayout,
    title: "Editor visual sobre lienzo 1280×720",
    description: "Arrastra, redimensiona, rota y ordena capas. Texto con múltiples tipografías, imágenes, formas, vídeo, iconos y bloques de código con resaltado.",
    tag: "editor",
    span: "md:col-span-2",
  },
  {
    icon: FiHelpCircle,
    title: "Preguntas en vivo",
    description: "De 2 a 6 respuestas, formato A-D, 1-4 o libre, y revelas la correcta desde el móvil.",
    tag: "specials",
    span: "",
  },
  {
    icon: FiShuffle,
    title: "Sorteo de participantes",
    description: "Ruleta o recuadro deslizante alimentados por una lista guardada como variable.",
    tag: "specials",
    span: "",
  },
  {
    icon: FiCode,
    title: "Variables del proyecto",
    description: "Números, texto, booleanos, listas y objetos validados, reutilizables en toda la presentación.",
    tag: "variables",
    span: "",
  },
  {
    icon: FiMaximize,
    title: "Pantalla completa sin bordes",
    description: "Cada elemento se reescala y reposiciona al tamaño de la ventana. Sin franjas negras.",
    tag: "player",
    span: "",
  },
  {
    icon: FiSmartphone,
    title: "Salas con código y QR",
    description: "Escanea y controla desde el móvil. Anti-spoiler con cuenta regresiva y controles configurables.",
    tag: "room",
    span: "",
  },
  {
    icon: FiPackage,
    title: "Exporta e importa en .zip",
    description: "Diapositivas, variables y archivos subidos en un solo paquete portable, compatible con el formato .json anterior.",
    tag: "export",
    span: "md:col-span-2",
  },
];

export const LANDING_STEPS = [
  { index: "01", title: "Diseña", description: "Construye tus diapositivas en el editor visual y guarda variables reutilizables." },
  { index: "02", title: "Abre una sala", description: "Genera un código y un QR. Configura anti-spoiler, controles y pantalla completa." },
  { index: "03", title: "Controla desde el móvil", description: "Escanea el QR y dirige la presentación: cambia diapositivas, resalta, lanza preguntas." },
] as const;

import type { IconType } from "react-icons";
import { FiEdit3, FiGlobe, FiHelpCircle, FiLayout, FiMaximize, FiPackage, FiPlayCircle, FiSmartphone } from "react-icons/fi";
import { LuGraduationCap, LuSparkles } from "react-icons/lu";

/** Sections linked from the landing navigation, in page order. */
export const LANDING_SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "funciones", label: "Funciones" },
  { id: "flujo", label: "Cómo funciona" },
  { id: "preguntas", label: "Preguntas" },
] as const;

export const LANDING_SECTION_IDS = LANDING_SECTIONS.map((s) => s.id);

/**
 * One capability of the product.
 */
export interface LandingFeature {
  icon: IconType;
  title: string;
  description: string;
}

/**
 * Capabilities grouped by the moment they help with.
 */
export interface LandingFeatureGroup {
  title: string;
  summary: string;
  features: LandingFeature[];
}

export const LANDING_FEATURE_GROUPS: LandingFeatureGroup[] = [
  {
    title: "Crea",
    summary: "Diseña en el navegador, solo o con ayuda.",
    features: [
      { icon: FiLayout, title: "Editor visual", description: "Texto, imágenes y vídeo con recorte, formas, tablas, código y dibujo a mano alzada, con guías de alineación, deshacer y autoguardado." },
      { icon: LuSparkles, title: "Asistente de IA", description: "Pide una presentación o un cambio y mírala construirse en el lienzo. Aceptas o descartas cada cambio y ves cuántos tokens gasta." },
      { icon: FiPlayCircle, title: "Animaciones", description: "Entradas, salidas y énfasis por elemento, o tus propios @keyframes, al mostrar la diapositiva o cuando tú las lances." },
      { icon: FiHelpCircle, title: "Preguntas y sorteos", description: "Preguntas con respuesta correcta y sorteos con ruleta a partir de tus listas de participantes." },
    ],
  },
  {
    title: "Presenta",
    summary: "La pantalla proyecta, tu móvil manda.",
    features: [
      { icon: FiSmartphone, title: "Control desde el móvil", description: "Escanea el QR para pasar diapositivas, resaltar elementos, expandir código y lanzar animaciones." },
      { icon: FiEdit3, title: "Anotaciones en directo", description: "Dibuja, subraya o usa el puntero láser sobre la diapositiva, y deja la pantalla en negro cuando quieras toda la atención." },
      { icon: FiMaximize, title: "Pantalla completa adaptable", description: "La diapositiva se ajusta a cualquier pantalla, con pantalla de espera anti-spoiler opcional." },
    ],
  },
  {
    title: "Comparte",
    summary: "Tu público te sigue desde su dispositivo.",
    features: [
      { icon: FiGlobe, title: "Sala pública", description: "Con un enlace, cualquiera sigue la presentación sin cuenta, repasa lo anterior y vuelve al directo." },
      { icon: FiPackage, title: "Exporta e importa", description: "Un .zip con diapositivas, variables y archivos para llevar o archivar tu trabajo." },
      { icon: LuGraduationCap, title: "Tutoriales integrados", description: "Recorridos guiados dentro del editor para descubrir cada herramienta." },
    ],
  },
];

export const LANDING_STEPS = [
  { index: "01", title: "Diseña", description: "Crea las diapositivas en el editor o pídeselas al asistente de IA y ajusta lo que quieras." },
  { index: "02", title: "Abre una sala", description: "Obtén un código y un QR. Si quieres, comparte además el enlace público para tu audiencia." },
  { index: "03", title: "Presenta desde el móvil", description: "Pasa diapositivas, anota sobre ellas, lanza preguntas y animaciones mientras hablas." },
] as const;

/**
 * Frequently asked question.
 */
export interface LandingQuestion {
  question: string;
  answer: string;
}

export const LANDING_QUESTIONS: LandingQuestion[] = [
  { question: "¿Tengo que instalar algo?", answer: "No. Todo funciona en el navegador: en el ordenador que proyecta y en el móvil con el que controlas." },
  { question: "¿Mi público necesita una cuenta?", answer: "No. Si activas la sala pública, cualquiera con el enlace sigue la presentación en su dispositivo, aunque no puede controlarla." },
  { question: "¿Cómo funciona el asistente de IA?", answer: "Conectas tu propia clave de Gemini, OpenAI, NVIDIA NIM u otro proveedor compatible. La clave se guarda cifrada, el consumo corre a cargo de tu cuenta con ese proveedor y ves los tokens de cada mensaje." },
  { question: "¿Puedo llevarme mis presentaciones?", answer: "Sí. Exporta cualquier presentación como .zip con sus diapositivas, variables y archivos, e impórtala cuando quieras." },
  { question: "¿Qué hacéis con mis datos?", answer: "Solo los necesarios para darte el servicio. Lo explicamos en la política de privacidad." },
];

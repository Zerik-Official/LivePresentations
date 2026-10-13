/**
 * Tutorial library content for the editor.
 * Targets are `data-tour` attribute values present in the editor UI.
 */

/**
 * One step of a guided tour.
 */
export interface TutorialStep {
  /** Step heading */
  title: string;
  /** Explanation shown in the popover */
  body: string;
  /** `data-tour` value of the element to spotlight; omit for a centered step */
  target?: string;
  /** `data-tour` value of an element to click before showing the step, e.g. a ribbon tab */
  open?: string;
}

/**
 * Guided tutorial listed in the library.
 */
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: "Primeros pasos" | "Editor" | "Presentar" | "Asistente";
  /** Estimated duration in minutes */
  minutes: number;
  steps: TutorialStep[];
}

/** Keyboard shortcut reference shown in the library. */
export const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "Ctrl + Z", action: "Deshacer" },
  { keys: "Ctrl + Y", action: "Rehacer" },
  { keys: "Ctrl + S", action: "Guardar" },
  { keys: "Ctrl + D", action: "Duplicar elemento" },
  { keys: "Ctrl + C / V", action: "Copiar y pegar elemento" },
  { keys: "Flechas", action: "Mover 1 px (con Mayús, 10 px)" },
  { keys: "Supr", action: "Borrar elemento" },
  { keys: "Esc", action: "Deseleccionar o salir del modo dibujo" },
];

/** Every tutorial, in library order. */
export const TUTORIALS: Tutorial[] = [
  {
    id: "basics",
    title: "Conoce el editor",
    description: "Un recorrido por las zonas principales: diapositivas, lienzo, cinta de herramientas y propiedades.",
    category: "Primeros pasos",
    minutes: 2,
    steps: [
      { title: "Te damos la bienvenida", body: "Este recorrido te enseña dónde está cada cosa. Puedes salir en cualquier momento y retomarlo desde la biblioteca de tutoriales." },
      { target: "slides-list", title: "Tus diapositivas", body: "Aquí ves todas las diapositivas. Haz clic para abrir una, arrástrala para reordenar o usa su menú para duplicarla o eliminarla." },
      { target: "canvas", title: "El lienzo", body: "Es la diapositiva activa. Arrastra los elementos para moverlos y usa los tiradores del borde para cambiar su tamaño. También puedes soltar aquí imágenes o vídeos desde tu equipo." },
      { target: "ribbon", open: "ribbon-tab-insert", title: "La cinta de herramientas", body: "Agrupa las acciones en pestañas: Insertar, Organizar, Diseño, Diapositivas y Datos." },
      { target: "properties", title: "Propiedades", body: "Al seleccionar un elemento, este panel muestra su posición, tamaño, rotación y opciones propias. Puedes moverlo o colapsarlo." },
      { target: "layers", title: "Capas", body: "Lista los elementos de la diapositiva. Reordena para decidir cuál queda encima y enlaza elementos para moverlos juntos." },
      { target: "zoom", title: "Zoom", body: "Acerca, aleja o ajusta el lienzo a la ventana sin cambiar el tamaño real de la diapositiva." },
      { target: "save", title: "Guardado automático", body: "Tus cambios se guardan solos a los pocos segundos de dejar de editar; el estado aparece junto al botón. También puedes pulsar Guardar o Ctrl + S cuando quieras." },
    ],
  },
  {
    id: "elements",
    title: "Insertar y dar formato",
    description: "Añade texto, imágenes, formas, tablas, líneas, iconos y código, y ajusta su aspecto.",
    category: "Editor",
    minutes: 3,
    steps: [
      { target: "ribbon-elements", open: "ribbon-tab-insert", title: "Añade elementos", body: "Cada botón crea un elemento en la diapositiva activa: texto, imagen, forma, tabla, línea o flecha, icono, vídeo y bloque de código." },
      { target: "canvas", title: "Colócalo", body: "El elemento nuevo aparece seleccionado. Arrástralo a su sitio y ajusta el tamaño con los tiradores. Con las flechas del teclado lo mueves píxel a píxel." },
      { target: "properties", title: "Dale estilo", body: "Las formas tienen 16 variantes (estrella, flechas, bocadillo...), las líneas pueden ser flechas discontinuas y las tablas permiten editar celdas y colores desde aquí." },
      { target: "properties", title: "Edición avanzada", body: "La pestaña Código del panel muestra el JSON del elemento: cópialo, pégalo en otra presentación o edítalo a mano." },
    ],
  },
  {
    id: "drawing",
    title: "Dibujar a mano alzada",
    description: "Haz anotaciones, subrayados y bocetos directamente sobre la diapositiva.",
    category: "Editor",
    minutes: 2,
    steps: [
      { target: "ribbon-draw", open: "ribbon-tab-insert", title: "Activa el modo dibujo", body: "Pulsa Dibujar para pintar sobre el lienzo con el ratón, un lápiz o el dedo." },
      { target: "canvas", title: "Dibuja", body: "Elige bolígrafo o marcador, color y grosor en la barra que aparece sobre el lienzo. Puedes deshacer trazos sueltos." },
      { target: "canvas", title: "Convierte el boceto en un elemento", body: "Al pulsar Listo, todos los trazos se agrupan en un elemento Dibujo que puedes mover, escalar, rotar o recolorear como cualquier otro." },
    ],
  },
  {
    id: "arrange",
    title: "Organizar y corregir",
    description: "Deshaz cambios, duplica, alinea y ordena elementos con rapidez.",
    category: "Editor",
    minutes: 2,
    steps: [
      { target: "ribbon", open: "ribbon-tab-arrange", title: "La pestaña Organizar", body: "Reúne el historial y las herramientas de colocación. Las de elemento se activan al seleccionar uno." },
      { target: "ribbon", open: "ribbon-tab-arrange", title: "Deshacer y rehacer", body: "Cada cambio queda en el historial, también los que hace el asistente de IA. Ctrl + Z deshace y Ctrl + Y rehace." },
      { target: "ribbon", open: "ribbon-tab-arrange", title: "Alinear y ordenar", body: "Centra un elemento en el lienzo o pégalo a un borde con un clic, y tráelo al frente o envíalo al fondo." },
      { target: "smart-guides", open: "ribbon-tab-arrange", title: "Guías inteligentes", body: "Al arrastrar un elemento aparecen líneas cuando sus bordes o su centro coinciden con otro elemento o con el lienzo, y el elemento se ajusta solo. Puedes desactivarlas aquí; la preferencia se recuerda en este navegador." },
      { title: "Atajos útiles", body: "Ctrl + D duplica, Ctrl + C y Ctrl + V copian y pegan (también entre diapositivas), y Supr borra. La lista completa está en la biblioteca de tutoriales." },
    ],
  },
  {
    id: "design",
    title: "Diseño y diapositivas",
    description: "Cambia fondos, transiciones, tamaño del lienzo y gestiona tus diapositivas.",
    category: "Editor",
    minutes: 2,
    steps: [
      { target: "ribbon", open: "ribbon-tab-design", title: "Diseño", body: "Define el color de fondo y la transición de la diapositiva activa, el tamaño del lienzo y los colores del tema." },
      { target: "ribbon", open: "ribbon-tab-slides", title: "Diapositivas", body: "Crea, duplica o elimina diapositivas. También puedes hacerlo desde el menú de cada miniatura." },
      { target: "slides-list", title: "Reordena", body: "Arrastra una miniatura para cambiar el orden en el que se presentará." },
    ],
  },
  {
    id: "interactive",
    title: "Variables y elementos especiales",
    description: "Prepara preguntas con respuestas, sorteos de participantes y datos reutilizables.",
    category: "Editor",
    minutes: 3,
    steps: [
      { target: "ribbon", open: "ribbon-tab-data", title: "Variables", body: "Las variables guardan datos de la presentación: números, textos, listas u objetos. Una lista de nombres, por ejemplo, alimenta un sorteo." },
      { target: "ribbon-specials", open: "ribbon-tab-insert", title: "Elementos especiales", body: "Añade bloques interactivos: preguntas con varias respuestas y sorteos con ruleta o tira animada." },
      { target: "properties", title: "Configúralos", body: "Selecciona el bloque y ábrelo desde Propiedades para definir la pregunta, las respuestas, la correcta y la variable de participantes." },
      { title: "Se controlan en directo", body: "Durante la presentación, el controlador del móvil lanza la pregunta, revela la respuesta o gira la ruleta." },
    ],
  },
  {
    id: "presenting",
    title: "Presentar y controlar desde el móvil",
    description: "Crea una sala, proyecta la presentación y contrólala con dibujo y puntero láser.",
    category: "Presentar",
    minutes: 3,
    steps: [
      { title: "Crea una sala", body: "Guarda y vuelve al panel principal. En la tarjeta de la presentación pulsa Crear sala: obtendrás un código de 6 caracteres y un QR." },
      { title: "Proyecta", body: "Abre Presentar en el equipo conectado al proyector. Puedes ocultar los controles, llenar la pantalla y mostrar una pantalla anti-spoiler hasta empezar." },
      { title: "Comparte con el público", body: "Activa «Sala pública» en la sala para obtener un enlace de espectador: cualquiera puede seguir la presentación desde su dispositivo, sin cuenta y sin poder controlarla." },
      { title: "Conecta el móvil", body: "Escanea el QR o introduce el código en «Unirse como controlador». El móvil pasa las diapositivas y resalta elementos en tiempo real." },
      { title: "Dibuja sobre la diapositiva", body: "En el controlador, la sección Anotar muestra la diapositiva: pinta con bolígrafo o marcador y el público lo ve al instante. Los trazos se guardan por diapositiva hasta que los borres." },
      { title: "Puntero láser y pantalla en negro", body: "Con el puntero láser señalas arrastrando el dedo, sin dejar marca. «Pantalla en negro» oculta la diapositiva para recuperar la atención de la sala." },
    ],
  },
  {
    id: "assistant",
    title: "Asistente de IA",
    description: "Conecta tu propia clave API y pide al asistente que cree o mejore diapositivas.",
    category: "Asistente",
    minutes: 3,
    steps: [
      { title: "Trae tu propia clave", body: "El asistente funciona con tu clave de Gemini, NVIDIA NIM, OpenAI, Groq, OpenRouter, Mistral, DeepSeek o cualquier servicio compatible con OpenAI." },
      { title: "Configúrala en tu perfil", body: "En el panel principal abre el menú de usuario → Asistente de IA. Pega la clave, pulsa «Cargar modelos» y elige uno. La clave se cifra en el servidor y nunca vuelve al navegador." },
      { target: "assistant", title: "Abre el chat", body: "Cuando hay una clave activa aparece este botón flotante. La ventana se puede mover y minimizar sin perder la conversación." },
      { title: "Pide lo que necesites", body: "Por ejemplo: «Crea 6 diapositivas sobre el ciclo del agua para 5.º de primaria» o «Haz esta diapositiva más visual». Verás cada elemento aparecer en el lienzo mientras trabaja." },
      { title: "Revisa sus cambios", body: "Lo que añade o modifica queda marcado en el lienzo y listado en la barra «cambios por revisar»: acepta o descarta cada cambio por separado, o todos a la vez." },
      { title: "Tú mantienes el control", body: "La conversación se guarda con la presentación y sigue ahí cuando vuelvas. Todo se puede deshacer con Ctrl + Z, y en tu perfil verás los tokens gastados por día y por modelo." },
    ],
  },
];

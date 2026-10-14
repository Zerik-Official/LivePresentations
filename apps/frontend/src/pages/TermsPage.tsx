import { Link } from "react-router-dom";

import { ContactEmail, LegalLayout, type LegalSection } from "@/features/legal/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    title: "Qué es el servicio",
    body: [
      "LivePresentations es una aplicación web para crear presentaciones, presentarlas en una pantalla y controlarlas desde otro dispositivo. Incluye un editor, salas en directo con código y QR, salas públicas para el público, un asistente de inteligencia artificial opcional y funciones de exportación e importación.",
    ],
  },
  {
    title: "Tu cuenta",
    body: [
      "Para usar el editor necesitas una cuenta, que puedes crear con tu correo y una contraseña o con tu cuenta de Google. Al registrarte con correo te enviaremos un código para confirmar que la dirección es tuya.",
      "Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad que se realice con tu cuenta. Avísanos en cuanto sospeches de un uso no autorizado.",
      "Debes tener la edad mínima exigida en tu país para aceptar estas condiciones o contar con el permiso de tu madre, padre o tutor.",
    ],
  },
  {
    title: "Tu contenido",
    body: [
      "Las presentaciones, imágenes, vídeos y demás contenido que crees o subas son tuyos. Nos concedes únicamente el permiso necesario para almacenarlo, procesarlo y mostrarlo con el fin de prestarte el servicio, por ejemplo para enseñar tus diapositivas en una sala o a los espectadores de una sala pública que tú abras.",
      "Debes tener los derechos necesarios sobre lo que subes. No publiques contenido ilegal, que infrinja derechos de terceros, que acose o discrimine, ni que contenga software malicioso.",
      "Cuando haces pública una sala, cualquier persona con el enlace puede ver las diapositivas que ya se hayan mostrado. Las notas del orador no se comparten.",
    ],
  },
  {
    title: "Asistente de inteligencia artificial",
    body: [
      "El asistente funciona con la clave de API que tú configuras de un proveedor externo (por ejemplo Google Gemini, OpenAI o NVIDIA NIM). Al usarlo, el contenido de tus mensajes y de la presentación necesario para responder se envía a ese proveedor, sujeto a sus propias condiciones y políticas.",
      "El coste de las peticiones lo factura el proveedor a tu cuenta. Te mostramos una estimación de los tokens usados, pero el consumo oficial es el que indique el proveedor.",
      "Las respuestas generadas pueden contener errores. Revisa los cambios antes de aceptarlos y antes de presentar.",
    ],
  },
  {
    title: "Uso aceptable",
    body: [
      "• No intentes acceder a cuentas, salas o datos ajenos ni eludir las medidas de seguridad.",
      "• No sobrecargues el servicio ni lo uses de forma automatizada para fines distintos a los previstos.",
      "• No uses el servicio para enviar spam ni para actividades ilegales.",
      "Podemos suspender o cerrar cuentas que incumplan estas reglas.",
    ],
  },
  {
    title: "Disponibilidad y cambios",
    body: [
      "Nos esforzamos por mantener el servicio disponible, pero puede haber interrupciones por mantenimiento, fallos o causas ajenas. Las salas en directo caducan a las pocas horas de crearse.",
      "Podemos modificar o retirar funciones. Si cambiamos estas condiciones de forma relevante, lo indicaremos en esta página actualizando la fecha de revisión.",
    ],
  },
  {
    title: "Responsabilidad",
    body: [
      "El servicio se ofrece tal cual. En la medida en que lo permita la ley, no respondemos de pérdidas de datos, interrupciones o daños indirectos derivados de su uso. Te recomendamos exportar periódicamente las presentaciones importantes.",
    ],
  },
  {
    title: "Privacidad",
    body: [
      <>
        El tratamiento de tus datos personales se explica en la{" "}
        <Link to="/privacy" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          política de privacidad
        </Link>
        .
      </>,
    ],
  },
  {
    title: "Contacto",
    body: [
      <>
        Para cualquier duda sobre estas condiciones escríbenos a <ContactEmail />.
      </>,
    ],
  },
];

/**
 * Terms and conditions of the service.
 * @returns Terms page
 */
export function TermsPage(): React.ReactNode {
  return <LegalLayout title="Términos y condiciones" intro="Estas condiciones regulan el uso de LivePresentations. Al crear una cuenta o usar el servicio las aceptas; si no estás de acuerdo, no lo utilices." sections={SECTIONS} />;
}

import { ContactEmail, LegalLayout, type LegalSection } from "@/features/legal/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    title: "Datos que recogemos",
    body: [
      "• Datos de la cuenta: correo electrónico, nombre visible, foto de perfil y contraseña (guardada solo como hash, nunca en texto plano).",
      "• Si entras con Google: el identificador de tu cuenta de Google, tu correo, tu nombre y la URL de tu foto de perfil. No accedemos a tu Gmail, Drive ni a otros datos de Google.",
      "• Contenido: presentaciones, variables y los archivos que subes.",
      "• Asistente de IA: el proveedor que eliges, el modelo, tu clave de API (cifrada) y el historial de conversación de cada presentación, junto con el número de tokens usados.",
      "• Datos técnicos: fecha del último inicio de sesión y los necesarios para mantener tu sesión abierta de forma segura.",
    ],
  },
  {
    title: "Para qué los usamos",
    body: [
      "Usamos estos datos únicamente para prestarte el servicio: identificarte, guardar y mostrar tus presentaciones, sincronizar las salas en directo, verificar tu correo, ejecutar el asistente de IA que configures y mostrarte tu consumo. No vendemos tus datos ni los usamos para publicidad.",
    ],
  },
  {
    title: "Con quién los compartimos",
    body: [
      "• Google, si eliges iniciar sesión con Google, para verificar tu identidad.",
      "• Resend, para enviarte el código de verificación por correo.",
      "• Cloudflare Turnstile, si el captcha está activado, para distinguir personas de bots.",
      "• El proveedor de IA que tú configures, que recibe el contenido necesario para responder a tus mensajes y se rige por su propia política de privacidad.",
      "• Los espectadores de una sala pública, que ven las diapositivas que ya se hayan mostrado, sin notas del orador.",
      "Fuera de estos casos, solo compartiremos datos si la ley nos obliga.",
    ],
  },
  {
    title: "Cookies y almacenamiento local",
    body: [
      "Usamos cookies técnicas imprescindibles para mantener tu sesión: un token de acceso de corta duración y otro de renovación, ambos inaccesibles desde JavaScript. No usamos cookies publicitarias ni de seguimiento.",
      "En tu navegador guardamos preferencias como el tema claro u oscuro, el progreso de los tutoriales, las guías de alineación o el nivel de esfuerzo del asistente, además de la lista de cambios del asistente pendientes de revisar.",
    ],
  },
  {
    title: "Seguridad",
    body: [
      "Las contraseñas se guardan con hash, las claves de API se cifran antes de almacenarse y nunca se devuelven al navegador, y los códigos de verificación caducan y se guardan cifrados. Ningún sistema es infalible, por lo que te pedimos que uses una contraseña única.",
    ],
  },
  {
    title: "Conservación",
    body: [
      "Conservamos tus datos mientras tengas la cuenta. Las salas en directo caducan a las pocas horas, las sesiones y los códigos de verificación se eliminan al caducar y los archivos subidos que no se usan se borran periódicamente.",
    ],
  },
  {
    title: "Tus derechos",
    body: [
      <>
        Puedes consultar y modificar tu nombre y foto desde tu perfil, eliminar tus presentaciones y claves de API cuando quieras, y exportar tus presentaciones. Para acceder a una copia de tus datos, corregirlos o eliminar tu cuenta por completo, escríbenos a <ContactEmail /> y atenderemos la solicitud.
      </>,
    ],
  },
  {
    title: "Cambios en esta política",
    body: ["Si cambiamos esta política de forma relevante, lo indicaremos en esta página actualizando la fecha de revisión."],
  },
  {
    title: "Contacto",
    body: [
      <>
        Para cualquier consulta sobre privacidad escríbenos a <ContactEmail />.
      </>,
    ],
  },
];

/**
 * Privacy policy of the service.
 * @returns Privacy page
 */
export function PrivacyPage(): React.ReactNode {
  return <LegalLayout title="Política de privacidad" intro="Esta política explica qué datos personales trata LivePresentations, para qué y con quién se comparten. Tratamos solo los datos necesarios para que el servicio funcione." sections={SECTIONS} />;
}

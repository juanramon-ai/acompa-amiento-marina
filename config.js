/*
  Configuración editable de la web de Marina.
  Cambia estos valores y se aplican en todas las páginas.

  Integración n8n:
  El chatbot envía al webhook un JSON con la forma:
    { sessionId: "uuid-v4", message: "texto", history: [{role:"user"|"assistant", content:"..."}] }
  El webhook debe responder con JSON:
    { reply: "respuesta del asistente" }
*/
window.MARINA_CONFIG = {
  WHATSAPP_NUMBER: "34614830660",
  WHATSAPP_PREFILLED: "Hola Marina, me gustaría saber más sobre tus servicios.",

  // Pendiente: URL del webhook de n8n. Mientras esté vacío, el chatbot
  // responderá con un mock local para poder probar el flujo.
  N8N_WEBHOOK_URL: "",

  CHAT_GREETING: "Hola, soy el asistente de Marina. ¿En qué puedo ayudarte hoy? Puedo orientarte sobre los servicios o ayudarte a reservar una sesión.",
  CHAT_ERROR_FALLBACK: "Ahora mismo no puedo responderte por aquí. Puedes escribirle directamente a Marina por WhatsApp."
};

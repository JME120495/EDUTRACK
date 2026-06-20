/**
 * Service de Notification (WhatsApp & SMS)
 * Prêt pour la production
 */

// 1. Envoi de SMS via Africa's Talking (Idéal pour l'Afrique, pas de restriction de 24h)
async function sendSMS(to, message) {
  const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;

  if (!apiKey || apiKey === 'mock_africas_talking_api_key') {
    console.log(`[SMS Mock] Env vars missing. Would have sent to ${to}: "${message}"`);
    return { success: true, provider: "SMS Mock" };
  }

  const credentials = { apiKey, username };
  const AfricasTalking = require('africastalking')(credentials);
  const sms = AfricasTalking.SMS;

  try {
    const options = { to: [to], message };
    const response = await sms.send(options);
    console.log(`[Africa's Talking] SMS sent to ${to}`);
    return { success: true, provider: "Africa's Talking", data: response };
  } catch (error) {
    console.error(`[Africa's Talking Error] Failed to send SMS:`, error);
    return { success: false, error: error.toString() };
  }
}

// 2. Envoi de Modèle WhatsApp (Template) - Requis pour les notifications initiées par l'école
async function sendWhatsAppTemplate(to, templateName, languageCode = 'fr', parameters = []) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || token === 'mock_whatsapp_token') {
    console.log(`[WhatsApp Template Mock] Would have sent template '${templateName}' to ${to}`);
    return { success: true, provider: "WhatsApp Mock" };
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: parameters.length > 0 ? [
        {
          type: "body",
          parameters: parameters.map(p => ({ type: "text", text: p }))
        }
      ] : []
    }
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[WhatsApp API Error] Template failed:`, data);
      return { success: false, error: data.error?.message };
    }

    console.log(`[WhatsApp API] Template '${templateName}' sent to ${cleanPhone}`);
    return { success: true, provider: "WhatsApp Cloud API", messageId: data.messages?.[0]?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 3. Envoi de Texte WhatsApp (Fonctionne uniquement si le parent a écrit dans les 24h)
async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || token === 'mock_whatsapp_token') {
    console.log(`[WhatsApp Text Mock] Would have sent to ${to}: "${message}"`);
    return { success: true, provider: "WhatsApp Mock" };
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { preview_url: true, body: message }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[WhatsApp API Error] Text failed:`, data);
      return { success: false, error: data.error?.message };
    }

    console.log(`[WhatsApp API] Text sent to ${cleanPhone}`);
    return { success: true, provider: "WhatsApp Cloud API", messageId: data.messages?.[0]?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendWhatsAppReport(to, studentName, pdfUrl) {
  // Par défaut, essaie d'envoyer un texte simple. 
  // En production stricte, remplacez par : return await sendWhatsAppTemplate(to, 'school_report', 'fr', [studentName, pdfUrl]);
  const message = `Bonjour, voici le bulletin de ${studentName}. Lien: ${pdfUrl}`;
  return await sendWhatsAppMessage(to, message);
}

module.exports = {
  sendSMS,
  sendWhatsAppTemplate,
  sendWhatsAppMessage,
  sendWhatsAppReport
};

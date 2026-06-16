async function sendSMS(to, message) {
  console.log(`[Africa's Talking SMS] Sending to ${to}: "${message}"`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, provider: "Africa's Talking" };
}

async function sendWhatsAppReport(to, studentName, pdfUrl) {
  console.log(`[WhatsApp Business API] Sending message to ${to}: "Bonjour, voici le bulletin de ${studentName}. Lien: ${pdfUrl}"`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, provider: "WhatsApp Business API" };
}

async function sendWhatsAppMessage(to, message) {
  console.log(`[WhatsApp Business API] Sending message to ${to}: "${message}"`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, provider: "WhatsApp Business API" };
}

module.exports = {
  sendSMS,
  sendWhatsAppReport,
  sendWhatsAppMessage,
};

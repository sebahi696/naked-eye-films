const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

export interface WAMessage {
  to: string; // phone number with country code, no +
  body: string;
}

export async function sendWhatsAppMessage({ to, body }: WAMessage): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn("WhatsApp env vars not set — skipping send");
    return false;
  }

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed:", err);
    return false;
  }
  return true;
}

// Pre-built message templates
export const messages = {
  scriptNeeded: (client: string, shootDate: string | null) =>
    `Naked Eye Films: Script needed for *${client}*${shootDate ? ` (shoot: ${shootDate})` : ""}. Please provide the script so editing can begin.`,

  orderMissing: (client: string) =>
    `Naked Eye Films: Order details not yet filled for *${client}*. Please complete the job brief.`,

  followUp: (contact: string) =>
    `Naked Eye Films: Follow up with *${contact}* today.`,

  shootTomorrow: (client: string, time: string, location: string) =>
    `Naked Eye Films: Shoot tomorrow — *${client}* at ${time}${location ? `, ${location}` : ""}.`,
};

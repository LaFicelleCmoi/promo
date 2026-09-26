import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export type OutgoingEmail = { to: string; subject: string; html: string; text: string };

/**
 * Envoi d'emails :
 * - SMTP (Gmail ou autre) si SMTP_USER / SMTP_PASS sont définis : peut écrire à n'importe quelle adresse ;
 * - sinon Resend (RESEND_API_KEY), limité à l'adresse du compte tant qu'aucun domaine n'est vérifié.
 */
export function getMailer() {
  const from = process.env.EMAIL_FROM ?? "Promo Tracker <onboarding@resend.dev>";

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      pool: true,
      maxConnections: 3,
    });

    return {
      name: "smtp" as const,
      async sendAll(emails: OutgoingEmail[]) {
        let sent = 0;
        try {
          for (const email of emails) {
            await transport.sendMail({ from, ...email });
            sent++;
          }
        } finally {
          transport.close();
        }
        return sent;
      },
    };
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return {
      name: "resend" as const,
      async sendAll(emails: OutgoingEmail[]) {
        let sent = 0;
        for (let i = 0; i < emails.length; i += 100) {
          const chunk = emails.slice(i, i + 100);
          const { error } = await resend.batch.send(chunk.map((email) => ({ from, ...email })));
          if (error) throw new Error(`Resend : ${error.message}`);
          sent += chunk.length;
        }
        return sent;
      },
    };
  }

  return null;
}

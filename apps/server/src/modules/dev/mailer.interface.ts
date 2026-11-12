/** Interface para envio de mensagens de email. Implementações: DevMailer (dev), real (Phase 2). */
export interface Mailer {
  send(message: MailerMessage): Promise<void>;
}

export interface MailerMessage {
  to: string;
  subject: string;
  body: string;
  resetUrl?: string;
}

export const MAILER = Symbol("MAILER");

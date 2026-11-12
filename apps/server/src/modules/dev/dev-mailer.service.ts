import { Injectable } from "@nestjs/common";
import type { Mailer, MailerMessage } from "./mailer.interface";

/**
 * Implementação de desenvolvimento da interface `Mailer`. Persiste a última mensagem
 * por destinatário em memória; não sobrevive a restart (aceitável: token expira em 30 min).
 *
 * ADR-007: reset verificável em testes e QA sem infra extra.
 */
@Injectable()
export class DevMailer implements Mailer {
  private readonly mailbox = new Map<string, MailerMessage>();

  async send(message: MailerMessage): Promise<void> {
    this.mailbox.set(message.to, message);
  }

  getLastMessage(email: string): MailerMessage | null {
    return this.mailbox.get(email) ?? null;
  }
}

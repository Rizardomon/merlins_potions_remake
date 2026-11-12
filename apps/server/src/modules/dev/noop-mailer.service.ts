import { Injectable } from "@nestjs/common";
import type { Mailer, MailerMessage } from "./mailer.interface";

/**
 * Implementação NoOp da interface `Mailer` para produção.
 * Reset continua funcionando, mas não envia email real.
 */
@Injectable()
export class NoOpMailer implements Mailer {
  async send(_message: MailerMessage): Promise<void> {
    // noop
  }
}

import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { DevMailer } from "./dev-mailer.service";

/**
 * Endpoint de desenvolvimento: `GET /api/dev/mailbox/:email` retorna a última mensagem
 * enviada para um email. Só registrado fora de produção (ADR-007).
 *
 * Resposta `200 { to, subject, body, resetUrl }` ou `404`.
 */
@Controller("dev")
export class DevMailboxController {
  constructor(private readonly mailer: DevMailer) {}

  @Get("mailbox/:email")
  getMailbox(@Param("email") email: string) {
    const message = this.mailer.getLastMessage(email);
    if (!message) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
    return message;
  }
}

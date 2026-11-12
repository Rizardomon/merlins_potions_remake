import { Module } from "@nestjs/common";
import { DevMailboxController } from "./dev-mailbox.controller";
import { DevMailer } from "./dev-mailer.service";
import { MAILER } from "./mailer.interface";

/**
 * Módulo de desenvolvimento: endpoint de mailbox + interface `Mailer` com implementação
 * `DevMailer`. Registrado apenas fora de produção (NODE_ENV !== 'production').
 *
 * ADR-007: reset verificável em testes e QA.
 */
@Module({
  controllers: [DevMailboxController],
  providers: [
    DevMailer,
    {
      provide: MAILER,
      useClass: DevMailer,
    },
  ],
  exports: [MAILER],
})
export class DevModule {}

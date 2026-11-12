import { HttpException, HttpStatus } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MailerMessage } from "./mailer.interface";
import { DevMailer } from "./dev-mailer.service";
import { DevMailboxController } from "./dev-mailbox.controller";

describe("DevMailboxController", () => {
  let controller: DevMailboxController;
  let mailer: DevMailer;

  beforeEach(() => {
    mailer = new DevMailer();
    controller = new DevMailboxController(mailer);
  });

  describe("GET /api/dev/mailbox/:email", () => {
    it("retorna 200 com a mensagem para email que recebeu mensagem", async () => {
      const message: MailerMessage = {
        to: "user@example.com",
        subject: "Reset de senha",
        body: "Clique aqui para resetar",
        resetUrl: "https://example.com/reset/token123",
      };

      await mailer.send(message);

      const result = controller.getMailbox("user@example.com");

      expect(result).toEqual(message);
      expect(result.to).toBe("user@example.com");
      expect(result.resetUrl).toBe("https://example.com/reset/token123");
    });

    it("retorna 404 quando não há mensagem para o email", () => {
      expect(() => {
        controller.getMailbox("nonexistent@example.com");
      }).toThrow(HttpException);

      try {
        controller.getMailbox("nonexistent@example.com");
      } catch (error) {
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it("retorna a última mensagem quando múltiplas foram enviadas", async () => {
      const message1: MailerMessage = {
        to: "user@example.com",
        subject: "Primeira",
        body: "Corpo 1",
      };

      const message2: MailerMessage = {
        to: "user@example.com",
        subject: "Segunda",
        body: "Corpo 2",
        resetUrl: "https://example.com/reset/latest",
      };

      await mailer.send(message1);
      await mailer.send(message2);

      const result = controller.getMailbox("user@example.com");

      expect(result).toEqual(message2);
      expect(result.subject).toBe("Segunda");
    });

    it("preserva o campo resetUrl na resposta", async () => {
      const resetUrl = "https://example.com/reset/abc123def456";
      const message: MailerMessage = {
        to: "alice@example.com",
        subject: "Password Reset",
        body: "Click the link below",
        resetUrl,
      };

      await mailer.send(message);

      const result = controller.getMailbox("alice@example.com");

      expect(result.resetUrl).toBe(resetUrl);
    });

    it("retorna mensagens para diferentes emails isoladamente", async () => {
      const message1: MailerMessage = {
        to: "alice@example.com",
        subject: "Para Alice",
        body: "Mensagem 1",
      };

      const message2: MailerMessage = {
        to: "bob@example.com",
        subject: "Para Bob",
        body: "Mensagem 2",
      };

      await mailer.send(message1);
      await mailer.send(message2);

      const resultAlice = controller.getMailbox("alice@example.com");
      expect(resultAlice).toEqual(message1);

      const resultBob = controller.getMailbox("bob@example.com");
      expect(resultBob).toEqual(message2);
    });

    it("retorna 404 com a mensagem 'Not found'", () => {
      try {
        controller.getMailbox("nonexistent@example.com");
        expect.fail("Should have thrown");
      } catch (error) {
        const httpError = error as HttpException;
        expect(httpError.getResponse()).toContain("Not found");
      }
    });
  });
});

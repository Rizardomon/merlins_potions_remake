import { beforeEach, describe, expect, it } from "vitest";
import type { MailerMessage } from "./mailer.interface";
import { DevMailer } from "./dev-mailer.service";

describe("DevMailer", () => {
  let mailer: DevMailer;

  beforeEach(() => {
    mailer = new DevMailer();
  });

  describe("send", () => {
    it("armazena a última mensagem por email", async () => {
      const message: MailerMessage = {
        to: "user@example.com",
        subject: "Reset de senha",
        body: "Clique aqui para resetar",
        resetUrl: "https://example.com/reset/token123",
      };

      await mailer.send(message);

      const retrieved = mailer.getLastMessage("user@example.com");
      expect(retrieved).toEqual(message);
    });

    it("sobrescreve mensagem anterior do mesmo email", async () => {
      const message1: MailerMessage = {
        to: "user@example.com",
        subject: "Reset 1",
        body: "Corpo 1",
      };

      const message2: MailerMessage = {
        to: "user@example.com",
        subject: "Reset 2",
        body: "Corpo 2",
        resetUrl: "https://example.com/reset/token456",
      };

      await mailer.send(message1);
      await mailer.send(message2);

      const retrieved = mailer.getLastMessage("user@example.com");
      expect(retrieved).toEqual(message2);
    });

    it("mantém mensagens isoladas por email", async () => {
      const message1: MailerMessage = {
        to: "alice@example.com",
        subject: "Reset Alice",
        body: "Para Alice",
      };

      const message2: MailerMessage = {
        to: "bob@example.com",
        subject: "Reset Bob",
        body: "Para Bob",
      };

      await mailer.send(message1);
      await mailer.send(message2);

      expect(mailer.getLastMessage("alice@example.com")).toEqual(message1);
      expect(mailer.getLastMessage("bob@example.com")).toEqual(message2);
    });

    it("preserva resetUrl quando presente", async () => {
      const resetUrl = "https://example.com/reset/my-special-token";
      const message: MailerMessage = {
        to: "user@example.com",
        subject: "Reset",
        body: "Body",
        resetUrl,
      };

      await mailer.send(message);

      const retrieved = mailer.getLastMessage("user@example.com");
      expect(retrieved?.resetUrl).toBe(resetUrl);
    });
  });

  describe("getLastMessage", () => {
    it("retorna null para email sem mensagem", () => {
      const result = mailer.getLastMessage("nonexistent@example.com");
      expect(result).toBeNull();
    });

    it("retorna a mensagem armazenada para email existente", async () => {
      const message: MailerMessage = {
        to: "user@example.com",
        subject: "Test",
        body: "Test body",
      };

      await mailer.send(message);

      const retrieved = mailer.getLastMessage("user@example.com");
      expect(retrieved).toEqual(message);
      expect(retrieved?.to).toBe("user@example.com");
      expect(retrieved?.subject).toBe("Test");
      expect(retrieved?.body).toBe("Test body");
    });

    it("é case-sensitive para email", async () => {
      const message: MailerMessage = {
        to: "User@Example.com",
        subject: "Test",
        body: "Test",
      };

      await mailer.send(message);

      expect(mailer.getLastMessage("user@example.com")).toBeNull();
      expect(mailer.getLastMessage("User@Example.com")).toEqual(message);
    });
  });
});

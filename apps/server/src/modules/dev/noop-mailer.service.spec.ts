import { beforeEach, describe, expect, it } from "vitest";
import type { MailerMessage } from "./mailer.interface";
import { NoOpMailer } from "./noop-mailer.service";

describe("NoOpMailer", () => {
  let mailer: NoOpMailer;

  beforeEach(() => {
    mailer = new NoOpMailer();
  });

  describe("send", () => {
    it("não faz nada com a mensagem (no-op)", async () => {
      const message: MailerMessage = {
        to: "user@example.com",
        subject: "Test",
        body: "Test body",
        resetUrl: "https://example.com/reset/token",
      };

      // Should not throw
      await expect(mailer.send(message)).resolves.toBeUndefined();
    });

    it("aceita qualquer mensagem sem erro", async () => {
      const messages: MailerMessage[] = [
        {
          to: "simple@example.com",
          subject: "Simple",
          body: "Body",
        },
        {
          to: "with-url@example.com",
          subject: "With URL",
          body: "Body",
          resetUrl: "https://example.com/reset/abc123",
        },
        {
          to: "empty@example.com",
          subject: "",
          body: "",
        },
      ];

      for (const message of messages) {
        await expect(mailer.send(message)).resolves.toBeUndefined();
      }
    });

    it("é idempotente", async () => {
      const message: MailerMessage = {
        to: "idempotent@example.com",
        subject: "Test",
        body: "Test",
      };

      // Send same message multiple times
      await mailer.send(message);
      await mailer.send(message);
      await mailer.send(message);

      // All should succeed
      expect(true).toBe(true);
    });
  });
});

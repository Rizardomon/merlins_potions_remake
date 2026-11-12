import { beforeEach, describe, expect, it } from "vitest";
import type { CreateCustomerInput } from "./customer.repository";
import { InMemoryCustomerRepository } from "./customer.repository.fake";

const customerInput = (overrides: Partial<CreateCustomerInput> = {}): CreateCustomerInput => ({
  fullName: "Merlin Ambrosius",
  email: "merlin@example.com",
  passwordHash: "$argon2id$fake-hash",
  newsletterOptIn: true,
  termsAcceptedAt: new Date("2026-11-12T00:00:00Z"),
  ...overrides,
});

describe("InMemoryCustomerRepository", () => {
  let repository: InMemoryCustomerRepository;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
  });

  describe("customer", () => {
    it("findByEmail retorna null para email inexistente", async () => {
      await expect(repository.findByEmail("nobody@example.com")).resolves.toBeNull();
    });

    it("findByEmail retorna o registro criado para email existente", async () => {
      const created = await repository.create(customerInput());

      const found = await repository.findByEmail("merlin@example.com");

      expect(found).toMatchObject({
        id: created.id,
        email: "merlin@example.com",
        fullName: "Merlin Ambrosius",
        failedSignInCount: 0,
        lockoutUntil: null,
      });
    });

    it("create aplica os defaults do banco e gera id/timestamps", async () => {
      const created = await repository.create(customerInput());

      expect(created.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(created.failedSignInCount).toBe(0);
      expect(created.lockoutUntil).toBeNull();
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it("create rejeita email duplicado com o código do Postgres", async () => {
      await repository.create(customerInput());

      await expect(repository.create(customerInput())).rejects.toMatchObject({
        code: "23505",
      });
    });

    it("update persiste lockout/contador e retorna null para id desconhecido", async () => {
      const created = await repository.create(customerInput());
      const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);

      const updated = await repository.update(created.id, {
        failedSignInCount: 5,
        lockoutUntil,
      });

      expect(updated).toMatchObject({ failedSignInCount: 5, lockoutUntil });
      await expect(repository.findById(created.id)).resolves.toMatchObject({
        failedSignInCount: 5,
        lockoutUntil,
      });
      await expect(
        repository.update("00000000-0000-0000-0000-000000000000", { failedSignInCount: 1 }),
      ).resolves.toBeNull();
    });
  });

  describe("session", () => {
    it("cria, encontra por token hash e remove a sessão", async () => {
      const customer = await repository.create(customerInput());
      const session = await repository.createSession({
        customerId: customer.id,
        tokenHash: "session-hash",
        expiresAt: new Date("2026-12-12T00:00:00Z"),
      });

      await expect(repository.findSessionByTokenHash("session-hash")).resolves.toMatchObject({
        id: session.id,
        customerId: customer.id,
      });

      await repository.deleteSessionByTokenHash("session-hash");

      await expect(repository.findSessionByTokenHash("session-hash")).resolves.toBeNull();
    });

    it("deleteAllSessionsForCustomer remove todas as sessões do customer", async () => {
      const target = await repository.create(customerInput());
      const other = await repository.create(
        customerInput({ email: "nimue@example.com" }),
      );

      for (const tokenHash of ["target-1", "target-2"]) {
        await repository.createSession({
          customerId: target.id,
          tokenHash,
          expiresAt: new Date("2026-12-12T00:00:00Z"),
        });
      }
      await repository.createSession({
        customerId: other.id,
        tokenHash: "other-1",
        expiresAt: new Date("2026-12-12T00:00:00Z"),
      });

      await repository.deleteAllSessionsForCustomer(target.id);

      await expect(repository.findSessionByTokenHash("target-1")).resolves.toBeNull();
      await expect(repository.findSessionByTokenHash("target-2")).resolves.toBeNull();
      await expect(repository.findSessionByTokenHash("other-1")).resolves.not.toBeNull();
    });

    it("createSession rejeita token hash duplicado com o código do Postgres", async () => {
      const customer = await repository.create(customerInput());
      const input = {
        customerId: customer.id,
        tokenHash: "duplicated-hash",
        expiresAt: new Date("2026-12-12T00:00:00Z"),
      };
      await repository.createSession(input);

      await expect(repository.createSession(input)).rejects.toMatchObject({ code: "23505" });
    });
  });

  describe("password reset token", () => {
    it("cria, encontra por token hash e marca used_at", async () => {
      const customer = await repository.create(customerInput());
      const token = await repository.createPasswordResetToken({
        customerId: customer.id,
        tokenHash: "reset-hash",
        expiresAt: new Date("2026-11-12T00:30:00Z"),
      });

      await expect(repository.findPasswordResetTokenByTokenHash("reset-hash")).resolves.toMatchObject(
        { id: token.id, usedAt: null },
      );

      const usedAt = new Date("2026-11-12T00:10:00Z");
      const used = await repository.markPasswordResetTokenUsed(token.id, usedAt);

      expect(used?.usedAt).toEqual(usedAt);
      await expect(repository.findPasswordResetTokenByTokenHash("reset-hash")).resolves.toMatchObject(
        { usedAt },
      );
    });

    it("markPasswordResetTokenUsed retorna null para id desconhecido", async () => {
      await expect(
        repository.markPasswordResetTokenUsed(
          "00000000-0000-0000-0000-000000000000",
          new Date(),
        ),
      ).resolves.toBeNull();
    });

    it("createPasswordResetToken rejeita token hash duplicado com o código do Postgres", async () => {
      const customer = await repository.create(customerInput());
      const input = {
        customerId: customer.id,
        tokenHash: "duplicated-reset-hash",
        expiresAt: new Date("2026-11-12T00:30:00Z"),
      };
      await repository.createPasswordResetToken(input);

      await expect(repository.createPasswordResetToken(input)).rejects.toMatchObject({
        code: "23505",
      });
    });
  });
});

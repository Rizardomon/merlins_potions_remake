import { createHash } from "node:crypto";
import {
  ConflictException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  SessionCustomer,
  SignInRequest,
  SignUpRequest,
} from "@merlins-potions-remake/shared";
import { verify as verifyPassword } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import type { CustomerRow } from "./customer.entity";
import { InMemoryCustomerRepository } from "./customer.repository.fake";
import {
  CustomerService,
  INVALID_CREDENTIALS_MESSAGE,
  LOCKOUT_DURATION_MS,
  LOCKOUT_MESSAGE,
  SESSION_DURATION_MS,
} from "./customer.service";

const signUpInput: SignUpRequest = {
  fullName: "Merlin Ambrosius",
  email: "merlin@example.com",
  password: "correct horse battery",
  newsletterOptIn: true,
  termsAccepted: true,
};

const signInInput: SignInRequest = {
  email: signUpInput.email,
  password: signUpInput.password,
  keepSignedIn: true,
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected promise to reject");
}

describe("CustomerService", () => {
  let repository: InMemoryCustomerRepository;
  let service: CustomerService;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
    service = new CustomerService(repository);
  });

  describe("signUp", () => {
    it("persiste hash Argon2id, newsletter, terms e cria sessão de 30 dias", async () => {
      const before = Date.now();
      const result = await service.signUp(signUpInput);

      expect(result.customer).toEqual({
        id: expect.any(String),
        fullName: signUpInput.fullName,
        firstName: "Merlin",
        email: signUpInput.email,
      });
      expect(result.sessionToken).toEqual(expect.any(String));
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + SESSION_DURATION_MS,
      );

      const row = await repository.findByEmail(signUpInput.email);
      expect(row).not.toBeNull();
      expect(row?.passwordHash).toMatch(/^\$argon2id\$/);
      expect(row?.passwordHash).not.toContain(signUpInput.password);
      await expect(
        verifyPassword(row!.passwordHash, signUpInput.password),
      ).resolves.toBe(true);
      expect(row?.newsletterOptIn).toBe(true);
      expect(row?.termsAcceptedAt).toBeInstanceOf(Date);

      // Somente o hash do token é persistido.
      await expect(
        repository.findSessionByTokenHash(result.sessionToken),
      ).resolves.toBeNull();
      await expect(
        repository.findSessionByTokenHash(sha256(result.sessionToken)),
      ).resolves.toMatchObject({
        customerId: result.customer.id,
        expiresAt: result.expiresAt,
      });
    });

    it("normaliza o email antes de buscar e persistir", async () => {
      const result = await service.signUp({
        ...signUpInput,
        email: "  MERLIN@Example.COM ",
      });

      expect(result.customer.email).toBe("merlin@example.com");
      await expect(
        repository.findByEmail("merlin@example.com"),
      ).resolves.toMatchObject({ email: "merlin@example.com" });
    });

    it("lança 409 quando o email já existe", async () => {
      await service.signUp(signUpInput);

      const error = await captureError(
        service.signUp({ ...signUpInput, fullName: "Outro Merlin" }),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getStatus()).toBe(409);
    });

    it("lança 409 quando o unique do banco vence uma corrida de sign-up", async () => {
      repository.create = async () => {
        throw Object.assign(new Error("duplicate key"), { code: "23505" });
      };

      const error = await captureError(service.signUp(signUpInput));

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getStatus()).toBe(409);
    });

    it("propaga erros de persistência que não são de unicidade", async () => {
      repository.create = async () => {
        throw new Error("database offline");
      };

      await expect(service.signUp(signUpInput)).rejects.toThrow(
        "database offline",
      );
    });
  });

  describe("signIn", () => {
    it("retorna SessionCustomer e token, sem expor o hash em nenhum DTO", async () => {
      await service.signUp({ ...signUpInput, newsletterOptIn: false });

      const result = await service.signIn(signInInput);

      expect(result.customer).toEqual({
        id: expect.any(String),
        fullName: signUpInput.fullName,
        firstName: "Merlin",
        email: signUpInput.email,
      });
      expect(result.customer).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(result)).not.toContain("$argon2");
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("lança 401 com mensagem genérica quando a senha está errada", async () => {
      await service.signUp(signUpInput);

      const error = await captureError(
        service.signIn({ ...signInInput, password: "wrong password" }),
      );

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getStatus()).toBe(401);
      expect((error as UnauthorizedException).message).toBe(
        INVALID_CREDENTIALS_MESSAGE,
      );
    });

    it("usa exatamente a mesma resposta para email inexistente", async () => {
      await service.signUp(signUpInput);

      const existingError = (await captureError(
        service.signIn({ ...signInInput, password: "wrong password" }),
      )) as UnauthorizedException;
      const unknownError = (await captureError(
        service.signIn({
          ...signInInput,
          email: "unknown@example.com",
          password: "wrong password",
        }),
      )) as UnauthorizedException;

      expect(unknownError.getStatus()).toBe(existingError.getStatus());
      expect(unknownError.message).toBe(existingError.message);
      await expect(
        repository.findByEmail("unknown@example.com"),
      ).resolves.toBeNull();
    });

    it("depois de 5 falhas responde 429 e recusa até a senha correta", async () => {
      await service.signUp(signUpInput);

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const error = (await captureError(
          service.signIn({ ...signInInput, password: "wrong password" }),
        )) as UnauthorizedException;
        expect(error.getStatus()).toBe(401);
      }

      const fifth = (await captureError(
        service.signIn({ ...signInInput, password: "wrong password" }),
      )) as HttpException;
      expect(fifth.getStatus()).toBe(429);
      expect(fifth.message).toBe(LOCKOUT_MESSAGE);

      const duringLockout = (await captureError(
        service.signIn(signInInput),
      )) as HttpException;
      expect(duringLockout.getStatus()).toBe(429);

      const row = await repository.findByEmail(signUpInput.email);
      expect(row?.failedSignInCount).toBe(5);
      expect(row?.lockoutUntil).not.toBeNull();
      expect(row!.lockoutUntil!.getTime()).toBeGreaterThan(Date.now());
      expect(row!.lockoutUntil!.getTime()).toBeLessThanOrEqual(
        Date.now() + LOCKOUT_DURATION_MS,
      );
    });

    it("comporta-se igual para email inexistente (5 falhas → 429)", async () => {
      const email = "ghost@example.com";

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const error = (await captureError(
          service.signIn({ ...signInInput, email, password: "wrong password" }),
        )) as UnauthorizedException;
        expect(error.getStatus()).toBe(401);
      }

      const fifth = (await captureError(
        service.signIn({ ...signInInput, email, password: "wrong password" }),
      )) as HttpException;
      expect(fifth.getStatus()).toBe(429);

      const duringLockout = (await captureError(
        service.signIn({ ...signInInput, email }),
      )) as HttpException;
      expect(duringLockout.getStatus()).toBe(429);
      await expect(repository.findByEmail(email)).resolves.toBeNull();
    });

    it("permite nova contagem quando o lockout persistido expirou", async () => {
      const created = await service.signUp(signUpInput);
      await repository.update(created.customer.id, {
        failedSignInCount: 5,
        lockoutUntil: new Date(Date.now() - 1_000),
      });

      const error = (await captureError(
        service.signIn({ ...signInInput, password: "wrong password" }),
      )) as UnauthorizedException;

      expect(error.getStatus()).toBe(401);
      const row = await repository.findByEmail(signUpInput.email);
      expect(row?.failedSignInCount).toBe(1);
      expect(row?.lockoutUntil).toBeNull();
    });

    it("sucesso zera failed_sign_in_count e lockout_until", async () => {
      const created = await service.signUp(signUpInput);
      await repository.update(created.customer.id, {
        failedSignInCount: 4,
        lockoutUntil: new Date(Date.now() - 1_000),
      });

      await service.signIn(signInInput);

      const row = await repository.findByEmail(signUpInput.email);
      expect(row?.failedSignInCount).toBe(0);
      expect(row?.lockoutUntil).toBeNull();
    });
  });

  describe("resolveSession", () => {
    it("retorna null para token vazio ou aleatório", async () => {
      await expect(service.resolveSession("")).resolves.toBeNull();
      await expect(service.resolveSession("random-token")).resolves.toBeNull();
    });

    it("retorna o SessionCustomer de uma sessão válida", async () => {
      const { customer, sessionToken } = await service.signUp(signUpInput);

      const expected: SessionCustomer = {
        id: customer.id,
        fullName: signUpInput.fullName,
        firstName: "Merlin",
        email: signUpInput.email,
      };
      await expect(service.resolveSession(sessionToken)).resolves.toEqual(
        expected,
      );
    });

    it("retorna null e remove a sessão expirada", async () => {
      const created = await service.signUp(signUpInput);
      const expiredToken = "expired-token";
      await repository.createSession({
        customerId: created.customer.id,
        tokenHash: sha256(expiredToken),
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(service.resolveSession(expiredToken)).resolves.toBeNull();
      await expect(
        repository.findSessionByTokenHash(sha256(expiredToken)),
      ).resolves.toBeNull();
    });

    it("retorna null quando o customer da sessão não existe mais", async () => {
      const missingCustomerRepository = new InMemoryCustomerRepository();
      missingCustomerRepository.findById = async () => null;
      const missingCustomerService = new CustomerService(
        missingCustomerRepository,
      );

      const { sessionToken } =
        await missingCustomerService.signUp(signUpInput);

      await expect(
        missingCustomerService.resolveSession(sessionToken),
      ).resolves.toBeNull();
    });
  });

  describe("signOut", () => {
    it("revoga a sessão atual e é idempotente", async () => {
      const { sessionToken } = await service.signUp(signUpInput);

      await service.signOut(sessionToken);
      await expect(service.resolveSession(sessionToken)).resolves.toBeNull();

      await expect(service.signOut(sessionToken)).resolves.toBeUndefined();
      await expect(service.signOut("")).resolves.toBeUndefined();
    });
  });
});

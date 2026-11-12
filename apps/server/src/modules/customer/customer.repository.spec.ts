import { describe, expect, it } from "vitest";
import type { Database } from "../../database/database.module";
import type { CustomerRow } from "./customer.entity";
import {
  DrizzleCustomerRepository,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "./customer.repository";
import type { PasswordResetTokenRow } from "./password-reset-token.entity";
import type { SessionRow } from "./session.entity";

/**
 * Unit tests do adapter Drizzle: valida o mapeamento de cada operação do repository sem
 * banco. O SQL real (uniques, FKs, defaults) é coberto por
 * `customer.repository.integration.spec.ts` contra Postgres.
 */
function databaseStub(results: {
  selected?: unknown[];
  inserted?: unknown[];
  updated?: unknown[];
}): Database {
  return {
    select: () => ({
      from: () => ({ where: () => Promise.resolve(results.selected ?? []) }),
    }),
    insert: () => ({
      values: () => ({ returning: () => Promise.resolve(results.inserted ?? []) }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve(results.updated ?? []) }),
      }),
    }),
    delete: () => ({ where: () => Promise.resolve({ rowCount: 1 }) }),
  } as unknown as Database;
}

const now = new Date("2026-11-12T00:00:00Z");

const customerRow: CustomerRow = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Merlin Ambrosius",
  email: "merlin@example.com",
  passwordHash: "$argon2id$fake-hash",
  newsletterOptIn: true,
  termsAcceptedAt: now,
  failedSignInCount: 0,
  lockoutUntil: null,
  createdAt: now,
  updatedAt: now,
  createdBy: null,
  updatedBy: null,
};

const sessionRow: SessionRow = {
  id: "00000000-0000-0000-0000-000000000002",
  customerId: customerRow.id,
  tokenHash: "session-hash",
  expiresAt: new Date("2026-12-12T00:00:00Z"),
  createdAt: now,
  updatedAt: now,
  createdBy: null,
  updatedBy: null,
};

const resetTokenRow: PasswordResetTokenRow = {
  id: "00000000-0000-0000-0000-000000000003",
  customerId: customerRow.id,
  tokenHash: "reset-hash",
  expiresAt: new Date("2026-11-12T00:30:00Z"),
  usedAt: null,
  createdAt: now,
  updatedAt: now,
  createdBy: null,
  updatedBy: null,
};

const createCustomerInput: CreateCustomerInput = {
  fullName: customerRow.fullName,
  email: customerRow.email,
  passwordHash: customerRow.passwordHash,
  newsletterOptIn: customerRow.newsletterOptIn,
  termsAcceptedAt: customerRow.termsAcceptedAt,
};

describe("DrizzleCustomerRepository", () => {
  it("findByEmail/findById retornam a linha e convertem resultado vazio em null", async () => {
    const found = new DrizzleCustomerRepository(databaseStub({ selected: [customerRow] }));
    await expect(found.findByEmail(customerRow.email)).resolves.toEqual(customerRow);
    await expect(found.findById(customerRow.id)).resolves.toEqual(customerRow);

    const empty = new DrizzleCustomerRepository(databaseStub({ selected: [] }));
    await expect(empty.findByEmail("nobody@example.com")).resolves.toBeNull();
    await expect(empty.findById("unknown")).resolves.toBeNull();
  });

  it("create/update retornam a linha persistida", async () => {
    const created = new DrizzleCustomerRepository(databaseStub({ inserted: [customerRow] }));
    await expect(created.create(createCustomerInput)).resolves.toEqual(customerRow);

    const updateInput: UpdateCustomerInput = { failedSignInCount: 5, lockoutUntil: now };
    const updatedRow = { ...customerRow, ...updateInput };
    const updated = new DrizzleCustomerRepository(databaseStub({ updated: [updatedRow] }));
    await expect(updated.update(customerRow.id, updateInput)).resolves.toEqual(updatedRow);

    const missing = new DrizzleCustomerRepository(databaseStub({ updated: [] }));
    await expect(missing.update("unknown", updateInput)).resolves.toBeNull();
  });

  it("opera sessões: create, findByTokenHash, delete e deleteAllForCustomer", async () => {
    const sessionRepository = new DrizzleCustomerRepository(
      databaseStub({ inserted: [sessionRow], selected: [sessionRow] }),
    );

    await expect(
      sessionRepository.createSession({
        customerId: sessionRow.customerId,
        tokenHash: sessionRow.tokenHash,
        expiresAt: sessionRow.expiresAt,
      }),
    ).resolves.toEqual(sessionRow);
    await expect(sessionRepository.findSessionByTokenHash(sessionRow.tokenHash)).resolves.toEqual(
      sessionRow,
    );
    await expect(sessionRepository.deleteSessionByTokenHash(sessionRow.tokenHash)).resolves.toBeUndefined();
    await expect(sessionRepository.deleteAllSessionsForCustomer(customerRow.id)).resolves.toBeUndefined();

    const empty = new DrizzleCustomerRepository(databaseStub({ selected: [] }));
    await expect(empty.findSessionByTokenHash("unknown")).resolves.toBeNull();
  });

  it("opera reset token: create, findByTokenHash e markUsed", async () => {
    const usedRow = { ...resetTokenRow, usedAt: now };
    const repository = new DrizzleCustomerRepository(
      databaseStub({ inserted: [resetTokenRow], selected: [resetTokenRow], updated: [usedRow] }),
    );

    await expect(
      repository.createPasswordResetToken({
        customerId: resetTokenRow.customerId,
        tokenHash: resetTokenRow.tokenHash,
        expiresAt: resetTokenRow.expiresAt,
      }),
    ).resolves.toEqual(resetTokenRow);
    await expect(
      repository.findPasswordResetTokenByTokenHash(resetTokenRow.tokenHash),
    ).resolves.toEqual(resetTokenRow);
    await expect(repository.markPasswordResetTokenUsed(resetTokenRow.id, now)).resolves.toEqual(
      usedRow,
    );

    const empty = new DrizzleCustomerRepository(databaseStub({ selected: [], updated: [] }));
    await expect(empty.findPasswordResetTokenByTokenHash("unknown")).resolves.toBeNull();
    await expect(empty.markPasswordResetTokenUsed("unknown", now)).resolves.toBeNull();
  });
});

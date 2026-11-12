import { randomUUID } from "node:crypto";
import type { CustomerRow } from "./customer.entity";
import {
  type CreateCustomerInput,
  type CreatePasswordResetTokenInput,
  type CreateSessionInput,
  type CustomerRepository,
  type UpdateCustomerInput,
} from "./customer.repository";
import type { PasswordResetTokenRow } from "./password-reset-token.entity";
import type { SessionRow } from "./session.entity";

/** Erro no formato do Postgres para violação de unicidade (code `23505`). */
function uniqueViolation(constraint: string): Error & { code: string } {
  return Object.assign(
    new Error(`duplicate key value violates unique constraint "${constraint}"`),
    { code: "23505" },
  );
}

/**
 * Fake em memória do `CustomerRepository`, usado nos unit tests do service (task_06/07).
 *
 * Reproduz o suficiente do comportamento do Postgres para os testes de regra de negócio:
 * ids/timestamps gerados, defaults de lockout, unicidade de email e de token_hash, e
 * cópias defensivas nas leituras. Nenhuma regra de negócio mora aqui.
 */
export class InMemoryCustomerRepository implements CustomerRepository {
  private customers: CustomerRow[] = [];
  private sessions: SessionRow[] = [];
  private resetTokens: PasswordResetTokenRow[] = [];

  async findByEmail(email: string): Promise<CustomerRow | null> {
    const row = this.customers.find((candidate) => candidate.email === email);
    return row ? { ...row } : null;
  }

  async findById(id: string): Promise<CustomerRow | null> {
    const row = this.customers.find((candidate) => candidate.id === id);
    return row ? { ...row } : null;
  }

  async create(input: CreateCustomerInput): Promise<CustomerRow> {
    if (this.customers.some((candidate) => candidate.email === input.email)) {
      throw uniqueViolation("customer_email_unique");
    }

    const now = new Date();
    const row: CustomerRow = {
      id: randomUUID(),
      ...input,
      failedSignInCount: 0,
      lockoutUntil: null,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
    };

    this.customers.push(row);
    return { ...row };
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerRow | null> {
    const index = this.customers.findIndex((candidate) => candidate.id === id);
    if (index === -1) return null;

    const row: CustomerRow = {
      ...this.customers[index],
      ...input,
      updatedAt: new Date(),
    };

    this.customers[index] = row;
    return { ...row };
  }

  async createSession(input: CreateSessionInput): Promise<SessionRow> {
    if (this.sessions.some((candidate) => candidate.tokenHash === input.tokenHash)) {
      throw uniqueViolation("session_token_hash_unique");
    }

    const now = new Date();
    const row: SessionRow = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
    };

    this.sessions.push(row);
    return { ...row };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
    const row = this.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    return row ? { ...row } : null;
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    this.sessions = this.sessions.filter((candidate) => candidate.tokenHash !== tokenHash);
  }

  async deleteAllSessionsForCustomer(customerId: string): Promise<void> {
    this.sessions = this.sessions.filter((candidate) => candidate.customerId !== customerId);
  }

  async createPasswordResetToken(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetTokenRow> {
    if (this.resetTokens.some((candidate) => candidate.tokenHash === input.tokenHash)) {
      throw uniqueViolation("password_reset_token_token_hash_unique");
    }

    const now = new Date();
    const row: PasswordResetTokenRow = {
      id: randomUUID(),
      ...input,
      usedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
    };

    this.resetTokens.push(row);
    return { ...row };
  }

  async findPasswordResetTokenByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRow | null> {
    const row = this.resetTokens.find((candidate) => candidate.tokenHash === tokenHash);
    return row ? { ...row } : null;
  }

  async markPasswordResetTokenUsed(
    id: string,
    usedAt: Date,
  ): Promise<PasswordResetTokenRow | null> {
    const index = this.resetTokens.findIndex((candidate) => candidate.id === id);
    if (index === -1) return null;

    const row: PasswordResetTokenRow = {
      ...this.resetTokens[index],
      usedAt,
      updatedAt: new Date(),
    };

    this.resetTokens[index] = row;
    return { ...row };
  }
}

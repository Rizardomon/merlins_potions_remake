import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE, type Database } from "../../database/database.module";
import { customer, type CustomerRow } from "./customer.entity";
import {
  passwordResetToken,
  type PasswordResetTokenRow,
} from "./password-reset-token.entity";
import { session, type SessionRow } from "./session.entity";

/**
 * Entradas de escrita do repository. São tipos próprios (e não `$inferInsert`) para que
 * Drizzle e o fake em memória compartilhem exatamente o mesmo contrato, sem vazar `SQL`.
 */
export interface CreateCustomerInput {
  fullName: string;
  email: string;
  passwordHash: string;
  newsletterOptIn: boolean;
  termsAcceptedAt: Date;
}

export interface UpdateCustomerInput {
  fullName?: string;
  passwordHash?: string;
  newsletterOptIn?: boolean;
  failedSignInCount?: number;
  lockoutUntil?: Date | null;
}

export interface CreateSessionInput {
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface CreatePasswordResetTokenInput {
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Acesso a dados do módulo customer (customer, session e password_reset_token).
 *
 * O repository **não** contém regra de negócio: hashing, lockout e expiração são
 * decididos no service. Drizzle e o fake em memória implementam esta mesma interface.
 */
export interface CustomerRepository {
  findByEmail(email: string): Promise<CustomerRow | null>;
  findById(id: string): Promise<CustomerRow | null>;
  create(input: CreateCustomerInput): Promise<CustomerRow>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerRow | null>;

  createSession(input: CreateSessionInput): Promise<SessionRow>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  deleteAllSessionsForCustomer(customerId: string): Promise<void>;

  createPasswordResetToken(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetTokenRow>;
  findPasswordResetTokenByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRow | null>;
  markPasswordResetTokenUsed(
    id: string,
    usedAt: Date,
  ): Promise<PasswordResetTokenRow | null>;
}

/** Token de injeção da interface (interfaces não existem em runtime no Nest). */
export const CUSTOMER_REPOSITORY = Symbol("CUSTOMER_REPOSITORY");

/** Implementação Drizzle — a única camada do domínio que toca no banco. */
@Injectable()
export class DrizzleCustomerRepository implements CustomerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByEmail(email: string): Promise<CustomerRow | null> {
    const [row] = await this.db.select().from(customer).where(eq(customer.email, email));
    return row ?? null;
  }

  async findById(id: string): Promise<CustomerRow | null> {
    const [row] = await this.db.select().from(customer).where(eq(customer.id, id));
    return row ?? null;
  }

  async create(input: CreateCustomerInput): Promise<CustomerRow> {
    const [row] = await this.db.insert(customer).values(input).returning();
    return row;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerRow | null> {
    const [row] = await this.db
      .update(customer)
      .set(input)
      .where(eq(customer.id, id))
      .returning();
    return row ?? null;
  }

  async createSession(input: CreateSessionInput): Promise<SessionRow> {
    const [row] = await this.db.insert(session).values(input).returning();
    return row;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
    const [row] = await this.db
      .select()
      .from(session)
      .where(eq(session.tokenHash, tokenHash));
    return row ?? null;
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.db.delete(session).where(eq(session.tokenHash, tokenHash));
  }

  async deleteAllSessionsForCustomer(customerId: string): Promise<void> {
    await this.db.delete(session).where(eq(session.customerId, customerId));
  }

  async createPasswordResetToken(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetTokenRow> {
    const [row] = await this.db.insert(passwordResetToken).values(input).returning();
    return row;
  }

  async findPasswordResetTokenByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRow | null> {
    const [row] = await this.db
      .select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.tokenHash, tokenHash));
    return row ?? null;
  }

  async markPasswordResetTokenUsed(
    id: string,
    usedAt: Date,
  ): Promise<PasswordResetTokenRow | null> {
    const [row] = await this.db
      .update(passwordResetToken)
      .set({ usedAt })
      .where(eq(passwordResetToken.id, id))
      .returning();
    return row ?? null;
  }
}

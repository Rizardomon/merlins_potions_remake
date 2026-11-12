import { createHash, randomBytes } from "node:crypto";
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  SessionCustomer,
  SignInRequest,
  SignUpRequest,
} from "@merlins-potions-remake/shared";
import { argon2id, hash as hashPassword, verify as verifyPassword } from "argon2";
import type { CustomerRow } from "./customer.entity";
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from "./customer.repository";

/** Duração da sessão: sempre criação + 30 dias (ADR-005). */
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** Janela de pausa após 5 falhas consecutivas de sign-in. */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/** Falhas consecutivas que ativam o lockout. */
export const MAX_FAILED_SIGN_IN_ATTEMPTS = 5;

export const INVALID_CREDENTIALS_MESSAGE =
  "Email or password is incorrect.";
export const LOCKOUT_MESSAGE = "Too many sign-in attempts. Try again later.";
export const EMAIL_ALREADY_REGISTERED_MESSAGE = "Email is already registered.";

/**
 * Hash fictício (Argon2id, parâmetros padrão) usado no sign-in de email inexistente.
 *
 * O `verify` roda mesmo quando não há conta para igualar o custo de tempo ao caminho de
 * email existente e impedir enumeração por timing (ADR-006).
 */
const FAKE_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$BvkFmN3aCa4zpc0QcGCeDg$IZs57hZzcLVUCclHtctA4z1EHHGFPn6F7Nu3F6ApxiY";

export interface AuthSession {
  customer: SessionCustomer;
  sessionToken: string;
  expiresAt: Date;
}

interface UnknownEmailFailures {
  failedSignInCount: number;
  lockoutUntil: Date | null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "23505"
  );
}

@Injectable()
export class CustomerService {
  /**
   * Contador de falhas para emails que não são contas. Mantido em memória porque não existe
   * tabela para emails inexistentes; o comportamento (status/tempo) é idêntico ao persistido.
   */
  private readonly unknownEmailFailures = new Map<
    string,
    UnknownEmailFailures
  >();

  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repository: CustomerRepository,
  ) {}

  async signUp(input: SignUpRequest): Promise<AuthSession> {
    const email = this.normalizeEmail(input.email);

    if (await this.repository.findByEmail(email)) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const passwordHash = await hashPassword(input.password, { type: argon2id });

    let customer: CustomerRow;
    try {
      customer = await this.repository.create({
        fullName: input.fullName,
        email,
        passwordHash,
        newsletterOptIn: input.newsletterOptIn,
        termsAcceptedAt: new Date(),
      });
    } catch (error) {
      // Corrida entre dois sign-ups do mesmo email: o unique do banco decide.
      if (isUniqueViolation(error)) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      }
      throw error;
    }

    this.unknownEmailFailures.delete(email);
    return this.createSessionFor(customer);
  }

  async signIn(input: SignInRequest): Promise<AuthSession> {
    const email = this.normalizeEmail(input.email);
    const customer = await this.repository.findByEmail(email);

    if (customer) {
      this.assertNotLocked(customer.lockoutUntil);

      const passwordMatches = await verifyPassword(
        customer.passwordHash,
        input.password,
      );

      if (!passwordMatches) {
        await this.registerPersistedFailure(customer);
      }

      await this.clearLockout(customer);
      this.unknownEmailFailures.delete(email);
      return this.createSessionFor(customer);
    }

    const state = this.unknownEmailFailures.get(email);
    this.assertNotLocked(state?.lockoutUntil ?? null);

    // Verify fictício: mantém o custo de tempo do caminho sem conta.
    await verifyPassword(FAKE_PASSWORD_HASH, input.password);
    this.registerUnknownEmailFailure(email, state);
  }

  async signOut(sessionToken: string): Promise<void> {
    if (!sessionToken) return;
    await this.repository.deleteSessionByTokenHash(this.hashToken(sessionToken));
  }

  async resolveSession(
    sessionToken: string,
  ): Promise<SessionCustomer | null> {
    if (!sessionToken) return null;

    const tokenHash = this.hashToken(sessionToken);
    const session = await this.repository.findSessionByTokenHash(tokenHash);

    if (!session) return null;

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.repository.deleteSessionByTokenHash(tokenHash);
      return null;
    }

    const customer = await this.repository.findById(session.customerId);
    return customer ? this.toSessionCustomer(customer) : null;
  }

  private async createSessionFor(customer: CustomerRow): Promise<AuthSession> {
    const sessionToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.repository.createSession({
      customerId: customer.id,
      tokenHash: this.hashToken(sessionToken),
      expiresAt,
    });

    return {
      customer: this.toSessionCustomer(customer),
      sessionToken,
      expiresAt,
    };
  }

  private async registerPersistedFailure(
    customer: CustomerRow,
  ): Promise<never> {
    const now = Date.now();
    const attempts = this.nextAttemptCount(
      customer.failedSignInCount,
      customer.lockoutUntil,
      now,
    );
    const locked = attempts >= MAX_FAILED_SIGN_IN_ATTEMPTS;

    await this.repository.update(customer.id, {
      failedSignInCount: attempts,
      lockoutUntil: locked ? new Date(now + LOCKOUT_DURATION_MS) : null,
    });

    throw locked ? this.lockoutException() : this.invalidCredentialsException();
  }

  private registerUnknownEmailFailure(
    email: string,
    state: UnknownEmailFailures | undefined,
  ): never {
    const now = Date.now();
    const attempts = this.nextAttemptCount(
      state?.failedSignInCount ?? 0,
      state?.lockoutUntil ?? null,
      now,
    );
    const locked = attempts >= MAX_FAILED_SIGN_IN_ATTEMPTS;

    this.unknownEmailFailures.set(email, {
      failedSignInCount: attempts,
      lockoutUntil: locked ? new Date(now + LOCKOUT_DURATION_MS) : null,
    });

    throw locked ? this.lockoutException() : this.invalidCredentialsException();
  }

  /**
   * Conta a falha a partir de zero quando o lockout anterior já expirou; caso contrário,
   * continua a sequência atual.
   */
  private nextAttemptCount(
    failedSignInCount: number,
    lockoutUntil: Date | null,
    now: number,
  ): number {
    const expired = lockoutUntil !== null && lockoutUntil.getTime() <= now;
    return (expired ? 0 : failedSignInCount) + 1;
  }

  private assertNotLocked(lockoutUntil: Date | null): void {
    if (lockoutUntil && lockoutUntil.getTime() > Date.now()) {
      throw this.lockoutException();
    }
  }

  private async clearLockout(customer: CustomerRow): Promise<void> {
    if (customer.failedSignInCount === 0 && customer.lockoutUntil === null) {
      return;
    }

    await this.repository.update(customer.id, {
      failedSignInCount: 0,
      lockoutUntil: null,
    });
  }

  private toSessionCustomer(customer: CustomerRow): SessionCustomer {
    const fullName = customer.fullName.trim();
    const [firstName] = fullName.split(/\s+/);

    return {
      id: customer.id,
      fullName: customer.fullName,
      firstName: firstName || fullName,
      email: customer.email,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private invalidCredentialsException(): UnauthorizedException {
    return new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
  }

  private lockoutException(): HttpException {
    return new HttpException(LOCKOUT_MESSAGE, HttpStatus.TOO_MANY_REQUESTS);
  }
}

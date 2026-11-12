/**
 * Barrel das tabelas Drizzle. O `drizzle.config.ts` lê deste arquivo para descobrir o
 * schema, e o `DatabaseModule` o usa para tipar o cliente.
 *
 * Cada domínio reexporta aqui a sua `<domain>.entity.ts` — ver `modules/_example/` e
 * `docs/padroes/backend-modulo.md`.
 */
export * from "../modules/customer/customer.entity";
export * from "../modules/customer/password-reset-token.entity";
export * from "../modules/customer/session.entity";

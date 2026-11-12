import { describe, expect, it } from "vitest";
import {
  CompletePasswordResetSchema,
  RequestPasswordResetSchema,
  SessionCustomerSchema,
  SessionResponseSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
} from "./auth";
import {
  CompletePasswordResetSchema as CompletePasswordResetSchemaBarrel,
  RequestPasswordResetSchema as RequestPasswordResetSchemaBarrel,
  SessionCustomerSchema as SessionCustomerSchemaBarrel,
  SessionResponseSchema as SessionResponseSchemaBarrel,
  SignInRequestSchema as SignInRequestSchemaBarrel,
  SignUpRequestSchema as SignUpRequestSchemaBarrel,
} from "../src/index";

const validSignUp = {
  fullName: "Merlin Ambrosius",
  email: "merlin@camelot.com",
  password: "supersecret",
  newsletterOptIn: false,
  termsAccepted: true as const,
};

const validCustomer = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Merlin Ambrosius",
  firstName: "Merlin",
  email: "merlin@camelot.com",
};

describe("SignUpRequestSchema", () => {
  it("aceita um sign-up válido", () => {
    expect(() => SignUpRequestSchema.parse(validSignUp)).not.toThrow();
  });

  it("rejeita termsAccepted false", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, termsAccepted: false }),
    ).toThrow();
  });

  it("rejeita termsAccepted ausente", () => {
    const { termsAccepted: _termsAccepted, ...withoutTerms } = validSignUp;
    expect(() => SignUpRequestSchema.parse(withoutTerms)).toThrow();
  });

  it("aceita termsAccepted true", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, termsAccepted: true }),
    ).not.toThrow();
  });

  it("rejeita senha com 7 caracteres", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, password: "1234567" }),
    ).toThrow();
  });

  it("aceita senha com 8 caracteres", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, password: "12345678" }),
    ).not.toThrow();
  });

  it("normaliza email com espaços e maiúsculas", () => {
    const result = SignUpRequestSchema.parse({
      ...validSignUp,
      email: "  USER@X.COM ",
    });
    expect(result.email).toBe("user@x.com");
  });

  it("normaliza fullName removendo espaços das pontas", () => {
    const result = SignUpRequestSchema.parse({
      ...validSignUp,
      fullName: "  Merlin  ",
    });
    expect(result.fullName).toBe("Merlin");
  });

  it("rejeita fullName vazio", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, fullName: "   " }),
    ).toThrow();
  });

  it("rejeita newsletterOptIn não-booleano", () => {
    expect(() =>
      SignUpRequestSchema.parse({ ...validSignUp, newsletterOptIn: "yes" }),
    ).toThrow();
  });
});

describe("SignInRequestSchema", () => {
  const validSignIn = {
    email: "merlin@camelot.com",
    password: "x",
    keepSignedIn: true,
  };

  it("aceita um sign-in válido", () => {
    expect(() => SignInRequestSchema.parse(validSignIn)).not.toThrow();
  });

  it("exige password com no mínimo 1 caractere", () => {
    expect(() =>
      SignInRequestSchema.parse({ ...validSignIn, password: "" }),
    ).toThrow();
  });

  it("rejeita keepSignedIn não-booleano", () => {
    expect(() =>
      SignInRequestSchema.parse({ ...validSignIn, keepSignedIn: "true" }),
    ).toThrow();
  });

  it("rejeita keepSignedIn ausente", () => {
    const { keepSignedIn: _keepSignedIn, ...withoutKeepSignedIn } = validSignIn;
    expect(() => SignInRequestSchema.parse(withoutKeepSignedIn)).toThrow();
  });

  it("aceita keepSignedIn false", () => {
    expect(() =>
      SignInRequestSchema.parse({ ...validSignIn, keepSignedIn: false }),
    ).not.toThrow();
  });

  it("normaliza email com espaços e maiúsculas", () => {
    const result = SignInRequestSchema.parse({
      ...validSignIn,
      email: "  USER@X.COM ",
    });
    expect(result.email).toBe("user@x.com");
  });
});

describe("RequestPasswordResetSchema", () => {
  it("normaliza email com espaços e maiúsculas", () => {
    const result = RequestPasswordResetSchema.parse({
      email: "  USER@X.COM ",
    });
    expect(result.email).toBe("user@x.com");
  });

  it("rejeita email inválido", () => {
    expect(() =>
      RequestPasswordResetSchema.parse({ email: "not-an-email" }),
    ).toThrow();
  });

  it("rejeita email ausente", () => {
    expect(() => RequestPasswordResetSchema.parse({})).toThrow();
  });
});

describe("CompletePasswordResetSchema", () => {
  const validReset = { token: "opaque-token", password: "12345678" };

  it("aceita token e senha válidos", () => {
    expect(() => CompletePasswordResetSchema.parse(validReset)).not.toThrow();
  });

  it("rejeita senha com 7 caracteres", () => {
    expect(() =>
      CompletePasswordResetSchema.parse({ ...validReset, password: "1234567" }),
    ).toThrow();
  });

  it("rejeita token vazio", () => {
    expect(() =>
      CompletePasswordResetSchema.parse({ ...validReset, token: "" }),
    ).toThrow();
  });

  it("rejeita token ausente", () => {
    expect(() =>
      CompletePasswordResetSchema.parse({ password: "12345678" }),
    ).toThrow();
  });
});

describe("SessionCustomerSchema", () => {
  it("aceita um cliente de sessão válido", () => {
    expect(() => SessionCustomerSchema.parse(validCustomer)).not.toThrow();
  });

  it("rejeita id que não é uuid", () => {
    expect(() =>
      SessionCustomerSchema.parse({ ...validCustomer, id: "not-a-uuid" }),
    ).toThrow();
  });

  it("rejeita email inválido", () => {
    expect(() =>
      SessionCustomerSchema.parse({ ...validCustomer, email: "nope" }),
    ).toThrow();
  });

  it("rejeita firstName ausente", () => {
    const { firstName: _firstName, ...withoutFirstName } = validCustomer;
    expect(() => SessionCustomerSchema.parse(withoutFirstName)).toThrow();
  });
});

describe("SessionResponseSchema", () => {
  it("aceita customer nulo", () => {
    expect(() => SessionResponseSchema.parse({ customer: null })).not.toThrow();
  });

  it("aceita customer preenchido", () => {
    const result = SessionResponseSchema.parse({ customer: validCustomer });
    expect(result.customer?.firstName).toBe("Merlin");
  });

  it("rejeita customer ausente", () => {
    expect(() => SessionResponseSchema.parse({})).toThrow();
  });

  it("rejeita customer inválido", () => {
    expect(() =>
      SessionResponseSchema.parse({
        customer: { ...validCustomer, id: "not-a-uuid" },
      }),
    ).toThrow();
  });
});

describe("barrel import", () => {
  it("reexporta todos os schemas de auth via index.ts", () => {
    expect(SignUpRequestSchemaBarrel).toBe(SignUpRequestSchema);
    expect(SignInRequestSchemaBarrel).toBe(SignInRequestSchema);
    expect(RequestPasswordResetSchemaBarrel).toBe(RequestPasswordResetSchema);
    expect(CompletePasswordResetSchemaBarrel).toBe(CompletePasswordResetSchema);
    expect(SessionCustomerSchemaBarrel).toBe(SessionCustomerSchema);
    expect(SessionResponseSchemaBarrel).toBe(SessionResponseSchema);
  });
});

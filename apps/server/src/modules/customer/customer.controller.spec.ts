import {
  BadRequestException,
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SessionCustomer } from "@merlins-potions-remake/shared";
import { CustomerController } from "./customer.controller";
import type { AuthSession } from "./customer.service";
import { CustomerService } from "./customer.service";

describe("CustomerController", () => {
  let controller: CustomerController;
  let service: CustomerService;

  beforeEach(() => {
    service = {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      resolveSession: vi.fn(),
      requestPasswordReset: vi.fn(),
      completePasswordReset: vi.fn(),
    } as any;

    controller = new CustomerController(service);
  });

  describe("signUp", () => {
    it("returns 201 with session on valid input", async () => {
      const mockSession: AuthSession = {
        customer: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          fullName: "John Doe",
          firstName: "John",
          email: "john@example.com",
        },
        sessionToken: "token",
        expiresAt: new Date("2026-12-12"),
      };

      vi.mocked(service.signUp).mockResolvedValue(mockSession);

      const result = await controller.signUp({
        fullName: "John Doe",
        email: "john@example.com",
        password: "password123",
        newsletterOptIn: false,
        termsAccepted: true,
      });

      expect(result).toEqual(mockSession);
    });

    it("returns 400 with invalid body", async () => {
      await expect(
        controller.signUp({
          fullName: "John",
          // missing email, password, etc.
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("returns 409 when email already exists", async () => {
      vi.mocked(service.signUp).mockRejectedValue(
        new ConflictException("Email is already registered."),
      );

      await expect(
        controller.signUp({
          fullName: "John Doe",
          email: "john@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("signIn", () => {
    it("returns 200 with session on valid credentials", async () => {
      const mockSession: AuthSession = {
        customer: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          fullName: "John Doe",
          firstName: "John",
          email: "john@example.com",
        },
        sessionToken: "token",
        expiresAt: new Date("2026-12-12"),
      };

      vi.mocked(service.signIn).mockResolvedValue(mockSession);

      const result = await controller.signIn({
        email: "john@example.com",
        password: "password123",
        keepSignedIn: false,
      });

      expect(result).toEqual(mockSession);
    });

    it("returns 400 with invalid body", async () => {
      await expect(
        controller.signIn({
          email: "invalid",
          // missing password
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("returns 401 with invalid credentials", async () => {
      vi.mocked(service.signIn).mockRejectedValue(
        new Error("Email or password is incorrect."),
      );

      await expect(
        controller.signIn({
          email: "john@example.com",
          password: "wrongpassword",
          keepSignedIn: false,
        }),
      ).rejects.toThrow();
    });

    it("returns 429 on lockout", async () => {
      vi.mocked(service.signIn).mockRejectedValue(
        new HttpException(
          "Too many sign-in attempts. Try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(
        controller.signIn({
          email: "john@example.com",
          password: "password123",
          keepSignedIn: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("signOut", () => {
    it("returns 204 idempotent", async () => {
      vi.mocked(service.signOut).mockResolvedValue(undefined);

      const result = await controller.signOut("Bearer token123");
      expect(result).toBeUndefined();
      expect(service.signOut).toHaveBeenCalledWith("token123");
    });

    it("extracts bearer token from header", async () => {
      vi.mocked(service.signOut).mockResolvedValue(undefined);

      await controller.signOut("Bearer mytoken");
      expect(service.signOut).toHaveBeenCalledWith("mytoken");
    });

    it("handles missing token gracefully", async () => {
      vi.mocked(service.signOut).mockResolvedValue(undefined);

      await controller.signOut(undefined);
      expect(service.signOut).toHaveBeenCalledWith("");
    });
  });

  describe("getSession", () => {
    it("returns session customer when token is valid", async () => {
      const mockCustomer: SessionCustomer = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        firstName: "John",
        email: "john@example.com",
      };

      vi.mocked(service.resolveSession).mockResolvedValue(mockCustomer);

      const result = await controller.getSession("Bearer token123");
      expect(result.customer).toEqual(mockCustomer);
      expect(service.resolveSession).toHaveBeenCalledWith("token123");
    });

    it("returns null customer when token is invalid", async () => {
      vi.mocked(service.resolveSession).mockResolvedValue(null);

      const result = await controller.getSession("Bearer invalidtoken");
      expect(result.customer).toBeNull();
    });

    it("handles missing authorization header", async () => {
      vi.mocked(service.resolveSession).mockResolvedValue(null);

      const result = await controller.getSession(undefined);
      expect(result.customer).toBeNull();
      expect(service.resolveSession).toHaveBeenCalledWith("");
    });
  });

  describe("requestPasswordReset", () => {
    it("returns 202 always", async () => {
      vi.mocked(service.requestPasswordReset).mockResolvedValue(undefined);

      const result = await controller.requestPasswordReset({
        email: "john@example.com",
      });

      expect(result).toBeUndefined();
      expect(service.requestPasswordReset).toHaveBeenCalledWith(
        "john@example.com",
      );
    });

    it("returns 202 even with nonexistent email", async () => {
      vi.mocked(service.requestPasswordReset).mockResolvedValue(undefined);

      const result = await controller.requestPasswordReset({
        email: "nonexistent@example.com",
      });

      expect(result).toBeUndefined();
    });

    it("returns 400 with invalid email", async () => {
      await expect(
        controller.requestPasswordReset({
          email: "not-an-email",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("completePasswordReset", () => {
    it("returns 204 on successful reset", async () => {
      vi.mocked(service.completePasswordReset).mockResolvedValue(undefined);

      const result = await controller.completePasswordReset({
        token: "reset-token-123",
        password: "newpassword123",
      });

      expect(result).toBeUndefined();
      expect(service.completePasswordReset).toHaveBeenCalledWith(
        "reset-token-123",
        "newpassword123",
      );
    });

    it("returns 410 when token expired", async () => {
      vi.mocked(service.completePasswordReset).mockRejectedValue(
        new GoneException("This reset link has expired."),
      );

      await expect(
        controller.completePasswordReset({
          token: "expired-token",
          password: "newpassword123",
        }),
      ).rejects.toThrow(GoneException);
    });

    it("returns 410 when token already used", async () => {
      vi.mocked(service.completePasswordReset).mockRejectedValue(
        new GoneException("This reset link has already been used."),
      );

      await expect(
        controller.completePasswordReset({
          token: "used-token",
          password: "newpassword123",
        }),
      ).rejects.toThrow(GoneException);
    });

    it("returns 400 with invalid password", async () => {
      await expect(
        controller.completePasswordReset({
          token: "token",
          password: "short", // Less than 8 characters
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Bearer token extraction", () => {
    it("extracts token from Bearer header", async () => {
      vi.mocked(service.resolveSession).mockResolvedValue(null);

      await controller.getSession("Bearer abc123xyz");
      expect(service.resolveSession).toHaveBeenCalledWith("abc123xyz");
    });

    it("handles case-insensitive Bearer prefix", async () => {
      vi.mocked(service.resolveSession).mockResolvedValue(null);

      await controller.getSession("bearer abc123xyz");
      expect(service.resolveSession).toHaveBeenCalledWith("abc123xyz");
    });

    it("returns empty string for malformed header", async () => {
      vi.mocked(service.resolveSession).mockResolvedValue(null);

      await controller.getSession("InvalidFormat token");
      expect(service.resolveSession).toHaveBeenCalledWith("");
    });
  });
});

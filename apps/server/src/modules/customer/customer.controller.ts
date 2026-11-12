import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type {
  CompletePasswordReset,
  RequestPasswordReset,
  SessionCustomer,
  SignInRequest,
  SignUpRequest,
} from "@merlins-potions-remake/shared";
import {
  CompletePasswordResetSchema,
  RequestPasswordResetSchema,
  SessionCustomerSchema,
  SessionResponseSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
} from "@merlins-potions-remake/shared";
import { parse } from "../../common/http";
import { toOpenApi } from "../../common/openapi";
import { CustomerService, type AuthSession } from "./customer.service";

@ApiTags("auth")
@Controller("auth")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post("sign-up")
  @HttpCode(201)
  async signUp(@Body() body: unknown): Promise<AuthSession> {
    const input = parse(SignUpRequestSchema, body);
    return this.service.signUp(input);
  }

  @Post("sign-in")
  @HttpCode(200)
  async signIn(@Body() body: unknown): Promise<AuthSession> {
    const input = parse(SignInRequestSchema, body);
    return this.service.signIn(input);
  }

  @Post("sign-out")
  @HttpCode(204)
  async signOut(@Headers("authorization") authHeader?: string): Promise<void> {
    const token = this.extractBearerToken(authHeader);
    await this.service.signOut(token);
  }

  @Get("session")
  @ApiOkResponse({ schema: toOpenApi(SessionResponseSchema) })
  async getSession(
    @Headers("authorization") authHeader?: string,
  ): Promise<{ customer: SessionCustomer | null }> {
    const token = this.extractBearerToken(authHeader);
    const customer = await this.service.resolveSession(token);
    return { customer };
  }

  @Post("password-resets")
  @HttpCode(202)
  async requestPasswordReset(@Body() body: unknown): Promise<void> {
    const input = parse(RequestPasswordResetSchema, body);
    await this.service.requestPasswordReset(input.email);
  }

  @Post("password-resets/complete")
  @HttpCode(204)
  async completePasswordReset(
    @Body() body: unknown,
  ): Promise<void> {
    const input = parse(CompletePasswordResetSchema, body);
    await this.service.completePasswordReset(input.token, input.password);
  }

  private extractBearerToken(authHeader?: string): string {
    if (!authHeader) return "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : "";
  }
}

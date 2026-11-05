import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CreateRoleSchema, RoleSchema, UpdateRoleSchema, type Role } from "@merlins-potions-remake/shared";
import { actorOf, parse } from "../../common/http";
import { toOpenApi, toOpenApiArray } from "../../common/openapi";
import { RoleService } from "./role.service";

/** CRUD do catálogo de papéis — o domínio de exemplo do template. */
@ApiTags("roles")
@Controller("roles")
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @ApiOkResponse({ schema: toOpenApiArray(RoleSchema) })
  findAll(): Promise<Role[]> {
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOkResponse({ schema: toOpenApi(RoleSchema) })
  findOne(@Param("id") id: string): Promise<Role> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBody({ schema: toOpenApi(CreateRoleSchema) })
  @ApiCreatedResponse({ schema: toOpenApi(RoleSchema) })
  create(@Body() body: unknown, @Req() req: Request): Promise<Role> {
    return this.service.create(parse(CreateRoleSchema, body), actorOf(req));
  }

  @Put(":id")
  @ApiBody({ schema: toOpenApi(UpdateRoleSchema) })
  @ApiOkResponse({ schema: toOpenApi(RoleSchema) })
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<Role> {
    return this.service.update(id, parse(UpdateRoleSchema, body), actorOf(req));
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@Param("id") id: string): Promise<void> {
    return this.service.remove(id);
  }
}

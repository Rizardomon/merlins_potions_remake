import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Potion } from "@merlins-potions-remake/shared";
import { PotionSchema } from "@merlins-potions-remake/shared";
import { toOpenApi, toOpenApiArray } from "../../common/openapi";
import { ProductService } from "./product.service";

@ApiTags("products")
@Controller("products")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  @ApiOkResponse({ schema: toOpenApiArray(PotionSchema) })
  findAll(): Promise<Potion[]> {
    return this.service.list();
  }

  @Get(":id")
  @ApiOkResponse({ schema: toOpenApi(PotionSchema) })
  findOne(@Param("id") id: string): Promise<Potion> {
    return this.service.getById(id);
  }
}

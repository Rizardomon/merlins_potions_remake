import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MenuSectionSchema, type Menu } from "@app/shared";
import { toOpenApiArray } from "../../common/openapi";
import { MenuService } from "./menu.service";

/** Menu de navegação do frontend. */
@ApiTags("menu")
@Controller("menu")
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Get()
  @ApiOkResponse({ schema: toOpenApiArray(MenuSectionSchema) })
  getMenu(): Promise<Menu> {
    return this.service.getMenu();
  }
}

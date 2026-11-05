import { Module } from "@nestjs/common";
import { MenuController } from "./menu.controller";
import { MenuRepository } from "./menu.repository";
import { MenuService } from "./menu.service";

/** Menu de navegação servido ao frontend (`GET /api/menu`). */
@Module({
  controllers: [MenuController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService],
})
export class MenuModule {}

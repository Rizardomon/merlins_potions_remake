import { Module } from "@nestjs/common";
import { ConfModule } from "./conf/config.module";
import { HealthController } from "./health.controller";
import { MenuModule } from "./modules/menu/menu.module";
import { RoleModule } from "./modules/role/role.module";

/**
 * Módulo raiz. Cada domínio novo entra em `imports` — ver `docs/padroes/backend-modulo.md`.
 *
 * O `DatabaseModule` **não** é importado aqui: os repositories do template são em memória,
 * então o app sobe sem Postgres. Ao ligar a persistência, adicione-o à lista (ele é
 * `@Global()`, então basta importar uma vez) e siga `modules/_example/`.
 */
@Module({
  imports: [ConfModule, MenuModule, RoleModule],
  controllers: [HealthController],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfModule } from "./conf/config.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { ProductModule } from "./modules/product/product.module";

@Module({
  imports: [ConfModule, DatabaseModule, ProductModule],
  controllers: [HealthController],
})
export class AppModule {}

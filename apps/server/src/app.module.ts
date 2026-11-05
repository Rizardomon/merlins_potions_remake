import { Module } from "@nestjs/common";
import { ConfModule } from "./conf/config.module";
import { HealthController } from "./health.controller";
import { ProductModule } from "./modules/product/product.module";

@Module({
  imports: [ConfModule, ProductModule],
  controllers: [HealthController],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfModule } from "./conf/config.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { CustomerModule } from "./modules/customer/customer.module";
import { DevModule } from "./modules/dev/dev.module";
import { ProductModule } from "./modules/product/product.module";

const devImports = process.env.NODE_ENV !== "production" ? [DevModule] : [];

@Module({
  imports: [ConfModule, DatabaseModule, CustomerModule, ProductModule, ...devImports],
  controllers: [HealthController],
})
export class AppModule {}

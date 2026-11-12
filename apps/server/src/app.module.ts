import { Module } from "@nestjs/common";
import { ConfModule } from "./conf/config.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { CustomerModule } from "./modules/customer/customer.module";
import { ProductModule } from "./modules/product/product.module";

@Module({
  imports: [ConfModule, DatabaseModule, CustomerModule, ProductModule],
  controllers: [HealthController],
})
export class AppModule {}

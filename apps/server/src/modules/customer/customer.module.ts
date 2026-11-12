import { Module } from "@nestjs/common";
import {
  CUSTOMER_REPOSITORY,
  DrizzleCustomerRepository,
} from "./customer.repository";
import { CustomerService } from "./customer.service";

@Module({
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: DrizzleCustomerRepository,
    },
  ],
  exports: [CustomerService, CUSTOMER_REPOSITORY],
})
export class CustomerModule {}

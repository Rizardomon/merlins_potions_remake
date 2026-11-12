import { Module } from "@nestjs/common";
import { DevMailer } from "../dev/dev-mailer.service";
import { NoOpMailer } from "../dev/noop-mailer.service";
import { MAILER } from "../dev/mailer.interface";
import {
  CUSTOMER_REPOSITORY,
  DrizzleCustomerRepository,
} from "./customer.repository";
import { CustomerService } from "./customer.service";
import { CustomerController } from "./customer.controller";

const mailerProvider = {
  provide: MAILER,
  useClass: process.env.NODE_ENV !== "production" ? DevMailer : NoOpMailer,
};

@Module({
  controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: DrizzleCustomerRepository,
    },
    mailerProvider,
  ],
  exports: [CustomerService, CUSTOMER_REPOSITORY],
})
export class CustomerModule {}

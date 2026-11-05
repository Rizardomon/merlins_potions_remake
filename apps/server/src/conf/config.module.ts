import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./configuration";

/**
 * Configuração global. Expõe o ConfigService para todo o app e valida as envs
 * no boot. Toda injeção de env no runtime deve passar pelo ConfigService.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
})
export class ConfModule {}

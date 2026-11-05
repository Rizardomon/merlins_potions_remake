-- REFERÊNCIA — formato de uma migration versionada.
--
-- Você NÃO escreve este arquivo à mão nem o coloca aqui: ele é gerado por
-- `pnpm --filter @merlins-potions-remake/server db:generate` a partir das entities e nasce em
-- `src/database/migrations/<seq>_<nome>.sql`, junto com o snapshot em `meta/`.
-- Este exemplo mostra apenas o que esperar da saída. Ver docs/padroes/migrations.md.
--
-- A PRIMEIRA migration do projeto precisa habilitar a pgcrypto: `gen_random_uuid()`
-- só é nativa a partir do PostgreSQL 13.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "example" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(400),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	CONSTRAINT "example_name_unique" UNIQUE("name")
);

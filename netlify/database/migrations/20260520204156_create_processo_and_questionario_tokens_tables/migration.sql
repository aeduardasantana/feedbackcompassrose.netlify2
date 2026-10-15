CREATE TABLE "processo_tokens" (
	"id" serial PRIMARY KEY,
	"processo_id" text NOT NULL,
	"token_hash" text NOT NULL UNIQUE,
	"descricao" text,
	"expires_at" timestamp,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questionario_tokens" (
	"id" serial PRIMARY KEY,
	"questionario_id" text NOT NULL,
	"avaliador_nome" text NOT NULL,
	"avaliador_email" text,
	"token_hash" text NOT NULL UNIQUE,
	"descricao" text,
	"respondido" boolean DEFAULT false NOT NULL,
	"respondido_at" timestamp,
	"expires_at" timestamp,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);

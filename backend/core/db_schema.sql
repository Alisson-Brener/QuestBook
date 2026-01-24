DROP TABLE IF EXISTS "suggested_questions", "chapters", "documents", "users";

CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL CHECK (role IN ('aluno', 'curador'))
);

CREATE TABLE "documents" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT REFERENCES "users"("id"),
    "filename" VARCHAR(255) NOT NULL,
    "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "chapters" (
    "id" SERIAL PRIMARY KEY,
    "document_id" INT REFERENCES "documents"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "text_content" TEXT
);


CREATE TABLE "suggested_questions" (
    "id" SERIAL PRIMARY KEY,
    "chapter_id" INT REFERENCES "chapters"("id") ON DELETE CASCADE,

    "external_question_id" VARCHAR(255) NOT NULL,
    
    "confidence_score" NUMERIC(5, 4) NOT NULL, 

    "status" VARCHAR(50) NOT NULL CHECK (status IN ('APROVADO_IA', 'PENDENTE', 'APROVADO_CURADOR', 'REJEITADO_CURADOR'))
);

CREATE INDEX idx_sug_chapter ON "suggested_questions" ("chapter_id");
CREATE INDEX idx_sug_status ON "suggested_questions" ("status");
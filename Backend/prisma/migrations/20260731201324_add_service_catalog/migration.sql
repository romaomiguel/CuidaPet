-- Converte as 3 colunas de enum para texto SEM perder dados (cast direto enum→texto)
ALTER TABLE "Booking" ALTER COLUMN "service" TYPE TEXT USING "service"::TEXT;
ALTER TABLE "PartnerProfile" ALTER COLUMN "servicesOffered" TYPE TEXT[] USING "servicesOffered"::TEXT[];
ALTER TABLE "PetsitterProfile" ALTER COLUMN "services" TYPE TEXT[] USING "services"::TEXT[];

-- Remove o enum, já sem nenhuma coluna usando ele
DROP TYPE "ServiceType";

-- Tabela nova do catálogo
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_audience_isActive_idx" ON "Service"("audience", "isActive");

ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;

-- Seed: os 13 serviços atuais, mesmo slug que o enum já usava (preserva todas as referências existentes)
INSERT INTO "Service" (id, slug, name, emoji, description, audience, "isActive", "createdAt") VALUES
  (gen_random_uuid(), 'hospedagem',           'Hospedagem',            '🏠', 'Cuidados dia e noite',            'petsitter', true, now()),
  (gen_random_uuid(), 'passeio',              'Passeio',               '🦮', 'Exercício diário',                 'petsitter', true, now()),
  (gen_random_uuid(), 'adestramento',         'Adestramento',          '🎓', 'Educação positiva',                'petsitter', true, now()),
  (gen_random_uuid(), 'banho_e_tosa',         'Banho & Tosa',          '🛁', 'Limpeza e estética completa',      'petshop',   true, now()),
  (gen_random_uuid(), 'visita',               'Visita Domiciliar',     '🚪', 'O cuidador vai até você',          'petsitter', true, now()),
  (gen_random_uuid(), 'creche',               'Creche',                '🎾', 'Diversão de dia',                  'petsitter', true, now()),
  (gen_random_uuid(), 'consulta_veterinaria', 'Consulta Veterinária',  '🩺', 'Diagnóstico e acompanhamento',     'clinica',   true, now()),
  (gen_random_uuid(), 'vacinacao',            'Vacinação',             '💉', 'Imunização em dia',                'clinica',   true, now()),
  (gen_random_uuid(), 'exames',               'Exames',                '🔬', 'Laboratoriais e de imagem',        'clinica',   true, now()),
  (gen_random_uuid(), 'cirurgia',             'Cirurgia',              '🩹', 'Procedimentos cirúrgicos',         'clinica',   true, now()),
  (gen_random_uuid(), 'internacao',           'Internação',            '🛏️', 'Cuidado contínuo e monitorado',   'clinica',   true, now()),
  (gen_random_uuid(), 'venda_produtos',       'Venda de Produtos',     '🛍️', 'Ração, acessórios e mais',        'petshop',   true, now()),
  (gen_random_uuid(), 'farmacia_veterinaria', 'Farmácia Veterinária',  '💊', 'Medicamentos e prescrições',       'petshop',   true, now());

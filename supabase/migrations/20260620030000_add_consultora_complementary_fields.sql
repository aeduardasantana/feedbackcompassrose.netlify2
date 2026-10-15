alter table if exists public.consultoras
  add column if not exists cpf_cnpj text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists observacoes text;

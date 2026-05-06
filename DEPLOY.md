# Deploy Cimi Alimentos — Vercel + Supabase

## 1. Supabase — Criar banco

1. Acesse https://supabase.com e crie um novo projeto ("cimi-alimentos")
2. Aguarde o projeto inicializar (~2 min)
3. Vá em **SQL Editor** e cole o conteúdo do arquivo `supabase-setup.sql`
4. Execute — isso cria todas as tabelas
5. Vá em **Settings → API** e copie:
   - **Project URL** (ex: https://xyzxyz.supabase.co)
   - **anon public key**

## 2. Configurar as chaves no Angular

Edite `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co',
    anonKey: 'eyJhbGci...'
  }
};
```

Faça o mesmo em `src/environments/environment.prod.ts`.

## 3. Deploy no Vercel

### Opção A — GitHub (recomendado)
1. Suba o projeto para um repositório GitHub
2. Acesse https://vercel.com → "New Project"
3. Conecte o repositório
4. Em **Environment Variables**, adicione:
   - `SUPABASE_URL` = sua URL
   - `SUPABASE_ANON_KEY` = sua chave
5. Clique em **Deploy** ✅

### Opção B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 4. Testar localmente antes
```bash
npm install
npm start
```
Acesse http://localhost:4200

## 5. Primeiro uso
1. Vá em **Importar MGV** e carregue o ITENSMGVPADARIA.TXT
2. Os 1677 produtos são salvos no Supabase automaticamente
3. Compartilhe a URL do Vercel com os operadores

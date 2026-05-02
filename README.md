# 🦶 FootPriv — Guia Completo (Iniciante)

> **Discretion. Dignity. Dirhams.** — Plataforma fictícia para fins acadêmicos.

⚠️ **AVISO:** Este é um projeto SIMULADO para um desafio de programação. Nada aqui é real, todos os dados são fake.

---

## 📋 O QUE VOCÊ VAI FAZER (visão geral)

1. Instalar 2 programas no seu PC (Node.js e VS Code)
2. Criar 3 contas grátis (GitHub, Supabase, Vercel)
3. Subir o código pro GitHub
4. Conectar Vercel e Supabase
5. Site no ar! 🎉

**Tempo estimado:** 3-4h se for sua primeira vez. Respira fundo, vai dar certo.

---

## 🛠️ FASE 1 — Instalando ferramentas (15 min)

### 1.1. Instalar Node.js
- Vai em https://nodejs.org/
- Baixa a versão **LTS** (botão verde da esquerda)
- Instala apertando "next, next, next"
- Pra testar: abre o **Prompt de Comando** (Windows) ou **Terminal** (Mac) e digita:
  ```
  node --version
  ```
- Se aparecer algo tipo `v20.x.x`, deu certo ✅

### 1.2. Instalar VS Code
- Vai em https://code.visualstudio.com/
- Baixa e instala normal

### 1.3. Instalar Git
- Vai em https://git-scm.com/downloads
- Baixa e instala (pode deixar todas as opções no padrão)

---

## 👤 FASE 2 — Criando contas (15 min)

Cria essas 3 contas, todas grátis:

1. **GitHub** → https://github.com/signup
2. **Supabase** → https://supabase.com/ (clica em "Start your project" e faz login com o GitHub)
3. **Vercel** → https://vercel.com/signup (também faz login com o GitHub)

> 💡 Usar "Sign in with GitHub" em todas facilita muito depois.

---

## 📦 FASE 3 — Configurando o projeto local (15 min)

### 3.1. Abrir o projeto
- Descompacta o zip que o Claude te mandou
- Abre o VS Code
- Vai em **File → Open Folder** e seleciona a pasta `footpriv`

### 3.2. Abrir o terminal DENTRO do VS Code
- No VS Code, aperta `Ctrl + '` (acento grave, fica embaixo do ESC)
- Vai abrir um terminalzinho na parte de baixo

### 3.3. Instalar as dependências
No terminal, digita:
```bash
npm install
```
Espera uns 2-3 minutos. Vai aparecer um monte de coisa, é normal.

---

## 🗄️ FASE 4 — Configurando o Supabase (20 min)

### 4.1. Criar projeto no Supabase
1. Entra em https://supabase.com/dashboard
2. Clica **"New Project"**
3. Preenche:
   - Name: `footpriv`
   - Database Password: **CRIA UMA SENHA FORTE E ANOTA EM ALGUM LUGAR**
   - Region: `South America (São Paulo)`
4. Clica em **"Create new project"** e espera uns 2 min carregar

### 4.2. Pegar as chaves de API
1. No painel do projeto, clica no ícone de **engrenagem** (Settings) na lateral esquerda
2. Vai em **API**
3. Você vai ver duas coisas importantes:
   - **Project URL** (algo tipo `https://xxxxx.supabase.co`)
   - **anon public** key (uma chave gigante)
4. **DEIXA ESSA ABA ABERTA**, vamos usar daqui a pouco

### 4.3. Criar as tabelas
1. Na lateral esquerda do Supabase, clica em **SQL Editor**
2. Clica em **"New query"**
3. Cola TODO o conteúdo do arquivo `supabase-setup.sql` (que tá na pasta do projeto)
4. Clica em **"Run"** (canto inferior direito)
5. Deve aparecer "Success" ✅

### 4.4. Criar o bucket de storage (pra fotos)
1. Na lateral, clica em **Storage**
2. Clica em **"New bucket"**
3. Nome: `feet-photos`
4. **MARCA "Public bucket"** ✅
5. Clica em **Save**

### 4.5. Conectar com seu projeto local
1. Na pasta do projeto, encontra o arquivo `.env.local.example`
2. **DUPLICA ele** e renomeia a cópia pra `.env.local` (sem o `.example`)
3. Abre o `.env.local` e preenche:
   ```
   NEXT_PUBLIC_SUPABASE_URL=cola_aqui_a_Project_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=cola_aqui_a_anon_public_key
   ```

---

## 🧪 FASE 5 — Testando localmente (5 min)

No terminal do VS Code:
```bash
npm run dev
```

Espera uns 30 seg. Quando aparecer "Ready", abre no navegador:
👉 http://localhost:3000

Se você ver o site do FootPriv, **DEU CERTO!** 🎉

Aperta `Ctrl + C` no terminal pra parar o servidor.

---

## 🚀 FASE 6 — Deploy (subir o site pra internet) (20 min)

### 6.1. Criar repositório no GitHub
1. Entra em https://github.com/new
2. Repository name: `footpriv`
3. Marca **Private** (mais discreto pro desafio)
4. **NÃO marca** nenhuma opção de "Initialize"
5. Clica **Create repository**

### 6.2. Subir o código
No terminal do VS Code, digita um comando de cada vez:
```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/footpriv.git
git push -u origin main
```
> Substitui `SEU_USUARIO` pelo seu nome de usuário do GitHub.

Se pedir login, segue as instruções na tela.

### 6.3. Deploy no Vercel
1. Entra em https://vercel.com/new
2. Clica em **"Import"** ao lado do repositório `footpriv`
3. Em **Environment Variables**, adiciona AS DUAS chaves do Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave
4. Clica **Deploy**
5. Espera uns 2 min...
6. **PRONTO! SEU SITE TÁ NO AR! 🎉**

A Vercel vai te dar um link tipo `footpriv-xyz.vercel.app`

---

## 🆘 DEU PROBLEMA?

- **"npm não é reconhecido"** → fecha o terminal, abre de novo, ou reinicia o VS Code
- **Site não carrega** → confere se preencheu o `.env.local` direitinho
- **Erro no Supabase** → confere se rodou o `supabase-setup.sql` todo
- **Build falhou no Vercel** → confere se adicionou as 2 variáveis de ambiente

Qualquer outra coisa, joga o erro no Claude!

---

## 🎭 SOBRE O PROJETO

- Todos os "sheiks" são fakes (gerados aleatoriamente)
- Os "bids" sobem sozinhos a cada poucos segundos (timer no front)
- A moeda "Camel Coins" é fictícia
- A faixa "SIMULAÇÃO" fica fixa no topo de TODAS as páginas
- Não use fotos reais de pés — coloquei placeholders (paisagens, pés de Lego, etc)

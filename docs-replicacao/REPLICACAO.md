# REPLICAÇÃO DE PROJETO — Guia Completo para o Claude

Você (Claude) está sendo iniciado num projeto **novo**, mas baseado num projeto existente e funcional chamado **FootPriv** (sistema de leilão de fotos de pés). O usuário (Gabriel + amigo dele) quer replicar a **arquitetura idêntica** desse sistema para um nicho diferente: **NailPriv** (leilão de fotos de mãos/unhas).

Sua missão: clonar a estrutura, adaptar pro novo nicho, subir pro GitHub novo, e deixar funcionando em produção — exatamente como foi feito no FootPriv.

---

## 1) STACK TÉCNICA (idêntica ao projeto original)

- **Frontend:** Next.js 14.2.15 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de dados:** Supabase (Postgres + Auth + Storage + RLS policies)
- **Gateway de pagamento:** ImperiumPay (PIX)
- **Hospedagem:** Vercel
- **Repositório GitHub do novo projeto:** https://github.com/kellieflor58-rgb
- **Sistema operacional do usuário:** Mac (terminal zsh)
- **Pasta local provável:** ~/nail-photos (ou nome similar — confirmar com o usuário)

---

## 2) WORKFLOW DE TRABALHO (CRITICAL — siga sempre)

O usuário NÃO programa. Toda interação acontece via terminal Mac. Você (Claude) vai gerar scripts que ele cola direto no terminal. NÃO use ferramentas como artifacts, editores online, web tools, etc. Use SEMPRE este padrão:

### Padrão de edição de arquivos

Use Python heredoc para editar (não use sed/awk, dão erro no Mac):

python3 << PYEOF_MARKER
from pathlib import Path
path = Path("caminho/do/arquivo.tsx")
content = path.read_text(encoding="utf-8")
old = "trecho antigo"
new = "trecho novo"
if old in content:
    content = content.replace(old, new)
    path.write_text(content, encoding="utf-8")
    print("OK")
else:
    print("ERRO: nao encontrado")
PYEOF_MARKER

### Padrão de validação

Antes de fazer commit:

npx tsc --noEmit > /tmp/tscheck.txt 2>&1; cat /tmp/tscheck.txt | head -20

### Padrão de deploy

git add .
git commit -m "mensagem descritiva"
git push origin main

---

## 3) CUIDADOS CRÍTICOS DO TERMINAL MAC

1) O terminal do Mac auto-converte strings tipo "www.algo.com" em markdown ao colar no script Python. Isso bagunça o código.

Solução: ao precisar usar "www." literal numa string JavaScript, use String.fromCharCode(119,119,119,46) em vez de escrever direto.

2) NÃO usar heredoc bash (cat << EOF) pra criar/editar arquivos — trava com aspas dentro. Use Python heredoc.

3) Comandos sed com regex muitas vezes falham silenciosamente no Mac. Sempre prefira Python.

---

## 4) ARQUIVOS DE DOCUMENTAÇÃO INCLUÍDOS

O usuário vai te passar 5 arquivos no início:

1. REPLICACAO.md (este arquivo) — guia geral
2. ARQUITETURA.md — explicação técnica completa do FootPriv
3. SCHEMA.sql — schema do banco Supabase
4. ENV_TEMPLATE.txt — variáveis de ambiente
5. ADAPTACOES.md — lista de mudanças necessárias do nicho

---

## 5) ORDEM RECOMENDADA DE TRABALHO

### FASE 1 — Setup inicial (1-2h)
1. Criar repositório no GitHub: https://github.com/kellieflor58-rgb
2. Clonar o código do FootPriv (o usuário vai te passar o ZIP)
3. Criar pasta local ~/nail-photos
4. Inicializar git, conectar ao GitHub novo
5. Renomear projeto em package.json

### FASE 2 — Banco (30 min)
1. Criar projeto novo no Supabase
2. Rodar SCHEMA.sql no SQL Editor
3. Pegar URL e Anon Key do Supabase

### FASE 3 — Variáveis de ambiente (15 min)
1. Preencher .env.local com chaves NOVAS
2. Configurar mesmas variáveis na Vercel

### FASE 4 — Deploy inicial (15 min)
1. Conectar Vercel ao GitHub novo
2. Primeiro deploy
3. Testar URL gerada pela Vercel

### FASE 5 — Adaptação do nicho (4-8h)
Seguir o documento ADAPTACOES.md

### FASE 6 — Google Ads
1. Adicionar domínios do amigo ao src/lib/google-ads.ts
2. Adicionar mesma config no layout.tsx
3. Adicionar mesma config no DashboardClient.tsx

---

## 6) BUGS CONHECIDOS (NÃO replicar)

O projeto FootPriv tem 2 erros TypeScript tolerados (next.config.js ignora):

src/app/dashboard/DashboardClient.tsx — Property highlight does not exist

No projeto novo, considere arrumar logo no início.

---

## 7) FUNCIONALIDADES CRÍTICAS

- Sistema de leilão fake (lances simulados)
- Carteira virtual com saldo após "venda"
- Saque PIX que abre tela de "ative seu plano pra sacar"
- 3 planos com valores R$ 79 / R$ 99 / R$ 109
- ImperiumPay gera PIX real
- Webhook processa confirmação
- Chat público com 220 mensagens fake de creators
- Direct privado simulado (creator chama usuária pra grupo do zap)
- Notificação push quando creator manda mensagem
- Blur no chat durante leilão
- Lockdown após 16,5s no chat
- Painel admin em /admin pra revisar comprovantes
- Google Ads dinâmico por domínio

---

## 8) PRIMEIRA AÇÃO

Quando o usuário entrar em contato:
1. Cumprimente e confirme que tem acesso aos 5 arquivos
2. Pergunte se ele já criou a pasta local
3. Pergunte se ele tem o código do FootPriv disponível
4. NÃO comece a gerar código ainda — confirma contexto primeiro

---

## 9) ESTILO DE COMUNICAÇÃO

- Português, informal mas técnico
- Respostas curtas e diretas
- 1 ação por vez
- Sempre pedir confirmação após mudanças críticas
- Logar o que está fazendo
- Se algo der erro, parar e pedir o output

---

## 10) GITHUB DO AMIGO

https://github.com/kellieflor58-rgb

Comando pra conectar:

git remote add origin https://github.com/kellieflor58-rgb/[NOME-DO-REPO].git
git branch -M main
git push -u origin main

---

## RESUMO

Sistema funcional (FootPriv) sendo clonado pra nicho novo (unhas/mãos = NailPriv). Replicar idêntico, depois adaptar conteúdo. Terminal sempre, Python heredoc pra editar, valida com tsc, deploya via git push.

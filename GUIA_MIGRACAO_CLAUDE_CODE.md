# Guia Definitivo: Como Migrar e Rodar o Enfermeiro Digital no Claude Code

Este guia detalha o passo a passo exato para você abrir e trabalhar com este projeto no **Claude Code** (a ferramenta oficial de linha de comando / agente da Anthropic).

---

## 1. Localização do Backup v0.7 Gerado

O backup completo compactado (com todos os arquivos de código, assets, vídeos de procedimentos e configurações, excluindo apenas pastas pesadas regeneráveis como `node_modules` e `.git`) foi gerado com sucesso:

- **Arquivo**: `backup_enfermeiro_digital_v0.7.zip`
- **Caminho**: `C:\Users\mxmin\Desktop\backup_enfermeiro_digital_v0.7.zip`
- **Tamanho**: `~219.95 MB` (1.160 arquivos salvos)

---

## 2. Visão Geral da Migração

O seu projeto já é um repositório Git conectado ao GitHub:
- **Repositório Oficial**: `https://github.com/marcosmanoelt45-jpg/Enfermeiro-Digital.git`
- **Branch Principal**: `main`
- **Deploy em Produção**: `https://enfere.vercel.app`

O **Claude Code** opera diretamente sobre pastas de código e repositórios locais via terminal. Portanto, você **não precisa recriar o projeto do zero** — basta apontar o Claude Code para esta pasta ou cloná-la.

---

## 3. Passo a Passo de Instalação e Inicialização do Claude Code

### Passo 1: Ter o Node.js e Git instalados
Você já possui o Node.js (v24) e Git instalados no seu Windows.

### Passo 2: Instalar o Claude Code globalmente
Abra o seu terminal (PowerShell ou Windows Terminal) e execute:

```powershell
npm install -g @anthropic-ai/claude-code
```

### Passo 3: Abrir a pasta do projeto
Você tem duas opções:

#### Opção A (Direto na pasta atual que já está configurada):
No terminal:
```powershell
cd "c:\Users\mxmin\.gemini\Enfermeiro Digital"
```

#### Opção B (Clonar em um novo local, ex: Documentos ou Projetos):
Se preferir tirar da pasta oculta `.gemini` para uma pasta padrão de trabalho (ex: `C:\Projetos\Enfermeiro-Digital`):
```powershell
mkdir C:\Projetos
cd C:\Projetos
git clone https://github.com/marcosmanoelt45-jpg/Enfermeiro-Digital.git
cd Enfermeiro-Digital
npm install
```

### Passo 4: Manter o arquivo `.env.local`
Certifique-se de que o seu arquivo `.env.local` esteja presente na raiz do projeto (ele não sobe pro GitHub por segurança). Ele contém as variáveis de ambiente necessárias para o Supabase e OpenRouter:
```env
OPENROUTER_API_KEY=sua_chave_openrouter_aqui
VITE_OPENROUTER_API_KEY=sua_chave_openrouter_aqui
VITE_SUPABASE_URL=https://xwqgyvqofxdqdbhltdzf.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase_aqui
```
*(As suas chaves ativas continuam salvas intactas no seu arquivo `.env.local` local e no backup v0.7)*

### Passo 5: Iniciar o Claude Code
Dentro da pasta do projeto, basta digitar:

```powershell
claude
```

Na primeira vez, ele solicitará login com a sua conta da Anthropic (OAuth no navegador ou inserção da `ANTHROPIC_API_KEY`).

---

## 4. Como o Claude Code entende o Projeto (`CLAUDE.md`)

O Claude Code lê nativamente um arquivo chamado `CLAUDE.md` na raiz do projeto como memória canônica (equivalente ao `AGENTS.md` que usamos aqui).

Para que o Claude já comece sabendo exatamente toda a arquitetura, regras de ouro, mascotinho Goti e comandos de teste, nós criamos o arquivo `CLAUDE.md` na raiz com:

1. **Stack**: React 18, Vite, TailwindCSS, Supabase, Framer Motion, Radix UI.
2. **Os 6 Módulos Oficiais**: Hub do Estudante, Goti Preceptor, Casos Clínicos, Plantão SBAR, Cálculo de Doses, Skills Lab (Procedimentos).
3. **Comandos de Qualidade**: `npm run lint`, `npm run typecheck`, `npm run build`.
4. **Regra de deploy**: Push na branch `main` atualiza automaticamente a Vercel (`https://enfere.vercel.app`).

---

## 5. Dicas de Ouro para Usar no Claude Code

1. **Comando `/init`**: Se você digitar `/init` na primeira execução, o Claude Code faz uma varredura inicial da estrutura.
2. **Contexto de Memória**: O Claude Code possui o comando `/compact` caso a conversa fique longa.
3. **Instruções de Estilo**: Sempre que pedir uma tarefa no Claude Code, você pode adicionar no final:
   > *"Responda em português - BR e rode `npm run lint` e `npm run typecheck` antes de finalizar."*
4. **Deploy Automático**: Como o repositório está conectado ao GitHub, após o Claude Code commitar e dar `git push origin main`, a Vercel publica a alteração em produção em menos de 1 minuto.

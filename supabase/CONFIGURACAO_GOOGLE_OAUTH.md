# Como Ativar o Google OAuth Real no Supabase

Este guia explica como habilitar o **Google Sign-In oficial** no seu projeto Supabase para que o navegador abra a janela oficial do Google (**accounts.google.com**) exibindo todas as contas Google atualmente logadas no computador da pessoa para seleção.

---

## 1. Informações do Seu Projeto Supabase

- **URL do Projeto Supabase:** `https://xwqgyvqofxdqdbhltdzf.supabase.co`
- **Painel de Autenticação Supabase:** [Acessar Auth Providers](https://supabase.com/dashboard/project/xwqgyvqofxdqdbhltdzf/auth/providers)
- **Callback URL Autorizada (Copie exatamente esta URL):**
  ```text
  https://xwqgyvqofxdqdbhltdzf.supabase.co/auth/v1/callback
  ```

---

## 2. Passo a Passo no Google Cloud Console (2 minutos)

1. Acesse o **[Google Cloud Console](https://console.cloud.google.com/)**.
2. No menu superior, selecione ou crie um projeto (ex: `Enfermeiro Digital`).
3. Vá em **APIs e Serviços** > **Tela de permissão OAuth** (OAuth consent screen):
   - Escolha o tipo de usuário: **Externo** e clique em **Criar**.
   - Preencha o nome do app (`Enfermeiro Digital`) e seu e-mail de suporte.
   - Avance até salvar.
4. Vá em **APIs e Serviços** > **Credenciais** (Credentials):
   - Clique em **+ Criar Credenciais** > **ID do cliente OAuth** (OAuth client ID).
   - Tipo de aplicativo: **Aplicativo da Web** (Web application).
   - Nome: `Enfermeiro Digital Web`.
   - Em **Origens JavaScript autorizadas** (Authorized JavaScript origins), adicione:
     - `http://localhost:5174` (para desenvolvimento local)
     - `http://localhost:5173`
   - Em **URIs de redirecionamento autorizados** (Authorized redirect URIs), adicione:
     - `https://xwqgyvqofxdqdbhltdzf.supabase.co/auth/v1/callback`
   - Clique em **Criar**.
5. O Google gerará duas chaves:
   - **ID do Cliente (Client ID)** (ex: `123456789-abc.apps.googleusercontent.com`)
   - **Chave Secreta do Cliente (Client Secret)** (ex: `GOCSPX-xyz123...`)

---

## 3. Passo a Passo no Painel do Supabase

1. Acesse o painel de provedores do seu projeto:
   👉 **[https://supabase.com/dashboard/project/xwqgyvqofxdqdbhltdzf/auth/providers](https://supabase.com/dashboard/project/xwqgyvqofxdqdbhltdzf/auth/providers)**
2. Na lista de provedores, clique em **Google**.
3. Ative a opção **Enable Sign in with Google** (interruptor para ligado/verde).
4. Cole o **Client ID** e o **Client Secret** obtidos no passo anterior.
5. Clique em **Save** (Salvar) no rodapé.

---

## 4. O Que Acontece no Site do Enfere

Quando o usuário clica em **"Continuar com o Google"**:
1. O código chama a API oficial com o parâmetro `prompt: 'select_account'`.
2. O Google abre a tela oficial **"Escolha uma conta"** exibindo todos os e-mails atualmente conectados no navegador do usuário.
3. Ao selecionar a conta desejada, o Google redireciona de volta para o Supabase, que extrai o nome e o e-mail reais do usuário e o autentica diretamente no painel do Enfere!

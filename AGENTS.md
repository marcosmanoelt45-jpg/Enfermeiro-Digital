# AGENTS.md

A fonte da verdade é o `CLAUDE.md`. Plano em andamento: `docs/plano/`.

## Supabase OAuth Pre-Flight Protection

Sempre que implementar login ou cadastro social via OAuth (Google, GitHub, etc.) com Supabase:
1. NUNCA redirecione o usuário diretamente com `window.location.href = data.url` sem antes verificar o status do provedor no backend.
2. Não tente fazer `fetch(data.url)` na rota `/auth/v1/authorize`, pois o Supabase não envia cabeçalhos CORS para origens locais nessa rota.
3. Consulte o endpoint oficial `${supabaseUrl}/auth/v1/settings` com o cabeçalho `apikey: ${supabaseAnonKey}`.
4. Se `settings.external[provider] !== true`, cancele o redirecionamento, lance o erro com código `PROVIDER_DISABLED` e apresente um modal na interface com instruções de configuração e a Redirect URI autorizada (`${supabaseUrl}/auth/v1/callback`).

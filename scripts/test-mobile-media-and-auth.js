/**
 * test-mobile-media-and-auth.js
 *
 * Teste automatizado de verificação para:
 * 1. Compatibilidade de mídia móvel em GotiAnimated.jsx (fallback garantido e atributos mobile).
 * 2. Ordem de codecs e atributos mobile em PacienteVideoStage.jsx (MP4 preferencial para iOS/Android).
 * 3. Remoção definitiva do formulário legado de Magic Link/OTP em GoogleOAuthModal.jsx.
 * 4. Resiliência do authService na verificação do provedor Google OAuth.
 */

import fs from 'fs';
import path from 'path';

function runTests() {
  const rootDir = process.cwd();
  let errors = [];

  console.log('🧪 Iniciando testes de compatibilidade móvel e autenticação Google...\n');

  // 1. Teste de GotiAnimated.jsx
  const gotiPath = path.join(rootDir, 'src', 'components', 'mascot', 'GotiAnimated.jsx');
  const gotiContent = fs.readFileSync(gotiPath, 'utf8');

  const hasFallback = gotiContent.includes('useImageFallback') || gotiContent.includes('fallback') || gotiContent.includes('onError');
  const handlesPlayRejection = gotiContent.includes('video.play().catch') && !gotiContent.includes('video.play().catch(() => {})');

  if (!hasFallback || !handlesPlayRejection) {
    errors.push('GotiAnimated.jsx: Não possui fallback robusto para imagem ao falhar reprodução de vídeo em mobile.');
  } else {
    console.log('✅ GotiAnimated.jsx: Mecanismo de fallback de imagem configurado.');
  }

  // 2. Teste de PacienteVideoStage.jsx
  const pacientePath = path.join(rootDir, 'src', 'components', 'simulador', 'PacienteVideoStage.jsx');
  const pacienteContent = fs.readFileSync(pacientePath, 'utf8');

  // Verifica se o source MP4 aparece antes do WEBM para compatibilidade móvel total
  const mp4First = pacienteContent.indexOf('type="video/mp4"') < pacienteContent.indexOf('type="video/webm"');
  const hasPreloadAuto = pacienteContent.includes('preload="auto"');

  if (!mp4First) {
    errors.push('PacienteVideoStage.jsx: O source MP4 deve preceder o WebM para compatibilidade com iOS Safari.');
  } else {
    console.log('✅ PacienteVideoStage.jsx: MP4 configurado prioritariamente para mobile.');
  }

  if (!hasPreloadAuto) {
    errors.push('PacienteVideoStage.jsx: Deve usar preload="auto" para evitar tela preta inicial em celulares.');
  } else {
    console.log('✅ PacienteVideoStage.jsx: Preload configurado como "auto".');
  }

  // 3. Teste de GoogleOAuthModal.jsx
  const modalPath = path.join(rootDir, 'src', 'components', 'auth', 'GoogleOAuthModal.jsx');
  const modalContent = fs.readFileSync(modalPath, 'utf8');

  const hasLegacyEmailForm = modalContent.includes('handleSendMagicLink') || modalContent.includes('loginWithMagicLink');
  if (hasLegacyEmailForm) {
    errors.push('GoogleOAuthModal.jsx: Ainda contém o formulário legado de link mágico/OTP por e-mail.');
  } else {
    console.log('✅ GoogleOAuthModal.jsx: Formulário legado de envio de e-mail/OTP removido com sucesso.');
  }

  // 4. Teste de authService.js
  const authPath = path.join(rootDir, 'src', 'services', 'authService.js');
  const authContent = fs.readFileSync(authPath, 'utf8');

  const hasProviderCacheOrResilience = authContent.includes('providerStatusCache') || authContent.includes('timeout') || authContent.includes('AbortController');
  if (!hasProviderCacheOrResilience) {
    errors.push('authService.js: isProviderEnabled precisa de proteção contra timeout/queda de rede móvel.');
  } else {
    console.log('✅ authService.js: Proteção resiliente do provedor Google implementada.');
  }

  // 5. Teste de remoção total de modais intermediários nas páginas de Login e Cadastro
  const loginPath = path.join(rootDir, 'src', 'pages', 'Login.jsx');
  const registerPath = path.join(rootDir, 'src', 'pages', 'Register.jsx');
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  const registerContent = fs.readFileSync(registerPath, 'utf8');

  if (loginContent.includes('GoogleOAuthModal') || registerContent.includes('GoogleOAuthModal')) {
    errors.push('Login.jsx / Register.jsx: Ainda renderizam modal intermediário antes do redirecionamento oficial do Google.');
  } else {
    console.log('✅ Login.jsx e Register.jsx: Redirecionamento direto para Google OAuth sem modais intermediários.');
  }

  console.log('\n--- RESULTADO ---');
  if (errors.length > 0) {
    console.error('❌ Falhas encontradas:');
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    process.exit(1);
  } else {
    console.log('🎉 Todos os testes de mídia móvel e login Google passaram com perfeição!');
  }
}

runTests();


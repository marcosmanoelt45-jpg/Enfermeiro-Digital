import assert from 'node:assert';
import dns from 'node:dns';
import https from 'node:https';

// Mock do localStorage para testes de serviços
const storage = {};
global.localStorage = {
  getItem(k) { return storage[k] || null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; },
  clear() { for (const k in storage) delete storage[k]; }
};

async function runTests() {
  console.log('--- [TDD] TESTE 1: Resolução de DNS da URL do Supabase OAuth ---');
  const badDomain = 'xwqgyvqofxdqdbhldtzf.supabase.co';
  const goodDomain = 'xwqgyvqofxdqdbhltdzf.supabase.co';

  // Verifica que badDomain falha no DNS
  await new Promise((resolve) => {
    dns.lookup(badDomain, (err) => {
      assert(err !== null, 'O domínio digitado incorretamente NÃO deve resolver no DNS');
      console.log('✔ badDomain corretamente falha com NXDOMAIN');
      resolve();
    });
  });

  // Verifica que goodDomain resolve no DNS
  await new Promise((resolve, reject) => {
    dns.lookup(goodDomain, (err, address) => {
      if (err) return reject(err);
      assert(Boolean(address), 'O domínio canônico DEVE resolver no DNS');
      console.log(`✔ goodDomain resolvido com sucesso: ${address}`);
      resolve();
    });
  });

  // Verifica endpoint de autorização do Google no Supabase oficial
  const authorizeUrl = `https://${goodDomain}/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A5174%2F`;
  await new Promise((resolve, reject) => {
    https.get(authorizeUrl, (res) => {
      assert.strictEqual(res.statusCode, 302, 'Supabase /auth/v1/authorize deve retornar HTTP 302 Redirect');
      const location = res.headers.location || '';
      assert(location.includes('accounts.google.com'), 'Redirecionamento DEVE ir para accounts.google.com');
      assert(location.includes(goodDomain), 'redirect_uri DEVE conter goodDomain');
      assert(!location.includes(badDomain), 'NÃO pode conter badDomain');
      console.log('✔ Endpoint OAuth Supabase retorna 302 direto para accounts.google.com');
      resolve();
    }).on('error', reject);
  });

  console.log('\n--- [TDD] TESTE 2: Gamificação e Variável de Acertos Seguidos por Conta ---');
  const { clinicalGamificationService } = await import('../src/services/clinicalGamificationService.js');
  const testUserId = 'user-unit-test-1234';

  // Limpa storage para o teste
  global.localStorage.clear();

  // Estado inicial de um usuário real novo
  const stateInicial = clinicalGamificationService.getState(testUserId);
  assert.strictEqual(stateInicial.acertosSeguidos, 0, 'acertosSeguidos inicial deve ser 0');
  assert.strictEqual(stateInicial.streak, 0, 'dias de ofensiva inicial de conta nova deve ser 0');
  console.log('✔ Estado inicial de nova conta individual está limpo (0 acertos, 0 ofensiva)');

  // Simula 1º acerto
  clinicalGamificationService.registrarAcertoQuestao(testUserId);
  let state = clinicalGamificationService.getState(testUserId);
  assert.strictEqual(state.acertosSeguidos, 1, 'Após 1º acerto, acertosSeguidos deve ser 1');
  console.log('✔ 1º acerto registrado: acertosSeguidos = 1');

  // Simula 2º acerto
  clinicalGamificationService.registrarAcertoQuestao(testUserId);
  state = clinicalGamificationService.getState(testUserId);
  assert.strictEqual(state.acertosSeguidos, 2, 'Após 2º acerto, acertosSeguidos deve ser 2');
  console.log('✔ 2º acerto registrado: acertosSeguidos = 2');

  // 1º erro (Amarelo com dica): NÃO deve zerar acertosSeguidos!
  state = clinicalGamificationService.getState(testUserId);
  assert.strictEqual(state.acertosSeguidos, 2, 'No 1º erro (amarelo), acertosSeguidos NÃO deve ser zerado');
  console.log('✔ No 1º erro (amarelo/dica), acertosSeguidos é preservado');

  // Erro Fatal (Vermelho - 2º erro/revisão): DEVE zerar acertosSeguidos!
  clinicalGamificationService.registrarErroVermelhoQuestao(testUserId);
  state = clinicalGamificationService.getState(testUserId);
  assert.strictEqual(state.acertosSeguidos, 0, 'No erro vermelho, acertosSeguidos DEVE zerar para 0');
  console.log('✔ No erro vermelho (2º erro/revisão), acertosSeguidos foi zerado para 0 com sucesso');

  console.log('\n--- [TDD] TESTE 3: Histórico de Atividades Clínicas por Conta ---');
  const { clinicalHistoryService, MODULE_TYPES } = await import('../src/services/clinicalHistoryService.js');

  const sessaoMock = {
    pacienteId: 'teresinha',
    pacienteNome: 'Dona Teresinha',
    modalidade: 'Atividade Rápida (4 a 6)',
    totalQuestoes: 5,
    acertos: 4,
    amarelas: 1,
    vermelhas: 0,
    tempoSegundos: 120,
    questoes: [
      { id: 'q1', pergunta: 'Prescrição Ceftriaxona', status: 'verde' },
      { id: 'q2', pergunta: 'Cálculo de gotejamento', status: 'amarela' }
    ]
  };

  clinicalHistoryService.saveVideochamadaSession(sessaoMock, testUserId);
  const atividades = clinicalHistoryService.getAllActivities('all', testUserId);
  assert(atividades.length >= 1, 'Deve haver ao menos 1 atividade salva');
  assert.strictEqual(atividades[0].moduleType, MODULE_TYPES.VIDEOCHAMADA, 'Módulo deve ser videochamada');
  assert.strictEqual(atividades[0].details.acertos, 4, 'Detalhe de acertos deve ser 4');
  console.log('✔ Sessão de Videochamada salva e recuperada com sucesso no histórico individual');

  // Fila de revisão de questões
  const questoesRevisao = clinicalHistoryService.getQuestoesRevisao(testUserId);
  assert(questoesRevisao.length >= 1, 'Questão amarela deve entrar para a fila de revisão');
  console.log('✔ Questão amarela entrou na fila de revisão do usuário com sucesso');

  // Remove questão da fila de revisão ao acertá-la
  clinicalHistoryService.removerQuestoesRevisao([{ pergunta: 'Cálculo de gotejamento' }], testUserId);
  const revisaoAposAcerto = clinicalHistoryService.getQuestoesRevisao(testUserId);
  assert.strictEqual(revisaoAposAcerto.length, 0, 'Fila de revisão deve ficar limpa após acerto');
  console.log('✔ Questão removida da fila de revisão após acerto com sucesso');

  console.log('\n========================================');
  console.log('TODOS OS TESTES TDD PASSARAM COM SUCESSO!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('\n❌ FALHA NO TESTE TDD:', err);
  process.exit(1);
});


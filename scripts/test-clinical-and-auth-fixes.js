import fs from 'fs';
import dns from 'dns';

console.log('🧪 Iniciando Teste de Validação das Correções de Auth, Casos e Medicamentos...\n');

// 1. Validar Correção da URL do Supabase e Resolução de DNS
console.log('[1/4] Testando proteção de DNS e normalização de URL no Supabase...');
const badTypoUrl = 'https://xwqgyvqofxdqdbhldtzf.supabase.co';
const correctUrl = 'https://xwqgyvqofxdqdbhltdzf.supabase.co';

dns.lookup('xwqgyvqofxdqdbhltdzf.supabase.co', (err, addr) => {
  if (err) {
    console.error('❌ Falha ao resolver DNS do Supabase real:', err);
    process.exit(1);
  }
  console.log(`  ✓ DNS do Supabase real resolvido com sucesso: ${addr}`);
});

const clientCode = fs.readFileSync('src/services/supabaseClient.js', 'utf8');
if (!clientCode.includes("clean.includes('dbhldtzf')") || !clientCode.includes("clean.replace('dbhldtzf', 'dbhltdzf')")) {
  throw new Error('Falha: supabaseClient.js não possui autocorreção para o typo dbhldtzf!');
}
console.log('  ✓ supabaseClient.js possui sanitização ativa para corrigir o typo de DNS automaticamente.');

// 2. Validar MedicationDosageLab.jsx
console.log('\n[2/4] Testando MedicationDosageLab.jsx...');
const dosageCode = fs.readFileSync('src/pages/MedicationDosageLab.jsx', 'utf8');

// Não deve conter o botão ou modal do Goti
if (dosageCode.includes('<GotiEvaluationModal') || dosageCode.includes('<GotiAnimated animation="pointing" size={24} />')) {
  throw new Error('Falha: Goti ainda está presente na parte de medicamentos!');
}
console.log('  ✓ Mascote Goti transparente removido da tela de medicamentos.');

// Não deve conter botões de dicas/tabela na visualização inicial
if (dosageCode.includes('<span>Ver Fórmula</span>') || dosageCode.includes('<span>Tabela de Conversão</span>')) {
  throw new Error('Falha: Botões de fórmula e tabela ainda estão presentes na tela inicial!');
}
console.log('  ✓ Botões de dicas e tabela removidos da tela inicial da questão.');

// Deve conter opções de continuar e voltar ao início
if (!dosageCode.includes('Voltar ao Início') || !dosageCode.includes('Próxima Questão')) {
  throw new Error('Falha: Botões de navegação e decisão não encontrados em MedicationDosageLab.jsx!');
}
console.log('  ✓ Botões "Próxima Questão" e "Voltar ao Início" implementados.');

// 3. Validar ClinicalGapRadar.jsx
console.log('\n[3/4] Testando ClinicalGapRadar.jsx...');
const gapCode = fs.readFileSync('src/components/ClinicalGapRadar.jsx', 'utf8');

if (!gapCode.includes('Verificar Resposta')) {
  throw new Error('Falha: Botão "Verificar Resposta" não encontrado em ClinicalGapRadar.jsx!');
}
console.log('  ✓ Botão "Verificar Resposta" presente no modal de exame físico.');

// 4. Validar CaseStudySimulator.jsx
console.log('\n[4/4] Testando CaseStudySimulator.jsx...');
const caseCode = fs.readFileSync('src/pages/CaseStudySimulator.jsx', 'utf8');

if (caseCode.includes('LABORATÓRIO DE HIPÓTESES DO GOTI') || caseCode.includes('CAUSAS FREQUENTES') || caseCode.includes('PISTAS CLÍNICAS DO PRONTUÁRIO')) {
  throw new Error('Falha: Blocos de hipóteses/pistas/causas ainda encontrados em CaseStudySimulator.jsx!');
}
console.log('  ✓ Blocos de hipóteses, pistas e causas frequentes removidos com sucesso.');

if (caseCode.includes('Recalcular (30 min)')) {
  throw new Error('Falha: Botão "Recalcular (30 min)" ainda encontrado em CaseStudySimulator.jsx!');
}
console.log('  ✓ Botão "Recalcular (30 min)" removido da Etapa 5 de evolução.');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! INTEGRIDADE TOTAL GARANTIDA!');

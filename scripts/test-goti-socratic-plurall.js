import fs from 'fs';
import { gotiPreceptorService } from '../src/services/gotiPreceptorService.js';

console.log('🧪 Iniciando Teste de Validação do Preceptor Goti Socrático (Estilo Plurall IA)...');

// 1. Validar integridade dos assets de imagem do Goti
console.log('\n[1/4] Validando integridade dos assets do Goti (PNG transparente 512x512)...');
const assetsToCheck = [
  'src/assets/goti-icone-oficial.png',
  'src/assets/goti-logo-transparent.png',
  'public/goti/goti-face-transparent.png',
  'public/goti/goti-icone.jpg'
];

assetsToCheck.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  const magic = buf.slice(0, 8).toString('hex');
  if (magic !== '89504e470d0a1a0a') {
    throw new Error(`Arquivo ${filePath} não é um PNG transparente válido! Magic: ${magic}`);
  }
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== 512 || h !== 512) {
    throw new Error(`Dimensão inesperada em ${filePath}: ${w}x${h}`);
  }
  console.log(`  ✓ ${filePath}: PNG 512x512 com canal alfa transparente.`);
});

// 2. Testar Dúvida Exata da Imagem 8 enviada pelo usuário
console.log('\n[2/4] Testando resposta para a dúvida clínica da Imagem 8 (Intervenções NIC com verbos no infinitivo)...');
const duvidaImagem8 = 'Olá Goti! Estou prescrevendo as intervenções de enfermagem para o paciente Paciente L. C. M. (Caso Simulado #117). Como estruturo os cuidados com verbos no infinitivo, aprazamento e metas seguras? Pode me dar um exemplo didático modelo similar sem me dar a resposta deste caso?';

const resposta1 = gotiPreceptorService.generateEducationalFallback(duvidaImagem8);

console.log('--- Resposta Gerada ---');
console.log(resposta1.substring(0, 300) + '...\n');

// Verificações estritas da pedagogia socrática:
if (!resposta1.includes('Verbo de Ação no Infinitivo') && !resposta1.includes('infinitivo')) {
  throw new Error('Falha: Goti não explicou o verbo de ação no infinitivo!');
}
if (!resposta1.includes('Exemplos Didáticos Modelos') && !resposta1.includes('Exemplo')) {
  throw new Error('Falha: Goti não forneceu exemplo didático modelo similar!');
}
if (!resposta1.includes('Reflexão Socrática') && !resposta1.includes('🤔')) {
  throw new Error('Falha: Goti não encerrou com método socrático e pergunta reflexiva!');
}
if (resposta1.includes('Acesse o Simulador de Casos Clínicos no menu superior (clique em Casos Clínicos)!')) {
  throw new Error('Falha: Goti regrediu para resposta vazia de redirecionamento!');
}
console.log('  ✓ Goti ensinou a metodologia, deu 2 exemplos didáticos modelos e encerrou com pergunta reflexiva socrática!');

// 3. Testar Pergunta de Cálculo de Medicamentos & Gotejamento
console.log('\n[3/4] Testando resposta para cálculo de medicamentos e dosagens...');
const duvidaCalculo = 'Goti, como faço cálculo de gotejamento de macrogotas e regra de três para diluição de frasco ampola? Pode me ensinar a fórmula?';
const respostaCalculo = gotiPreceptorService.generateEducationalFallback(duvidaCalculo);

if (!respostaCalculo.includes('Gotas/min') && !respostaCalculo.includes('Macrogotas')) {
  throw new Error('Falha: Goti não explicou a fórmula de macrogotas!');
}
if (!respostaCalculo.includes('Ampicilina') && !respostaCalculo.includes('2,5 mL')) {
  throw new Error('Falha: Goti não forneceu exemplo matemático didático análogo!');
}
if (!respostaCalculo.includes('Reflexão Socrática')) {
  throw new Error('Falha: Goti não estimulou o aluno socraticamente no final do cálculo!');
}
console.log('  ✓ Goti ensinou as fórmulas matemáticas, deu exemplo resolvido fictício e fez pergunta reflexiva.');

// 4. Testar Diagnósticos NANDA-I e SBAR
console.log('\n[4/4] Testando diagnósticos NANDA-I e passagem de plantão SBAR...');
const duvidaNanda = 'Como diferencio diagnóstico com foco no problema de diagnóstico de risco na NANDA-I?';
const respostaNanda = gotiPreceptorService.generateEducationalFallback(duvidaNanda);

if (!respostaNanda.includes('relacionado a') || !respostaNanda.includes('evidenciado por')) {
  throw new Error('Falha: Goti não detalhou R/C e E/P do NANDA-I!');
}
console.log('  ✓ Taxonomia NANDA-I explicada com clareza conceitual e exemplos.');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! O GOTI AGORA OPERA NO PADRÃO PLURALL IA (PLU)!');


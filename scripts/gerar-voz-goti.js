import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICEBOX_BASE_URL = process.env.VOICEBOX_BASE_URL || 'http://127.0.0.1:17493';
const PROFILE_NAME = 'Goti';
const DEFAULT_TEXT = 'Olá! Eu sou o Goti, seu enfermeiro digital. Estou aqui para cuidar de você e te guiar em todos os seus cuidados e aprendizados de saúde!';

/**
 * Converte um buffer WAV PCM de 16 bits para MP3 usando @breezystack/lamejs.
 */
function wavToMp3(wavBuffer) {
  const riff = wavBuffer.toString('ascii', 0, 4);
  const wave = wavBuffer.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Formato WAV inválido retornado pela API do Voicebox.');
  }

  let offset = 12;
  let numChannels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset < wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      numChannels = wavBuffer.readUInt16LE(offset + 10);
      sampleRate = wavBuffer.readUInt32LE(offset + 12);
      bitsPerSample = wavBuffer.readUInt16LE(offset + 22);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  if (!dataOffset || dataSize === 0) {
    throw new Error('Chunk de dados de áudio não encontrado no buffer WAV.');
  }

  if (bitsPerSample !== 16) {
    throw new Error(`Bits por amostra não suportado: ${bitsPerSample}. Esperado 16-bit PCM.`);
  }

  const pcmBytes = wavBuffer.subarray(dataOffset, dataOffset + dataSize);
  const sampleCount = Math.floor(pcmBytes.length / 2);
  const samples = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    samples[i] = pcmBytes.readInt16LE(i * 2);
  }

  const mp3encoder = new Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data = [];

  if (numChannels === 1) {
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const chunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(Buffer.from(mp3buf));
      }
    }
  } else if (numChannels === 2) {
    const frames = Math.floor(sampleCount / 2);
    const leftChannel = new Int16Array(frames);
    const rightChannel = new Int16Array(frames);
    for (let i = 0; i < frames; i++) {
      leftChannel[i] = samples[i * 2];
      rightChannel[i] = samples[i * 2 + 1];
    }
    const sampleBlockSize = 1152;
    for (let i = 0; i < frames; i += sampleBlockSize) {
      const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
      const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(Buffer.from(mp3buf));
      }
    }
  } else {
    throw new Error(`Número de canais não suportado: ${numChannels}`);
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(Buffer.from(endBuf));
  }

  return Buffer.concat(mp3Data);
}

/**
 * Encontra ou cria o perfil de voz do Goti no Voicebox.
 */
async function getOrCreateGotiProfile() {
  console.log(`[Voicebox] Buscando perfis de voz em ${VOICEBOX_BASE_URL}/profiles...`);
  const res = await fetch(`${VOICEBOX_BASE_URL}/profiles`);
  if (!res.ok) {
    throw new Error(`Falha ao listar perfis do Voicebox: ${res.status} ${res.statusText}`);
  }
  const profiles = await res.json();
  const gotiProfile = profiles.find((p) => p.name.toLowerCase() === PROFILE_NAME.toLowerCase());

  if (gotiProfile) {
    console.log(`[Voicebox] Perfil "${PROFILE_NAME}" encontrado (ID: ${gotiProfile.id}).`);
    return gotiProfile;
  }

  console.log(`[Voicebox] Perfil "${PROFILE_NAME}" não encontrado. Criando novo perfil...`);
  const createRes = await fetch(`${VOICEBOX_BASE_URL}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PROFILE_NAME,
      language: 'pt',
      default_engine: 'qwen',
      personality:
        'A cheerful, energetic, and playful young male water-drop mascot in the style of Duolingo characters. Speaks Brazilian Portuguese with enthusiastic, warm, animated healthcare reminders.',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Falha ao criar perfil do Goti: ${createRes.status} ${createRes.statusText}`);
  }

  const created = await createRes.json();
  console.log(`[Voicebox] Perfil criado com sucesso (ID: ${created.id}).`);
  return created;
}

/**
 * Aguarda a geração de áudio ser concluída no Voicebox (polling assíncrono).
 */
async function waitForGenerationCompletion(generationId, maxTimeoutMs = 180000) {
  const startTime = Date.now();
  console.log(`[Voicebox] Aguardando síntese e renderização do áudio (ID: ${generationId})...`);

  while (Date.now() - startTime < maxTimeoutMs) {
    const res = await fetch(`${VOICEBOX_BASE_URL}/history/${generationId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'completed') {
        console.log(`\n[Voicebox] Síntese concluída com sucesso! Duração: ${data.duration}s`);
        return data;
      }
      if (data.status === 'failed') {
        throw new Error(`A geração falhou no servidor Voicebox: ${data.error || 'Erro desconhecido'}`);
      }
    }
    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Tempo limite esgotado (${maxTimeoutMs / 1000}s) aguardando geração de áudio.`);
}

/**
 * Gera áudio de voz a partir de um perfil e texto.
 */
async function generateAudio(profileId, text) {
  console.log(`[Voicebox] Solicitando síntese de áudio para: "${text}"...`);
  const generateRes = await fetch(`${VOICEBOX_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profileId,
      text,
      language: 'pt',
      engine: 'qwen',
      model_size: '1.7B',
      normalize: true,
    }),
  });

  if (!generateRes.ok) {
    const errorText = await generateRes.text();
    throw new Error(`Erro na síntese do áudio (${generateRes.status}): ${errorText}`);
  }

  const generation = await generateRes.json();
  console.log(`[Voicebox] Requisição aceita com ID: ${generation.id}`);

  if (generation.status !== 'completed') {
    await waitForGenerationCompletion(generation.id);
  }

  console.log(`[Voicebox] Baixando arquivo de áudio (${VOICEBOX_BASE_URL}/audio/${generation.id})...`);
  const audioRes = await fetch(`${VOICEBOX_BASE_URL}/audio/${generation.id}`);
  if (!audioRes.ok) {
    throw new Error(`Falha ao baixar áudio gerado: ${audioRes.status} ${audioRes.statusText}`);
  }

  const arrayBuffer = await audioRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Função principal
 */
async function main() {
  try {
    const textToSpeak = process.argv[2] || DEFAULT_TEXT;
    const outputFilename = process.argv[3] || 'goti-welcome.mp3';

    // 1. Garantir que as pastas de destino existam
    const targetDirPrimary = path.resolve(__dirname, '../public/assets/audio');
    const targetDirSecondary = path.resolve(__dirname, '../public/audio');

    [targetDirPrimary, targetDirSecondary].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        console.log(`[FileSystem] Criando pasta de destino: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // 2. Obter perfil do Goti
    const profile = await getOrCreateGotiProfile();

    // 3. Gerar áudio através do Voicebox
    const wavBuffer = await generateAudio(profile.id, textToSpeak);
    console.log(`[Áudio] Áudio original recebido: ${wavBuffer.length} bytes (WAV PCM)`);

    // 4. Converter para MP3
    console.log(`[Codificação] Convertendo WAV para MP3 usando @breezystack/lamejs...`);
    const mp3Buffer = wavToMp3(wavBuffer);
    console.log(`[Codificação] MP3 gerado com sucesso: ${mp3Buffer.length} bytes`);

    // 5. Salvar nas pastas de assets e áudios públicos
    const primaryFilePath = path.join(targetDirPrimary, outputFilename);
    const secondaryFilePath = path.join(targetDirSecondary, outputFilename);

    fs.writeFileSync(primaryFilePath, mp3Buffer);
    console.log(`[Sucesso] Áudio salvo em: ${primaryFilePath}`);

    fs.writeFileSync(secondaryFilePath, mp3Buffer);
    console.log(`[Sucesso] Áudio salvo também em: ${secondaryFilePath}`);

    console.log('\nProcesso de geração e automação concluído com êxito! 🎉');
  } catch (err) {
    console.error('\n❌ Erro durante o processo:', err.message || err);
    process.exit(1);
  }
}

main();

// Fundamentos das Escalas Clínicas Validadas (Braden, SAK, Glasgow, Dor/Nível de Consciência)
// Extraído e fundamentado nos manuais clínicos de referência oficiais

export const CLINICAL_SCALES = {
  braden: {
    name: 'Escala de Braden',
    purpose: 'Previsão do Risco de Lesão por Pressão (LPP)',
    range: { min: 6, max: 23 },
    categories: [
      {
        id: 'percepcao',
        title: 'Percepção Sensorial',
        options: [
          { score: 1, label: '1 - Totalmente Limitado', desc: 'Não responde a estímulos dolorosos (inconsciente/sedado) ou capacidade limitada de sentir dor na maior parte do corpo.' },
          { score: 2, label: '2 - Muito Limitado', desc: 'Responde apenas a estímulos dolorosos. Comunica desconforto apenas por gemidos ou agitação.' },
          { score: 3, label: '3 - Levemente Limitado', desc: 'Responde a comandos verbais, mas não pode sempre comunicar desconforto ou necessita de ajuda.' },
          { score: 4, label: '4 - Nenhuma Limitação', desc: 'Responde a comandos verbais. Não tem déficit sensorial que limite a capacidade de sentir e expressar dor.' }
        ]
      },
      {
        id: 'umidade',
        title: 'Umidade da Pele',
        options: [
          { score: 1, label: '1 - Completamente Molhada', desc: 'Pele constantemente molhada por suor, urina ou fezes.' },
          { score: 2, label: '2 - Muito Molhada', desc: 'A roupa de cama deve ser trocada pelo menos uma vez por turno.' },
          { score: 3, label: '3 - Ocasionalmente Molhada', desc: 'Requer troca extra de roupa de cama aproximadamente uma vez ao dia.' },
          { score: 4, label: '4 - Raramente Molhada', desc: 'Pele geralmente seca, troca de roupa de cama em intervalos de rotina.' }
        ]
      },
      {
        id: 'atividade',
        title: 'Atividade',
        options: [
          { score: 1, label: '1 - Acamado', desc: 'Confinado à cama.' },
          { score: 2, label: '2 - Confinado à Cadeira', desc: 'Capacidade de andar severamente limitada ou nula. Não suporta o próprio peso.' },
          { score: 3, label: '3 - Caminha Ocasionalmente', desc: 'Anda ocasionalmente durante o dia, mas para distâncias muito curtas.' },
          { score: 4, label: '4 - Caminha Frequentemente', desc: 'Anda fora do quarto pelo menos duas vezes ao dia e dentro do quarto pelo menos a cada 2h.' }
        ]
      },
      {
        id: 'mobilidade',
        title: 'Mobilidade',
        options: [
          { score: 1, label: '1 - Totalmente Imóvel', desc: 'Não faz nem pequenas mudanças na posição do corpo ou extremidades sem assistência.' },
          { score: 2, label: '2 - Muito Limitada', desc: 'Faz pequenas mudanças na posição do corpo ou extremidades, mas incapaz de mudanças frequentes.' },
          { score: 3, label: '3 - Levemente Limitada', desc: 'Faz frequentes embora pequenas mudanças na posição do corpo ou extremidades de forma independente.' },
          { score: 4, label: '4 - Sem Limitações', desc: 'Faz grandes e frequentes mudanças na posição sem assistência.' }
        ]
      },
      {
        id: 'nutricao',
        title: 'Nutrição',
        options: [
          { score: 1, label: '1 - Muito Pobre', desc: 'Nunca come uma refeição completa. Raramente come mais do que 1/3 de qualquer alimento.' },
          { score: 2, label: '2 - Provavelmente Inadequada', desc: 'Raramente come uma refeição completa e geralmente come apenas cerca de 1/2 de qualquer alimento.' },
          { score: 3, label: '3 - Adequada', desc: 'Come mais da metade da maioria das refeições. Ocasionalmente recusa uma refeição.' },
          { score: 4, label: '4 - Excelente', desc: 'Come a maior parte de cada refeição. Nunca recusa uma refeição.' }
        ]
      },
      {
        id: 'friccao',
        title: 'Fricção e Cisalhamento',
        options: [
          { score: 1, label: '1 - Problema Presente', desc: 'Requer assistência moderada a máxima para mover-se. Escorrega frequentemente na cama/cadeira.' },
          { score: 2, label: '2 - Problema Potencial', desc: 'Move-se fracamente ou requer assistência mínima. A pele provavelmente roça contra lençóis.' },
          { score: 3, label: '3 - Nenhum Problema Aparente', desc: 'Move-se na cama e na cadeira independentemente e tem força muscular suficiente para levantar-se.' }
        ]
      }
    ],
    interpretScore: (total) => {
      if (!total || total < 6) return { risk: 'Não avaliado', color: 'gray' };
      if (total <= 9) return { risk: 'Risco Muito Alto', color: 'red', protocol: 'Colchão pneumático, mudança decúbito 2/2h, barreira cutânea, coxins em proeminências' };
      if (total <= 12) return { risk: 'Risco Alto', color: 'orange', protocol: 'Mudança de decúbito rigorosa a cada 2h, hidratação cutânea com AGH, suporte nutricional' };
      if (total <= 14) return { risk: 'Risco Moderado', color: 'yellow', protocol: 'Mudança de decúbito regular a cada 2-3h, manter cabeceira <= 30°, mobilização ativa' };
      if (total <= 18) return { risk: 'Risco Baixo', color: 'blue', protocol: 'Incentivar mobilização ativa, manter pele seca e hidratada, reavaliar em 48h' };
      return { risk: 'Sem Risco', color: 'green', protocol: 'Cuidados gerais de higiene e conforto, reavaliação periódica' };
    }
  },

  sak: {
    name: 'Escala de SAK (Avaliação do Risco de Quedas)',
    purpose: 'Identificação de pacientes adultos e idosos sob risco de queda hospitalar',
    items: [
      { id: 'desorientacao', label: 'Desorientação / Confusão Mental / Delirium', weight: 1 },
      { id: 'miccao_frequente', label: 'Micção Frequente / Urgência / Incontinência', weight: 1 },
      { id: 'limitacao_marcha', label: 'Limitação da Marcha / Paresia / Uso de Dispositivo de Apoio', weight: 1 },
      { id: 'ausencia_acompanhante', label: 'Ausência de Acompanhante no Leito', weight: 1 },
      { id: 'pos_operatorio', label: 'Pós-operatório Imediato ou Procedimento sob Sedação (< 24-48h)', weight: 1 },
      { id: 'quedas_previas', label: 'Histórico de Quedas Prévias nos últimos 6 meses', weight: 1 },
      { id: 'medicamentos_risco', label: 'Uso de Medicamentos de Alto Risco (Sedativos, Anti-hipertensivos, Diuréticos, Hipoglicemiantes)', weight: 1 }
    ],
    interpretScore: (total) => {
      if (total >= 2) {
        return {
          risk: 'Alto Risco de Queda',
          color: 'red',
          interventions: [
            'Identificação visual imediata (Pulseira amarela e placa de alerta no leito)',
            'Manter grades bilaterais do leito sempre elevadas',
            'Manter leito na posição mais baixa com travas acionadas',
            'Campainha de emergência ao alcance imediato das mãos',
            'Assistência da equipe de enfermagem obrigatória durante qualquer mobilização ou transferência',
            'Orientação intensiva ao paciente e acompanhante sobre não levantar desacompanhado'
          ]
        };
      }
      return {
        risk: 'Baixo Risco de Queda',
        color: 'green',
        interventions: [
          'Orientações gerais de segurança no leito',
          'Ambiente iluminado e desobstruído',
          'Reavaliação em caso de mudança de medicamentos ou estado clínico'
        ]
      };
    }
  },

  glasgow: {
    name: 'Escala de Coma de Glasgow (ECG-P com Reatividade Pupilar)',
    purpose: 'Avaliação do Nível de Consciência e Gravidade do Traumatismo Cranioencefálico',
    subscales: {
      abertura_ocular: [
        { score: 4, desc: 'Espontânea' },
        { score: 3, desc: 'Ao som / voz' },
        { score: 2, desc: 'À pressão / dor' },
        { score: 1, desc: 'Ausente' },
        { score: 'NT', desc: 'Não testável (edema/oclusão)' }
      ],
      resposta_verbal: [
        { score: 5, desc: 'Orientada' },
        { score: 4, desc: 'Confusa' },
        { score: 3, desc: 'Palavras inapropriadas' },
        { score: 2, desc: 'Sons ininteligíveis (gemidos)' },
        { score: 1, desc: 'Ausente' },
        { score: 'NT', desc: 'Não testável (intubado/traqueostomizado)' }
      ],
      resposta_motora: [
        { score: 6, desc: 'Obedece a comandos' },
        { score: 5, desc: 'Localiza o estímulo doloroso' },
        { score: 4, desc: 'Flexão normal (retirada rápida)' },
        { score: 3, desc: 'Flexão anormal (decorticação)' },
        { score: 2, desc: 'Extensão anormal (descerebração)' },
        { score: 1, desc: 'Ausente' },
        { score: 'NT', desc: 'Não testável (bloqueio neuromuscular/paralisia)' }
      ],
      reatividade_pupilar: [
        { score: 0, desc: 'Ambas as pupilas reagem à luz' },
        { score: -1, desc: 'Apenas uma pupila reage à luz (assimetria/anisocoria)' },
        { score: -2, desc: 'Nenhuma pupila reage à luz (midríase fixa paralítica)' }
      ]
    },
    interpretScore: (score) => {
      if (typeof score !== 'number') return { severity: 'Não testável' };
      if (score <= 8) return { severity: 'Grave / Coma Profundo', conduct: 'Risco crítico de perda de via aérea. Indicação formal de via aérea avançada (IOT) e monitorização neurológica contínua.' };
      if (score <= 12) return { severity: 'Lesão Moderada', conduct: 'Vigilância neurológica estrita horária, controle pressórico, risco de deterioração rápida.' };
      return { severity: 'Leve / Consciência Preservada', conduct: 'Observação clínica periódica, vigilância de sinais de alarme.' };
    }
  },

  dor: {
    name: 'Avaliação da Dor segundo Nível de Consciência',
    modalities: {
      verbal: {
        name: 'Escala Visual Analógica / Numérica (EVA 0 a 10)',
        indication: 'Pacientes conscientes, comunicativos e orientados',
        criteria: '0 = Sem dor | 1 a 3 = Dor leve | 4 a 6 = Dor moderada | 7 a 10 = Dor intensa/insuportável'
      },
      comportamental_inconsciente: {
        name: 'Escala Comportamental (BPS / CPOT / Indicadores Autonômicos)',
        indication: 'Pacientes desacordados, sedados, intubados ou em coma',
        clinical_rule: 'Em pacientes inconscientes, a dor não pode ser autorrelatada na escala 0 a 10. A avaliação baseia-se em: mímica facial de tensão, postura de rigidez muscular, assincronia ventilatória e respostas autonômicas (taquicardia reativa, elevação de PA, sudorese).'
      }
    }
  }
};

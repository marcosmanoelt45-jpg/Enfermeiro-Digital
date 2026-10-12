-- ==============================================================================
-- 004_seed_nanda_catalog.sql
-- Carga Inicial do Catálogo Canônico NANDA-I, NIC e NOC
-- ==============================================================================

INSERT INTO nanda_catalog (code, title, domain, class, interventions, outcomes)
VALUES
(
    '00047',
    'Risco de lesão por pressão',
    'Domínio 11: Segurança/Proteção',
    'Classe 2: Lesão física',
    '[
        {"code": "3540", "title": "Prevenção de lesão por pressão", "description": "Mudança de decúbito a cada 2h e aplicação de AGH."},
        {"code": "0740", "title": "Cuidados com a pele: tratamentos tópicos", "description": "Inspeção diária e hidratação cutânea."}
    ]'::jsonb,
    '[
        {"code": "1101", "title": "Integridade tissular: pele e mucosas", "description": "Pele íntegra e sem solução de continuidade."}
    ]'::jsonb
),
(
    '00155',
    'Risco de quedas em adultos',
    'Domínio 11: Segurança/Proteção',
    'Classe 2: Lesão física',
    '[
        {"code": "6490", "title": "Prevenção contra quedas", "description": "Elevação de grades, campainha acessível e piso desobstruído."},
        {"code": "6610", "title": "Identificação de risco", "description": "Sinalização visual de alerta de queda no leito."}
    ]'::jsonb,
    '[
        {"code": "1912", "title": "Controle de risco: quedas", "description": "Adoção de precauções ambientais e adesão do paciente."}
    ]'::jsonb
),
(
    '00132',
    'Dor aguda',
    'Domínio 12: Conforto',
    'Classe 1: Conforto físico',
    '[
        {"code": "1400", "title": "Manejo da dor", "description": "Avaliação de intensidade (0-10) e administração de analgésicos."},
        {"code": "2210", "title": "Administração de analgésicos", "description": "Monitorização de eficácia e eventos adversos."}
    ]'::jsonb,
    '[
        {"code": "1605", "title": "Controle da dor", "description": "Reconhecimento e alívio documentado da dor."},
        {"code": "2102", "title": "Nível de dor", "description": "Redução do escore na escala CALOI."}
    ]'::jsonb
),
(
    '00128',
    'Confusão aguda (Delirium)',
    'Domínio 5: Percepção/Cognição',
    'Classe 4: Cognição',
    '[
        {"code": "4880", "title": "Manejo do delirium", "description": "Orientação temporoespacial e regulação de ciclo circadiano."}
    ]'::jsonb,
    '[
        {"code": "0901", "title": "Orientação cognitiva", "description": "Identificação de tempo, espaço e acompanhantes."}
    ]'::jsonb
),
(
    '00030',
    'Troca de gases prejudicada',
    'Domínio 3: Eliminação e Troca',
    'Classe 4: Função respiratória',
    '[
        {"code": "3320", "title": "Oxigenoterapia", "description": "Administração de O2 suplementar e vigilância da saturação."},
        {"code": "3350", "title": "Monitorização respiratória", "description": "Ausculta pulmonar e frequência respiratória."}
    ]'::jsonb,
    '[
        {"code": "0402", "title": "Estado respiratório: troca gasosa", "description": "SatO2 >= 94% e ausência de cianose."}
    ]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

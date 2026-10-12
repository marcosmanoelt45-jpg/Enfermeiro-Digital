# TERMO DE PROCESSAMENTO DE DADOS PESSOAIS (DPA)
## Conformidade com a Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD)

### 1. PARTES E OBJETO
Este instrumento estabelece os termos e condições aplicáveis ao tratamento de dados pessoais no âmbito da utilização da plataforma **Enfermeiro Digital**, celebrado entre:

* **CONTROLADORA**: A instituição de saúde contratante (Hospital, Clínica Médica, Serviço de Atendimento Domiciliar / Home Care ou Instituição de Ensino Superior).
* **OPERADOR**: **Enfermeiro Digital Tecnologia e Soluções em Saúde**, responsável pelo fornecimento do software de apoio à decisão clínica e gestão assistencial de enfermagem.

### 2. PAPÉIS E RESPONSABILIDADES SOB A LGPD
2.1. A **CONTROLADORA** detém o poder de decisão sobre os dados pessoais e dados pessoais sensíveis de saúde coletados no âmbito da assistência aos seus pacientes, cabendo-lhe garantir a base legal legítima (art. 7º e art. 11 da LGPD - Tutela da Saúde e Cumprimento de Obrigação Legal/Regulatória).  
2.2. O **OPERADOR** realiza o tratamento de dados estritamente em nome da Controladora e conforme suas instruções contratuais, implementando salvaguardas técnicas adequadas para garantir confidencialidade, integridade e disponibilidade.

### 3. MEDIDAS TÉCNICAS E ORGANIZACIONAIS DE SEGURANÇA
O Enfermeiro Digital implementa uma arquitetura técnica orientada por *Privacy by Design* e *Security by Default*:

1. **Isolamento de Dados Multi-Tenant com Row Level Security (RLS)**:
   * Cada instituição de saúde possui seu identificador único de organização (`org_id`).
   * Políticas ativas no motor do banco de dados PostgreSQL impedem que qualquer usuário, mesmo autenticado, visualize ou acesse registros clínicos de outra instituição hospitalar.
2. **Criptografia em Trânsito e em Repouso**:
   * Tráfego 100% cifrado utilizando TLS 1.3 / HTTPS.
   * Criptografia em repouso nos bancos de dados gerenciados (AES-256).
3. **Trilha de Auditoria Imutável (Append-Only)**:
   * Todos os acessos, inserções, atualizações e assinaturas de evoluções clínicas são registrados em uma tabela segregada de auditoria (`audit_logs`).
   * A tabela de auditoria é protegida contra comandos `UPDATE` e `DELETE`, garantindo idoneidade perante auditorias forenses e fiscalizações dos conselhos de classe.
4. **Assinatura Eletrônica Avançada (Lei nº 14.063/2020)**:
   * Cada evolução assinada pelo profissional de enfermagem recebe um carimbo temporal UTC, registro do COREN e um hash criptográfico irreversível SHA-256 gerado a partir do conteúdo do relato clínico, garantindo não-repúdio e integridade documental.

### 4. PIPELINE DE PSEUDONIMIZAÇÃO E ANODINIZAÇÃO PRÉ-IA
4.1. Em estrita observância à **Resolução CFM nº 2.454/2026** e aos princípios de minimização e segurança da LGPD, **dados pessoais identificadores diretos JAMAIS são enviados em texto aberto para motores externos de Inteligência Artificial**.  
4.2. O sistema executa um filtro prévio de higienização de entidades nomeadas que remove ou substitui por pseudônimos:
* Nomes próprios de pacientes e familiares;
* Números de documentos (CPF, RG, Certidão);
* Cartão Nacional de Saúde (CNS);
* Identificadores de localização hospitalar (leito, quarto, enfermaria);
* Contatos telefônicos e endereços residenciais.  
4.3. O modelo de Inteligência Artificial processa exclusivamente dados estritamente clínicos (sinais vitais, escores de escalas validadas como BRADEN, CAM, SAK, AUDIT e CALOI) para fins de mapeamento taxonômico NANDA-I, NIC e NOC.

### 5. CONTRATO DE RETENÇÃO ZERO (ZERO DATA RETENTION)
5.1. Os conectores de inferência de IA operam sob cláusulas de **Zero Data Retention**, garantindo que:
* As requisições clínicas não são armazenadas em disco pelos provedores de modelo de linguagem após o término da inferência;
* Nenhum dado assistencial ou registro hospitalar é utilizado para treinamento, calibração ou aprimoramento de modelos de IA fundamentais.

### 6. NOTIFICAÇÃO DE INCIDENTES E DIREITOS DOS TITULARES
6.1. O Operador cooperará diligentemente com a Controladora no atendimento a solicitações dos titulares de dados (art. 18 da LGPD) e na elaboração de Relatórios de Impacto à Proteção de Dados Pessoais (RIPD).  
6.2. Em caso de qualquer incidente de segurança envolvendo dados pessoais, o Operador notificará a Controladora no prazo máximo de 48 (quarenta e oito) horas a contar da ciência inequívoca.

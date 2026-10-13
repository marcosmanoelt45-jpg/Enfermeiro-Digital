# Dossiê de Propriedade Intelectual, Governança LGPD e Conformidade Regulatória
**Projeto: Enfermeiro Digital (Plataforma EdTech de Raciocínio Clínico e Simulação em Enfermagem)**
**Destinatário: Núcleo de Inovação Tecnológica (NIT) - Hospital de Clínicas de Porto Alegre (HCPA) / Starts-HCPA**

---

## 1. Sumário Executivo

O **Enfermeiro Digital** é uma plataforma educacional (EdTech) voltada ao desenvolvimento do raciocínio clínico, julgamento diagnóstico e tomada de decisão de estudantes de enfermagem.

Este documento consolida a conformidade jurídica, regulatória e de propriedade intelectual da plataforma, estabelecendo as bases para o processo de **pré-incubação e incubação na Starts-HCPA / HCPATec**, com foco em:
1. **Propriedade Intelectual & Taxonomias de Enfermagem (NANDA-I, NIC, NOC e CIPE®)**;
2. **Conformidade com a LGPD (Lei nº 13.709/2018)** e Resoluções do Conselho Federal de Enfermagem (COFEN);
3. **Plano de Parceria e Licenciamento Institucional Oficial**.

---

## 2. Estratégia de Propriedade Intelectual (PI) & Taxonomias

### 2.1. O Desafio das Taxonomias Privadas (NANDA-I, NIC, NOC)
- As classificações NANDA International (NANDA-I) são obras protegidas com direitos autorais e marcas registradas geridas pela editora **Thieme Group** (e *Thieme RECOM* para integrações em bases de dados).
- As classificações NIC (Intervenções) e NOC (Resultados) são obras protegidas pela **Elsevier Health**.
- **Posicionamento Jurídico da Plataforma**:
  - O Enfermeiro Digital **NÃO redistribui, comercializa nem vende o banco de dados dos livros protegidos**.
  - A tecnologia central da plataforma é o **Motor de Tutoria Socrática e Avaliação de Raciocínio Clínico**, o qual ensina o estudante a aplicar o método científico de Wanda Horta e do COFEN.
  - O uso de termos e conceitos diagnósticos nas simulações apoia-se no **Artigo 46, inciso III da Lei de Direitos Autorais nº 9.610/98** (*"A citação em livros, jornais, revistas ou qualquer outro meio de comunicação, de passagens de qualquer obra, para fins de estudo, crítica ou polêmica, na medida justificada para o fim a atingir, indicando-se o nome do autor e a origem"*).

### 2.2. Adoção Estratégica da CIPE® (Classificação Aberta do ICN / COFEN)
- Para garantir interoperabilidade com o Sistema Único de Saúde (SUS) e neutralidade jurídica perante órgãos públicos e editais de fomento (FAPERGS, FINEP, CNPq), a plataforma adota nativamente a **CIPE® (Classificação Internacional para a Prática de Enfermagem)**, mantida pelo Conselho Internacional de Enfermeiros (ICN) e formalmente incentivada pela **Resolução COFEN nº 736/2024**.
- A CIPE® é terminologia aberta e padronizada globalmente, mapeada para a SNOMED-CT, eliminando barreiras proprietárias para expansão universitária.

### 2.3. Proposta Institucional para a Incubação Starts-HCPA
Como parte do plano de trabalho durante a pré-incubação no HCPA:
1. Buscar, com o apoio institucional do NIT HCPA e da Universidade Federal do Rio Grande do Sul (UFRGS), a formalização de um **Convênio de Licenciamento Educacional** com a Thieme e a Elsevier;
2. Esse convênio posicionará o Enfermeiro Digital como uma plataforma pioneira chancelada oficialmente no Brasil, transformando uma barreira de mercado em um diferencial competitivo de alta barreira de entrada (*moat* regulatório).

---

## 3. Conformidade Rigorosa com a LGPD (Lei nº 13.709/2018)

### 3.1. Dados Pessoais Sensíveis de Saúde (Art. 5º, II e Art. 11)
- O ambiente do Enfermeiro Digital é **estritamente simulado e didático**.
- Nenhum prontuário ou dado de paciente real é cadastrado, armazenado ou processado na plataforma.
- Todos os casos clínicos são sintéticos e utilizam dados anonimizados por padrão (ex: `Paciente S. S. - Caso Simulado #101`), estando fora do conceito de dado pessoal nos termos do **Artigo 12 da LGPD**.

### 3.2. Camada Ativa de Prevenção de Vazamento (DLP - Data Loss Prevention)
A plataforma incorpora no front-end um filtro ativo de DLP (`dlpSanitizer.js`) que inspeciona textos inseridos pelos alunos antes do processamento por IA, interceptando e bloqueando:
- Padrões de CPF (formato 000.000.000-00 e numérico);
- Padrões de Cartão Nacional de Saúde (CNS - 15 dígitos);
- Números de RG, telefones, endereços e identificadores de leitos hospitalares reais;
- Acionamento imediato do modal ético `DlpShieldModal.jsx` com anonimização automática.

---

## 4. Metodologia Pedagógica & Tutora Socrática

Conforme as diretrizes das Diretrizes Curriculares Nacionais (DCN) do Curso de Graduação em Enfermagem e as recomendações do HCPA:
1. **Método Socrático**: A IA não fornece respostas prontas nem diagnósticos mastigados. Ela realiza perguntas reflexivas que estimulam o aluno a correlacionar fisiopatologia, sinais vitais e farmacologia.
2. **Scaffolding (Andaimes Pedagógicos)**: Dicas progressivas em 3 níveis (Pergunta Guia, Pista Fisiopatológica e Fundamentação Conceitual).
3. **Detecção Ativa de Lacunas Clínicas (Radar Clínico)**: Prevenção do viés de fechamento prematuro, orientando o aluno a investigar o que está faltando antes de concluir o plano de cuidados.

---

**Porto Alegre / RS, Outubro de 2026.**
*Enfermeiro Digital - Tecnologia & Educação em Saúde.*

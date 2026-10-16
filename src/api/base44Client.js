import {
  authService,
  patientService,
  assessmentService,
  evolutionService,
  diagnosisService,
  turmaService,
  medicationService,
  dischargeService,
  aiService,
} from '@/services';
import { parseClinicalSpeech } from '@/lib/clinicalSpeechParser';

export const base44 = {
  auth: {
    me: () => authService.getCurrentUser(),
    loginViaEmailPassword: (email, pass, opts) => authService.login(email, pass, opts),
    loginWithProvider: (prov, ret, opts) => authService.loginWithProvider(prov, ret, opts),
    register: ({ email, password, full_name, user_type = 'aluno', coren }) =>
      authService.register(email, password, { full_name, user_type, coren }),
    updateMe: (updates) => {
      return authService.getCurrentUser().then((u) => {
        if (!u) return null;
        return authService.updateProfile(u.id, updates);
      });
    },
    resetPasswordRequest: (email) => authService.resetPasswordRequest(email),
    resetPassword: ({ newPassword }) => authService.updatePassword(newPassword),
    verifyOtp: async () => ({ access_token: 'valid' }),
    setToken: () => {},
    resendOtp: async () => {},
  },
  entities: {
    Patient: {
      list: (order, limit) => patientService.list(order, limit),
      get: (id) => patientService.get(id),
      create: (data) => patientService.create(data),
      update: (id, data) => patientService.update(id, data),
      delete: (id) => patientService.delete(id),
    },
    Assessment: {
      list: (order, limit) => assessmentService.list(order, limit),
      filter: (crit, order, limit) => assessmentService.filter(crit, order, limit),
      get: (id) => assessmentService.get(id),
      create: (data) => assessmentService.create(data),
      update: (id, data) => assessmentService.update(id, data),
      delete: (id) => assessmentService.delete(id),
      deleteMany: (crit) => assessmentService.deleteMany(crit),
    },
    Evolution: {
      filter: (crit, order, limit) => evolutionService.filter(crit, order, limit),
      create: (data) => evolutionService.create(data),
      update: (id, data) => evolutionService.update(id, data),
      delete: (id) => evolutionService.delete(id),
      deleteMany: (crit) => evolutionService.deleteMany(crit),
      sign: (id, coren) => evolutionService.signEvolution(id, coren),
    },
    NursingDiagnosis: {
      filter: (crit, order, limit) => diagnosisService.filter(crit, order, limit),
      create: (data) => diagnosisService.create(data),
      update: (id, data) => diagnosisService.update(id, data),
      delete: (id) => diagnosisService.delete(id),
      deleteMany: (crit) => diagnosisService.deleteMany(crit),
      bulkCreate: (list) => diagnosisService.bulkCreate(list),
    },
    NandaDiagnosis: {
      list: (order, limit) => diagnosisService.listNandaCatalog(limit),
      filter: (crit) => diagnosisService.searchNandaCatalog(crit?.title || crit?.query || ''),
      get: async (code) => {
        const results = await diagnosisService.listNandaCatalog(500);
        return results.find((d) => d.code === code) || null;
      },
    },
    MedicationRecord: {
      list: (order, limit) => medicationService.list(order, limit),
      filter: (crit, order, limit) => medicationService.filter(crit, order, limit),
      create: (data) => medicationService.create(data),
      delete: (id) => medicationService.delete(id),
      deleteMany: (crit) => medicationService.deleteMany(crit),
    },
    DischargePlan: {
      filter: (crit, order, limit) => dischargeService.filter(crit, order, limit),
      get: (id) => dischargeService.get(id),
      create: (data) => dischargeService.create(data),
      update: (id, data) => dischargeService.update(id, data),
      delete: (id) => dischargeService.delete(id),
      deleteMany: (crit) => dischargeService.deleteMany(crit),
    },
    Turma: {
      list: (order, limit) => turmaService.listTurmas(limit),
      get: (id) => turmaService.getTurma(id),
      filter: (crit) => turmaService.filterTurmas(crit),
      create: (data) => turmaService.createTurma(data),
      update: (id, data) => turmaService.updateTurma(id, data),
      updateMany: (crit, updates) => turmaService.updateManyTurmas(crit, updates),
      delete: (id) => turmaService.deleteTurma(id),
    },
    TurmaMember: {
      filter: (crit, order, limit) => turmaService.filterTurmaMembers(crit, order, limit),
      create: (data) => turmaService.addTurmaMember(data),
      delete: (id) => turmaService.removeTurmaMember(id),
      deleteMany: (crit) => turmaService.deleteManyTurmaMembers(crit),
      updateMany: (crit, updates) => turmaService.updateManyTurmaMembers(crit, updates),
      subscribe: () => () => {},
    },
    CaseAssignment: {
      filter: (crit, order, limit) => turmaService.filterCaseAssignments(crit, order, limit),
      get: (id) => turmaService.getCaseAssignment(id),
      create: (data) => turmaService.createCaseAssignment(data),
      delete: (id) => turmaService.deleteCaseAssignment(id),
      deleteMany: (crit) => turmaService.deleteManyCaseAssignments(crit),
      subscribe: () => () => {},
    },
    StudentAnswer: {
      filter: (crit, order, limit) => turmaService.filterStudentAnswers(crit, order, limit),
      create: (data) => turmaService.createStudentAnswer(data),
      deleteMany: (crit) => turmaService.deleteManyStudentAnswers(crit),
      subscribe: () => () => {},
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        return new Promise((resolve, reject) => {
          if (!file) return reject(new Error('Nenhum arquivo fornecido'));
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ file_url: reader.result });
          };
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(file);
        });
      },
      UploadPublicFile: async ({ file }) => {
        return new Promise((resolve, reject) => {
          if (!file) return reject(new Error('Nenhum arquivo fornecido'));
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ file_url: reader.result });
          };
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(file);
        });
      },
    },
  },
  functions: {
    invoke: async (name, payload = {}) => {
      if (name === 'saveAssessment') {
        const created = await assessmentService.create({
          patient_id: payload.patient_id,
          ...payload.data,
        });
        return {
          data: { assessment_id: created.id },
          assessment_id: created.id,
          id: created.id,
        };
      }
      if (name === 'audioAssessment') {
        const userTranscript = (payload.transcript || '').trim();
        const extractedVitals = userTranscript ? parseClinicalSpeech(userTranscript) : {};
        const assessmentPayload = {
          patient_id: payload.patient_id,
          audio_url: payload.audio_url || null,
          notes: userTranscript ? `Relato falado: "${userTranscript}"` : 'Avaliação clínica guiada por voz',
          ...(payload.parsed || {}),
          ...extractedVitals,
          ...(payload.data || {}),
        };
        const created = await assessmentService.create(assessmentPayload);
        return {
          data: {
            assessment_id: created.id,
            transcript: userTranscript,
            risk_status: created.risk_status,
          },
          assessment_id: created.id,
          id: created.id,
          transcript: userTranscript,
          risk_status: created.risk_status,
        };
      }
      if (name === 'generateCarePlan') {
        const plan = await aiService.invokeCarePlanSync(payload.assessment_id);
        return { plan };
      }
      if (name === 'syncAssignmentMembers') {
        return turmaService.syncAssignmentMembers(payload.turma_id);
      }
      return { ok: true };
    },
  },
  app: {
    getPublicSettings: async () => ({ id: 'enfermeiro-digital', public_settings: {} }),
  },
};

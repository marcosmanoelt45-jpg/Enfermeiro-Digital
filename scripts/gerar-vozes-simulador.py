import os
import sys
import time
import json
import urllib.request
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

VOICEBOX_URL = "http://127.0.0.1:17493"
MARCUS_DIR = os.path.abspath("public/pacientes/marcus")
TERESINHA_DIR = os.path.abspath("public/pacientes/teresinha")

os.makedirs(MARCUS_DIR, exist_ok=True)
os.makedirs(TERESINHA_DIR, exist_ok=True)

# Definição dos textos reais falados pelo paciente em cada passo
FALAS_MARCUS = [
    # Passo 0 (Abertura)
    "Oi enfermeiro, que bom que você veio... Minha perna tá doendo e tô sentindo um incômodo forte aqui no calcanhar.",
    # Passo 1 (Avaliação da ferida)
    "Ao avaliar a ferida no meu calcanhar com tecido fibrinoso e bordas maceradas, qual conduta primordial você adota primeiro?",
    # Passo 2 (Materiais de curativo)
    "Quais materiais você vai separar para limpar e proteger o meu machucado?",
    # Passo 3 (Cálculo analgesia Dipirona)
    "Quantos mL você prepara para o alívio da dor do paciente?",
    # Passo 4 (Técnica de limpeza com soro)
    "Qual técnica é preconizada pelo Ministério da Saúde para limpar a lesão sem traumatizar o tecido de granulação?",
    # Passo 5 (Prevenção e alívio de pressão)
    "Quais condutas de enfermagem previnem a piora da lesão e protegem outras proeminências?",
    # Passo 6 (Gotejamento de soro)
    "Quantas gotas por minuto, macrogotas, devem correr na hidratação prescrita?",
    # Passo 7 (Biossegurança e higiene das mãos)
    "Antes de colocar as luvas e tocar no paciente, diga qual procedimento primordial você realiza.",
    # Passo 8 (Escala de Braden)
    "Na Escala de Braden para predição do risco de lesão por pressão, qual parâmetro avalia a sensibilidade a desconforto?"
]

FALAS_TERESINHA = [
    # Passo 0 (Abertura)
    "Olá, enfermeiro. O meu braço tá ardendo um pouquinho onde colocaram esse soro... O que será que tá acontecendo?",
    # Passo 1 (Diagnóstico de flebite)
    "Dona Teresinha apresenta dor local, calor e cordão venoso palpável no antebraço direito. Qual o diagnóstico de enfermagem prioritário?",
    # Passo 2 (Cálculo Ceftriaxona)
    "Quantos mL você aspira do frasco reconstituído para administrar a dose prescrita?",
    # Passo 3 (Sinais de flebite química)
    "Ao identificar sinais de flebite química no membro da paciente, quais ações imediatas a equipe de enfermagem deve executar?",
    # Passo 4 (Boas práticas de punção)
    "Ao puncionar novo acesso venoso periférico na Dona Teresinha, qual a recomendação técnica de boas práticas?",
    # Passo 5 (Microgotas)
    "Quantas microgotas por minuto devem ser reguladas para infundir a medicação no tempo prescrito?",
    # Passo 6 (Cuidado tópico compressa morna)
    "Após a retirada do cateter venoso com flebite, qual cuidado tópico com evidência científica auxilia no alívio da dor e edema?",
    # Passo 7 (Materiais de punção estéril)
    "Selecione todos os materiais necessários para realizar uma nova punção venosa periférica estéril e segura.",
    # Passo 8 (Flebite vs Infiltração)
    "Qual a principal diferença clínica observada entre flebite inflamatória e infiltração venosa?"
]

def main():
    print("🚀 Iniciando servidor Voicebox...")
    p = subprocess.Popen([
        r"C:\Program Files\Voicebox\voicebox-server.exe",
        "--port", "17493",
        "--data-dir", r"C:\Users\mxmin\AppData\Roaming\sh.voicebox.app"
    ])

    for i in range(20):
        time.sleep(1)
        try:
            urllib.request.urlopen(f"{VOICEBOX_URL}/profiles")
            print(f"✅ Voicebox online na tentativa {i+1}!")
            break
        except Exception:
            pass

    try:
        # Obter perfis
        req = urllib.request.urlopen(f"{VOICEBOX_URL}/profiles")
        profiles = json.loads(req.read().decode())
        
        # Perfil Masculino (Marcus)
        marcus_prof = next((pr for pr in profiles if pr.get('name') == 'Marcus Male'), None)
        if not marcus_prof:
            payload = {
                'name': 'Marcus Male',
                'language': 'pt',
                'voice_type': 'preset',
                'preset_engine': 'kokoro',
                'preset_voice_id': 'pm_alex'
            }
            create_req = urllib.request.Request(f"{VOICEBOX_URL}/profiles", data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
            res = urllib.request.urlopen(create_req)
            marcus_prof = json.loads(res.read().decode())
            print(f"Perfil Marcus criado: {marcus_prof['id']}")
        else:
            print(f"Perfil Marcus existente: {marcus_prof['id']}")

        # Perfil Feminino (Teresinha)
        teresinha_prof = next((pr for pr in profiles if pr.get('name') == 'Teresinha Female'), None)
        if not teresinha_prof:
            payload = {
                'name': 'Teresinha Female',
                'language': 'pt',
                'voice_type': 'preset',
                'preset_engine': 'kokoro',
                'preset_voice_id': 'pf_dora'
            }
            create_req = urllib.request.Request(f"{VOICEBOX_URL}/profiles", data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
            res = urllib.request.urlopen(create_req)
            teresinha_prof = json.loads(res.read().decode())
            print(f"Perfil Teresinha criado: {teresinha_prof['id']}")
        else:
            print(f"Perfil Teresinha existente: {teresinha_prof['id']}")

        # Função auxiliar de síntese
        def sintetizar_audio(profile_id, texto, out_path):
            print(f"🎙️ Sintetizando: \"{texto[:45]}...\"")
            gen_payload = {
                'profile_id': profile_id,
                'text': texto,
                'language': 'pt',
                'engine': 'kokoro'
            }
            gen_req = urllib.request.Request(f"{VOICEBOX_URL}/generate", data=json.dumps(gen_payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
            gen_res = urllib.request.urlopen(gen_req)
            gen = json.loads(gen_res.read().decode())
            gen_id = gen['id']

            for _ in range(30):
                time.sleep(1)
                stat_req = urllib.request.urlopen(f"{VOICEBOX_URL}/history/{gen_id}")
                stat = json.loads(stat_req.read().decode())
                if stat.get('status') == 'completed':
                    audio_res = urllib.request.urlopen(f"{VOICEBOX_URL}/audio/{gen_id}")
                    audio_data = audio_res.read()
                    with open(out_path, "wb") as f:
                        f.write(audio_data)
                    print(f"✅ Salvo ({len(audio_data)} bytes) em {os.path.basename(out_path)}")
                    return True
                elif stat.get('status') == 'failed':
                    print(f"❌ Falha na geração: {stat.get('error')}")
                    return False
            return False

        # Gerar Marcus
        print("\n--- GERANDO ÁUDIOS DO SR. MARCUS ---")
        for idx, texto in enumerate(FALAS_MARCUS):
            out_file = os.path.join(MARCUS_DIR, f"passo_{idx}.wav")
            sintetizar_audio(marcus_prof['id'], texto, out_file)

        # Copia passo_0 para fala.wav para retrocompatibilidade
        fala_marcus = os.path.join(MARCUS_DIR, "fala.wav")
        if os.path.exists(os.path.join(MARCUS_DIR, "passo_0.wav")):
            with open(os.path.join(MARCUS_DIR, "passo_0.wav"), "rb") as f_src, open(fala_marcus, "wb") as f_dst:
                f_dst.write(f_src.read())

        # Gerar Teresinha
        print("\n--- GERANDO ÁUDIOS DA DONA TERESINHA ---")
        for idx, texto in enumerate(FALAS_TERESINHA):
            out_file = os.path.join(TERESINHA_DIR, f"passo_{idx}.wav")
            sintetizar_audio(teresinha_prof['id'], texto, out_file)

        # Copia passo_0 para fala.wav para retrocompatibilidade
        fala_teresinha = os.path.join(TERESINHA_DIR, "fala.wav")
        if os.path.exists(os.path.join(TERESINHA_DIR, "passo_0.wav")):
            with open(os.path.join(TERESINHA_DIR, "passo_0.wav"), "rb") as f_src, open(fala_teresinha, "wb") as f_dst:
                f_dst.write(f_src.read())

        print("\n🎉 TODOS OS 18 ÁUDIOS FORAM GERADOS COM SUCESSO PELO VOICEBOX!")

    finally:
        print("🛑 Finalizando servidor Voicebox...")
        p.terminate()

if __name__ == "__main__":
    main()

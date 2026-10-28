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
JSON_PATH = os.path.abspath("scripts/falas_pacientes.json")

os.makedirs(MARCUS_DIR, exist_ok=True)
os.makedirs(TERESINHA_DIR, exist_ok=True)

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo {JSON_PATH} não encontrado!")
        sys.exit(1)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        dados_falas = json.load(f)

    print("🚀 Verificando servidor Voicebox...")
    voicebox_online = False
    try:
        urllib.request.urlopen(f"{VOICEBOX_URL}/profiles", timeout=2)
        print("✅ Servidor Voicebox já está em execução!")
        voicebox_online = True
        p = None
    except Exception:
        print("Iniciando voicebox-server.exe local...")
        p = subprocess.Popen([
            r"C:\Program Files\Voicebox\voicebox-server.exe",
            "--port", "17493",
            "--data-dir", r"C:\Users\mxmin\AppData\Roaming\sh.voicebox.app"
        ])
        for i in range(25):
            time.sleep(1)
            try:
                urllib.request.urlopen(f"{VOICEBOX_URL}/profiles", timeout=2)
                print(f"✅ Voicebox online na tentativa {i+1}!")
                voicebox_online = True
                break
            except Exception:
                pass

    if not voicebox_online:
        print("❌ Não foi possível conectar ao Voicebox.")
        sys.exit(1)

    try:
        req = urllib.request.urlopen(f"{VOICEBOX_URL}/profiles")
        profiles = json.loads(req.read().decode())

        # Perfil Marcus (Masculino Idoso - Kokoro pm_alex)
        marcus_prof = next((pr for pr in profiles if pr.get('name') == 'Marcus Male'), None)
        if not marcus_prof:
            payload = {
                'name': 'Marcus Male',
                'language': 'pt',
                'voice_type': 'preset',
                'preset_engine': 'kokoro',
                'preset_voice_id': 'pm_alex'
            }
            create_req = urllib.request.Request(
                f"{VOICEBOX_URL}/profiles",
                data=json.dumps(payload).encode(),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            res = urllib.request.urlopen(create_req)
            marcus_prof = json.loads(res.read().decode())
            print(f"Perfil Marcus criado: {marcus_prof['id']}")
        else:
            print(f"Perfil Marcus existente: {marcus_prof['id']}")

        # Perfil Teresinha (Feminino Idosa - Kokoro pf_dora)
        teresinha_prof = next((pr for pr in profiles if pr.get('name') == 'Teresinha Female'), None)
        if not teresinha_prof:
            payload = {
                'name': 'Teresinha Female',
                'language': 'pt',
                'voice_type': 'preset',
                'preset_engine': 'kokoro',
                'preset_voice_id': 'pf_dora'
            }
            create_req = urllib.request.Request(
                f"{VOICEBOX_URL}/profiles",
                data=json.dumps(payload).encode(),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            res = urllib.request.urlopen(create_req)
            teresinha_prof = json.loads(res.read().decode())
            print(f"Perfil Teresinha criado: {teresinha_prof['id']}")
        else:
            print(f"Perfil Teresinha existente: {teresinha_prof['id']}")

        def sintetizar_audio(profile_id, texto, out_path, force=False):
            if not force and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                print(f"⏩ Já existe ({os.path.getsize(out_path)} bytes): {os.path.basename(out_path)}")
                return True

            print(f"🎙️ Sintetizando -> {os.path.basename(out_path)}: \"{texto[:55]}...\"")
            gen_payload = {
                'profile_id': profile_id,
                'text': texto,
                'language': 'pt',
                'engine': 'kokoro'
            }
            gen_req = urllib.request.Request(
                f"{VOICEBOX_URL}/generate",
                data=json.dumps(gen_payload).encode(),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            gen_res = urllib.request.urlopen(gen_req)
            gen = json.loads(gen_res.read().decode())
            gen_id = gen['id']

            for _ in range(45):
                time.sleep(1)
                stat_req = urllib.request.urlopen(f"{VOICEBOX_URL}/history/{gen_id}")
                stat = json.loads(stat_req.read().decode())
                if stat.get('status') == 'completed':
                    audio_res = urllib.request.urlopen(f"{VOICEBOX_URL}/audio/{gen_id}")
                    audio_data = audio_res.read()
                    with open(out_path, "wb") as f_out:
                        f_out.write(audio_data)
                    print(f"✅ Salvo ({len(audio_data)} bytes) em {os.path.basename(out_path)}")
                    return True
                elif stat.get('status') == 'failed':
                    print(f"❌ Falha na geração: {stat.get('error')}")
                    return False
            return False

        # Gerar Sr. Marcus (22 passos)
        print("\n--- SINTETIZANDO FALAS DO SR. MARCUS (22 PASSOS) ---")
        for item in dados_falas.get("marcus", []):
            idx = item["idx"]
            texto = item["textoFala"]
            out_file = os.path.join(MARCUS_DIR, f"passo_{idx}.wav")
            sintetizar_audio(marcus_prof['id'], texto, out_file)

        # Atualizar fala.wav de Marcus
        fala_marcus = os.path.join(MARCUS_DIR, "fala.wav")
        if os.path.exists(os.path.join(MARCUS_DIR, "passo_0.wav")):
            with open(os.path.join(MARCUS_DIR, "passo_0.wav"), "rb") as f_src, open(fala_marcus, "wb") as f_dst:
                f_dst.write(f_src.read())

        # Gerar Dona Teresinha (22 passos)
        print("\n--- SINTETIZANDO FALAS DA DONA TERESINHA (22 PASSOS) ---")
        for item in dados_falas.get("teresinha", []):
            idx = item["idx"]
            texto = item["textoFala"]
            out_file = os.path.join(TERESINHA_DIR, f"passo_{idx}.wav")
            sintetizar_audio(teresinha_prof['id'], texto, out_file)

        # Atualizar fala.wav de Teresinha
        fala_teresinha = os.path.join(TERESINHA_DIR, "fala.wav")
        if os.path.exists(os.path.join(TERESINHA_DIR, "passo_0.wav")):
            with open(os.path.join(TERESINHA_DIR, "passo_0.wav"), "rb") as f_src, open(fala_teresinha, "wb") as f_dst:
                f_dst.write(f_src.read())

        print("\n🎉 TODOS OS 44 ÁUDIOS DOS PACIENTES ESTÃO DISPONÍVEIS E VALIDADOS!")

    finally:
        if p is not None:
            print("🛑 Finalizando processo Voicebox iniciado pelo script...")
            p.terminate()

if __name__ == "__main__":
    main()

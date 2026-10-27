import urllib.request, json, subprocess, time

p = subprocess.Popen([r'C:\Program Files\Voicebox\voicebox-server.exe', '--port', '17493', '--data-dir', r'C:\Users\mxmin\AppData\Roaming\sh.voicebox.app'])
for i in range(15):
    time.sleep(1)
    try:
        urllib.request.urlopen('http://127.0.0.1:17493/profiles')
        print('Voicebox Ready!')
        break
    except:
        pass

try:
    # 1. Checa se o perfil Marcus já existe
    req = urllib.request.urlopen('http://127.0.0.1:17493/profiles')
    profiles = json.loads(req.read().decode())
    marcus_prof = next((pr for pr in profiles if pr.get('name') == 'Marcus Male'), None)
    
    if not marcus_prof:
        payload_profile = {
            'name': 'Marcus Male',
            'language': 'pt',
            'voice_type': 'preset',
            'preset_engine': 'kokoro',
            'preset_voice_id': 'pm_alex'
        }
        create_req = urllib.request.Request('http://127.0.0.1:17493/profiles', data=json.dumps(payload_profile).encode(), headers={'Content-Type': 'application/json'}, method='POST')
        res = urllib.request.urlopen(create_req)
        marcus_prof = json.loads(res.read().decode())
        print('Profile Marcus Criado:', marcus_prof['id'])
    else:
        print('Profile Marcus Encontrado:', marcus_prof['id'])

    # 2. Testa geração com Kokoro
    gen_payload = {
        'profile_id': marcus_prof['id'],
        'text': 'Oi enfermeiro, que bom que você veio.',
        'language': 'pt',
        'engine': 'kokoro'
    }
    gen_req = urllib.request.Request('http://127.0.0.1:17493/generate', data=json.dumps(gen_payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    gen_res = urllib.request.urlopen(gen_req)
    gen = json.loads(gen_res.read().decode())
    print('Generation iniciada:', gen['id'])
    
    for _ in range(10):
        time.sleep(1)
        stat_req = urllib.request.urlopen(f"http://127.0.0.1:17493/history/{gen['id']}")
        stat = json.loads(stat_req.read().decode())
        print('Status:', stat.get('status'))
        if stat.get('status') in ['completed', 'failed']:
            if stat.get('status') == 'completed':
                audio_res = urllib.request.urlopen(f"http://127.0.0.1:17493/audio/{gen['id']}")
                print('Tamanho do audio:', len(audio_res.read()), 'bytes')
            break
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode())
except Exception as e:
    print('ERROR:', e)
finally:
    p.terminate()

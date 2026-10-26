# Guia de Arquitetura Flutter e Porte para Android Nativo (Enfere Vivo)

Este documento estabelece as diretrizes de arquitetura inspiradas no ecossistema **Flutter** (Material 3 + física de toques táteis estilo Duolingo clínico) e a estratégia de porte oficial para **Android**.

---

## 1. Princípios de Design e Arquitetura Inspirados no Flutter

No Flutter, componentes como `Scaffold`, `AppBar`, `BottomNavigationBar` e `InkWell` oferecem uma resposta tátil imediata (haptic feedback + elevação de superfícies). O Enfere adota esses princípios no frontend web móvel para garantir uma experiência indistinguível de um app nativo:

1. **Scaffold & SafeArea:**
   - Todo o conteúdo respeita `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.
   - O `MobileBottomDock` funciona como uma `BottomNavigationBar` com 56px a 64px de altura e ancoragem rígida.

2. **Superfícies Táteis 3D (Botões com Elevação e Base):**
   - No Flutter: `ElevatedButton` com `styleFrom(elevation: 4)`.
   - No Enfere: borda inferior de 4 a 5px (`border-b-4` / `border-b-5`) que cede 4px em 120ms (`active:translate-y-1 active:border-b-2`).
   - Cores do Design System Enfere Vivo:
     - Primária (Aqua): `#1FC7B6` (Claro) / `#2AD3C1` (Escuro)
     - Base da Aqua: `#12A596` (Claro) / `#17A99A` (Escuro)
     - Texto sobre Aqua: `#06302E` (sempre escuro para contraste AA de 6.8:1)

3. **Reconhecimento de Gestos (GestureDetector & Drag):**
   - Listas horizontais (como as categorias da Videoteca de Procedimentos) utilizam `touch-action: pan-x` e `-webkit-overflow-scrolling: touch` para rolagem inercial nativa no Android e iOS.

---

## 2. Estratégia de Porte para Android via Flutter

Para empacotar o Enfere como um aplicativo Android de alta performance mantendo a sincronização com o código web, há dois caminhos consolidados:

### Opção A: Wrapper Nativo Flutter (InAppWebView + MethodChannel)
Cria-se um projeto Flutter que encapsula a aplicação web com suporte nativo a hardware:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() => runApp(const EnfereApp());

class EnfereApp extends StatelessWidget {
  const EnfereApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Enfere - Enfermagem Digital',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1FC7B6)),
        useMaterial3: true,
      ),
      home: const EnfereWebView(),
    );
  }
}

class EnfereWebView extends StatefulWidget {
  const EnfereWebView({super.key});

  @override
  State<EnfereWebView> createState() => _EnfereWebViewState();
}

class _EnfereWebViewState extends State<EnfereWebView> {
  InAppWebViewController? webViewController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri("http://localhost:5174")),
          initialSettings: InAppWebViewSettings(
            cacheEnabled: true,
            supportZoom: false,
            allowsInlineMediaPlayback: true,
            useHybridComposition: true,
          ),
          onWebViewCreated: (controller) {
            webViewController = controller;
          },
        ),
      ),
    );
  }
}
```

### Opção B: Build Nativo via Capacitor / Android Studio
Instala-se o Capacitor para gerar diretamente o APK/AAB do Android Studio a partir da pasta `dist/`:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Enfere" "br.com.enfermeirodigital.app" --web-dir dist
npm run build
npx cap add android
npx cap open android
```

---

## 3. Checklist de Performance para Android
- [x] Viewport mobile travado contra zoom indesejado (`viewport-fit=cover`).
- [x] Safe area do Android/iOS aplicada no Dock inferior.
- [x] Haptic feedback integrado via `navigator.vibrate` com fallbacks seguros.
- [x] Suporte offline resiliente com motor clínico local determinístico no Goti IA.

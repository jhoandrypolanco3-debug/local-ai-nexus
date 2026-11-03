# 🌐 Local AI Nexus — Ecosistema Central de IA 100% Local & Agente FTC

**Local AI Nexus** es una plataforma y panel de control unificado diseñado para concentrar, orquestar y monitorear todas las inteligencias artificiales que corren de manera local en tu PC, con arquitectura isométrica de 5 capas, herramientas especializadas para **FIRST Tech Challenge (FTC)** y agente de control con acceso a disco.

---

## ⚡ Novedades y 5 Superpoderes Integrados

1. **📄 RAG Local (Subida y Extracción de Documentos & PDF)**:
   - Sube manuales de juego de FTC, reglamentos o código (`.pdf`, `.txt`, `.java`, `.md`, `.json`).
   - El ecosistema extrae el texto en el cliente (usando PDF.js) y lo inyecta como contexto relevante para tus consultas al modelo sin enviar un solo byte a la nube.

2. **🎙️ Modo de Voz Bidireccional (STT + TTS)**:
   - Habla directamente con tu robot o IA usando el micrófono (Web Speech STT).
   - Respuestas habladas con síntesis de voz neural (SpeechSynthesis TTS) y selector de velocidad.

3. **📱 Acceso Remoto Móvil con Código QR (Wi-Fi Local)**:
   - Escanea el código QR generado en el dashboard con tu smartphone o tablet conectado al mismo Wi-Fi.
   - Controla el ecosistema y consulta tus modelos desde el taller o la cancha de robótica sin cables.

4. **📊 Visualizador de Estrategia Robótica FTC con Diagramas Mermaid.js**:
   - Genera y visualiza al instante diagramas de flujo para rutinas autónomas (`AutonomousMecanum`), máquinas de estados y cinemática de brazos o intake.

5. **🖥️ Acceso Directo de Escritorio como Aplicación Nativa**:
   - Acceso de un clic desde el escritorio de Windows (`Local AI Nexus.lnk`) ejecutándose como app independiente sin barras de navegador.

---

## 🏛️ Arquitectura Isométrica de 5 Capas

```
┌────────────────────────────────────────────────────────┐
│  Tier 5: Interactive User Experience (UI / UX / Voice)  │
├────────────────────────────────────────────────────────┤
│  Tier 4: Model Catalog & FTC Specialized Agents        │
├────────────────────────────────────────────────────────┤
│  Tier 3: Execution Runtime & Local Proxy (Node.js)     │
├────────────────────────────────────────────────────────┤
│  Tier 2: AI Inference Engines (Ollama, SD, LM Studio)  │
├────────────────────────────────────────────────────────┤
│  Tier 1: Hardware & Strict Storage Guard (<= 5 GB)     │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

1. **Vía Acceso Directo**:
   - Haz doble clic en el icono **`Local AI Nexus`** en tu Escritorio de Windows.

2. **Vía Terminal / Batch**:
   ```bat
   iniciar-ecosistema.bat
   ```
   O manualmente con Node.js:
   ```powershell
   node server.js
   ```
   Abre tu navegador en: [http://localhost:3333](http://localhost:3333)

---

## 🛡️ Guardián de Almacenamiento (Estricto <= 5 GB)
El ecosistema supervisa permanentemente la carpeta de pesos y blobs de Ollama para garantizar que el almacenamiento nunca sobrepase el límite máximo de **5.0 GB**, protegiendo el espacio disponible de tu disco SSD/HDD en Windows.

---

## 🤖 Agente Autónomo FTC (Java)
Incluye plantillas listas para producción y generación de código:
- **`AutonomousMecanum`**: Rutina autónoma con encoders y sensores de distancia.
- **`TeleOp`**: Control de chasis omnidireccional mecanum con gamepad y control de potencia.
- **`RobotHardware`**: Mapeo centralizado de hardware motors, servos y sensores.
- **Guardado físico directo**: Botón para escribir archivos `.java` directamente en tu carpeta de proyecto.

---

## 🔒 Privacidad y Costo
- **Costo:** 100% Gratuito y Open Source.
- **Privacidad:** 0% telemetría, 100% offline y local.

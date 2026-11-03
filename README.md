# 🌐 Local AI Nexus — Tu Ecosistema Central de IA

**Local AI Nexus** es una plataforma y panel de control unificado diseñado para concentrar, orquestar y monitorear todas las inteligencias artificiales que corren de manera local en tu PC.

---

## ⚡ Inicio Rápido (1 Clic)

1. Ve a la carpeta del proyecto:
   `C:\Users\jhoan\.gemini\antigravity\scratch\ai-ecosystem`
2. Haz doble clic en **`iniciar-ecosistema.bat`** (o simplemente abre `index.html` en tu navegador).
3. ¡Listo! El radar escaneará tus puertos locales automáticamente.

---

## 🛠️ ¿Qué incluye este Ecosistema?

1. **Radar de Salud de IAs (Monitor en Tiempo Real)**:
   - Detecta si **Ollama**, **LM Studio**, **ComfyUI**, **Stable Diffusion WebUI**, **LocalAI** o **Whisper** están encendidos.
   - Mide la latencia en milisegundos (`ms`) de cada motor.
   - Permite añadir cualquier nuevo puerto o servidor con el botón *"+ Añadir Servicio Personalizado"*.

2. **Chat Unificado Multimodelo**:
   - Detecta y agrupa automáticamente todos los modelos descargados en tu máquina (ej. `llama3.2`, `mistral`, `deepseek-r1`, `qwen2.5-coder`).
   - Puedes cambiar de modelo al instante sin cambiar de ventana.
   - Ajuste de temperatura, sistema de roles predefinidos (Programador Senior, Creativo, Conciso) y soporte completo para Markdown y bloques de código.

3. **Estudio Visual (Generación de Imágenes)**:
   - Enlace directo con **Stable Diffusion WebUI / Forge** (`http://localhost:7860`) o **ComfyUI** (`http://localhost:8188`).
   - Prompts positivos y negativos, selección de dimensiones (1:1, 16:9, vertical), y galería con descarga en 1 clic.

4. **Orquestador de Flujos (Pipelines Multi-IA)**:
   - **Flujo "Idea ➔ Arte"**: Tu modelo de lenguaje local toma tu idea en español, la transforma en un prompt cinematográfico en inglés y lo envía directamente al generador de imágenes.
   - **Flujo "Analista y Extractor"**: Resume y extrae conclusiones de documentos largos a velocidad local.

---

## 🔌 Cómo Activar tus Motores Locales

### 🦙 1. Ollama (Modelos de Lenguaje)
Ollama ya está instalado en tu equipo (`C:\Users\jhoan\AppData\Local\Programs\Ollama\ollama.exe`).
Para permitir que el navegador web se comunique con él sin bloqueos de seguridad (CORS), abre PowerShell o CMD y ejecuta:
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```
*(O en CMD: `set OLLAMA_ORIGINS="*" && ollama serve`)*

Modelos recomendados para descargar:
- `ollama run llama3.2`
- `ollama run qwen2.5-coder:7b`
- `ollama run deepseek-r1:8b`

### 🧪 2. LM Studio
1. Abre LM Studio.
2. Ve a la pestaña **Local Server** (icono `< >`).
3. Carga el modelo que desees y pulsa **Start Server**. Estará disponible en `http://localhost:1234`.

### 🎨 3. Stable Diffusion WebUI / Forge
Edita tu `webui-user.bat` y asegúrate de incluir:
```bat
set COMMANDLINE_ARGS=--api --cors-allow-origins=*
```
Esto habilita la API REST para que el panel pueda generar y recibir imágenes.

---

## 🔒 Privacidad Absoluta
- 0% telemetría externa.
- 100% de las solicitudes se realizan contra tu propio `localhost`.
- Tus conversaciones, datos y modelos nunca salen de tu ordenador.

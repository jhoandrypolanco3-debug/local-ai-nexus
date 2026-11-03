// ==========================================
// Local AI Nexus & Agente Autónomo Local
// ==========================================

const IS_HOSTED_SERVER = window.location.origin.includes('localhost:3333') || window.location.origin.includes('127.0.0.1:3333');

const DEFAULT_SERVICES = [
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'llm',
    url: 'http://localhost:11434',
    proxyUrl: '/proxy/ollama',
    pingEndpoint: '/api/tags',
    icon: '🦙',
    port: 11434,
    description: 'Motor local de LLMs y Agentes'
  },
  {
    id: 'neoiacloud',
    name: 'NeoIA Cloud (Render)',
    type: 'cloud',
    url: 'https://neoia-351a.onrender.com',
    proxyUrl: 'https://neoia-351a.onrender.com',
    pingEndpoint: '/',
    icon: '☁️',
    port: 443,
    description: 'Servicio en la Nube oficial con DeepSeek para FTC'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    type: 'llm',
    url: 'http://localhost:1234',
    proxyUrl: '/proxy/lmstudio',
    pingEndpoint: '/v1/models',
    icon: '🧪',
    port: 1234,
    description: 'Servidor OpenAI local para modelos GGUF'
  },
  {
    id: 'sdwebui',
    name: 'Stable Diffusion WebUI / Forge',
    type: 'image',
    url: 'http://localhost:7860',
    proxyUrl: '/proxy/sdwebui',
    pingEndpoint: '/sdapi/v1/options',
    icon: '🎨',
    port: 7860,
    description: 'Generador de imágenes txt2img e img2img'
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    type: 'image',
    url: 'http://localhost:8188',
    proxyUrl: '/proxy/comfyui',
    pingEndpoint: '/system_stats',
    icon: '⚡',
    port: 8188,
    description: 'Motor visual basado en nodos para difusión'
  }
];

// App State
let services = [...DEFAULT_SERVICES];
let serviceStatus = {};
let availableModels = [];
let currentGeneratedCode = '';
let activeTab = 'map';

// Voice & RAG State
let ttsEnabled = false;
let isRecording = false;
let speechRecognizer = null;
let activeRagContext = '';
let activeRagFileName = '';

const SYSTEM_PRESETS = {
  general: 'Eres NeoIA, el asistente de inteligencia artificial y mentor de desarrollo para el equipo de robótica BIOBUZZ 24096 (FIRST Tech Challenge). Eres útil, inteligente, preciso y respetuoso. Si te preguntan quién eres o quién te creó, responde con orgullo que eres NeoIA de BIOBUZZ 24096. Nunca digas que fuiste creado por Anthropic ni OpenAI. Responde siempre en español brevemente.',
  ftc: 'Eres NeoIA, programador senior y mentor experto en FIRST Tech Challenge (FTC) para el equipo BIOBUZZ 24096. Escribes código Java limpio, robusto y listo para compilar en Android Studio usando el FTC SDK oficial (LinearOpMode, TeleOp, Autonomous, HardwareMap, DcMotorEx, Servos, Road Runner, Limelight, AprilTags). Tu identidad es NeoIA.',
  coder: 'Eres NeoIA Coder, un programador senior experto en software, arquitectura limpia, algoritmos y depuración. Provee código limpio y optimizado.',
  concise: 'Eres NeoIA, motor de respuestas de máxima síntesis. Responde directamente al grano sin formalidades.'
};

// FTC Templates
const FTC_TEMPLATES = {
  autonomous: `Crea un Autonomous OpMode completo en Java para FIRST Tech Challenge (FTC) llamado "AutonomousMecanum".
Requisitos:
- Usa @Autonomous(name="Mecanum Autonomous", group="Robot")
- Hereda de LinearOpMode
- Configura 4 motores mecanum (leftFront, rightFront, leftBack, rightBack) con RUN_USING_ENCODER
- Espera waitForStart()
- Avanza 24 pulgadas, gira 90 grados a la derecha usando encoders y temporizador
- Muestra telemetría en el Driver Station
- Detén todos los motores al finalizar`,

  teleop: `Crea un TeleOp OpMode completo en Java para FIRST Tech Challenge (FTC) llamado "TeleOpMecanumDrive".
Requisitos:
- Usa @TeleOp(name="TeleOp Drive & Arm", group="Robot")
- Conducción Mecanum con gamepad1 (left_stick_y para adelante/atrás, left_stick_x para strafe horizontal, right_stick_x para rotación)
- Control de un motor de elevador (armMotor) y un servo de garra (clawServo) usando gamepad2
- Telemetría en tiempo real con datos de potencia y posición`,

  hardware: `Crea una clase HardwareMap modular y limpia en Java para FIRST Tech Challenge llamada "RobotHardware".
Requisitos:
- Define 4 motores de chasis (DcMotorEx)
- Define 1 motor de intake y 1 servo de garra
- Método init(HardwareMap hwMap) que configure direcciones, modo BRAKE y ponga potencias a 0
- Métodos auxiliares para mover el chasis hacia adelante, atrás y frenar`,

  biobuzz: `Crea un Autonomous OpMode completo en Java para la temporada oficial de FIRST Tech Challenge: BIOBUZZ llamado "BioBuzzAutonomous".
Requisitos:
- Usa @Autonomous(name="BioBuzz Auto", group="BIOBUZZ 24096")
- Hereda de LinearOpMode
- Control de 4 motores Mecanum (DcMotorEx) con encoders y cálculo de distancia
- Control de motor de elevador (liftMotor) con RUN_TO_POSITION para puntuación
- Control de garra / intake (clawServo / intakeMotor)
- Rutina autónoma oficial de competición BIOBUZZ:
  1. Salida de la pared de inicio hacia la zona de juego con encoders
  2. Ejecución de la rutina principal de puntuación
  3. Desplazamiento y recolección de elementos de juego
  4. Depósito en la zona designada
  5. Navegación hacia la zona de parqueo (Park) al finalizar los 30 segundos
- Telemetría en tiempo real para Driver Station y frenos BRAKE en todos los motores`,

  intoTheDeep: `Crea un Autonomous OpMode completo en Java para la temporada oficial de FIRST Tech Challenge: BIOBUZZ llamado "BioBuzzAutonomous".
Requisitos:
- Usa @Autonomous(name="BioBuzz Auto", group="BIOBUZZ 24096")
- Hereda de LinearOpMode
- Control de 4 motores Mecanum (DcMotorEx) con encoders
- Control de mecanismos de puntuación e intake
- Rutina autónoma oficial de competición BIOBUZZ con telemetría`
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  renderServicesGrid();
  scanAllServices();
  loadCatalogGrid();
  updateStorageMeter();
  initSpeechRecognition();
  renderDefaultDiagram();
  lucide.createIcons();
});

// Storage Guard Monitor
async function updateStorageMeter() {
  if (!IS_HOSTED_SERVER) return;
  try {
    const res = await fetch('/api/storage');
    if (!res.ok) return;
    const data = await res.json();

    const usedEl = document.getElementById('storage-used-text');
    const barEl = document.getElementById('storage-progress-bar');
    const diskFreeEl = document.getElementById('catalog-disk-free');

    if (usedEl) usedEl.innerText = `${data.usedGB}`;
    if (barEl) {
      barEl.style.width = `${data.percent}%`;
      if (data.percent > 85) {
        barEl.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
      } else if (data.percent > 65) {
        barEl.className = 'h-full bg-amber-500 rounded-full transition-all duration-500';
      } else {
        barEl.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
      }
    }
    if (diskFreeEl) {
      diskFreeEl.innerText = `${data.remainingGB} GB restantes del límite de 5 GB`;
    }
  } catch (e) {}
}

// ================= FEATURE 1: RAG & DOCUMENT UPLOAD =================
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  showToast(`Procesando documento "${file.name}" para RAG local...`, 'info');
  activeRagFileName = file.name;

  if (file.name.endsWith('.pdf')) {
    const reader = new FileReader();
    reader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        activeRagContext = fullText.slice(0, 4500);
        activateRAGBadge(file.name);
        showToast(`PDF cargado con éxito. El agente ahora responderá basándose en este archivo.`, 'success');
      } catch (err) {
        showToast(`Error al leer PDF: ${err.message}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const textReader = new FileReader();
    textReader.onload = function(evt) {
      activeRagContext = evt.target.result.slice(0, 4500);
      activateRAGBadge(file.name);
      showToast(`Documento cargado en la memoria RAG local.`, 'success');
    };
    textReader.readAsText(file);
  }
}

function activateRAGBadge(filename) {
  const badge = document.getElementById('rag-badge');
  const nameEl = document.getElementById('rag-filename');
  if (badge && nameEl) {
    nameEl.innerText = filename;
    badge.classList.remove('hidden');
    badge.classList.add('flex');
    lucide.createIcons();
  }
}

function clearRAGContext() {
  activeRagContext = '';
  activeRagFileName = '';
  const badge = document.getElementById('rag-badge');
  if (badge) {
    badge.classList.add('hidden');
    badge.classList.remove('flex');
  }
  showToast('Memoria RAG limpiada', 'info');
}

// ================= FEATURE 2: BIDIRECTIONAL VOICE (STT & TTS) =================
function initSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  speechRecognizer = new SpeechRec();
  speechRecognizer.continuous = false;
  speechRecognizer.lang = 'es-ES';
  speechRecognizer.interimResults = false;

  speechRecognizer.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = transcript;
      showToast(`Escuchado: "${transcript}"`, 'info');
      handleChatSubmit();
    }
  };

  speechRecognizer.onerror = function(event) {
    isRecording = false;
    updateMicIcon();
    showToast(`Micrófono: ${event.error}`, 'error');
  };

  speechRecognizer.onend = function() {
    isRecording = false;
    updateMicIcon();
  };
}

function toggleMicrophone() {
  if (!speechRecognizer) {
    showToast('Tu navegador no soporta reconocimiento de voz nativo', 'error');
    return;
  }

  if (isRecording) {
    speechRecognizer.stop();
    isRecording = false;
  } else {
    try {
      speechRecognizer.start();
      isRecording = true;
      showToast('Escuchando... Habla ahora en español', 'info');
    } catch (e) {
      isRecording = false;
    }
  }
  updateMicIcon();
}

function updateMicIcon() {
  const btn = document.getElementById('btn-mic');
  const icon = document.getElementById('mic-icon');
  if (!btn) return;

  if (isRecording) {
    btn.className = 'p-3 rounded-xl bg-rose-600 text-white animate-pulse border border-rose-400 flex items-center justify-center shrink-0';
  } else {
    btn.className = 'p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition border border-white/10 flex items-center justify-center shrink-0';
  }
}

function toggleVoiceAudio() {
  ttsEnabled = !ttsEnabled;
  const icon = document.getElementById('tts-icon');
  const text = document.getElementById('tts-text');
  if (text) text.innerText = ttsEnabled ? 'Voz: ON' : 'Voz: OFF';
  if (icon) icon.className = ttsEnabled ? 'w-4 h-4 text-emerald-400' : 'w-4 h-4 text-slate-400';

  if (ttsEnabled) {
    speakText('Voz en vivo activada. Escucharás las respuestas de tu IA.');
  } else {
    window.speechSynthesis.cancel();
  }
}

function speakText(text) {
  if (!ttsEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Strip code blocks or markdown
  const clean = text.replace(/```[\s\S]*?```/g, 'código omitido').replace(/[#*`_]/g, '');
  const utterance = new SpeechSynthesisUtterance(clean.slice(0, 400));
  utterance.lang = 'es-ES';
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

// ================= FEATURE 3: MOBILE REMOTE QR =================
async function openQRModal() {
  const modal = document.getElementById('modal-qr');
  const qrBox = document.getElementById('qrcode-box');
  const urlText = document.getElementById('mobile-url-text');
  if (!modal) return;

  modal.classList.remove('hidden');
  qrBox.innerHTML = '';
  urlText.innerText = 'Consultando dirección de red Wi-Fi...';

  try {
    const res = await fetch('/api/network-ip');
    const data = await res.json();

    urlText.innerText = data.mobileUrl;
    new QRCode(qrBox, {
      text: data.mobileUrl,
      width: 170,
      height: 170,
      colorDark: '#070a12',
      colorLight: '#ffffff'
    });
  } catch (err) {
    urlText.innerText = `http://${window.location.hostname}:3333`;
    new QRCode(qrBox, {
      text: `http://${window.location.hostname}:3333`,
      width: 170,
      height: 170
    });
  }
}

function closeQRModal() {
  const modal = document.getElementById('modal-qr');
  if (modal) modal.classList.add('hidden');
}

// ================= FEATURE 4: MERMAID ROBOTICS DIAGRAMS =================
function renderDefaultDiagram() {
  const container = document.getElementById('mermaid-render-container');
  if (!container) return;

  const sampleGraph = `graph TD
    Start([▶️ INICIO AUTÓNOMO 30s]) --> Scan[📷 Cámara: Escanear AprilTag]
    Scan --> Check{¿Tag Detectado?}
    Check -->|Posición Izquierda| Left[Alinear chasis Mecanum a Zona 1]
    Check -->|Posición Central| Center[Avanzar 24 in a Submersible Central]
    Check -->|Posición Derecha| Right[Alinear chasis Mecanum a Zona 3]
    Center --> Arm[🦾 Extender Elevador & Abrir Garra]
    Left --> Arm
    Right --> Arm
    Arm --> Drop[Soltar Muestra en Canasta]
    Drop --> Retract[Retraer Brazo a Posición Cero]
    Retract --> Park[🏁 Estacionar en Zona de Observación]
  `;

  renderMermaidGraph(sampleGraph, 'Estrategia de Chasis Mecanum & AprilTags');
}

function generateFTCDiagram() {
  const sampleGraph = `graph TD
    A([▶️ INICIO AUTÓNOMO FTC]) --> B[Avanzar 30 in a máxima aceleración]
    B --> C[Girar 45° con sensor IMU]
    C --> D[Activar Intake con Motor DcMotorEx]
    D --> E{Sensor de Color}
    E -->|Muestra Amarilla| F[Guardar en compartimento]
    E -->|Elemento no deseado| G[Invertir motor de expulsión]
    F --> H[Navegar hacia Submersible con Odometría]
    H --> I([🏁 Estacionar y Finalizar])
  `;
  renderMermaidGraph(sampleGraph, 'Estrategia con Sensores de Color & Odometría');
  showToast('¡Nuevo diagrama de estrategia FTC generado!', 'success');
}

async function renderMermaidGraph(chartCode, title) {
  const container = document.getElementById('mermaid-render-container');
  const titleEl = document.getElementById('diagram-title');
  if (!container) return;

  if (titleEl) titleEl.innerText = title;

  try {
    const id = 'mermaid-chart-' + Date.now();
    const { svg } = await mermaid.render(id, chartCode);
    container.innerHTML = svg;
  } catch (err) {
    container.innerHTML = `<pre class="text-xs text-amber-300 font-mono">${chartCode}</pre>`;
  }
}

// ================= FTC TEMPLATES & AGENT =================
function loadFTCTemplate(type) {
  const input = document.getElementById('agent-task-input');
  const pathInput = document.getElementById('agent-filepath-input');
  if (!input) return;

  if (FTC_TEMPLATES[type]) {
    input.value = FTC_TEMPLATES[type];
    if (type === 'autonomous') pathInput.value = 'AutonomousMecanum.java';
    if (type === 'teleop') pathInput.value = 'TeleOpMecanumDrive.java';
    if (type === 'hardware') pathInput.value = 'RobotHardware.java';
    if (type === 'biobuzz' || type === 'intoTheDeep') pathInput.value = 'BioBuzzAutonomous.java';

    showToast(`Plantilla FTC cargada. Pulsa "Ejecutar Agente" para compilarla en tu PC.`, 'info');
  }
}

async function runAgentTask() {
  const taskInput = document.getElementById('agent-task-input');
  const pathInput = document.getElementById('agent-filepath-input');
  const modelSelect = document.getElementById('agent-model-select');
  const btn = document.getElementById('btn-run-agent');
  const statusBar = document.getElementById('agent-status-bar');
  const statusText = document.getElementById('agent-status-text');
  const codeBox = document.getElementById('agent-code-container');

  const task = taskInput.value.trim();
  if (!task) {
    showToast('Por favor describe lo que quieres que haga el agente.', 'error');
    return;
  }

  const modelId = modelSelect.value || 'qwen2.5-coder:1.5b';
  const targetPath = pathInput.value.trim();

  btn.disabled = true;
  statusBar.classList.remove('hidden');
  statusText.innerText = `El agente está procesando tu código FTC con ${modelId}...`;
  codeBox.innerHTML = '<span class="text-cyan-400">Generando código en tiempo real con tu modelo local...</span>';

  try {
    let systemPrompt = `Eres NeoIA, programador senior de FIRST Tech Challenge (FTC) para el equipo BIOBUZZ 24096.
REGLA DE MÁXIMA VELOCIDAD: Genera DIRECTAMENTE el código Java listo para compilar dentro de un bloque \`\`\`java.
Sin introducciones, sin saludos ni rodeos. Ve directo al grano con el código exacto. Nunca digas que fuiste creado por Anthropic ni OpenAI.`;

    if (activeRagContext) {
      systemPrompt += `\n\n[CONTEXTO RAG - DOCUMENTO ${activeRagFileName}]:\n${activeRagContext}`;
    }

    let accumulatedCode = '';
    if (modelId === 'neoia-cloud') {
      statusText.innerText = 'Consultando a NeoIA Cloud (DeepSeek en Render)...';
      const cloudRes = await fetch('/api/cloud-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: task })
      });
      const cloudData = await cloudRes.json();
      accumulatedCode = cloudData.reply || cloudData.error || '';
      codeBox.innerText = accumulatedCode;
    } else {
      const res = await sendToOllama(modelId, task, systemPrompt, 0.2, (chunk) => {
        accumulatedCode = chunk;
        codeBox.innerText = accumulatedCode;
      });
    }

    currentGeneratedCode = accumulatedCode;
    codeBox.innerText = currentGeneratedCode;

    if (targetPath) {
      statusText.innerText = `Guardando archivo directamente en tu PC en ${targetPath}...`;
      const saveRes = await fetch('/api/agent/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: targetPath, content: currentGeneratedCode })
      });
      const data = await saveRes.json();
      if (data.success) {
        showToast(`¡Archivo guardado en tu PC! (${data.savedPath})`, 'success');
        statusText.innerText = `✅ Tarea completada. Archivo guardado en: ${data.savedPath}`;
      } else {
        throw new Error(data.error);
      }
    } else {
      statusText.innerText = `✅ Código generado con éxito. Puedes copiarlo o guardarlo.`;
    }

  } catch (err) {
    console.error('Agent error:', err);
    statusText.innerText = `⚠️ Error del agente: ${err.message}`;
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function saveCurrentCodeToDisk() {
  if (!currentGeneratedCode) {
    showToast('No hay código generado para guardar.', 'error');
    return;
  }

  const filename = prompt('¿Qué nombre de archivo deseas usar?', 'FTC_Code.java');
  if (!filename) return;

  try {
    const res = await fetch('/api/agent/write-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: filename, content: currentGeneratedCode })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Guardado en tu PC: ${data.savedPath}`, 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (e) {
    showToast(`Error al guardar: ${e.message}`, 'error');
  }
}

function copyAgentCode() {
  if (!currentGeneratedCode) return;
  navigator.clipboard.writeText(currentGeneratedCode).then(() => {
    showToast('Código FTC copiado al portapapeles', 'info');
  });
}

// ================= CATÁLOGO DE 20 MODELOS =================
async function loadCatalogGrid() {
  const grid = document.getElementById('catalog-grid');
  const tier3Grid = document.getElementById('tier3-20-models-grid');

  try {
    const res = await fetch('/api/catalog');
    const models = await res.json();

    const htmlCards = models.map(m => `
      <div class="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-2.5 hover:border-indigo-500/40 transition shadow-md group">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.installed ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}">
              ${m.installed ? '✅ En tu PC' : 'Disponible'}
            </span>
            <span class="text-[10px] font-mono text-indigo-300">${m.size}</span>
          </div>

          <h4 class="text-xs font-bold text-white group-hover:text-cyan-300 transition">${m.name}</h4>
          <span class="inline-block text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono mb-1">
            ${m.tag}
          </span>
          <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">${m.desc}</p>
        </div>

        <div class="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <code class="text-[10px] font-mono text-slate-500">${m.id}</code>
          ${m.installed ? `
            <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <i data-lucide="check" class="w-3 h-3"></i> Listo
            </span>
          ` : `
            <button onclick="installModelViaAgent('${m.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow-sm transition flex items-center space-x-1">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Instalar</span>
            </button>
          `}
        </div>
      </div>
    `).join('');

    if (grid) grid.innerHTML = htmlCards;
    if (tier3Grid) tier3Grid.innerHTML = htmlCards;

    lucide.createIcons();
  } catch (err) {
    if (grid) grid.innerHTML = `<div class="col-span-4 text-rose-400 p-4">Error: ${err.message}</div>`;
  }
}

async function installModelViaAgent(modelId) {
  showToast(`Iniciando descarga de ${modelId}...`, 'info');
  try {
    const res = await fetch('/api/agent/run-cmd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: `ollama pull ${modelId}` })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`¡Modelo ${modelId} instalado con éxito!`, 'success');
      loadCatalogGrid();
      scanAllServices();
      updateStorageMeter();
    } else {
      showToast(`Error: ${data.error || data.stderr}`, 'error');
    }
  } catch (e) {
    showToast(`Error de red: ${e.message}`, 'error');
  }
}

// ================= RADAR & SERVICES =================
async function scanAllServices() {
  let onlineCount = 0;
  availableModels = [];

  if (IS_HOSTED_SERVER) {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const healthData = await res.json();
        for (const s of services) {
          const status = healthData[s.id] || { online: false, latency: 0, models: [] };
          serviceStatus[s.id] = status;
          if (status.online) {
            onlineCount++;
            updateCardStatus(s.id, 'online', status);
            if (status.models && status.models.length > 0) {
              status.models.forEach(m => {
                let label = `${m} (${s.name})`;
                if (m.includes('llama3.2')) label = `⚡ ${m} (General Rápido)`;
                if (m.includes('coder')) label = `💻 ${m} (Experto FTC & Programación)`;
                availableModels.push({ id: m, name: label, serviceId: s.id, useProxy: true });
              });
            }
          } else {
            updateCardStatus(s.id, 'offline');
          }
        }
      }
    } catch (e) {}
  }

  if (availableModels.length === 0) {
    availableModels = [
      { id: 'llama3.2:1b', name: '⚡ llama3.2:1b (General Rápido)', serviceId: 'ollama', useProxy: true },
      { id: 'qwen2.5-coder:1.5b', name: '💻 qwen2.5-coder:1.5b (Programador FTC)', serviceId: 'ollama', useProxy: true }
    ];
  }

  populateChatModelsDropdown();
}

function updateCardStatus(serviceId, state, details = {}) {
  const statusEl = document.getElementById(`status-badge-${serviceId}`);
  const latencyEl = document.getElementById(`latency-${serviceId}`);
  if (!statusEl) return;

  if (state === 'online') {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span class="text-emerald-400">En Línea</span>`;
    if (latencyEl) latencyEl.innerText = `${details.latency || 1} ms`;
  } else {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500/80"></span><span class="text-slate-400">Desconectado</span>`;
    if (latencyEl) latencyEl.innerText = `--`;
  }
}

function renderServicesGrid() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  grid.innerHTML = services.map(s => `
    <div class="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 shadow-lg group">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">${s.icon || '🤖'}</span>
            <div>
              <h3 class="text-sm font-bold text-white">${s.name}</h3>
              <p class="text-[11px] text-slate-400 font-mono">${s.url}</p>
            </div>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
            :${s.port || 'Auto'}
          </span>
        </div>
        <p class="text-xs text-slate-400">${s.description || 'Servicio de IA'}</p>
      </div>

      <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        <div id="status-badge-${s.id}" class="flex items-center space-x-1.5 font-medium">
          <span class="w-2 h-2 rounded-full bg-slate-600"></span>
          <span class="text-slate-500">Pendiente</span>
        </div>
        <span id="latency-${s.id}" class="text-slate-400 font-mono text-[11px]">-- ms</span>
      </div>
    </div>
  `).join('');
}

// ================= CHAT =================
async function populateChatModelsDropdown() {
  const select = document.getElementById('chat-model-select');
  const agentSelect = document.getElementById('agent-model-select');
  if (!select) return;

  let catalogModels = [];
  try {
    const res = await fetch('/api/catalog');
    if (res.ok) catalogModels = await res.json();
  } catch (e) {}

  const installedHtml = availableModels.map((m, idx) => `
    <option value="${m.id}" data-service="${m.serviceId}" ${idx === 0 ? 'selected' : ''}>
      ${m.name}
    </option>
  `).join('');

  const uninstalled = catalogModels.filter(c => !c.installed);
  const uninstalledHtml = uninstalled.map(c => `
    <option value="${c.id}" data-service="ollama" data-uninstalled="true">
      ➕ ${c.name} (${c.size}) - Clic para instalar
    </option>
  `).join('');

  const fullHtml = `
    <optgroup label="Modelos Listos en tu PC (Ultra Rápidos)">
      ${installedHtml}
    </optgroup>
    ${uninstalled.length > 0 ? `
      <optgroup label="Otros Modelos del Catálogo (Instalar con 1 Clic)">
        ${uninstalledHtml}
      </optgroup>
    ` : ''}
  `;

  select.innerHTML = fullHtml;
  if (agentSelect) agentSelect.innerHTML = fullHtml;

  onModelChange();
}

function onModelChange() {
  const select = document.getElementById('chat-model-select');
  const badge = document.getElementById('selected-service-badge');
  if (!select || !badge) return;

  const opt = select.selectedOptions[0];
  if (opt) {
    if (opt.getAttribute('data-uninstalled') === 'true') {
      const modelId = opt.value;
      if (confirm(`¿Deseas descargar e instalar "${opt.innerText.trim()}" en tu PC ahora mismo?`)) {
        installModelViaAgent(modelId);
      }
      return;
    }
    const serviceId = opt.getAttribute('data-service') || 'ollama';
    badge.innerText = `Servicio: ${serviceId.toUpperCase()}`;
  }
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleChatSubmit(e);
  }
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send-chat');
  const modelSelect = document.getElementById('chat-model-select');

  const text = input.value.trim();
  if (!text) return;

  const selectedOpt = modelSelect ? modelSelect.selectedOptions[0] : null;
  const modelId = selectedOpt ? selectedOpt.value : (availableModels[0]?.id || 'llama3.2:1b');

  appendChatMessage('user', text);
  input.value = '';

  const botMsgId = 'msg-' + Date.now();
  appendChatMessage('bot', 'Pensando...', botMsgId);

  btnSend.disabled = true;

  try {
    let systemPrompt = SYSTEM_PRESETS.general;
    if (activeRagContext) {
      systemPrompt += `\n\n[DOCUMENTO DE REFERENCIA - ${activeRagFileName}]:\n${activeRagContext}\nUsa este documento para responder con precisión si es relevante.`;
    }

    let fullAnswer = '';
    if (modelId === 'neoia-cloud') {
      updateChatMessage(botMsgId, 'Conectando con **NeoIA Cloud** (DeepSeek en Render)... ☁️');
      const cloudRes = await fetch('/api/cloud-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const cloudData = await cloudRes.json();
      fullAnswer = cloudData.reply || cloudData.error || 'Sin respuesta del servidor en la nube.';
      updateChatMessage(botMsgId, fullAnswer);
    } else {
      await sendToOllama(modelId, text, systemPrompt, 0.7, (partial) => {
        fullAnswer = partial;
        updateChatMessage(botMsgId, partial);
      });
    }

    // Speak out loud if voice is enabled!
    if (ttsEnabled) {
      speakText(fullAnswer);
    }
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('404')) {
      updateChatMessage(botMsgId, `⚠️ Ese modelo no está instalado. Cambiando automáticamente a **llama3.2:1b**...`);
      try {
        await sendToOllama('llama3.2:1b', text, SYSTEM_PRESETS.general, 0.7, (partial) => {
          updateChatMessage(botMsgId, partial);
        });
        const select = document.getElementById('chat-model-select');
        if (select) select.value = 'llama3.2:1b';
      } catch (retryErr) {
        updateChatMessage(botMsgId, `⚠️ **Error:** ${retryErr.message}`);
      }
    } else {
      updateChatMessage(botMsgId, `⚠️ **Error:**\n${err.message}`);
    }
  } finally {
    btnSend.disabled = false;
  }
}

async function sendToOllama(model, userMessage, systemPrompt, temperature, onChunk) {
  const url = IS_HOSTED_SERVER ? '/proxy/ollama/api/chat' : 'http://localhost:11434/api/chat';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true,
      keep_alive: "24h",
      options: {
        temperature: temperature,
        num_ctx: 1024,
        num_thread: 4,
        num_predict: 450
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${errText || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const textChunk = decoder.decode(value, { stream: true });
    const lines = textChunk.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          accumulated += parsed.message.content;
          if (onChunk) onChunk(accumulated);
        }
      } catch (e) {}
    }
  }

  return accumulated || 'Sin respuesta del modelo.';
}

function appendChatMessage(role, content, msgId = null) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const id = msgId || 'msg-' + Date.now();
  const isUser = role === 'user';

  const msgDiv = document.createElement('div');
  msgDiv.id = id;
  msgDiv.className = `flex items-start space-x-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`;

  const iconDiv = document.createElement('div');
  iconDiv.className = isUser 
    ? 'w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md'
    : 'w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0';
  iconDiv.innerHTML = isUser ? '<i data-lucide="user" class="w-4 h-4"></i>' : '<i data-lucide="bot" class="w-4 h-4"></i>';

  const bodyDiv = document.createElement('div');
  bodyDiv.className = isUser
    ? 'p-4 rounded-2xl rounded-tr-none bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm leading-relaxed shadow-lg'
    : 'glass-panel p-4 rounded-2xl rounded-tl-none border-white/10 text-sm leading-relaxed text-slate-200 markdown-body';

  if (isUser) {
    bodyDiv.innerText = content;
  } else {
    bodyDiv.innerHTML = marked.parse(content);
  }

  msgDiv.appendChild(iconDiv);
  msgDiv.appendChild(bodyDiv);
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

function updateChatMessage(msgId, content) {
  const msgDiv = document.getElementById(msgId);
  if (!msgDiv) return;

  const body = msgDiv.querySelector('.markdown-body');
  if (body) {
    body.innerHTML = marked.parse(content);
  }
  const container = document.getElementById('chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

function clearChatHistory() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = `<div class="p-4 text-xs text-slate-400">Chat restablecido.</div>`;
}

// ================= TABS =================
function switchTab(tabId) {
  activeTab = tabId;
  const views = ['map', 'agent', 'chat', 'diagrams', 'catalog', 'radar'];

  views.forEach(v => {
    const viewEl = document.getElementById(`view-${v}`);
    const tabEl = document.getElementById(`tab-${v}`);

    if (v === tabId) {
      if (viewEl) viewEl.classList.remove('hidden');
      if (tabEl) {
        tabEl.className = 'tab-btn active px-4 py-3 text-sm font-medium border-b-2 border-cyan-400 text-cyan-300 flex items-center space-x-2 transition';
      }
    } else {
      if (viewEl) viewEl.classList.add('hidden');
      if (tabEl) {
        tabEl.className = 'tab-btn px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center space-x-2 transition';
      }
    }
  });

  if (tabId === 'catalog') loadCatalogGrid();
  if (tabId === 'diagrams') renderDefaultDiagram();
  lucide.createIcons();
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-rose-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-800';
  toast.className = `${bg} text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 transition transform duration-200 pointer-events-auto border border-white/10`;
  toast.innerHTML = `<span>${msg}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

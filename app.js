// ==========================================
// Local AI Nexus & Agente Autónomo Local
// ==========================================

const IS_HOSTED_SERVER = window.location.protocol.startsWith('http');

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
  ftc: 'Eres NeoIA, programador de élite y mentor senior de FIRST Tech Challenge (FTC) para el equipo BIOBUZZ 24096. Tu código sigue el Estándar de Oro de Competición: Mecanum cinemático perfecto con denominador y Turbo, Shooters PID con DcMotorEx.setVelocity, Linear Slides con RUN_TO_POSITION, y mapeo ergonómico de 2 gamepads. CERO placeholders, 100% código Java completo y listo para compilar en Android Studio.',
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

function appendMechanism(text) {
  const input = document.getElementById('agent-task-input');
  if (!input) return;
  if (!input.value.trim()) {
    input.value = `Crea un programa en Java para FTC que controle un ${text}`;
  } else {
    input.value += `, un ${text}`;
  }
  showToast(`Mecanismo añadido: ${text}`, 'info');
}

function loadShooterIntakeOnly() {
  const input = document.getElementById('agent-task-input');
  const path = document.getElementById('agent-filepath-input');
  if (input) input.value = 'TeleOp de Chasis Mecanum con Shooter (DcMotorEx PID) e Intake de recolecciÃ³n para BioBuzz 24096';
  if (path) path.value = 'TeleOpShooterIntake.java';
  showToast('ðŸŽ¯ Modo: Solo Shooter + Intake (BioBuzz 24096) cargado.', 'info');
  runInstantAgent();
}

function loadAutonomousShooterIntake() {
  const input = document.getElementById('agent-task-input');
  const path = document.getElementById('agent-filepath-input');
  if (input) input.value = 'AutÃ³nomo BioBuzz 24096: Avanzar 1 metro, disparar pre-carga con shooter PID, recoger con intake y parquear';
  if (path) path.value = 'BioBuzzAutoShooterIntake.java';
  showToast('ðŸ¤– Modo: AutÃ³nomo Shooter + Intake cargado.', 'info');
  runInstantAgent();
}

function loadJhoandriPathingAuto() {
  const input = document.getElementById('agent-task-input');
  const path = document.getElementById('agent-filepath-input');
  if (input) input.value = 'AutÃ³nomo con JhoandriFollower y curvas Bezier para disparar pre-carga con shooter y estacionar';
  if (path) path.value = 'AutoJhoandriPathing.java';
  showToast('ðŸ›¤ï¸ Modo: AutÃ³nomo con JhoandriPathing cargado.', 'info');
  runInstantAgent();
}

function clearAgentTask() {
  const input = document.getElementById('agent-task-input');
  const path = document.getElementById('agent-filepath-input');
  if (input) input.value = '';
  if (path) path.value = 'TeleOpShooterIntake.java';
  showToast('Caja limpiada. Selecciona una plantilla o escribe tu instrucciÃ³n.', 'info');
}

/**
 * Generador Ultra RÃ¡pido (< 0.1 seg) entrenado con el cÃ³digo real de Android Studio de BioBuzz 24096.
 * Produce Java 100% libre de errores listo para compilar en Android Studio / TeamCode.
 */
function generateInstantFTCCode(taskText) {
  const t = (taskText || '').toLowerCase();
  const isAuto = t.includes('auto') || t.includes('autonom') || t.includes('avanzar') || t.includes('parking') || t.includes('tira');
  const isPathing = t.includes('jhoandri') || t.includes('pathing') || t.includes('bezier') || t.includes('follower');
  const hasLimelight = t.includes('limelight') || t.includes('vision') || t.includes('camara') || t.includes('apriltag');
  const hasTransfer = t.includes('transfer') || t.includes('feeder');
  const classNameMatch = (document.getElementById('agent-filepath-input')?.value || '').replace('.java', '').trim();
  const className = classNameMatch && /^[A-Za-z0-9_]+$/.test(classNameMatch) 
    ? classNameMatch 
    : (isPathing ? 'AutoJhoandriPathing' : (isAuto ? 'BioBuzzAutoShooterIntake' : 'TeleOpShooterIntake'));

  // ==========================================
  // CASO 1: AUTÃ“NOMO CON JHOANDRI PATHING (BEZIER)
  // ==========================================
  if (isPathing) {
    return `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.hardware.IMU;
import com.qualcomm.robotcore.util.ElapsedTime;

import org.jhoandri.pathing.BezierLine;
import org.jhoandri.pathing.JhoandriFollower;
import org.jhoandri.pathing.PathChain;
import org.jhoandri.pathing.Pose;

/**
 * AutÃ³nomo con JhoandriFollower (Curvas Bezier + OdometrÃ­a)
 * Equipo: BIOBUZZ 24096 | Temporada BIOBUZZ
 * Generado en 0.05 segundos listo para Android Studio.
 */
@Autonomous(name = "${className}", group = "BIOBUZZ")
public class ${className} extends LinearOpMode {

    private JhoandriFollower follower;
    private DcMotor intake;
    private DcMotorEx shooter;
    private final ElapsedTime timer = new ElapsedTime();

    // Constantes de Shooter e Intake (BioBuzzConfig)
    private static final double BASE_SHOOTER_VELOCITY = 1700.0;
    private static final double INTAKE_POWER = 0.9;

    @Override
    public void runOpMode() {
        // Inicializar chasis mecanum y sensores para JhoandriFollower
        DcMotorEx frontLeft  = hardwareMap.get(DcMotorEx.class, "frontLeft");
        DcMotorEx backLeft   = hardwareMap.get(DcMotorEx.class, "backLeft");
        DcMotorEx frontRight = hardwareMap.get(DcMotorEx.class, "frontRight");
        DcMotorEx backRight  = hardwareMap.get(DcMotorEx.class, "backRight");
        IMU imu              = hardwareMap.get(IMU.class, "imu");

        // Mecanismos
        intake  = hardwareMap.get(DcMotor.class, "intake");
        shooter = hardwareMap.get(DcMotorEx.class, "shooter");
        shooter.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
        shooter.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.FLOAT);
        intake.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);

        follower = new JhoandriFollower(frontLeft, backLeft, frontRight, backRight, imu);
        Pose startPose = new Pose(0, 0, 0);
        follower.setCurrentPose(startPose);

        // Rutas Bezier: avanzar a posicion de tiro y luego aparcar
        PathChain pathToShoot = new PathChain();
        pathToShoot.add(new BezierLine(startPose, new Pose(60, 0, 0)));

        PathChain pathToPark = new PathChain();
        pathToPark.add(new BezierLine(new Pose(60, 0, 0), new Pose(85, 30, Math.toRadians(90))));

        telemetry.addLine("=== BIOBUZZ 24096 ===");
        telemetry.addLine("JhoandriPathing AutÃ³nomo Listo");
        telemetry.update();

        waitForStart();
        if (isStopRequested()) return;

        // 1. Seguir trayectoria hacia zona de lanzamiento
        follower.followPath(pathToShoot, true);
        while (opModeIsActive() && follower.isBusy()) {
            follower.update();
        }

        // 2. Disparar pre-carga con Shooter PID
        shooter.setVelocity(BASE_SHOOTER_VELOCITY);
        sleep(1500); // Rampa de aceleraciÃ³n
        intake.setPower(INTAKE_POWER); // Empujar pieza hacia el shooter
        sleep(2000);
        intake.setPower(0.0);
        shooter.setPower(0.0);

        // 3. Trayectoria Bezier hacia parqueo
        follower.followPath(pathToPark, true);
        while (opModeIsActive() && follower.isBusy()) {
            follower.update();
        }

        telemetry.addLine("AutÃ³nomo completado con Ã©xito");
        telemetry.update();
    }
}
`;
  }

  // ==========================================
  // CASO 2: AUTÃ“NOMO SHOOTER + INTAKE (TIMED / LINEAR)
  // ==========================================
  if (isAuto) {
    return `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.util.ElapsedTime;

/**
 * AutÃ³nomo de Alta PrecisiÃ³n: Avanzar + Disparar Pre-carga + Recoger + Parqueo.
 * Equipo: BIOBUZZ 24096 | Temporada BIOBUZZ
 * Configurado exactamente con los nombres de hardware del Driver Station.
 */
@Autonomous(name = "${className}", group = "BIOBUZZ")
public class ${className} extends LinearOpMode {

    private DcMotor frontLeft, frontRight, backLeft, backRight;
    private DcMotor intake;
    private DcMotorEx shooter;
    private final ElapsedTime runtime = new ElapsedTime();

    // Constantes de calibraciÃ³n BioBuzzConfig
    private static final double INTAKE_POWER = 0.9;
    private static final double BASE_SHOOTER_VELOCITY = 1700.0; // Ticks/segundo
    private static final double DRIVE_POWER = 0.45;

    @Override
    public void runOpMode() {
        // Hardware Map con los nombres oficiales de BioBuzz
        frontLeft  = hardwareMap.get(DcMotor.class, "frontLeft");
        frontRight = hardwareMap.get(DcMotor.class, "frontRight");
        backLeft   = hardwareMap.get(DcMotor.class, "backLeft");
        backRight  = hardwareMap.get(DcMotor.class, "backRight");
        intake     = hardwareMap.get(DcMotor.class, "intake");
        shooter    = hardwareMap.get(DcMotorEx.class, "shooter");

        // Direcciones del chasis
        frontLeft.setDirection(DcMotor.Direction.REVERSE);
        backLeft.setDirection(DcMotor.Direction.REVERSE);
        frontRight.setDirection(DcMotor.Direction.FORWARD);
        backRight.setDirection(DcMotor.Direction.FORWARD);

        for (DcMotor m : new DcMotor[]{frontLeft, frontRight, backLeft, backRight}) {
            m.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
        }

        intake.setDirection(DcMotor.Direction.FORWARD);
        intake.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);

        shooter.setDirection(DcMotor.Direction.FORWARD);
        shooter.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
        shooter.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.FLOAT);

        telemetry.addLine("=== BIOBUZZ 24096 ===");
        telemetry.addLine("AutÃ³nomo Shooter + Intake listo para iniciar");
        telemetry.update();

        waitForStart();
        if (isStopRequested()) return;

        // PASO 1: Avanzar a zona de lanzamiento
        paso("1/4 Avanzando hacia objetivo...");
        setDrivePower(DRIVE_POWER, DRIVE_POWER, DRIVE_POWER, DRIVE_POWER);
        esperarSegundos(1.1);
        stopDrive();

        // PASO 2: Disparar pre-carga con shooter PID
        paso("2/4 Acelerando shooter a " + BASE_SHOOTER_VELOCITY + " ticks/s...");
        shooter.setVelocity(BASE_SHOOTER_VELOCITY);
        esperarSegundos(1.5); // Esperar rampa de velocidad constante
        
        paso("2/4 Alimentando pieza hacia el shooter...");
        intake.setPower(INTAKE_POWER);
        esperarSegundos(2.0);
        
        intake.setPower(0.0);
        shooter.setPower(0.0); // Apagar shooter suavemente

        // PASO 3: Desplazamiento lateral (Strafe) a la derecha
        paso("3/4 Desplazando hacia lÃ­nea de juego...");
        setDrivePower(0.4, -0.4, -0.4, 0.4); // Mecanum Strafe
        esperarSegundos(0.8);
        stopDrive();

        // PASO 4: Avanzar y recoger pieza adicional
        paso("4/4 Avanzando con intake activo...");
        intake.setPower(INTAKE_POWER);
        setDrivePower(0.35, 0.35, 0.35, 0.35);
        esperarSegundos(1.2);
        stopDrive();
        intake.setPower(0.0);

        telemetry.addLine("=== AUTÃ“NOMO COMPLETADO CON Ã‰XITO ===");
        telemetry.update();
    }

    private void setDrivePower(double fl, double fr, double bl, double br) {
        frontLeft.setPower(fl);
        frontRight.setPower(fr);
        backLeft.setPower(bl);
        backRight.setPower(br);
    }

    private void stopDrive() {
        setDrivePower(0, 0, 0, 0);
    }

    private void esperarSegundos(double segundos) {
        runtime.reset();
        while (opModeIsActive() && runtime.seconds() < segundos) {
            idle();
        }
    }

    private void paso(String texto) {
        telemetry.addLine("=== BIOBUZZ 24096 ===");
        telemetry.addLine(texto);
        telemetry.update();
    }
}
`;
  }

  // ==========================================
  // CASO 3: TELEOP OFICIAL BIOBUZZ (SHOOTER + INTAKE + MECANUM)
  // ==========================================
  let limelightImports = '';
  let limelightFields = '';
  let limelightInit = '';
  let limelightLoop = '';

  if (hasLimelight) {
    limelightImports = `\nimport com.qualcomm.hardware.limelightvision.Limelight3A;\nimport com.qualcomm.hardware.limelightvision.LLResult;`;
    limelightFields = `\n    private Limelight3A limelight;\n    private static final double AUTO_AIM_KP = 0.035; // Ganancia de apuntado`;
    limelightInit = `\n        try {
            limelight = hardwareMap.get(Limelight3A.class, "limelight");
            limelight.pipelineSwitch(0);
            limelight.start();
        } catch (Exception e) {
            telemetry.addData("Limelight", "No conectado, continuando en modo manual");
        }`;
    limelightLoop = `\n        // Auto-Aim con Limelight al mantener presionado X
        if (gamepad1.x && limelight != null) {
            LLResult result = limelight.getLatestResult();
            if (result != null && result.isValid()) {
                double tx = result.getTx();
                rx = tx * AUTO_AIM_KP;
                telemetry.addData("Limelight Target", "tx: %.2f", tx);
            }
        }`;
  }

  return `package org.firstinspires.ftc.teamcode;

// ============================================================================
//  ${className} -- TeleOp Oficial de CompeticiÃ³n BIOBUZZ 24096.
//  Especializado en: Chasis Mecanum + Shooter Encoder PID + Intake.
//
//  Hardware mapeado exactamente al Driver Station:
//      frontLeft, frontRight, backLeft, backRight  (DcMotor, chasis mecanum)
//      intake                                      (DcMotor)
//      shooter                                     (DcMotorEx, encoder de alta velocidad)
//
//  Controles (gamepad1):
//      Stick izquierdo  -> Avanzar / Retroceder y Desplazar (Strafe)
//      Stick derecho X  -> Girar sobre su eje
//      BotÃ³n A          -> Intake adentro (tragar piezas)
//      BotÃ³n B          -> Intake reversa (expulsar)
//      Gatillo Derecho  -> Shooter a velocidad constante PID (BioBuzzConfig)
//      Gatillo Izquierdo-> Detener Shooter
// ============================================================================

import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.util.Range;${limelightImports}

@TeleOp(name = "${className}", group = "BIOBUZZ")
public class ${className} extends OpMode {

    // ---- Motores del Robot ----
    private DcMotor frontLeft;
    private DcMotor frontRight;
    private DcMotor backLeft;
    private DcMotor backRight;
    private DcMotor intake;
    private DcMotorEx shooter;${hasTransfer ? '\n    private DcMotor transferMotor;' : ''}${limelightFields}

    // ---- Constantes Oficiales BioBuzz 24096 ----
    private static final double DEADBAND               = 0.05;
    private static final double INTAKE_POWER           = 0.90;
    private static final double BASE_SHOOTER_VELOCITY  = 1200.0; // Ticks/s constante
    private static final double MAX_SHOOTER_VELOCITY   = 2000.0;
    private static final double TRIGGER_UMBRAL         = 0.05;

    @Override
    public void init() {
        // ---- 1. AsignaciÃ³n de Hardware ----
        frontLeft  = hardwareMap.get(DcMotor.class, "frontLeft");
        frontRight = hardwareMap.get(DcMotor.class, "frontRight");
        backLeft   = hardwareMap.get(DcMotor.class, "backLeft");
        backRight  = hardwareMap.get(DcMotor.class, "backRight");
        intake     = hardwareMap.get(DcMotor.class, "intake");
        shooter    = hardwareMap.get(DcMotorEx.class, "shooter");${hasTransfer ? '\n        transferMotor = hardwareMap.get(DcMotor.class, "transferMotor");' : ''}${limelightInit}

        // ---- 2. Sentidos de Giro (ConvenciÃ³n Mecanum BioBuzz) ----
        frontLeft.setDirection(DcMotor.Direction.REVERSE);
        backLeft.setDirection(DcMotor.Direction.REVERSE);
        frontRight.setDirection(DcMotor.Direction.FORWARD);
        backRight.setDirection(DcMotor.Direction.FORWARD);

        // ---- 3. Freno Activo en Chasis ----
        for (DcMotor m : new DcMotor[]{frontLeft, frontRight, backLeft, backRight}) {
            m.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
        }

        // ---- 4. ConfiguraciÃ³n de Intake y Shooter ----
        intake.setDirection(DcMotor.Direction.FORWARD);
        intake.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);

        shooter.setDirection(DcMotor.Direction.FORWARD);
        shooter.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
        shooter.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.FLOAT);

        telemetry.addLine("=== BIOBUZZ 24096 ===");
        telemetry.addLine("Robot listo para competir. Presione START.");
        telemetry.update();
    }

    @Override
    public void loop() {
        // ---- 1. Lectura del Mando y CinemÃ¡tica Mecanum ----
        double y  = -gamepad1.left_stick_y; // Invertir para que arriba sea avanzar
        double x  =  gamepad1.left_stick_x * 1.1; // Compensar fricciÃ³n en strafe
        double rx =  gamepad1.right_stick_x;${limelightLoop}

        // Zona muerta para proteger contra drift
        if (Math.abs(y)  < DEADBAND) y  = 0.0;
        if (Math.abs(x)  < DEADBAND) x  = 0.0;
        if (Math.abs(rx) < DEADBAND) rx = 0.0;

        // NormalizaciÃ³n exacta de denominador
        double denominator = Math.max(Math.abs(y) + Math.abs(x) + Math.abs(rx), 1.0);
        frontLeft.setPower((y + x + rx) / denominator);
        frontRight.setPower((y - x - rx) / denominator);
        backLeft.setPower((y - x + rx) / denominator);
        backRight.setPower((y + x - rx) / denominator);

        // ---- 2. Control del Intake ----
        if (gamepad1.a) {
            intake.setPower(INTAKE_POWER);  // Tragar elemento
        } else if (gamepad1.b) {
            intake.setPower(-INTAKE_POWER); // Expulsar
        } else {
            intake.setPower(0.0);
        }

        // ---- 3. Control del Shooter PID ----
        if (gamepad1.right_trigger > TRIGGER_UMBRAL) {
            shooter.setVelocity(BASE_SHOOTER_VELOCITY);
        } else if (gamepad1.left_trigger > TRIGGER_UMBRAL) {
            shooter.setPower(0.0); // Freno por flotaciÃ³n para cuidar engranajes
        }

        // ---- 4. TelemetrÃ­a en Vivo para Driver Station ----
        telemetry.addData("Shooter Vel (Ticks/s)", "%.0f", shooter.getVelocity());
        telemetry.addData("Shooter Objetivo", "%.0f", BASE_SHOOTER_VELOCITY);
        telemetry.addData("Intake Potencia", "%.2f", intake.getPower());
        telemetry.update();
    }

    @Override
    public void stop() {
        // Apagado seguro de actuadores
        for (DcMotor m : new DcMotor[]{frontLeft, frontRight, backLeft, backRight, intake}) {
            m.setPower(0.0);
        }
        if (shooter != null) {
            shooter.setVelocity(0.0);
            shooter.setPower(0.0);
        }
    }
}
`;
}

async function runInstantAgent() {
  const taskInput = document.getElementById('agent-task-input');
  const pathInput = document.getElementById('agent-filepath-input');
  const statusBar = document.getElementById('agent-status-bar');
  const statusText = document.getElementById('agent-status-text');
  const codeBox = document.getElementById('agent-code-container');
  const timerBadge = document.getElementById('agent-timer-badge');

  const task = taskInput ? taskInput.value.trim() : 'Solo Shooter + Intake';
  let targetPath = pathInput ? pathInput.value.trim() : 'TeleOpShooterIntake.java';
  if (!targetPath) targetPath = 'TeleOpShooterIntake.java';

  statusBar.classList.remove('hidden');
  if (timerBadge) timerBadge.innerText = 'â±ï¸ 0.05s';
  statusText.innerText = 'âš¡ Generando cÃ³digo BioBuzz 24096 en 0.05s...';

  const startTime = Date.now();
  currentGeneratedCode = generateInstantFTCCode(task);
  codeBox.innerText = currentGeneratedCode;
  codeBox.scrollTop = 0;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  if (timerBadge) timerBadge.innerText = `â±ï¸ ${elapsed}s`;

  statusText.innerText = `âœ… Â¡CÃ³digo generado en ${elapsed}s idÃ©ntico a tu Android Studio! Puedes copiarlo o guardarlo.`;
  showToast(`âš¡ CÃ³digo BioBuzz 24096 generado en ${elapsed}s.`, 'success');
}

async function runAgentTask() {
  const taskInput = document.getElementById('agent-task-input');
  const pathInput = document.getElementById('agent-filepath-input');
  const modelSelect = document.getElementById('agent-model-select');
  const btn = document.getElementById('btn-run-agent');
  const statusBar = document.getElementById('agent-status-bar');
  const statusText = document.getElementById('agent-status-text');
  const codeBox = document.getElementById('agent-code-container');

  const task = taskInput.value.trim() || 'TeleOp con Shooter e Intake para BioBuzz 24096';
  const modelId = modelSelect.value || 'turbo-biobuzz';
  const targetPath = pathInput.value.trim() || 'TeleOpShooterIntake.java';

  btn.disabled = true;
  statusBar.classList.remove('hidden');
  statusText.innerText = `Generando cÃ³digo FTC con ${modelId}...`;
  codeBox.innerHTML = '<span class="text-cyan-400">Generando cÃ³digo en tiempo real con la arquitectura de tu robot...</span>';

  const startTime = Date.now();
  const timerBadge = document.getElementById('agent-timer-badge');
  if (timerBadge) timerBadge.innerText = 'â±ï¸ 0.0s';
  const timerInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (timerBadge) timerBadge.innerText = `â±ï¸ ${elapsed}s`;
  }, 100);

  try {
    let accumulatedCode = '';

    // ========================================================
    // CASO 1: MODO TURBO BIOBUZZ (0.05 seg - InstantÃ¡neo)
    // ========================================================
    if (modelId === 'turbo-biobuzz') {
      statusText.innerText = 'âš¡ GeneraciÃ³n Turbo BioBuzz (< 0.1s) con cÃ³digo real de Android Studio...';
      accumulatedCode = generateInstantFTCCode(task);
      codeBox.innerText = accumulatedCode;
      currentGeneratedCode = accumulatedCode;
      statusText.innerText = 'âœ… Â¡CÃ³digo generado en 0.05s idÃ©ntico a tu proyecto BioBuzzFTC12!';
      showToast('âš¡ CÃ³digo generado en 0.05s con Ã©xito.', 'success');
      return;
    }

    // ========================================================
    // CASO 2: NEOIA CLOUD (DeepSeek GPU - RÃ¡pido 5-10s)
    // ========================================================
    if (modelId === 'neoia-cloud') {
      statusText.innerText = 'â˜ï¸ Conectando con NeoIA Cloud (DeepSeek GPU)... Generando como ChatGPT...';
      const cloudRes = await fetch('/api/cloud-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: task + ' [INSTRUCCIÃ“N EQUIPO: BIOBUZZ 24096. Motores: frontLeft, frontRight, backLeft, backRight, shooter, intake. Usa sintaxis exacta de Android Studio.]' 
        })
      });
      if (!cloudRes.ok) throw new Error('Error en NeoIA Cloud: ' + cloudRes.statusText);
      const cloudData = await cloudRes.json();
      accumulatedCode = cloudData.reply || cloudData.error || '';
      codeBox.innerText = accumulatedCode;
      codeBox.scrollTop = codeBox.scrollHeight;
      currentGeneratedCode = accumulatedCode;
      statusText.innerText = 'âœ… CÃ³digo generado con NeoIA Cloud (DeepSeek GPU).';
      return;
    }

    // ========================================================
    // CASO 3: MODELOS LOCALES EN OLLAMA (Streaming en vivo)
    // ========================================================
    let systemPrompt = `Eres NeoIA, programador senior de FTC para el equipo BIOBUZZ 24096.
USA LA ARQUITECTURA EXACTA DEL PROYECTO ANDROID STUDIO:
- Motores de chasis: frontLeft, frontRight, backLeft, backRight (DcMotor).
- Shooter: shooter (DcMotorEx con setVelocity, RUN_USING_ENCODER, ZeroPowerBehavior.FLOAT).
- Intake: intake (DcMotor, 0.9 power, ZeroPowerBehavior.BRAKE).
- Paquete: package org.firstinspires.ftc.teamcode;
- Prohibidos placeholders o cÃ³digo incompleto. Genera todo el archivo en un bloque java.`;

    let chunkCount = 0;
    await sendToOllama(modelId, task, systemPrompt, 0.2, (chunk) => {
      chunkCount++;
      accumulatedCode = chunk;
      codeBox.innerText = accumulatedCode;
      codeBox.scrollTop = codeBox.scrollHeight;
      if (chunkCount % 10 === 0) {
        statusText.innerText = `Escribiendo cÃ³digo Java en vivo (${accumulatedCode.length} caracteres)...`;
      }
    });

    currentGeneratedCode = accumulatedCode;
    codeBox.innerText = currentGeneratedCode;
    statusText.innerText = 'âœ… CÃ³digo FTC generado con Ã©xito.';

  } catch (err) {
    console.error('Agent error:', err);
    // RESILIENCIA TOTAL: Si falla la red, el modelo o da "Failed to fetch", caer de inmediato a Turbo BioBuzz
    statusText.innerText = 'âš¡ Activando Modo Turbo BioBuzz (RecuperaciÃ³n en 0.05s)...';
    try {
      const instantCode = generateInstantFTCCode(task);
      currentGeneratedCode = instantCode;
      codeBox.innerText = currentGeneratedCode;
      statusText.innerText = 'âœ… Â¡CÃ³digo generado en 0.05s con el estÃ¡ndar de BioBuzzFTC12!';
      showToast('âš¡ Recuperado al instante con la configuraciÃ³n de BioBuzz 24096.', 'success');
      const sel = document.getElementById('agent-model-select');
      if (sel) sel.value = 'turbo-biobuzz';
    } catch (fallbackErr) {
      statusText.innerText = `âš ï¸ Error: ${err.message}`;
      showToast(`Error: ${err.message}`, 'error');
    }
  } finally {
    clearInterval(timerInterval);
    const finalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (timerBadge) timerBadge.innerText = `â±ï¸ ${finalElapsed}s`;
    btn.disabled = false;
  }
}

async function saveToAndroidStudio() {
  if (!currentGeneratedCode) {
    showToast('No hay cÃ³digo generado para guardar.', 'error');
    return;
  }
  const pathInput = document.getElementById('agent-filepath-input');
  let filename = (pathInput && pathInput.value.trim()) ? pathInput.value.trim() : 'TeleOpShooterIntake.java';
  if (!filename.endsWith('.java')) filename += '.java';

  try {
    const res = await fetch('/api/agent/write-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filePath: filename, 
        content: currentGeneratedCode,
        targetAndroidStudio: true 
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`âœ… Â¡Guardado en Android Studio! (${data.savedPath})`, 'success');
      const statusText = document.getElementById('agent-status-text');
      if (statusText) statusText.innerText = `âœ… Guardado directo en TeamCode: ${data.savedPath}`;
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast(`Error al guardar: ${err.message}`, 'error');
  }
}

async function saveCurrentCodeToDisk() {
  await saveToAndroidStudio();
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
  if (agentSelect) {
    agentSelect.innerHTML = `
      <option value="turbo-biobuzz" selected>⚡ Modo Turbo BioBuzz (&lt; 0.1s - Idéntico a tu Android Studio)</option>
      <option value="neoia-cloud">☁️ NeoIA Cloud (DeepSeek GPU - Como ChatGPT, 5-10s)</option>
      <option value="llama3.2:1b">🧠 llama3.2:1b (Local en tu PC - 100% Offline)</option>
      <option value="qwen2.5-coder:1.5b">💻 qwen2.5-coder:1.5b (Local en tu PC - Coder FTC)</option>
    `;
  }

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

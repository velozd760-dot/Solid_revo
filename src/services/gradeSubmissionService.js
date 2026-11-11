/**
 * Servicio aislado para registrar calificaciones del módulo de Desafíos
 * en Google Sheets mediante un Web App de Google Apps Script (GAS).
 *
 * Consume exclusivamente la variable de entorno `VITE_SHEETS_API_URL`.
 * No depende ni altera ningún módulo matemático o de simulación.
 */

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_RETRIES = 2; // Hasta 3 intentos totales ante timeout o fallo de red
const RETRY_BASE_DELAY_MS = 650;
const PENDING_STORAGE_KEY = 'solid_revo_pending_grades_v1';
const MAX_PENDING_BACKUPS = 10;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeText = (value, maxLength = 240) => {
  if (typeof value !== 'string') {
    if (value === null || value === undefined) return '';
    return String(value).trim().slice(0, maxLength);
  }
  return value.trim().slice(0, maxLength);
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Obtiene de forma segura la URL del endpoint configurado en `.env`.
 * Nunca almacena URLs reales quemadas en código.
 */
export function getSheetsApiUrl() {
  try {
    const raw = import.meta.env.VITE_SHEETS_API_URL;
    return typeof raw === 'string' ? raw.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Verifica si el endpoint de Google Sheets está configurado y no usa el placeholder.
 */
export function isGradeSubmissionConfigured(customEndpoint) {
  const url = typeof customEndpoint === 'string' ? customEndpoint.trim() : getSheetsApiUrl();
  if (!url || url.includes('TU_SCRIPT_ID')) return false;
  return /^https?:\/\/.+/i.test(url);
}

/**
 * Respaldo local no bloqueante en caso de falla de red, para evitar pérdida de datos.
 */
function saveLocalFallback(payload) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];
    const filtered = safeList.filter((item) => item?.submissionId !== payload.submissionId);
    filtered.push(payload);
    window.localStorage.setItem(
      PENDING_STORAGE_KEY,
      JSON.stringify(filtered.slice(-MAX_PENDING_BACKUPS))
    );
  } catch {
    // Fallback silencioso: si localStorage está restringido, no interrumpir al usuario
  }
}

function clearLocalFallback(submissionId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !submissionId) return;
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    const next = list.filter((item) => item?.submissionId !== submissionId);
    if (next.length === 0) {
      window.localStorage.removeItem(PENDING_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
}

function combineAbortSignals(externalSignal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;

  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timerId);
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timerId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  return {
    signal: controller.signal,
    wasTimedOut: () => timedOut,
    wasExternallyAborted: () => Boolean(externalSignal?.aborted),
    cleanup,
  };
}

/**
 * Envía la calificación del estudiante al Web App de Google Apps Script.
 * Utiliza POST con `mode: 'no-cors'` y `Content-Type: text/plain;charset=utf-8`
 * para evitar bloqueos por preflight OPTIONS y redirecciones 302 de GAS.
 *
 * Nunca lanza excepciones no controladas que puedan congelar la interfaz;
 * siempre resuelve con un objeto estructurado `{ ok, status, error, attempts, payload }`.
 *
 * @param {Object} params
 * @param {string} params.studentName - Nombre completo del estudiante (obligatorio)
 * @param {string} [params.studentId] - Identificación / Código / Cédula (opcional)
 * @param {number} params.score - Puntaje obtenido
 * @param {number} params.maxScore - Puntaje máximo posible
 * @param {number} params.timeElapsedSeconds - Duración del intento en segundos
 * @param {string} [params.topic] - Tema o módulo evaluado
 * @param {string} [params.details] - Detalles adicionales del intento
 * @param {Object} [options]
 * @param {number} [options.timeoutMs] - Tiempo máximo por intento (ms)
 * @param {number} [options.maxRetries] - Cantidad de reintentos ante timeout/red
 * @param {AbortSignal} [options.signal] - Señal externa de cancelación
 * @param {string} [options.submissionId] - Identificador único del intento
 * @param {string} [options.endpoint] - Override opcional para pruebas
 * @returns {Promise<{ ok: boolean, status: string, error?: string, attempts: number, payload?: Object }>}
 */
export async function submitChallengeGrade(
  {
    studentName,
    studentId = '',
    score = 0,
    maxScore = 100,
    timeElapsedSeconds = 0,
    topic = 'Duelo de Cartas: Sólidos de Revolución',
    details = '',
  } = {},
  options = {}
) {
  try {
    const cleanName = sanitizeText(studentName, 120);
    if (cleanName.length < 2) {
      return {
        ok: false,
        status: 'validation_error',
        error: 'Ingresa el nombre completo del estudiante (mínimo 2 caracteres).',
        attempts: 0,
      };
    }

    const cleanId = sanitizeText(studentId, 60) || 'N/A';
    const safeMaxScore = Math.max(1, toNonNegativeNumber(maxScore, 100));
    const safeScore = Math.min(safeMaxScore, toNonNegativeNumber(score, 0));
    const percentage = Number(((safeScore / safeMaxScore) * 100).toFixed(2));
    const safeSeconds = Math.max(0, Math.round(toNonNegativeNumber(timeElapsedSeconds, 0)));
    const cleanTopic = sanitizeText(topic, 140) || 'Duelo de Cartas: Sólidos de Revolución';
    const cleanDetails = sanitizeText(details, 500);

    const submissionId =
      sanitizeText(options.submissionId, 80) ||
      `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      submissionId,
      timestamp: new Date().toISOString(),
      studentName: cleanName,
      studentId: cleanId,
      score: safeScore,
      maxScore: safeMaxScore,
      percentage,
      timeElapsedSeconds: safeSeconds,
      topic: cleanTopic,
      details: cleanDetails,
    };

    const endpoint =
      typeof options.endpoint === 'string' ? options.endpoint.trim() : getSheetsApiUrl();

    if (!isGradeSubmissionConfigured(endpoint)) {
      saveLocalFallback(payload);
      return {
        ok: false,
        status: 'not_configured',
        error:
          'No se encontró un endpoint válido en VITE_SHEETS_API_URL (.env). Tu resultado sigue guardado en pantalla.',
        attempts: 0,
        payload,
      };
    }

    const timeoutMs = Number.isFinite(options.timeoutMs)
      ? Math.max(1000, options.timeoutMs)
      : DEFAULT_TIMEOUT_MS;
    const maxRetries = Number.isFinite(options.maxRetries)
      ? Math.max(0, Math.min(4, Math.floor(options.maxRetries)))
      : DEFAULT_MAX_RETRIES;

    const bodyText = JSON.stringify(payload);
    let lastErrorMessage = 'No fue posible establecer conexión con el servidor de calificaciones.';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) {
        return {
          ok: false,
          status: 'aborted',
          error: 'Envío cancelado.',
          attempts: attempt,
          payload,
        };
      }

      const { signal, wasTimedOut, wasExternallyAborted, cleanup } = combineAbortSignals(
        options.signal,
        timeoutMs
      );

      try {
        // POST con text/plain + no-cors evita el preflight OPTIONS bloqueado por Apps Script
        const response = await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: bodyText,
          signal,
        });

        cleanup();

        // Con mode: 'no-cors', una respuesta que alcanza GAS retorna type === 'opaque'
        if (response.type === 'opaque') {
          clearLocalFallback(payload.submissionId);
          return {
            ok: true,
            status: 'submitted',
            opaque: true,
            attempts: attempt + 1,
            payload,
          };
        }

        // Soporte adicional en caso de ejecutarse en entornos CORS habilitados
        if (response.ok) {
          let parsed = null;
          try {
            parsed = await response.json();
          } catch {
            parsed = null;
          }

          if (parsed && parsed.ok === false) {
            lastErrorMessage = parsed.error || 'El servidor rechazó el registro de calificación.';
            saveLocalFallback(payload);
            return {
              ok: false,
              status: 'server_error',
              error: lastErrorMessage,
              attempts: attempt + 1,
              payload,
            };
          }

          clearLocalFallback(payload.submissionId);
          return {
            ok: true,
            status: 'submitted',
            opaque: false,
            serverResponse: parsed,
            attempts: attempt + 1,
            payload,
          };
        }

        // Error HTTP explícito (si no fue opaque)
        const isRetriableHttp = response.status >= 500 || response.status === 429;
        lastErrorMessage = `El servidor respondió con estado HTTP ${response.status}.`;

        if (!isRetriableHttp || attempt === maxRetries) {
          saveLocalFallback(payload);
          return {
            ok: false,
            status: 'http_error',
            error: lastErrorMessage,
            attempts: attempt + 1,
            payload,
          };
        }
      } catch (err) {
        cleanup();

        if (wasExternallyAborted()) {
          return {
            ok: false,
            status: 'aborted',
            error: 'Envío cancelado.',
            attempts: attempt + 1,
            payload,
          };
        }

        const isTimeout = wasTimedOut() || err?.name === 'AbortError';
        lastErrorMessage = isTimeout
          ? 'Tiempo de espera agotado al conectar con Google Sheets.'
          : 'Error de red al intentar conectar con el servidor.';

        if (attempt === maxRetries) {
          saveLocalFallback(payload);
          return {
            ok: false,
            status: isTimeout ? 'timeout' : 'network_error',
            error: lastErrorMessage,
            attempts: attempt + 1,
            payload,
          };
        }
      }

      // Espera exponencial breve antes de reintentar
      await delay(RETRY_BASE_DELAY_MS * (attempt + 1));
    }

    saveLocalFallback(payload);
    return {
      ok: false,
      status: 'network_error',
      error: lastErrorMessage,
      attempts: maxRetries + 1,
      payload,
    };
  } catch (unexpected) {
    return {
      ok: false,
      status: 'unexpected_error',
      error: unexpected?.message || 'Error inesperado al preparar el envío de la calificación.',
      attempts: 0,
    };
  }
}

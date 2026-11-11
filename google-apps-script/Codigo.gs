/**
 * Google Apps Script — Receptor Serverless de Calificaciones (solid-revo)
 * ------------------------------------------------------------------------
 * Instrucciones de despliegue:
 * 1. Abre tu hoja de cálculo en Google Sheets y ve a Extensiones -> Apps Script.
 * 2. Pega este contenido completo en el archivo `Código.gs` y guarda (Ctrl+S).
 * 3. Haz clic en "Implementar" -> "Nueva implementación":
 *    - Tipo: Aplicación web (Web app)
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquier usuario (Anyone)
 * 4. Autoriza los permisos solicitados y copia la URL terminada en `/exec`.
 * 5. Pega esa URL en tu archivo `.env` bajo la clave `VITE_SHEETS_API_URL`.
 */

var TARGET_SHEET_NAME = 'Calificaciones';

var HEADERS = [
  'Fecha y Hora',
  'Estudiante',
  'Identificación/Cédula',
  'Puntaje Obtenido',
  'Puntaje Máximo',
  'Porcentaje (%)',
  'Tiempo (segundos)',
  'Tema/Módulo',
  'Detalles',
];

/**
 * Endpoint GET opcional de verificación de salud (healthcheck).
 */
function doGet() {
  return buildJsonResponse({
    ok: true,
    service: 'solid-revo-grades-webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Endpoint POST principal consumido por el cliente React (`submitChallengeGrade`).
 * Implementa `LockService.getScriptLock()` para evitar condiciones de carrera cuando
 * múltiples estudiantes registran su calificación simultáneamente.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    // Espera hasta 15 segundos para adquirir el bloqueo exclusivo de escritura
    lock.waitLock(15000);
    lockAcquired = true;

    var payload = parseRequestPayload(e);
    if (!payload) {
      return buildJsonResponse({
        ok: false,
        status: 'invalid_payload',
        error: 'No se recibió un cuerpo JSON válido.',
      });
    }

    var studentName = sanitizeSheetText(payload.studentName, 120);
    if (!studentName || studentName.length < 2) {
      return buildJsonResponse({
        ok: false,
        status: 'validation_error',
        error: 'El nombre del estudiante es obligatorio.',
      });
    }

    var studentId = sanitizeSheetText(payload.studentId || 'N/A', 60);
    var maxScore = toNonNegativeNumber(payload.maxScore, 100);
    if (maxScore <= 0) maxScore = 100;

    var score = Math.min(maxScore, toNonNegativeNumber(payload.score, 0));
    var percentage =
      payload.percentage !== undefined && isFinite(Number(payload.percentage))
        ? Number(Number(payload.percentage).toFixed(2))
        : Number(((score / maxScore) * 100).toFixed(2));

    var timeElapsedSeconds = Math.round(toNonNegativeNumber(payload.timeElapsedSeconds, 0));
    var topic = sanitizeSheetText(payload.topic || 'Duelo de Cartas: Sólidos de Revolución', 140);
    var details = sanitizeSheetText(payload.details || '', 500);

    var sheet = getOrCreateTargetSheet();
    ensureHeaders(sheet);

    var now = new Date();
    var timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'UTC';
    var formattedTimestamp = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd HH:mm:ss');

    sheet.appendRow([
      formattedTimestamp,
      studentName,
      studentId,
      score,
      maxScore,
      percentage,
      timeElapsedSeconds,
      topic,
      details,
    ]);

    SpreadsheetApp.flush();

    return buildJsonResponse({
      ok: true,
      status: 'recorded',
      row: sheet.getLastRow(),
      timestamp: now.toISOString(),
    });
  } catch (err) {
    return buildJsonResponse({
      ok: false,
      status: 'server_error',
      error: err && err.message ? String(err.message) : 'Error interno al escribir en la hoja.',
    });
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (_releaseErr) {
        // Ignorar errores al liberar bloqueo
      }
    }
  }
}

/**
 * Parsea el payload ya sea desde `e.postData.contents` (text/plain o application/json)
 * o desde `e.parameter.payload` como respaldo.
 */
function parseRequestPayload(e) {
  if (!e) return null;

  try {
    if (e.postData && typeof e.postData.contents === 'string' && e.postData.contents.trim()) {
      return JSON.parse(e.postData.contents);
    }
    if (e.parameter && typeof e.parameter.payload === 'string' && e.parameter.payload.trim()) {
      return JSON.parse(e.parameter.payload);
    }
  } catch (_parseErr) {
    return null;
  }

  return null;
}

/**
 * Obtiene la pestaña destino o utiliza/crea `Calificaciones` de forma segura.
 */
function getOrCreateTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('El script debe estar vinculado a una hoja de cálculo de Google Sheets.');
  }

  var sheet = ss.getSheetByName(TARGET_SHEET_NAME);
  if (!sheet) {
    var firstSheet = ss.getSheets()[0];
    // Si la hoja inicial está completamente vacía, la reutilizamos con el nombre oficial
    if (firstSheet && firstSheet.getLastRow() === 0 && firstSheet.getLastColumn() === 0) {
      firstSheet.setName(TARGET_SHEET_NAME);
      sheet = firstSheet;
    } else {
      sheet = ss.insertSheet(TARGET_SHEET_NAME);
    }
  }

  return sheet;
}

/**
 * Crea dinámicamente la fila de cabeceras y aplica formato si la hoja está vacía.
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow(HEADERS);
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#1d4ed8')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 165); // Fecha y Hora
  sheet.setColumnWidth(2, 220); // Estudiante
  sheet.setColumnWidth(3, 155); // Identificación/Cédula
  sheet.setColumnWidth(4, 130); // Puntaje Obtenido
  sheet.setColumnWidth(5, 130); // Puntaje Máximo
  sheet.setColumnWidth(6, 120); // Porcentaje (%)
  sheet.setColumnWidth(7, 135); // Tiempo (segundos)
  sheet.setColumnWidth(8, 230); // Tema/Módulo
  sheet.setColumnWidth(9, 340); // Detalles
}

/**
 * Previene inyección de fórmulas en Google Sheets (=, +, -, @) y normaliza longitudes.
 */
function sanitizeSheetText(value, maxLen) {
  var limit = maxLen || 240;
  var str = value === null || value === undefined ? '' : String(value);
  str = str.replace(/[\r\n\t]+/g, ' ').trim();
  if (str.length > limit) {
    str = str.slice(0, limit);
  }
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

function toNonNegativeNumber(value, fallback) {
  var num = Number(value);
  return isFinite(num) && num >= 0 ? num : fallback;
}

function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

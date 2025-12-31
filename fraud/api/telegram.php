<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
// Allow same-origin XHR/fetch; adjust if you need a stricter policy.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight (in case some clients use fetch)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function respond(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

/* =======================
   CONFIG — ВСТАВЬ СЮДА
   Лучше: задать переменные окружения на сервере:
   TG_BOT_TOKEN и TG_CHAT_ID
   ======================= */
/* Read tokens from env when possible; fall back to repo defaults (replace in production) */
$BOT_TOKEN = getenv('TG_BOT_TOKEN') ?: '8249942060:AAFdn2odnWG-HZurTrRvn5i7zTCQ5oq4_g8';
$CHAT_ID   = getenv('TG_CHAT_ID') ?: '-5274673635'; // группа/канал: -100xxxxxxxxxx, обычная группа: -xxxxxxxxxx

// Optional debug mode: set TG_DEBUG=1 in environment to enable minimal logging to /tmp/telegram_telemetry.log
$DEBUG = getenv('TG_DEBUG') === '1';
/* ======================= */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

if ($BOT_TOKEN === '' || $CHAT_ID === '' || str_contains($BOT_TOKEN, 'PUT_TELEGRAM_') || str_contains($CHAT_ID, 'PUT_TELEGRAM_')) {
  respond(500, ['ok' => false, 'error' => 'tg_not_configured']);
}

// Honeypot (optional)
$honeypot = (string)($_POST['website'] ?? '');
if ($honeypot !== '') {
  respond(200, ['ok' => true]);
}

// Fields (support multiple names from different forms)
$name  = trim((string)($_POST['name'] ?? $_POST['fullname'] ?? $_POST['your_name'] ?? $_POST['username'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? $_POST['tel'] ?? $_POST['phone_number'] ?? ''));
$text  = trim((string)($_POST['message'] ?? $_POST['question'] ?? $_POST['text'] ?? $_POST['comment'] ?? $_POST['situation'] ?? ''));
$page  = trim((string)($_POST['page'] ?? ''));

if ($page === '' && !empty($_SERVER['HTTP_REFERER'])) {
  $page = (string)$_SERVER['HTTP_REFERER'];
}

if ($name === '' && $phone === '' && $text === '') {
  respond(400, ['ok' => false, 'error' => 'empty_payload']);
}

$parts = [];
$parts[] = "🧾 Новая заявка с сайта";
if ($page  !== '') $parts[] = "🌐 Страница: {$page}";
if ($name  !== '') $parts[] = "👤 Имя: {$name}";
if ($phone !== '') $parts[] = "📞 Телефон: {$phone}";
if ($text  !== '') $parts[] = "📝 Сообщение: {$text}";
$parts[] = '⏱ ' . date('Y-m-d H:i:s');

$msg = implode("\n", $parts);

// SendMessage
$url = 'https://api.telegram.org/bot' . $BOT_TOKEN . '/sendMessage';
$post = http_build_query([
  'chat_id' => $CHAT_ID,
  'text' => $msg,
  'disable_web_page_preview' => true,
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $post,
  CURLOPT_CONNECTTIMEOUT => 8,
  CURLOPT_TIMEOUT => 14,
]);

$raw = curl_exec($ch);
$err = curl_error($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($DEBUG) {
  // minimal, sanitized telemetry for diagnostics — do not log full phone or message in production
  $log = sprintf("[%s] POST page=%s name=%s phone_last4=%s http_code=%d\n",
    date('c'),
    substr($page, 0, 200),
    $name !== '' ? preg_replace('/[^\p{L}\p{N} _-]/u', '', mb_substr($name, 0, 50)) : '-',
    $phone !== '' ? substr(preg_replace('/\D+/', '', $phone), -4) : '-',
    $code
  );
  // append TG raw response (truncated) if present
  $log .= "TG_RESPONSE: " . substr((string)$raw, 0, 1000) . "\n";
  @file_put_contents('/tmp/telegram_telemetry.log', $log, FILE_APPEND | LOCK_EX);
}

if ($raw === false) {
  respond(502, ['ok' => false, 'error' => 'curl_error', 'detail' => $err]);
}

$json = json_decode($raw, true);
if (!is_array($json)) {
  respond(502, ['ok' => false, 'error' => 'bad_json', 'http_code' => $code, 'raw' => $raw]);
}

if (($json['ok'] ?? false) !== true) {
  respond(502, ['ok' => false, 'error' => 'tg_send_failed', 'http_code' => $code, 'tg' => $json]);
}

respond(200, ['ok' => true]);
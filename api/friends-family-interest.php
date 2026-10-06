<?php
/**
 * Friends & Family Expression of Interest – save submission to JSON.
 * For use on static/PHP hosting (e.g. SiteGround). Upload this file and the
 * data directory to your server; ensure the directory is writable.
 *
 * POST JSON: full_name, email, location, amount_usd, risk_acknowledgment
 * Optional: phone, notes
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$full_name = isset($body['full_name']) ? trim((string) $body['full_name']) : '';
$email = isset($body['email']) ? trim((string) $body['email']) : '';
$location = isset($body['location']) ? trim((string) $body['location']) : '';
$amount_usd = $body['amount_usd'] ?? null;
$risk_acknowledgment = !empty($body['risk_acknowledgment']);

if ($full_name === '' || $email === '' || $location === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing required fields: full_name, email, location']);
  exit;
}
if (!$risk_acknowledgment) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Risk acknowledgment is required']);
  exit;
}
if ($amount_usd === null || $amount_usd === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Approximate amount (USD) is required']);
  exit;
}

$amount_num = is_numeric($amount_usd) ? (float) $amount_usd : null;
if ($amount_num === null) {
  $amount_clean = preg_replace('/[^\d.-]/', '', (string) $amount_usd);
  $amount_num = $amount_clean !== '' && is_numeric($amount_clean) ? (float) $amount_clean : null;
}
if ($amount_num === null || is_nan($amount_num)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'A valid Purchase Amount (USD) is required']);
  exit;
}
if ($amount_num < 1000) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Minimum Purchase Amount per investor is $1,000.']);
  exit;
}
if ($amount_num > 5000) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Maximum Purchase Amount per investor is $5,000.']);
  exit;
}
$amount_stored = $amount_num;

$phone = isset($body['phone']) ? trim((string) $body['phone']) : '';
$notes = isset($body['notes']) ? trim((string) $body['notes']) : '';

$record = [
  'id' => uniqid((string) (time() * 1000) . '-', true),
  'full_name' => $full_name,
  'email' => $email,
  'phone' => $phone !== '' ? $phone : null,
  'location' => $location,
  'amount_usd' => $amount_stored,
  'notes' => $notes !== '' ? $notes : null,
  'submitted_at' => gmdate('Y-m-d\TH:i:s\Z'),
];

$data_dir = __DIR__ . '/../data';
$file = $data_dir . '/friends_family_investors.json';

if (!is_dir($data_dir)) {
  if (!@mkdir($data_dir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to create data directory']);
    exit;
  }
}

$list = [];
if (is_file($file)) {
  $content = @file_get_contents($file);
  if ($content !== false) {
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
      $list = $decoded;
    }
  }
}

$list[] = $record;
$json = json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if ($json === false || @file_put_contents($file, $json) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Failed to save submission']);
  exit;
}

// Personalized SAFE PDF generation is intentionally disabled.
// Obsolete Friends & Family SAFE PDFs were removed from the repository
// (formerly SAFE_Friends_Family.pdf; prior expected path docs/SAFE - Friends & Family.pdf).
// Current draft for legal review: docs/safe-friends-family-draft.html
// pdf_path remains in the response for API compatibility with the EOI client (always null).
$pdf_path = null;

http_response_code(200);
echo json_encode([
  'ok' => true,
  'id' => $record['id'],
  'pdf_path' => $pdf_path,
]);

/**
 * Personalized SAFE PDF generation — DISABLED.
 * No PDF template is shipped. Current draft: ../docs/safe-friends-family-draft.html
 *
 * @param array $record
 * @return string|null
 */
function generate_investor_safe_pdf(array $record)
{
  return null;
}

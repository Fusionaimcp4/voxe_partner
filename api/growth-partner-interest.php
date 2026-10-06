<?php
/**
 * Growth Partner Program Expression of Interest – save submission to JSON.
 * For use on static/PHP hosting (e.g. SiteGround). Upload this file and the
 * data directory to your server; ensure the directory is writable.
 *
 * POST JSON: full_name, email, contribution
 * Optional: phone, experience_network, notes
 *
 * Separate from Friends & Family — does not write to friends_family_investors.json.
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
$contribution = isset($body['contribution']) ? trim((string) $body['contribution']) : '';

if ($full_name === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Full name is required']);
  exit;
}
if ($email === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Email is required']);
  exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'A valid email address is required']);
  exit;
}
if ($contribution === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Growth contribution explanation is required']);
  exit;
}

$phone = isset($body['phone']) ? trim((string) $body['phone']) : '';
$experience_network = isset($body['experience_network']) ? trim((string) $body['experience_network']) : '';
$notes = isset($body['notes']) ? trim((string) $body['notes']) : '';

$record = [
  'id' => uniqid((string) (time() * 1000) . '-', true),
  'full_name' => $full_name,
  'email' => $email,
  'phone' => $phone !== '' ? $phone : null,
  'contribution' => $contribution,
  'experience_network' => $experience_network !== '' ? $experience_network : null,
  'notes' => $notes !== '' ? $notes : null,
  'submitted_at' => gmdate('Y-m-d\TH:i:s\Z'),
];

$data_dir = __DIR__ . '/../data';
$file = $data_dir . '/growth_partner_applications.json';

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

http_response_code(200);
echo json_encode([
  'ok' => true,
  'id' => $record['id'],
]);

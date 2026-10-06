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
if ($amount_num !== null && !is_nan($amount_num) && $amount_num > 5000) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Maximum amount per investor is $5,000.']);
  exit;
}
$amount_stored = ($amount_num !== null && !is_nan($amount_num)) ? $amount_num : trim((string) $amount_usd);

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

// Try to generate a personalised SAFE PDF for this investor.
// This is best-effort only; a failure here will NOT block the submission.
$pdf_path = null;
try {
  $pdf_path = generate_investor_safe_pdf($record);
} catch (Throwable $e) {
  // Swallow errors; optionally log with error_log($e->getMessage());
}

http_response_code(200);
echo json_encode([
  'ok' => true,
  'id' => $record['id'],
  // Relative or absolute path to the generated PDF on the server, if created.
  'pdf_path' => $pdf_path,
]);

/**
 * Generate a personalised SAFE PDF using a template.
 *
 * Requirements (to be set up on your hosting):
 * - Place your template at: ../docs/SAFE - Friends & Family.pdf
 * - Install FPDI (and its FPDF dependency) via Composer so that
 *   ../vendor/autoload.php exists and provides \setasign\Fpdi\Fpdi.
 *
 * On success returns a web‑accessible path (e.g. /generated-safe/xyz.pdf),
 * otherwise null.
 *
 * @param array $record
 * @return string|null
 */
function generate_investor_safe_pdf(array $record)
{
  $template = __DIR__ . '/../docs/SAFE - Friends & Family.pdf';
  if (!is_file($template)) {
    return null;
  }

  $autoloader = __DIR__ . '/../vendor/autoload.php';
  if (!is_file($autoloader)) {
    return null;
  }

  require_once $autoloader;

  if (!class_exists('\setasign\Fpdi\Fpdi')) {
    return null;
  }

  $outDir = __DIR__ . '/../generated-safe';
  if (!is_dir($outDir) && !@mkdir($outDir, 0755, true)) {
    return null;
  }

  // Build a safe file name based on the investor's name and record id.
  $nameBase = preg_replace('/[^A-Za-z0-9_-]+/', '_', (string) ($record['full_name'] ?? 'investor'));
  $nameBase = substr($nameBase, 0, 40);
  if ($nameBase === '') {
    $nameBase = 'investor';
  }
  $fileName = $nameBase . '-' . ($record['id'] ?? uniqid()) . '.pdf';
  $outPath = $outDir . '/' . $fileName;
  // Assuming the web root corresponds to the project root, ../generated-safe
  // should be accessible at /generated-safe in the browser.
  $webPath = '/generated-safe/' . $fileName;

  $pdf = new \setasign\Fpdi\Fpdi();
  $pageCount = $pdf->setSourceFile($template);

  for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
    $tplIdx = $pdf->importPage($pageNo);
    $size = $pdf->getTemplateSize($tplIdx);

    // Use the same size/orientation as the template page.
    $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
    $pdf->useTemplate($tplIdx);

    // On the first page, write the investor's name (and optionally other data).
    if ($pageNo === 1) {
      $pdf->SetFont('Helvetica', '', 12);
      $pdf->SetTextColor(0, 0, 0);

      // TODO: adjust these coordinates to match where the name should appear
      // on your SAFE template (units are in user space units, usually mm).
      $pdf->SetXY(40, 80);
      $pdf->Write(6, (string) ($record['full_name'] ?? ''));
    }
  }

  // Save the personalised SAFE to disk.
  $pdf->Output($outPath, 'F');

  return $webPath;
}

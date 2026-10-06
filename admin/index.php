<?php
session_start();

/**
 * Simple password-protected admin UI to view portal submissions.
 *
 * Auth:
 * - Reads ADMIN_PASS from ../.env (or from the environment).
 * - Uses a PHP session flag to remember login.
 *
 * Data:
 * - Friends & Family: ../data/friends_family_investors.json
 * - Growth Partners: ../data/growth_partner_applications.json
 */

function env_get($key)
{
  static $env = null;
  if ($env === null) {
    $env = [];
    $envFile = __DIR__ . '/../.env';
    if (is_file($envFile) && is_readable($envFile)) {
      $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
      foreach ($lines as $line) {
        $trimmed = ltrim($line);
        if ($trimmed === '' || $trimmed[0] === '#') {
          continue;
        }
        $pos = strpos($line, '=');
        if ($pos === false) {
          continue;
        }
        $k = trim(substr($line, 0, $pos));
        $v = trim(substr($line, $pos + 1));
        if ($k !== '') {
          $env[$k] = $v;
        }
      }
    }
  }

  if (array_key_exists($key, $env)) {
    return $env[$key];
  }

  $val = getenv($key);
  return $val !== false ? $val : null;
}

$adminPass = env_get('ADMIN_PASS');

if (isset($_GET['logout'])) {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
      $params['path'], $params['domain'],
      $params['secure'], $params['httponly']
    );
  }
  session_destroy();
  header('Location: index.php');
  exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
  if (!$adminPass) {
    $error = 'Admin password is not configured. Set ADMIN_PASS in .env.';
  } else {
    $input = (string) $_POST['password'];
    // Use hash_equals to avoid timing attacks (overkill here but good practice).
    if (hash_equals($adminPass, $input)) {
      $_SESSION['admin_logged_in'] = true;
      header('Location: index.php');
      exit;
    } else {
      $error = 'Incorrect password.';
    }
  }
}

$loggedIn = !empty($_SESSION['admin_logged_in']);

function load_json_submissions($relativePath)
{
  $file = __DIR__ . '/../' . $relativePath;
  if (!is_file($file) || !is_readable($file)) {
    return [];
  }
  $raw = file_get_contents($file);
  if ($raw === false) {
    return [];
  }
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    return [];
  }

  // Sort newest first by submitted_at or id fallback.
  usort($data, function ($a, $b) {
    $ta = isset($a['submitted_at']) ? strtotime($a['submitted_at']) : 0;
    $tb = isset($b['submitted_at']) ? strtotime($b['submitted_at']) : 0;
    if ($ta === $tb) {
      return 0;
    }
    return $ta < $tb ? 1 : -1;
  });

  return $data;
}

$activeTab = isset($_GET['tab']) ? (string) $_GET['tab'] : 'friends-family';
if ($activeTab !== 'growth-partners') {
  $activeTab = 'friends-family';
}

$ffSubmissions = $loggedIn ? load_json_submissions('data/friends_family_investors.json') : [];
$gppSubmissions = $loggedIn ? load_json_submissions('data/growth_partner_applications.json') : [];

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Submissions – Admin</title>
  <style>
    :root {
      color-scheme: dark light;
      --bg: #020617;
      --bg-alt: #0f172a;
      --card: #020617;
      --border: #1e293b;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --accent-soft: rgba(56, 189, 248, 0.12);
      --danger: #f97373;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
      background: radial-gradient(circle at top, #0f172a, #020617 55%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      justify-content: center;
      padding: 32px 16px;
    }
    .shell {
      width: 100%;
      max-width: 1120px;
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.15);
      box-shadow:
        0 22px 45px rgba(15, 23, 42, 0.55),
        0 0 0 1px rgba(15, 23, 42, 0.9);
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 60%);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .subtitle {
      margin: 0;
      margin-top: 2px;
      font-size: 13px;
      color: var(--muted);
    }
    .logout-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.28);
    }
    .logout-link:hover {
      border-color: rgba(248, 113, 113, 0.75);
      color: #fecaca;
      background: rgba(239, 68, 68, 0.12);
    }
    .card {
      background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 60%);
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 18px 16px;
    }
    .login-form {
      max-width: 340px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    label {
      font-size: 13px;
      color: var(--muted);
    }
    input[type="password"] {
      width: 100%;
      padding: 9px 11px;
      border-radius: 9px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.95);
      color: var(--text);
      font-size: 14px;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.5);
    }
    .btn-primary {
      margin-top: 6px;
      border: none;
      border-radius: 999px;
      padding: 9px 14px;
      font-size: 14px;
      font-weight: 500;
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      color: #0b1120;
      cursor: pointer;
    }
    .btn-primary:hover {
      filter: brightness(1.05);
    }
    .error {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(248, 113, 113, 0.08);
      border: 1px solid rgba(248, 113, 113, 0.6);
      color: #fecaca;
      font-size: 13px;
    }
    .empty {
      font-size: 14px;
      color: var(--muted);
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .tab {
      text-decoration: none;
      font-size: 13px;
      color: var(--muted);
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: transparent;
    }
    .tab:hover {
      border-color: rgba(56, 189, 248, 0.55);
      color: #e0f2fe;
    }
    .tab.active {
      color: #0b1120;
      border-color: transparent;
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      font-weight: 500;
    }
    .table-wrap {
      margin-top: 6px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.98));
      overflow: auto;
      max-height: 70vh;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      min-width: 720px;
    }
    thead {
      background: rgba(15, 23, 42, 0.96);
      position: sticky;
      top: 0;
      z-index: 1;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(30, 64, 175, 0.35);
      text-align: left;
      vertical-align: top;
    }
    th {
      font-weight: 500;
      color: var(--muted);
      white-space: nowrap;
    }
    tbody tr:nth-child(even) {
      background: rgba(15, 23, 42, 0.7);
    }
    tbody tr:hover {
      background: rgba(15, 118, 110, 0.22);
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      color: var(--muted);
    }
    .cell-wrap {
      max-width: 220px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    @media (max-width: 640px) {
      .shell {
        padding: 16px 14px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .logout-link {
        align-self: flex-end;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="header">
      <div class="title-wrap">
        <div class="badge">Admin · Voxe Partner Portal</div>
        <div>
          <h1>Portal submissions</h1>
          <p class="subtitle">Password-protected view of expressions of interest.</p>
        </div>
      </div>
      <?php if ($loggedIn): ?>
        <a href="?logout=1" class="logout-link">Log out</a>
      <?php endif; ?>
    </div>

    <div class="card">
      <?php if (!$loggedIn): ?>
        <form method="post" class="login-form" autocomplete="off">
          <label for="password">Admin password</label>
          <input id="password" name="password" type="password" required autofocus>
          <button type="submit" class="btn-primary">Sign in</button>
          <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
          <?php elseif (!$adminPass): ?>
            <div class="error">ADMIN_PASS is not set in your <code>.env</code> file.</div>
          <?php endif; ?>
        </form>
      <?php else: ?>
        <div class="tabs" role="tablist">
          <a
            href="?tab=friends-family"
            class="tab<?php echo $activeTab === 'friends-family' ? ' active' : ''; ?>"
            role="tab"
            aria-selected="<?php echo $activeTab === 'friends-family' ? 'true' : 'false'; ?>"
          >Friends &amp; Family</a>
          <a
            href="?tab=growth-partners"
            class="tab<?php echo $activeTab === 'growth-partners' ? ' active' : ''; ?>"
            role="tab"
            aria-selected="<?php echo $activeTab === 'growth-partners' ? 'true' : 'false'; ?>"
          >Growth Partners</a>
        </div>

        <?php if ($activeTab === 'friends-family'): ?>
          <?php if (empty($ffSubmissions)): ?>
            <p class="empty">No Friends &amp; Family submissions have been recorded yet.</p>
          <?php else: ?>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date (UTC)</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Amount (USD)</th>
                    <th>Notes</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($ffSubmissions as $row): ?>
                    <tr>
                      <td class="mono">
                        <?php
                        $t = isset($row['submitted_at']) ? $row['submitted_at'] : '';
                        echo htmlspecialchars($t, ENT_QUOTES, 'UTF-8');
                        ?>
                      </td>
                      <td><?php echo htmlspecialchars((string) ($row['full_name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td><?php echo htmlspecialchars((string) ($row['email'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td><?php echo htmlspecialchars((string) ($row['phone'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td><?php echo htmlspecialchars((string) ($row['location'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td>
                        <?php
                        $amt = $row['amount_usd'] ?? '';
                        echo htmlspecialchars((string) $amt, ENT_QUOTES, 'UTF-8');
                        ?>
                      </td>
                      <td><?php echo nl2br(htmlspecialchars((string) ($row['notes'] ?? ''), ENT_QUOTES, 'UTF-8')); ?></td>
                      <td class="mono">
                        <?php echo htmlspecialchars((string) ($row['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          <?php endif; ?>
        <?php else: ?>
          <?php if (empty($gppSubmissions)): ?>
            <p class="empty">No Growth Partner applications have been recorded yet.</p>
          <?php else: ?>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date (UTC)</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Growth contribution</th>
                    <th>Experience / network</th>
                    <th>Comments</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($gppSubmissions as $row): ?>
                    <tr>
                      <td class="mono">
                        <?php
                        $t = isset($row['submitted_at']) ? $row['submitted_at'] : '';
                        echo htmlspecialchars($t, ENT_QUOTES, 'UTF-8');
                        ?>
                      </td>
                      <td><?php echo htmlspecialchars((string) ($row['full_name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td><?php echo htmlspecialchars((string) ($row['email'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td><?php echo htmlspecialchars((string) ($row['phone'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></td>
                      <td class="cell-wrap"><?php echo nl2br(htmlspecialchars((string) ($row['contribution'] ?? ''), ENT_QUOTES, 'UTF-8')); ?></td>
                      <td class="cell-wrap"><?php echo nl2br(htmlspecialchars((string) ($row['experience_network'] ?? ''), ENT_QUOTES, 'UTF-8')); ?></td>
                      <td class="cell-wrap"><?php echo nl2br(htmlspecialchars((string) ($row['notes'] ?? ''), ENT_QUOTES, 'UTF-8')); ?></td>
                      <td class="mono">
                        <?php echo htmlspecialchars((string) ($row['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          <?php endif; ?>
        <?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>

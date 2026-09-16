<?php
/**
 * One-time migration runner
 * Access: https://osas-sys.duckdns.org/run_migration.php
 * DELETES ITSELF after running successfully.
 */

// ── Simple auth token — change this if you want extra security ──────────────
define('SECRET_TOKEN', 'osas_migrate_2026');

require_once __DIR__ . '/app/config/db_connect.php';

$token    = $_GET['token'] ?? '';
$confirmed = isset($_GET['confirm']) && $_GET['confirm'] === '1';

?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OSAS — Migration Runner</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #0f172a; color: #f1f5f9; min-height: 100vh;
         display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { background: #1e293b; border-radius: 16px; padding: 36px 40px;
          max-width: 680px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  h1  { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #D4AF37; }
  .sub{ font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
  pre { background: #0f172a; border-radius: 10px; padding: 16px 18px; font-size: 12.5px;
        line-height: 1.7; overflow-x: auto; color: #e2e8f0; margin-bottom: 20px;
        border: 1px solid #334155; }
  .btn { display: inline-block; padding: 12px 28px; border-radius: 10px; font-size: 14px;
         font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: opacity .18s; }
  .btn-run  { background: #D4AF37; color: #1a1a1a; }
  .btn-run:hover { opacity: .85; }
  .btn-del  { background: #ef4444; color: #fff; margin-left: 10px; }
  .btn-del:hover { opacity: .85; }
  .alert { padding: 14px 18px; border-radius: 10px; font-size: 13.5px;
           margin-bottom: 18px; line-height: 1.55; }
  .alert-ok   { background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.3); color: #4ade80; }
  .alert-err  { background: rgba(239,68,68,.12);  border: 1px solid rgba(239,68,68,.3);  color: #f87171; }
  .alert-warn { background: rgba(212,175,55,.1);  border: 1px solid rgba(212,175,55,.3); color: #fbbf24; }
  .result-line { font-size: 13px; padding: 5px 0; border-bottom: 1px solid #1e293b; }
  .result-line.ok  { color: #4ade80; }
  .result-line.err { color: #f87171; }
  .result-line.skip{ color: #94a3b8; }
  .icon { margin-right: 6px; }
  form { display: inline; }
</style>
</head>
<body>
<div class="card">
  <h1>🗄️ OSAS Migration Runner</h1>
  <p class="sub">Messaging Tables — <code>conversations</code> &amp; <code>direct_messages</code></p>

<?php

// ── Token check ──────────────────────────────────────────────────────────────
if ($token !== SECRET_TOKEN) { ?>
  <div class="alert alert-err">
    ❌ Access denied. Provide the correct token:<br><br>
    <code>https://osas-sys.duckdns.org/run_migration.php?token=osas_migrate_2026</code>
  </div>
</div></body></html>
<?php exit; }

// ── SQL statements ────────────────────────────────────────────────────────────
$statements = [
    'conversations' => "
        CREATE TABLE IF NOT EXISTS `conversations` (
          `id`              INT          NOT NULL AUTO_INCREMENT,
          `admin_user_id`   INT          NOT NULL COMMENT 'users.id of the admin/staff',
          `student_user_id` INT          NOT NULL COMMENT 'users.id of the student',
          `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uq_pair` (`admin_user_id`, `student_user_id`),
          KEY `idx_admin`   (`admin_user_id`),
          KEY `idx_student` (`student_user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    'direct_messages' => "
        CREATE TABLE IF NOT EXISTS `direct_messages` (
          `id`               INT          NOT NULL AUTO_INCREMENT,
          `conversation_id`  INT          NOT NULL,
          `sender_id`        INT          NOT NULL COMMENT 'users.id of the sender',
          `body`             TEXT         NOT NULL,
          `is_read`          TINYINT(1)   NOT NULL DEFAULT 0,
          `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_conv`     (`conversation_id`),
          KEY `idx_sender`   (`sender_id`),
          CONSTRAINT `fk_dm_conv` FOREIGN KEY (`conversation_id`)
            REFERENCES `conversations` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
];

// ── Not yet confirmed — show preview ─────────────────────────────────────────
if (!$confirmed) { ?>
  <div class="alert alert-warn">
    ⚠️ This will create 2 new tables in your <strong>osas</strong> database.
    Tables that already exist will be skipped (uses <code>CREATE TABLE IF NOT EXISTS</code>).
  </div>

  <p style="font-size:13px;color:#94a3b8;margin-bottom:10px;">Tables to create:</p>
  <pre>CREATE TABLE IF NOT EXISTS `conversations` (
  id, admin_user_id, student_user_id,
  created_at, updated_at
)

CREATE TABLE IF NOT EXISTS `direct_messages` (
  id, conversation_id, sender_id,
  body, is_read, created_at
  FOREIGN KEY → conversations.id ON DELETE CASCADE
)</pre>

  <a href="?token=<?= SECRET_TOKEN ?>&confirm=1" class="btn btn-run">▶ Run Migration Now</a>

<?php exit_card(); }

// ── Run migration ─────────────────────────────────────────────────────────────
if (!isset($conn) || $conn->connect_error) { ?>
  <div class="alert alert-err">❌ Database connection failed: <?= htmlspecialchars($conn->connect_error ?? 'Unknown error') ?></div>
<?php exit_card(); }

$results = [];
$allOk   = true;

foreach ($statements as $tableName => $sql) {
    // Check if table already exists
    $exists = $conn->query("SHOW TABLES LIKE '$tableName'")->num_rows > 0;

    if ($exists) {
        $results[] = ['table' => $tableName, 'status' => 'skip', 'msg' => 'Table already exists — skipped'];
        continue;
    }

    if ($conn->query(trim($sql))) {
        $results[] = ['table' => $tableName, 'status' => 'ok', 'msg' => 'Created successfully'];
    } else {
        $results[] = ['table' => $tableName, 'status' => 'err', 'msg' => $conn->error];
        $allOk = false;
    }
}

// ── Results ───────────────────────────────────────────────────────────────────
$icon = ['ok' => '✅', 'skip' => '⏭️', 'err' => '❌'];
foreach ($results as $r) { ?>
  <div class="result-line <?= $r['status'] ?>">
    <?= $icon[$r['status']] ?> <strong>`<?= htmlspecialchars($r['table']) ?>`</strong>
    — <?= htmlspecialchars($r['msg']) ?>
  </div>
<?php } ?>
<br>

<?php if ($allOk): ?>
  <div class="alert alert-ok">
    ✅ Migration completed successfully! All tables are ready.
  </div>

  <!-- Self-destruct -->
  <form method="POST" action="?token=<?= SECRET_TOKEN ?>&confirm=1&delete=1">
    <button type="submit" class="btn btn-del">🗑 Delete this file now</button>
  </form>
  <span style="font-size:12px;color:#64748b;margin-left:12px;">
    Recommended — removes the migration script from your server.
  </span>
<?php else: ?>
  <div class="alert alert-err">
    ❌ One or more statements failed. Review the errors above and check your DB user permissions.
  </div>
<?php endif;

// ── Handle self-delete ────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['delete'])) {
    $self = __FILE__;
    if (@unlink($self)) { ?>
      <div class="alert alert-ok" style="margin-top:14px;">
        🗑️ <strong>File deleted.</strong> The migration runner has been removed from the server.
      </div>
    <?php } else { ?>
      <div class="alert alert-err" style="margin-top:14px;">
        ⚠️ Could not auto-delete. Please manually delete <code>run_migration.php</code> from the server root.
      </div>
    <?php }
}

exit_card();

function exit_card() {
    echo '</div></body></html>';
    exit;
}

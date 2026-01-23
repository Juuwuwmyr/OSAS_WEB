<?php
// migrate.php - simple migration runner for /migrations folder
// Applies all *.sql and *.php migrations once and records them in `migrations` table.

require_once __DIR__ . '/config/db_connect.php';

header('Content-Type: text/plain; charset=utf-8');

echo "OSAS Migration Runner\n";
echo "====================\n\n";

if (!isset($conn) || ($conn && $conn->connect_error)) {
    echo "❌ Database connection failed. Check config/db_connect.php\n";
    exit(1);
}

$migrationsDir = __DIR__ . '/migrations';
if (!is_dir($migrationsDir)) {
    echo "❌ Migrations folder not found: {$migrationsDir}\n";
    exit(1);
}

// Create migrations tracking table if missing
$createMigrationsTableSql = "
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_migration` (`migration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if (!$conn->query($createMigrationsTableSql)) {
    echo "❌ Failed to ensure migrations table exists: {$conn->error}\n";
    exit(1);
}

// Get current batch
$batch = 1;
$batchRes = $conn->query("SELECT MAX(batch) AS max_batch FROM migrations");
if ($batchRes) {
    $row = $batchRes->fetch_assoc();
    if (!empty($row['max_batch'])) {
        $batch = ((int)$row['max_batch']) + 1;
    }
}

// Load applied migrations set
$applied = [];
$appliedRes = $conn->query("SELECT migration FROM migrations");
if ($appliedRes) {
    while ($r = $appliedRes->fetch_assoc()) {
        $applied[$r['migration']] = true;
    }
}

// Collect migration files
$files = glob($migrationsDir . '/*');
if ($files === false) {
    echo "❌ Failed to read migrations folder\n";
    exit(1);
}

// Sort by filename
sort($files, SORT_STRING);

$pending = [];
foreach ($files as $file) {
    if (!is_file($file)) {
        continue;
    }

    $base = basename($file);
    if ($base === '.gitkeep') {
        continue;
    }

    $ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));
    if (!in_array($ext, ['sql', 'php'], true)) {
        continue;
    }

    if (isset($applied[$base])) {
        continue;
    }

    $pending[] = $file;
}

if (count($pending) === 0) {
    echo "✅ No pending migrations.\n";
    exit(0);
}

echo "Pending migrations (batch {$batch}):\n";
foreach ($pending as $p) {
    echo "- " . basename($p) . "\n";
}
echo "\n";

$appliedCount = 0;
foreach ($pending as $file) {
    $base = basename($file);
    $ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));

    echo "➡️  Applying: {$base}\n";

    $conn->begin_transaction();
    try {
        if ($ext === 'sql') {
            $sql = file_get_contents($file);
            if ($sql === false) {
                throw new Exception('Could not read SQL file');
            }

            // multi_query for files containing multiple statements
            if (!$conn->multi_query($sql)) {
                throw new Exception('SQL error: ' . $conn->error);
            }

            // flush results
            do {
                if ($result = $conn->store_result()) {
                    $result->free();
                }
            } while ($conn->more_results() && $conn->next_result());

            if ($conn->errno) {
                throw new Exception('SQL error: ' . $conn->error);
            }
        } elseif ($ext === 'php') {
            require_once $file;

            // convention: class name equals StudlyCase of filename
            // but since existing migrations already self-handle, we attempt known patterns:
            if ($base === 'add_yearlevel_to_students.php' && class_exists('AddYearlevelToStudents')) {
                $m = new AddYearlevelToStudents($conn);
                if (!$m->up()) {
                    throw new Exception('Migration returned false');
                }
            } elseif ($base === 'add_yearlevel_to_reports.php' && class_exists('AddYearlevelToReports')) {
                $m = new AddYearlevelToReports($conn);
                if (!$m->up()) {
                    throw new Exception('Migration returned false');
                }
            } else {
                throw new Exception('Unsupported PHP migration file (no known runnable class): ' . $base);
            }
        }

        $stmt = $conn->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
        if (!$stmt) {
            throw new Exception('Failed to prepare insert into migrations: ' . $conn->error);
        }
        $stmt->bind_param('si', $base, $batch);
        if (!$stmt->execute()) {
            $stmt->close();
            throw new Exception('Failed to record migration: ' . $stmt->error);
        }
        $stmt->close();

        $conn->commit();
        $appliedCount++;
        echo "✅ Applied: {$base}\n\n";
    } catch (Throwable $e) {
        $conn->rollback();
        echo "❌ Failed: {$base}\n";
        echo "Reason: " . $e->getMessage() . "\n\n";
        exit(1);
    }
}

echo "✅ Done. Applied {$appliedCount} migration(s).\n";

<?php
/**
 * Messages API
 * Direct messaging between admin/staff and students.
 *
 * Actions (GET):
 *   ?action=conversations          — list all conversations for current user
 *   ?action=messages&conv_id=N     — messages in a conversation
 *   ?action=poll&conv_id=N&after=N — new messages after a given message id
 *   ?action=search_students&q=...  — search students (admin only)
 *   ?action=unread_count           — total unread messages for current user
 *
 * Actions (POST):
 *   ?action=send         { conv_id, body }  — send a message
 *   ?action=start        { student_user_id } — start / get a conversation (admin)
 *   ?action=mark_read    { conv_id }         — mark all messages in conv as read
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../app/config/db_connect.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$userId   = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
$userRole = $_SESSION['role'] ?? null;

if (!$userId || !$userRole) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$isAdmin   = in_array($userRole, ['admin', 'OSAS Staff', 'CSC Officer', 'Officer', 'Faculty Member']);
$isStudent = ($userRole === 'user');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input  = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $input['action'] ?? $action;
} else {
    $input = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function ok($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

/**
 * Trigger a push notification to a specific user (by users.id).
 * Silently fails if push is not configured.
 */
function pushToUser(int $targetUserId, string $title, string $body, array $data = []) {
    global $conn;
    try {
        require_once __DIR__ . '/../app/core/Model.php';
        require_once __DIR__ . '/../app/models/PushSubscriptionModel.php';
        require_once __DIR__ . '/../app/services/PushNotificationService.php';

        $push = new PushNotificationService();
        if (!$push->isEnabled()) return;

        // Get subscriptions for this user_id
        $stmt = $conn->prepare(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? LIMIT 10"
        );
        $stmt->bind_param('i', $targetUserId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (empty($rows)) return;

        // Use reflection to call sendToRows (private), or replicate the send logic directly
        // We replicate it here to avoid reflection
        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'icon'  => '/app/assets/img/default.png',
            'badge' => '/app/assets/img/default.png',
            'tag'   => $data['tag'] ?? ('msg-' . time()),
            'data'  => $data,
        ], JSON_UNESCAPED_UNICODE);

        $autoload = realpath(__DIR__ . '/../vendor/autoload.php');
        if (!$autoload) return;
        require_once $autoload;
        if (!class_exists(\Minishlink\WebPush\WebPush::class)) return;

        $cfg = require __DIR__ . '/../app/config/push_config.php';
        $pub  = trim($cfg['vapid']['publicKey']  ?? '');
        $priv = trim($cfg['vapid']['privateKey'] ?? '');
        $sub  = trim($cfg['vapid']['subject']    ?? '');
        if ($pub === '' || $priv === '' || $sub === '') return;

        $webPush = new \Minishlink\WebPush\WebPush([
            'VAPID' => ['subject' => $sub, 'publicKey' => $pub, 'privateKey' => $priv],
        ]);

        $seen = [];
        foreach ($rows as $row) {
            $ep = $row['endpoint'] ?? '';
            if ($ep === '' || isset($seen[$ep])) continue;
            $seen[$ep] = true;
            try {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint' => $ep,
                    'keys' => ['p256dh' => $row['p256dh'], 'auth' => $row['auth']],
                ]);
                $report = $webPush->sendOneNotification($subscription, $payload);
                if (!$report->isSuccess()) {
                    $code = $report->getResponse() ? $report->getResponse()->getStatusCode() : 0;
                    if (in_array($code, [404, 410], true)) {
                        $h = hash('sha256', $ep);
                        $d = $conn->prepare("DELETE FROM push_subscriptions WHERE endpoint_hash=?");
                        $d->bind_param('s', $h); $d->execute(); $d->close();
                    }
                }
            } catch (Throwable $e) {
                error_log('Msg push error: ' . $e->getMessage());
            }
        }
    } catch (Throwable $e) {
        error_log('pushToUser error: ' . $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

switch ($action) {

    // ── List conversations ─────────────────────────────────────────────────
    case 'conversations':
        if ($isAdmin) {
            $stmt = $conn->prepare("
                SELECT c.id, c.student_user_id,
                       u.full_name  AS student_name,
                       COALESCE(s.avatar, u.profile_picture) AS student_avatar,
                       s.student_id AS student_code,
                       s.department, s.year_level,
                       (SELECT dm.body FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                        ORDER BY dm.id DESC LIMIT 1)       AS last_message,
                       (SELECT dm.created_at FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                        ORDER BY dm.id DESC LIMIT 1)       AS last_at,
                       (SELECT COUNT(*) FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                          AND dm.sender_id != ? AND dm.is_read = 0) AS unread
                FROM conversations c
                INNER JOIN users u ON u.id = c.student_user_id
                LEFT JOIN students s ON s.student_id = u.student_id
                WHERE c.admin_user_id = ?
                ORDER BY last_at DESC, c.id DESC
            ");
            $stmt->bind_param('ii', $userId, $userId);
        } else {
            // Student: see all conversations where they are the student side
            $stmt = $conn->prepare("
                SELECT c.id, c.admin_user_id,
                       u.full_name  AS admin_name,
                       u.profile_picture AS admin_avatar,
                       (SELECT dm.body FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                        ORDER BY dm.id DESC LIMIT 1)       AS last_message,
                       (SELECT dm.created_at FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                        ORDER BY dm.id DESC LIMIT 1)       AS last_at,
                       (SELECT COUNT(*) FROM direct_messages dm
                        WHERE dm.conversation_id = c.id
                          AND dm.sender_id != ? AND dm.is_read = 0) AS unread
                FROM conversations c
                INNER JOIN users u ON u.id = c.admin_user_id
                WHERE c.student_user_id = ?
                ORDER BY last_at DESC, c.id DESC
            ");
            $stmt->bind_param('ii', $userId, $userId);
        }
        $stmt->execute();
        $convs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        ok(['conversations' => $convs]);

    // ── Start / get conversation (admin only) ─────────────────────────────
    case 'start':
        if (!$isAdmin) fail('Admin only', 403);
        $studentUserId = isset($input['student_user_id']) ? (int) $input['student_user_id'] : 0;
        if (!$studentUserId) fail('student_user_id required');

        // Verify the target is a student
        $chk = $conn->prepare("SELECT id FROM users WHERE id = ? AND role = 'user' LIMIT 1");
        $chk->bind_param('i', $studentUserId);
        $chk->execute();
        if (!$chk->get_result()->fetch_assoc()) fail('Student not found', 404);
        $chk->close();

        // Get or create conversation
        $stmt = $conn->prepare(
            "SELECT id FROM conversations WHERE admin_user_id = ? AND student_user_id = ? LIMIT 1"
        );
        $stmt->bind_param('ii', $userId, $studentUserId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($row) {
            ok(['conv_id' => (int) $row['id'], 'created' => false]);
        }

        $ins = $conn->prepare(
            "INSERT INTO conversations (admin_user_id, student_user_id) VALUES (?, ?)"
        );
        $ins->bind_param('ii', $userId, $studentUserId);
        $ins->execute();
        $convId = (int) $conn->insert_id;
        $ins->close();
        ok(['conv_id' => $convId, 'created' => true]);

    // ── Load messages in a conversation ───────────────────────────────────
    case 'messages':
        $convId = isset($_GET['conv_id']) ? (int) $_GET['conv_id'] : 0;
        if (!$convId) fail('conv_id required');

        if (!canAccessConv($conn, $convId, $userId, $isAdmin)) fail('Not authorized', 403);

        $stmt = $conn->prepare("
            SELECT dm.id, dm.sender_id, dm.body, dm.is_read, dm.created_at,
                   u.full_name AS sender_name, u.role AS sender_role
            FROM direct_messages dm
            INNER JOIN users u ON u.id = dm.sender_id
            WHERE dm.conversation_id = ?
            ORDER BY dm.id ASC
            LIMIT 200
        ");
        $stmt->bind_param('i', $convId);
        $stmt->execute();
        $msgs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Auto-mark as read
        $markStmt = $conn->prepare(
            "UPDATE direct_messages SET is_read = 1
             WHERE conversation_id = ? AND sender_id != ? AND is_read = 0"
        );
        $markStmt->bind_param('ii', $convId, $userId);
        $markStmt->execute();
        $markStmt->close();

        ok(['messages' => $msgs]);

    // ── Poll for new messages (lightweight, called every 3s) ──────────────
    case 'poll':
        $convId  = isset($_GET['conv_id'])  ? (int) $_GET['conv_id']  : 0;
        $afterId = isset($_GET['after'])    ? (int) $_GET['after']    : 0;
        if (!$convId) fail('conv_id required');

        if (!canAccessConv($conn, $convId, $userId, $isAdmin)) fail('Not authorized', 403);

        $stmt = $conn->prepare("
            SELECT dm.id, dm.sender_id, dm.body, dm.is_read, dm.created_at,
                   u.full_name AS sender_name, u.role AS sender_role
            FROM direct_messages dm
            INNER JOIN users u ON u.id = dm.sender_id
            WHERE dm.conversation_id = ? AND dm.id > ?
            ORDER BY dm.id ASC
            LIMIT 50
        ");
        $stmt->bind_param('ii', $convId, $afterId);
        $stmt->execute();
        $msgs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (!empty($msgs)) {
            $markStmt = $conn->prepare(
                "UPDATE direct_messages SET is_read = 1
                 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0"
            );
            $markStmt->bind_param('ii', $convId, $userId);
            $markStmt->execute();
            $markStmt->close();
        }

        ok(['messages' => $msgs]);

    // ── Send a message ─────────────────────────────────────────────────────
    case 'send':
        $convId = isset($input['conv_id']) ? (int) $input['conv_id'] : 0;
        $body   = trim($input['body'] ?? '');
        if (!$convId) fail('conv_id required');
        if ($body === '')  fail('body required');
        if (mb_strlen($body) > 5000) fail('Message too long');

        if (!canAccessConv($conn, $convId, $userId, $isAdmin)) fail('Not authorized', 403);

        // Insert the message
        $ins = $conn->prepare(
            "INSERT INTO direct_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)"
        );
        $ins->bind_param('iis', $convId, $userId, $body);
        $ins->execute();
        $msgId = (int) $conn->insert_id;
        $ins->close();

        // Touch conversation updated_at
        $upd = $conn->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?");
        $upd->bind_param('i', $convId); $upd->execute(); $upd->close();

        // Get conversation participants to figure out who to notify
        $conv = getConvRow($conn, $convId);
        $recipientId = ($userId === (int) $conv['admin_user_id'])
            ? (int) $conv['student_user_id']
            : (int) $conv['admin_user_id'];

        // Sender's display name
        $nameStmt = $conn->prepare("SELECT full_name FROM users WHERE id = ? LIMIT 1");
        $nameStmt->bind_param('i', $userId);
        $nameStmt->execute();
        $nameRow = $nameStmt->get_result()->fetch_assoc();
        $nameStmt->close();
        $senderName = $nameRow['full_name'] ?? 'OSAS';

        // Push notify recipient
        $pushPage = $isAdmin
            ? 'user-page/messages'          // student receives → open their messages
            : 'admin_page/Messages';        // admin receives → open admin messages
        pushToUser($recipientId, '💬 ' . $senderName, $body, [
            'tag'  => 'msg-conv-' . $convId,
            'page' => $pushPage,
            'conv_id' => $convId,
        ]);

        ok(['msg_id' => $msgId, 'sent_at' => date('Y-m-d H:i:s')]);

    // ── Mark all messages in a conv as read ───────────────────────────────
    case 'mark_read':
        $convId = isset($input['conv_id']) ? (int) $input['conv_id'] : 0;
        if (!$convId) fail('conv_id required');
        if (!canAccessConv($conn, $convId, $userId, $isAdmin)) fail('Not authorized', 403);

        $stmt = $conn->prepare(
            "UPDATE direct_messages SET is_read = 1
             WHERE conversation_id = ? AND sender_id != ? AND is_read = 0"
        );
        $stmt->bind_param('ii', $convId, $userId);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        ok(['marked' => $affected]);

    // ── Total unread count across all conversations ────────────────────────
    case 'unread_count':
        if ($isAdmin) {
            $stmt = $conn->prepare("
                SELECT COUNT(*) AS cnt
                FROM direct_messages dm
                INNER JOIN conversations c ON c.id = dm.conversation_id
                WHERE c.admin_user_id = ? AND dm.sender_id != ? AND dm.is_read = 0
            ");
        } else {
            $stmt = $conn->prepare("
                SELECT COUNT(*) AS cnt
                FROM direct_messages dm
                INNER JOIN conversations c ON c.id = dm.conversation_id
                WHERE c.student_user_id = ? AND dm.sender_id != ? AND dm.is_read = 0
            ");
        }
        $stmt->bind_param('ii', $userId, $userId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        ok(['unread' => (int) ($row['cnt'] ?? 0)]);

    // ── Search students (admin only) ──────────────────────────────────────
    case 'search_students':
        if (!$isAdmin) fail('Admin only', 403);
        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 1) ok(['students' => []]);

        $like = '%' . $conn->real_escape_string($q) . '%';
        $stmt = $conn->prepare("
            SELECT u.id AS user_id, u.full_name, u.student_id AS student_code,
                   s.department, s.year_level,
                   COALESCE(s.avatar, u.profile_picture) AS avatar,
                   s.section_id
            FROM users u
            LEFT JOIN students s ON s.student_id = u.student_id
            WHERE u.role = 'user' AND u.is_active = 1
              AND (u.full_name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ?)
            ORDER BY u.full_name ASC
            LIMIT 20
        ");
        $stmt->bind_param('sss', $like, $like, $like);
        $stmt->execute();
        $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        ok(['students' => $students]);

    default:
        fail('Unknown action');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function canAccessConv($conn, int $convId, int $userId, bool $isAdmin): bool {
    $stmt = $conn->prepare(
        "SELECT id, admin_user_id, student_user_id FROM conversations WHERE id = ? LIMIT 1"
    );
    $stmt->bind_param('i', $convId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) return false;
    return ($userId === (int) $row['admin_user_id'] || $userId === (int) $row['student_user_id']);
}

function getConvRow($conn, int $convId): array {
    $stmt = $conn->prepare("SELECT * FROM conversations WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $convId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?? [];
}

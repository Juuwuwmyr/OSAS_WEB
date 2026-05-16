<?php
require_once __DIR__ . '/../core/Model.php';

class PushSubscriptionModel extends Model
{
    protected $table = 'push_subscriptions';

    public function upsert($userId, array $subscription, $userAgent = null)
    {
        $endpoint = $subscription['endpoint'] ?? '';
        $keys = $subscription['keys'] ?? [];
        $p256dh = $keys['p256dh'] ?? '';
        $auth = $keys['auth'] ?? '';
        if ($endpoint === '' || $p256dh === '' || $auth === '') {
            throw new InvalidArgumentException('Invalid push subscription');
        }

        $hash = hash('sha256', $endpoint);
        $existing = $this->query('SELECT id FROM push_subscriptions WHERE endpoint_hash = ? LIMIT 1', [$hash]);

        if (!empty($existing)) {
            $id = (int) $existing[0]['id'];
            $stmt = $this->conn->prepare(
                'UPDATE push_subscriptions SET user_id=?, endpoint=?, p256dh=?, auth=?, user_agent=?, updated_at=NOW() WHERE id=?'
            );
            $stmt->bind_param('issssi', $userId, $endpoint, $p256dh, $auth, $userAgent, $id);
            $stmt->execute();
            $stmt->close();
            return $id;
        }

        $stmt = $this->conn->prepare(
            'INSERT INTO push_subscriptions (user_id, endpoint_hash, endpoint, p256dh, auth, user_agent) VALUES (?,?,?,?,?,?)'
        );
        $stmt->bind_param('isssss', $userId, $hash, $endpoint, $p256dh, $auth, $userAgent);
        $stmt->execute();
        $id = (int) $stmt->insert_id;
        $stmt->close();
        return $id;
    }

    public function removeForUser($userId, $endpoint)
    {
        $hash = hash('sha256', $endpoint);
        $stmt = $this->conn->prepare('DELETE FROM push_subscriptions WHERE user_id=? AND endpoint_hash=?');
        $stmt->bind_param('is', $userId, $hash);
        $stmt->execute();
        $stmt->close();
    }

    public function getAllStudentSubscriptions()
    {
        return $this->query(
            "SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps
             INNER JOIN users u ON u.id = ps.user_id
             WHERE u.role = 'user' AND u.is_active = 1"
        );
    }

    public function getSubscriptionsForStudentId($studentId)
    {
        return $this->query(
            "SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps
             INNER JOIN users u ON u.id = ps.user_id
             WHERE u.role = 'user' AND u.is_active = 1 AND BINARY u.student_id = BINARY ?
             LIMIT 20",
            [$studentId]
        );
    }

    public function deleteByEndpoint($endpoint)
    {
        $hash = hash('sha256', $endpoint);
        $stmt = $this->conn->prepare('DELETE FROM push_subscriptions WHERE endpoint_hash=?');
        $stmt->bind_param('s', $hash);
        $stmt->execute();
        $stmt->close();
    }
}

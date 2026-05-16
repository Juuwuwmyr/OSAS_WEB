<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/PushSubscriptionModel.php';
require_once __DIR__ . '/../services/PushNotificationService.php';

class PushController extends Controller
{
    private $push;
    private $subs;

    public function __construct()
    {
        @session_start();
        $this->push = new PushNotificationService();
        $this->subs = new PushSubscriptionModel();
    }

    public function vapidPublicKey()
    {
        $key = $this->push->getPublicKey();
        if ($key === '') $this->error('Push not configured', '', 503);
        $this->success('VAPID public key', ['publicKey' => $key]);
    }

    public function subscribe()
    {
        $this->requireStudent();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) $this->error('Invalid JSON');
        $id = $this->subs->upsert((int) $_SESSION['user_id'], $input, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 512));
        $this->success('Subscribed', ['id' => $id]);
    }

    public function unsubscribe()
    {
        $this->requireStudent();
        $input = json_decode(file_get_contents('php://input'), true);
        $ep = is_array($input) ? ($input['endpoint'] ?? '') : '';
        if ($ep === '') $this->error('Endpoint required');
        $this->subs->removeForUser((int) $_SESSION['user_id'], $ep);
        $this->success('Unsubscribed');
    }

    private function requireStudent()
    {
        if (($_SESSION['role'] ?? '') !== 'user' || empty($_SESSION['user_id'])) {
            $this->error('Student login required', '', 401);
        }
    }
}

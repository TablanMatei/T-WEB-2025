<?php
require_once '../config.php';
require_once 'jwt.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Verifică JWT token
    $payload = verifyJWT();
    $user_id = $payload['user_id'];

    $pdo = getDbConnection();

    // Log logout activity
    $logStmt = $pdo->prepare("
        INSERT INTO user_activity_log (user_id, activity_type, activity_time) 
        VALUES (?, 'logout', CURRENT_TIMESTAMP)
    ");
    $logStmt->execute([$user_id]);

    // Adaugă tokenul în blacklist
    $authHeader = getallheaders()['Authorization'] ?? '';
    $token = substr($authHeader, 7);
    $expires_at = date('Y-m-d H:i:s', $payload['exp']);

    $blacklistStmt = $pdo->prepare("
        INSERT INTO jwt_blacklist (token, expires_at) VALUES (?, ?)
    ");
    $blacklistStmt->execute([$token, $expires_at]);

    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully',
        'logout_time' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    // Chiar dacă token-ul e invalid, logout-ul e "reușit"
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully',
        'logout_time' => date('Y-m-d H:i:s')
    ]);
}
?>
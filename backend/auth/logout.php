<?php
require_once '../config.php';
/** @var PDO $pdo */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

if (isset($_SESSION['user_id'])) {
    try {
        $user_id = $_SESSION['user_id'];
        $current_time = date('Y-m-d H:i:s');

        // Actualizează ultima deconectare
        $updateStmt = $pdo->prepare("UPDATE users SET last_logout = CURRENT_TIMESTAMP WHERE user_id = ?");
        $updateStmt->execute([$user_id]);

        // Creează log de audit pentru logout
        $logStmt = $pdo->prepare("INSERT INTO user_activity_log (user_id, activity_type, activity_time) VALUES (?, 'logout', CURRENT_TIMESTAMP)");
        $logStmt->execute([$user_id]);

        $message = 'Logged out successfully';
        $logout_time = $current_time;

    } catch (Exception $e) {
        error_log("Logout error: " . $e->getMessage());
        $message = 'Logged out successfully';
        $logout_time = date('Y-m-d H:i:s');
    }
} else {
    $message = 'Logged out successfully';
    $logout_time = date('Y-m-d H:i:s');
}

session_destroy();
echo json_encode([
    'success' => true,
    'message' => $message,
    'logout_time' => $logout_time
]);
?>
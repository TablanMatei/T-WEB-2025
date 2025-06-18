<?php
require_once '../config.php';
/** @var PDO $pdo */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

try {
    // Verifică dacă utilizatorul este autentificat
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'User not authenticated'
        ]);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['notification_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Notification ID is required'
        ]);
        exit;
    }

    $notification_id = $input['notification_id'];

    // Marchează notificarea ca citită
    $stmt = $pdo->prepare("
        UPDATE notifications 
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$notification_id, $user_id]);
    $affected_rows = $stmt->rowCount();

    if ($affected_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Notification not found or access denied',
            'remaining_unread' => 0
        ]);
        exit;
    }

    // Obține numărul de notificări necitite rămase
    $unread_stmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE");
    $unread_stmt->execute([$user_id]);
    $unread_result = $unread_stmt->fetch(PDO::FETCH_ASSOC);
    $unread_count = $unread_result['unread_count'];

    echo json_encode([
        'success' => true,
        'message' => 'Notification marked as read',
        'remaining_unread' => $unread_count
    ]);

} catch (PDOException $e) {
    error_log("Database error in mark_notification_read.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("General error in mark_notification_read.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred'
    ]);
}
?>
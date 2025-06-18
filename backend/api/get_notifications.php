<?php
require_once '../config.php';
/** @var PDO $pdo */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
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

    // Obține numărul de notificări necitite
    $unread_stmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE");
    $unread_stmt->execute([$user_id]);
    $unread_result = $unread_stmt->fetch(PDO::FETCH_ASSOC);
    $unread_count = $unread_result['unread_count'];

    // Query pentru a obține notificările utilizatorului
    $stmt = $pdo->prepare("
        SELECT n.id, n.user_id, n.type, n.message, n.is_read, n.created_at,
               CASE 
                   WHEN n.type = 'welcome' THEN 1
                   WHEN n.type = 'group_joined' THEN 2
                   WHEN n.type = 'profile_update' THEN 3
                   ELSE 4
               END as priority,
               ? as unread_count
        FROM notifications n
        WHERE n.user_id = ?
        ORDER BY n.is_read ASC, n.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$unread_count, $user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);

} catch (PDOException $e) {
    error_log("Database error in get_notifications.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("General error in get_notifications.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching notifications'
    ]);
}
?>
<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
require_once '../config.php';
//require_once '../config/database.php';
/** @var PDO $pdo */

// Verifică sesiunea (similar cu logout.php)
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT user_id, username, real_name, email, description, 
               birthdate, gender, location, pronouns, website, 
               profile_picture, created_at 
        FROM users 
        WHERE user_id = ?
    ");

    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>

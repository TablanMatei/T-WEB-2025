<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

//require_once '../config/database.php';
require_once '../config.php';
/** @var PDO $pdo */

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

// Citește JSON data (exact ca în register.php)
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];

    // Prepare update query (similar cu register.php)
    $stmt = $pdo->prepare("
        UPDATE users SET 
            username = ?, 
            real_name = ?, 
            description = ?, 
            location = ?, 
            birthdate = ?, 
            pronouns = ?, 
            website = ?
        WHERE user_id = ?
    ");

    $stmt->execute([
        $input['username'],
        $input['real_name'],
        $input['description'],
        $input['location'],
        $input['birthdate'],
        $input['pronouns'],
        $input['website'],
        $user_id
    ]);

    // Returnează datele actualizate (similar cu login.php)
    $stmt = $pdo->prepare("
        SELECT user_id, username, real_name, email, description, 
               birthdate, gender, location, pronouns, website, 
               profile_picture, created_at 
        FROM users 
        WHERE user_id = ?
    ");

    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => $user
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>

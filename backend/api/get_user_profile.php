<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:9000');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
require_once '../config.php';

$pdo = getDbConnection();

// Primește user_id din POST în loc de sesiune
$input = json_decode(file_get_contents('php://input'), true);
$user_id = isset($input['user_id']) ? $input['user_id'] : null;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT user_id, username, real_name, email, description, 
               birthdate, gender, location, pronouns, website, 
               profile_picture, updated_at 
        FROM users 
        WHERE user_id = ?
    ");

    $stmt->execute([$user_id]);
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
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
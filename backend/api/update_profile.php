<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:9000');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

require_once '../config.php';
$pdo = getDbConnection();

// Citește JSON data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Verifică user_id în loc de sesiune
if (!isset($input['user_id']) || empty($input['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

try {
    $user_id = $input['user_id'];

    // Verifică dacă userul există
    $checkStmt = $pdo->prepare("SELECT user_id FROM users WHERE user_id = ?");
    $checkStmt->execute([$user_id]);

    if (!$checkStmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    // Verifică dacă username-ul este deja folosit de alt user
    if (!empty($input['username'])) {
        $usernameCheckStmt = $pdo->prepare("SELECT 1 FROM users WHERE username = ? AND user_id != ?");
        $usernameCheckStmt->execute([$input['username'], $user_id]);

        if ($usernameCheckStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'error' => 'Username already exists'
            ]);
            exit;
        }
    }

    // Update user
    $updateStmt = $pdo->prepare("
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

    $updateStmt->execute([
        isset($input['username']) ? $input['username'] : '',
        isset($input['real_name']) ? $input['real_name'] : '',
        isset($input['description']) ? $input['description'] : '',
        isset($input['location']) ? $input['location'] : '',
        !empty($input['birthdate']) ? $input['birthdate'] : null,
        isset($input['pronouns']) ? $input['pronouns'] : '',
        isset($input['website']) ? $input['website'] : '',
        $user_id
    ]);

    // Returnează datele actualizate
    $selectStmt = $pdo->prepare("
        SELECT user_id, username, real_name, email, description, 
               birthdate, gender, location, pronouns, website, 
               profile_picture, updated_at
        FROM users 
        WHERE user_id = ?
    ");
    $selectStmt->execute([$user_id]);
    $user_data = $selectStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => $user_data
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
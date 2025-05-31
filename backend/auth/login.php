<?php
require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Folosește funcția din config.php
    $pdo = getDbConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim(isset($input['username']) ? $input['username'] : '');
    $password = isset($input['password']) ? $input['password'] : '';

    if (empty($username) || empty($password)) {
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT user_id, username, email, password FROM users WHERE username = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    if (password_verify($password, $user['password'])) {
        // Login reușit
        echo json_encode([
            'success' => true,
            'user' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email']
            ]
        ]);
    } else {
        echo json_encode(['error' => 'Invalid credentials']);
    }

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
}
?>
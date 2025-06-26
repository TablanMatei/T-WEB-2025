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
    $pdo = getDbConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim(isset($input['username']) ? $input['username'] : '');
    $password = isset($input['password']) ? $input['password'] : '';

    if (empty($username) || empty($password)) {
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }

    // Obține datele utilizatorului
    $stmt = $pdo->prepare("
        SELECT u.user_id, u.username, u.email, u.password, u.role
        FROM users u 
        WHERE u.username = ? OR u.email = ?
    ");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    // Verifică parola
    if (password_verify($password, $user['password'])) {
        // Creează JWT payload
        $payload = [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(), // issued at
            'exp' => time() + JWT_EXPIRATION // expires
        ];

        // Generează JWT token
        $token = SimpleJWT::encode($payload, JWT_SECRET);

        // Log successful login
        try {
            $logStmt = $pdo->prepare("
                INSERT INTO user_activity_log (user_id, activity_type, activity_time) 
                VALUES (?, 'login', CURRENT_TIMESTAMP)
            ");
            $logStmt->execute([$user['user_id']]);
        } catch (Exception $e) {
            error_log("Login log error: " . $e->getMessage());
        }

        // Răspuns de succes
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role']
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
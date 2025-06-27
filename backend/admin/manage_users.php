<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
require_once '../auth/jwt.php';

// Verifică autentificarea JWT
$user = requireAuth();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Obține lista utilizatorilor
            $stmt = $pdo->prepare("
                SELECT user_id, username, email, role, real_name, updated_at 
                FROM users 
                ORDER BY username ASC
            ");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'users' => $users
            ]);
            break;

        case 'POST':
            // Actualizează rolul utilizatorului
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['user_id'] ?? null;
            $newRole = $input['role'] ?? null;

            if (!$userId || !in_array($newRole, ['user', 'admin'])) {
                throw new Exception('Invalid user ID or role');
            }

            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE user_id = ?");
            $stmt->execute([$newRole, $userId]);

            echo json_encode([
                'success' => true,
                'message' => 'User role updated successfully'
            ]);
            break;

        case 'DELETE':
            // Șterge utilizator
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['user_id'] ?? null;

            if (!$userId) {
                throw new Exception('User ID required');
            }

            // Nu permite ștergerea propriului cont
            if ($userId == $user['user_id']) {
                throw new Exception('Cannot delete your own account');
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);

            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
            break;
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
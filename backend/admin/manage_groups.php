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
            // Obține lista grupurilor cu numărul de membri
            $stmt = $pdo->prepare("
                SELECT g.id, g.name, g.description, g.created_at,
                       COUNT(gm.user_id) as member_count,
                       u.username as creator_name
                FROM groups g
                LEFT JOIN group_members gm ON g.id = gm.group_id
                LEFT JOIN users u ON g.created_by = u.user_id
                GROUP BY g.id, g.name, g.description, g.created_at, u.username
                ORDER BY g.created_at DESC
            ");
            $stmt->execute();
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'groups' => $groups
            ]);
            break;

        case 'DELETE':
            // Șterge grup
            $input = json_decode(file_get_contents('php://input'), true);
            $groupId = $input['group_id'] ?? null;

            if (!$groupId) {
                throw new Exception('Group ID required');
            }

            // Șterge mai întâi membrii grupului
            $stmt = $pdo->prepare("DELETE FROM group_members WHERE group_id = ?");
            $stmt->execute([$groupId]);

            // Apoi șterge grupul
            $stmt = $pdo->prepare("DELETE FROM groups WHERE id = ?");
            $stmt->execute([$groupId]);

            echo json_encode([
                'success' => true,
                'message' => 'Group deleted successfully'
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
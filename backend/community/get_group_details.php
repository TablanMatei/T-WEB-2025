<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
$pdo = getDbConnection();

if (!isset($_GET['group_id'])) {
    echo json_encode(['success' => false, 'error' => 'Group ID required']);
    exit;
}

$groupId = $_GET['group_id'];

try {
    // Obține detaliile grupului
    $groupStmt = $pdo->prepare("
        SELECT g.id, g.name, g.description, g.genres, g.min_age, g.max_age,
               g.created_at, g.is_private, u.username as creator_name, 
               u.real_name as creator_real_name, COUNT(gm.user_id) as total_members
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.user_id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE g.id = ?
        GROUP BY g.id, g.name, g.description, g.genres, g.min_age, g.max_age, 
                 g.created_at, g.is_private, u.username, u.real_name
    ");
    $groupStmt->execute([$groupId]);
    $group = $groupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$group) {
        echo json_encode(['success' => false, 'error' => 'Group not found']);
        exit;
    }

    // Obține membrii grupului
    $membersStmt = $pdo->prepare("
        SELECT u.username, u.real_name, gm.role, gm.joined_at
        FROM group_members gm
        JOIN users u ON gm.user_id = u.user_id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC
    ");
    $membersStmt->execute([$groupId]);
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'group' => $group,
        'members' => $members
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

// Folosește funcția din config.php pentru a obține conexiunea
$pdo = getDbConnection();

try {
    // Query pentru a obține grupurile cu informații despre creator și numărul de membri
    $stmt = $pdo->prepare("
        SELECT g.id, g.name, g.description, g.created_at, g.is_private,
               u.username as creator_name, COUNT(gm.user_id) as member_count,
               MAX(gm.joined_at) as recent_activity
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.user_id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        GROUP BY g.id, g.name, g.description, g.created_at, g.is_private, u.username
        ORDER BY g.created_at DESC
    ");

    $stmt->execute();
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'groups' => $groups
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
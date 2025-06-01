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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name']) || !isset($input['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Pentru PostgreSQL, convertește boolean la string
    $isPrivate = isset($input['is_private']) && $input['is_private'] ? 'true' : 'false';

    // Inserează grupul
    $sql = "INSERT INTO groups (name, description, created_by, is_private) VALUES (?, ?, ?, ?::boolean)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['name'],
        isset($input['description']) ? $input['description'] : '',
        $input['user_id'],
        $isPrivate
    ]);

    $groupId = $pdo->lastInsertId();

    // Adaugă creatorul ca membru cu rol de admin
    $sql = "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$groupId, $input['user_id']]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'group_id' => $groupId,
        'message' => 'Group created successfully'
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
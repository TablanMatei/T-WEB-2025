<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
/** @var PDO $pdo */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['group_id']) || !isset($input['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Verifică dacă utilizatorul este deja membru
    $sql = "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['group_id'], $input['user_id']]);

    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Already a member of this group']);
        exit;
    }

    // Adaugă utilizatorul la grup
    $sql = "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['group_id'], $input['user_id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Successfully joined the group'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
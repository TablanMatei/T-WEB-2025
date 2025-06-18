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
    $checkMemberStmt = $pdo->prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?");
    $checkMemberStmt->execute([$input['group_id'], $input['user_id']]);

    if ($checkMemberStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'error' => 'Already a member of this group'
        ]);
        exit;
    }

    // Adaugă utilizatorul în grup
    $insertMemberStmt = $pdo->prepare("
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES (?, ?, 'member', CURRENT_TIMESTAMP)
    ");
    $insertMemberStmt->execute([$input['group_id'], $input['user_id']]);

    // Inserează notificarea
    $insertNotificationStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, message, created_at)
        VALUES (?, 'group_joined', 'You have successfully joined a reading group!', CURRENT_TIMESTAMP)
    ");
    $insertNotificationStmt->execute([$input['user_id']]);

    // Obține informații despre grup pentru debug
    $groupStmt = $pdo->prepare("SELECT name, member_count FROM groups WHERE id = ?");
    $groupStmt->execute([$input['group_id']]);
    $group = $groupStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Successfully joined the group',
        'debug_member_count' => $group['member_count']  // TRIGGER
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
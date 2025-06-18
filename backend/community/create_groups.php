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

if (!isset($input['name']) || !isset($input['description']) || !isset($input['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Extrage genurile și vârsta din descriere
    $description = $input['description'];
    $genres = '';
    $minAge = null;
    $maxAge = null;
    $cleanDescription = $description;

    // Extrage genurile (caută "Preferred Genres: ...")
    if (preg_match('/Preferred Genres:\s*([^\n\r]+)/', $description, $matches)) {
        $genres = trim($matches[1]);
        $cleanDescription = str_replace($matches[0], '', $cleanDescription);
    }

    // Extrage vârsta (caută "Age Range: X - Y")
    if (preg_match('/Age Range:\s*(\d+)\s*-\s*(\d+)/', $description, $matches)) {
        $minAge = (int)$matches[1];
        $maxAge = (int)$matches[2];
        $cleanDescription = str_replace($matches[0], '', $cleanDescription);
    }

    // Curăță descrierea de spații extra
    $cleanDescription = trim(preg_replace('/\s+/', ' ', $cleanDescription));

    // Inserează grupul în baza de date
    $insertGroupStmt = $pdo->prepare("
        INSERT INTO groups (name, description, created_by, genres, min_age, max_age, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");
    $insertGroupStmt->execute([
        $input['name'],
        $cleanDescription,
        $input['user_id'],
        $genres,
        $minAge,
        $maxAge
    ]);

    // Obține ID-ul grupului nou creat
    $group_id = $pdo->lastInsertId();

    // Adaugă creatorul ca admin al grupului
    $insertMemberStmt = $pdo->prepare("
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES (?, ?, 'admin', CURRENT_TIMESTAMP)
    ");
    $insertMemberStmt->execute([$group_id, $input['user_id']]);

    // Inserează notificarea
    $insertNotificationStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, message, created_at)
        VALUES (?, 'group_created', 'Your reading group has been created successfully!', CURRENT_TIMESTAMP)
    ");
    $insertNotificationStmt->execute([$input['user_id']]);

    echo json_encode([
        'success' => true,
        'group_id' => $group_id,
        'message' => 'Group created successfully'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
<?php
header('Content-Type: application/json');
include_once '../config.php';
/** @var PDO $pdo */
$input = json_decode(file_get_contents('php://input'), true);
$user_id = isset($input['user_id']) ? $input['user_id'] : null;
$book_id = isset($input['book_id']) ? $input['book_id'] : null;
$status = isset($input['status']) ? $input['status'] : null;

if (!$user_id || !$book_id || !$status) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verifică dacă există deja o înregistrare
    $stmt = $pdo->prepare("SELECT id FROM user_book_status WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user_id, $book_id]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare("UPDATE user_book_status SET status = ?, date_updated = NOW() WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$status, $user_id, $book_id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO user_book_status (user_id, book_id, status, date_added, date_updated) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->execute([$user_id, $book_id, $status]);
    }

    echo json_encode(['success' => true]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
<?php
header('Content-Type: application/json');
include_once('../config.php');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['book_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$user_id = $input['user_id'];
$book_id = $input['book_id'];

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("DELETE FROM user_book_status WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user_id, $book_id]);

    echo json_encode(['success' => true]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

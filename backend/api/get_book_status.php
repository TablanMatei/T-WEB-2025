<?php
header('Content-Type: application/json');
include_once '../config.php';
/** @var PDO $pdo */
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$book_id = isset($_GET['book_id']) ? $_GET['book_id'] : null;

if (!$user_id || !$book_id) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT status FROM user_book_status WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user_id, $book_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode(['success' => true, 'status' => $result['status']]);
    } else {
        echo json_encode(['success' => true, 'status' => null]);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
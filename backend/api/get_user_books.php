<?php
header('Content-Type: application/json');
include_once('../config.php');

if (!isset($_GET['user_id']) || !isset($_GET['status'])) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$user_id = $_GET['user_id'];
$status = $_GET['status'];

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT b.*, ubs.status, ubs.date_added, ubs.rating, ubs.review
        FROM user_book_status ubs
       JOIN books b ON ubs.book_id = b.book_id
        WHERE ubs.user_id = ? AND ubs.status = ?
        ORDER BY ubs.date_added DESC
    ");
    $stmt->execute([$user_id, $status]);
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'books' => $books]);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

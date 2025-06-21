<?php
require_once '../config.php';
header('Content-Type: application/json');

if (!isset($_GET['author_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing author_id']);
    exit;
}

$authorId = intval($_GET['author_id']);
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT 
            b.book_id,
            b.title,
            b.year,
            b.genre,
            ROUND(AVG(ubs.rating), 2) AS avg_rating
        FROM books b
        JOIN book_authors ba ON b.book_id = ba.book_id
        LEFT JOIN user_book_status ubs ON b.book_id = ubs.book_id
        WHERE ba.author_id = ?
        GROUP BY b.book_id
        ORDER BY avg_rating DESC
        LIMIT ?
    ");
    $stmt->execute([$authorId, $limit]);
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'books' => $books]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

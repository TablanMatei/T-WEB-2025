<?php
require_once '../config.php';
header('Content-Type: application/json');

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("
        SELECT 
            b.book_id,
            b.title,
            b.year,
            b.genre,
            a.name AS author_name,
            ROUND(AVG(ubs.rating), 2) as avg_rating
        FROM user_book_status ubs
        JOIN books b ON ubs.book_id = b.book_id
        JOIN book_authors ba ON ba.book_id = b.book_id
        JOIN authors a ON a.author_id = ba.author_id
        WHERE ubs.rating IS NOT NULL
        GROUP BY b.book_id, a.name
        ORDER BY avg_rating DESC, COUNT(*) DESC
        LIMIT 5
    ");

    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'books' => $books]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

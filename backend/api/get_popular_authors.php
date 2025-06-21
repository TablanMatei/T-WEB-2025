<?php
require_once '../config.php';
header('Content-Type: application/json');

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("
        SELECT 
            a.author_id,
            a.name,
            COUNT(ubs.rating) AS total_ratings,
            ROUND(AVG(ubs.rating), 2) AS avg_rating
        FROM user_book_status ubs
        JOIN books b ON ubs.book_id = b.book_id
        JOIN book_authors ba ON b.book_id = ba.book_id
        JOIN authors a ON ba.author_id = a.author_id
        WHERE ubs.rating IS NOT NULL
        GROUP BY a.author_id, a.name
        ORDER BY total_ratings DESC, avg_rating DESC
        LIMIT 5
    ");

    $authors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'authors' => $authors]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

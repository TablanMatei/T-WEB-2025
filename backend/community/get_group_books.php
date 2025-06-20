<?php
require_once '../config.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    $pdo = getDbConnection();

    $group_id = $_GET['group_id'] ?? null;

    if (!$group_id) {
        jsonResponse(['success' => false, 'error' => 'Group ID is required'], 400);
    }

    // Get books that have been read by at least 2 members of the group
    $stmt = $pdo->prepare("
        SELECT 
            b.book_id,
            b.title,
            b.year,
            b.publisher,
            b.genre,
            STRING_AGG(DISTINCT a.name, ', ') as author,
            COUNT(DISTINCT ubs.user_id) as reader_count,
            STRING_AGG(DISTINCT u.username, ', ') as readers,
            ROUND(AVG(CASE WHEN ubs.rating > 0 THEN ubs.rating END), 1) as avg_rating,
            COUNT(CASE WHEN ubs.rating > 0 THEN 1 END) as rating_count,
            STRING_AGG(
                CASE 
                    WHEN ubs.review IS NOT NULL AND ubs.review != '' 
                    THEN u.username || ': ' || ubs.review 
                END, 
                ' | '
            ) as reviews
        FROM books b
        INNER JOIN book_authors ba ON b.book_id = ba.book_id
        INNER JOIN authors a ON ba.author_id = a.author_id
        INNER JOIN user_book_status ubs ON b.book_id = ubs.book_id
        INNER JOIN users u ON ubs.user_id = u.user_id
        INNER JOIN group_members gm ON u.user_id = gm.user_id
        WHERE gm.group_id = :group_id 
        AND ubs.status = 'finished'
        GROUP BY b.book_id, b.title, b.year, b.publisher, b.genre
        HAVING COUNT(DISTINCT ubs.user_id) >= 2
        ORDER BY reader_count DESC, avg_rating DESC
    ");

    $stmt->bindParam(':group_id', $group_id, PDO::PARAM_INT);
    $stmt->execute();

    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process the results to clean up the data
    foreach ($books as &$book) {
        $book['avg_rating'] = $book['avg_rating'] ? floatval($book['avg_rating']) : null;
        $book['rating_count'] = intval($book['rating_count']);
        $book['reader_count'] = intval($book['reader_count']);

        // Clean up reviews - remove empty entries
        if ($book['reviews']) {
            $reviews = explode(' | ', $book['reviews']);
            $reviews = array_filter($reviews, function($review) {
                return !empty(trim($review));
            });
            $book['reviews'] = implode(' | ', $reviews);
        }

        // Add cover_image placeholder since it's not in your books table
        $book['cover_image'] = null;
        $book['description'] = null;
    }

    jsonResponse([
        'success' => true,
        'books' => $books
    ]);

} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 500);
}
?>
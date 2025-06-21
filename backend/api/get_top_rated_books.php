<?php
require_once '../config.php';
require_once '../announcements_manager.php';
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

    if (!empty($books)) {
        $topBook = $books[0];
        checkAndAddTopBookAnnouncement($topBook);
    }

    echo json_encode(['success' => true, 'books' => $books]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function checkAndAddTopBookAnnouncement($book) {
    try {
        $pdo = getDbConnection();

        // Verifică dacă această carte a mai fost anunțată în ultimele 7 zile
        $stmt = $pdo->prepare("  
            SELECT id FROM announcements   
            WHERE type = 'top_book'   
            AND title LIKE ?   
            AND created_at > NOW() - INTERVAL '7 days'  
        ");

        $stmt->execute(['%' . $book['title'] . '%']);

        if ($stmt->rowCount() == 0) {
            // Nu a fost anunțată recent, adaugă anunț nou
            $announcementManager = new AnnouncementManager();
            $success = $announcementManager->addTopBookAnnouncement($book['title'], $book['book_id']);

            if ($success) {
                error_log(" RSS: Added top book announcement for: " . $book['title']);
            }
        }

    } catch (Exception $e) {
        error_log("Error checking top book announcement: " . $e->getMessage());
    }
}
<?php
require_once '../config.php';
require_once '../announcements_manager.php';
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

    if (!empty($authors)) {
        $topAuthor = $authors[0];
        checkAndAddTopAuthorAnnouncement($topAuthor);
    }

    echo json_encode(['success' => true, 'authors' => $authors]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function checkAndAddTopAuthorAnnouncement($author) {
    try {
        $pdo = getDbConnection();

        // Verifică dacă acest autor a mai fost anunțat în ultimele 30 de zile
        $stmt = $pdo->prepare("  
            SELECT id FROM announcements   
            WHERE type = 'top_author'   
            AND title LIKE ?   
            AND created_at > NOW() - INTERVAL '30 days'  
        ");

        $stmt->execute(['%' . $author['name'] . '%']);

        if ($stmt->rowCount() == 0) {
            // Nu a fost anunțat recent, adaugă anunț nou
            $announcementManager = new AnnouncementManager();
            $success = $announcementManager->addTopAuthorAnnouncement($author['name'], $author['author_id']);

            if ($success) {
                error_log(" RSS: Added top author announcement for: " . $author['name']);
            }
        }

    } catch (Exception $e) {
        error_log("Error checking top author announcement: " . $e->getMessage());
    }
}
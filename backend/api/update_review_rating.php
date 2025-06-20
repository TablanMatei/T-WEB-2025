<?php
header('Content-Type: application/json');
include_once '../config.php';
require_once '../announcements_manager.php';

/** @var PDO $pdo */
$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['user_id']) ? $input['user_id'] : null;
$book_id = isset($input['book_id']) ? $input['book_id'] : null;

$rating = isset($input['rating']) ? intval($input['rating']) : null;
$review = isset($input['review']) ? trim($input['review']) : null;

if (!$user_id || !$book_id || ($rating === null && $review === null)) {
    echo json_encode(['success' => false, 'error' => 'Missing or invalid parameters']);
    exit;
}

try {
    $pdo = getDbConnection();
    $announcementManager = new AnnouncementManager();

    // Verifică dacă există deja înregistrarea
    $stmt = $pdo->prepare("SELECT id FROM user_book_status WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user_id, $book_id]);
    $existing = $stmt->fetch();

    // Obține titlul cărții pentru anunț
    $stmt = $pdo->prepare("SELECT title FROM books WHERE book_id = ?");
    $stmt->execute([$book_id]);
    $book = $stmt->fetch();
    $book_title = $book ? $book['title'] : 'Unknown Book';

    $shouldCreateAnnouncement = false;

    if ($existing) {
        // Verifică dacă este prima dată când se adaugă o recenzie (nu doar rating)
        $stmt = $pdo->prepare("SELECT review FROM user_book_status WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$user_id, $book_id]);
        $currentData = $stmt->fetch();

        // Creează anunț doar dacă se adaugă o recenzie nouă (nu era înainte)
        if ($review && (!$currentData['review'] || trim($currentData['review']) === '')) {
            $shouldCreateAnnouncement = true;
        }

        // Actualizează review și/sau rating
        $stmt = $pdo->prepare("UPDATE user_book_status SET review = :review, rating = :rating, date_updated = NOW() WHERE user_id = :user_id AND book_id = :book_id");
        $stmt->execute([
            ':review' => $review,
            ':rating' => $rating,
            ':user_id' => $user_id,
            ':book_id' => $book_id
        ]);
    } else {
        // Dacă nu există, introdu o înregistrare nouă (fallback)
        $stmt = $pdo->prepare("INSERT INTO user_book_status (user_id, book_id, status, review, rating, date_added, date_updated)
        VALUES (:user_id, :book_id, 'finished', :review, :rating, NOW(), NOW())");
        $stmt->execute([
            ':user_id' => $user_id,
            ':book_id' => $book_id,
            ':review' => $review,
            ':rating' => $rating
        ]);

        // Creează anunț pentru recenzie nouă
        if ($review && trim($review) !== '') {
            $shouldCreateAnnouncement = true;
        }
    }

    // Adaugă anunțul dacă este cazul
    if ($shouldCreateAnnouncement && $rating) {
        $announcementManager->addNewReviewAnnouncement($user_id, $book_title, $book_id, $rating);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
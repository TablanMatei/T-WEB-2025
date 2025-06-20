<?php
header('Content-Type: application/json');
include_once '../config.php'; // Asigură-te că include conexiunea PDO

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

    // Verifică dacă există deja înregistrarea
    $stmt = $pdo->prepare("SELECT id FROM user_book_status WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user_id, $book_id]);
    $existing = $stmt->fetch();

    if ($existing) {
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
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}

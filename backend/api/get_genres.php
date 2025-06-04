<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
require_once '../config.php';

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $genre = isset($_GET['genre']) ? $_GET['genre'] : null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        if ($genre) {
            // Obține cărți pentru un gen specific din tabela BOOKS
            $stmt = $pdo->prepare("
                SELECT DISTINCT
                    b.book_id as id,
                    b.title,
                    STRING_AGG(a.name, ', ') as author,
                    b.year as publication_year,
                    b.publisher,
                    b.genre
                FROM books b
                LEFT JOIN book_authors ba ON b.book_id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.author_id
                WHERE LOWER(b.genre) LIKE LOWER(?)
                GROUP BY b.book_id, b.title, b.year, b.publisher, b.genre
                ORDER BY b.title ASC
                LIMIT ?
            ");
            $stmt->execute(["%$genre%", $limit]);
            $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'genre' => $genre,
                'books' => $books,
                'count' => count($books)
            ]);
        } else {
            // Obține genurile din tabela BOOKS (nu groups!)
            $stmt = $pdo->prepare("
                SELECT 
                    TRIM(LOWER(genre)) as genre_name,
                    COUNT(*) as book_count
                FROM books 
                WHERE genre IS NOT NULL AND genre != '' 
                GROUP BY TRIM(LOWER(genre))
                HAVING COUNT(*) > 0
                ORDER BY COUNT(*) DESC
            ");
            $stmt->execute();
            $genres = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Dacă nu avem genuri în books, afișează mesaj
            if (empty($genres)) {
                echo json_encode([
                    'success' => false,
                    'error' => 'No genres found in books table',
                    'message' => 'Run the update_genres.php script first'
                ]);
                exit;
            }

            echo json_encode([
                'success' => true,
                'genres' => $genres,
                'count' => count($genres)
            ]);
        }
    }

} catch (PDOException $e) {
    error_log("Database error in get_genres.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'debug' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error in get_genres.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'debug' => $e->getMessage()
    ]);
}
?>
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
            // Corectat: folosește || pentru concatenare în PostgreSQL și parametri separați
            $stmt = $pdo->prepare("
                SELECT   
                    b.book_id as id,  
                    b.title,  
                    COALESCE(STRING_AGG(DISTINCT a.name, ', '), 'Unknown Author') as author,  
                    COALESCE(b.year, 0) as publication_year,  
                    COALESCE(b.publisher, 'Unknown Publisher') as publisher,  
                    b.genre  
                FROM books b  
                LEFT JOIN book_authors ba ON b.book_id = ba.book_id  
                LEFT JOIN authors a ON ba.author_id = a.author_id  
                WHERE LOWER(TRIM(b.genre)) = LOWER(TRIM(?))  
                   OR LOWER(b.genre) LIKE LOWER('%' || ? || '%')  
                GROUP BY b.book_id, b.title, b.year, b.publisher, b.genre  
                ORDER BY b.title ASC  
                LIMIT ?
            ");
            $stmt->execute([$genre, $genre, $limit]);
            $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug pentru a vedea ce returnează
            error_log("Books found for genre '$genre': " . count($books));
            if (count($books) > 0) {
                error_log("First book: " . json_encode($books[0]));
            }

            echo json_encode([
                'success' => true,
                'genre' => $genre,
                'books' => $books,
                'count' => count($books)
            ]);
        } else {
            // Obține lista de genuri
            $stmt = $pdo->prepare("
                SELECT 
                    TRIM(LOWER(b.genre)) as genre_name,
                    COUNT(*) as book_count
                FROM books b
                WHERE b.genre IS NOT NULL AND b.genre != '' 
                GROUP BY TRIM(LOWER(b.genre))
                HAVING COUNT(*) > 0
                ORDER BY COUNT(*) DESC
            ");
            $stmt->execute();
            $genres = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug - să vedem ce genuri exacte există
            $sampleGenres = $pdo->query("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
            error_log("Sample genres from DB: " . json_encode($sampleGenres));

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
                'count' => count($genres),
                'debug_sample_genres' => $sampleGenres  // Temporar pentru debugging
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
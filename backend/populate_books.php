<?php
require_once '../config.php';
// https://Railway.com
try {
    $dsn = "pgsql:host=caboose.proxy.rlwy.net;port=31222;dbname=railway";
    $pdo = new PDO($dsn, 'postgres', 'VqLbVuGOLRJqxMuhPBLkFypyLQQqUlju');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

function fetchBooks($query, $maxResults = 40, $startIndex = 0) {
    $url = "https://www.googleapis.com/books/v1/volumes?q=" . urlencode($query) .
        "&maxResults=$maxResults&startIndex=$startIndex";

    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'Biblioxy/1.0'
        ]
    ]);

    $json = file_get_contents($url, false, $context);
    if ($json === false) {
        echo "Eroare la apelul API pentru query: $query<br>";
        return null;
    }

    return json_decode($json, true);
}

function insertBook($pdo, $book) {
    try {
        $title = isset($book['volumeInfo']['title']) ? $book['volumeInfo']['title'] : null;
        $year = isset($book['volumeInfo']['publishedDate']) ? substr($book['volumeInfo']['publishedDate'], 0, 4) : null;
        $publisher = isset($book['volumeInfo']['publisher']) ? $book['volumeInfo']['publisher'] : null;
        $authors = isset($book['volumeInfo']['authors']) ? $book['volumeInfo']['authors'] : [];

        if (!$title) return; // Skip books without title

        // Verifică dacă cartea există deja
        $checkStmt = $pdo->prepare("SELECT book_id FROM books WHERE title = ? LIMIT 1");
        $checkStmt->execute([$title]);
        $existingBook = $checkStmt->fetch();

        if ($existingBook) {
            return; // Cartea există deja
        }

        // Inserează cartea
        $insertBookStmt = $pdo->prepare("
            INSERT INTO books (title, year, publisher, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ");
        $insertBookStmt->execute([$title, $year ? (int)$year : null, $publisher]);
        $book_id = $pdo->lastInsertId();

        $authors_count = 0;

        // Procesează autorii
        if (!empty($authors)) {
            foreach ($authors as $author_name) {
                if (!empty(trim($author_name))) {
                    // Caută sau creează autorul
                    $findAuthorStmt = $pdo->prepare("SELECT author_id FROM authors WHERE name = ?");
                    $findAuthorStmt->execute([$author_name]);
                    $author = $findAuthorStmt->fetch();

                    if (!$author) {
                        // Creează autorul nou
                        $insertAuthorStmt = $pdo->prepare("
                            INSERT INTO authors (name, created_at)
                            VALUES (?, CURRENT_TIMESTAMP)
                        ");
                        $insertAuthorStmt->execute([$author_name]);
                        $author_id = $pdo->lastInsertId();
                    } else {
                        $author_id = $author['author_id'];
                    }

                    // Creează legătura carte-autor (evită duplicatele)
                    try {
                        $insertBookAuthorStmt = $pdo->prepare("
                            INSERT INTO book_authors (book_id, author_id)
                            VALUES (?, ?)
                        ");
                        $insertBookAuthorStmt->execute([$book_id, $author_id]);
                        $authors_count++;
                    } catch (PDOException $e) {
                        // Ignoră erorile de duplicate key
                        if ($e->getCode() != '23505') { // 23505 = unique violation
                            throw $e;
                        }
                    }
                }
            }
        }

        echo "Adăugat: $title (cu $authors_count autori)<br>";

    } catch (Exception $e) {
        echo "Eroare la inserarea cărții '$title': " . $e->getMessage() . "<br>";
    }
}

// Subiecte pentru căutare
$subjects = ['fiction', 'science', 'history', 'novel', 'romance', 'fantasy', 'biography', 'children', 'mystery', 'thriller'];

// La începutul scriptului, adaugă:
ini_set('max_execution_time', 0);
ini_set('memory_limit', '512M');

$booksPerSubject = 300;
$totalProcessed = 0;
$maxBooksPerRun = 500;

echo "<h2>Începem popularea bazei de date...</h2>";

foreach ($subjects as $query) {
    echo "<h3>Căutăm cărți pentru: '$query'</h3>";

    for ($start = 0; $start < $booksPerSubject; $start += 40) {
        $books = fetchBooks($query, 40, $start);

        if ($books && isset($books['items'])) {
            foreach ($books['items'] as $book) {
                insertBook($pdo, $book);
                $totalProcessed++;

                if ($totalProcessed >= $maxBooksPerRun) {
                    break 2;
                }
            }
            echo "Procesat batch pentru '$query' (startIndex=$start) - " . count($books['items']) . " cărți<br>";
        } else {
            echo "Nu s-au găsit cărți pentru '$query' la startIndex=$start<br>";
            break;
        }

        sleep(1);

        if (ob_get_level()) {
            ob_flush();
        }
        flush();
    }

    echo "<hr>";
}

// Statistici finale
$totalBooksStmt = $pdo->query("SELECT COUNT(*) FROM books");
$totalBooks = $totalBooksStmt->fetchColumn();

$totalAuthorsStmt = $pdo->query("SELECT COUNT(*) FROM authors");
$totalAuthors = $totalAuthorsStmt->fetchColumn();

$booksWithAuthorsStmt = $pdo->query("SELECT COUNT(DISTINCT ba.book_id) FROM book_authors ba");
$booksWithAuthors = $booksWithAuthorsStmt->fetchColumn();

$recentAdditionsStmt = $pdo->query("SELECT COUNT(*) FROM books WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'");
$recentAdditions = $recentAdditionsStmt->fetchColumn();

echo "<h2>Populare finalizată!</h2>";
echo "<p><strong>Total cărți:</strong> $totalBooks</p>";
echo "<p><strong>Total autori:</strong> $totalAuthors</p>";
echo "<p><strong>Cărți cu autori:</strong> $booksWithAuthors</p>";
echo "<p><strong>Adăugate recent:</strong> $recentAdditions</p>";
?>
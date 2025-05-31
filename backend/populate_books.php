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
        $stmt = $pdo->prepare("SELECT book_id FROM books WHERE title = :title LIMIT 1");
        $stmt->execute(['title' => $title]);
        if ($stmt->fetchColumn()) {
            return; // Cartea există deja
        }

        // Inserează cartea
        $stmt = $pdo->prepare("INSERT INTO books (title, year, publisher) VALUES (:title, :year, :publisher) RETURNING book_id");
        $stmt->execute(['title' => $title, 'year' => $year, 'publisher' => $publisher]);
        $book_id = $stmt->fetchColumn();

        // Inserează autorii și legăturile
        foreach ($authors as $author) {
            if (empty($author)) continue;

            $stmt = $pdo->prepare("SELECT author_id FROM authors WHERE name = :name");
            $stmt->execute(['name' => $author]);
            $author_id = $stmt->fetchColumn();

            if (!$author_id) {
                $stmt = $pdo->prepare("INSERT INTO authors (name) VALUES (:name) RETURNING author_id");
                $stmt->execute(['name' => $author]);
                $author_id = $stmt->fetchColumn();
            }

            $stmt = $pdo->prepare("INSERT INTO book_authors (book_id, author_id) VALUES (:book_id, :author_id) ON CONFLICT DO NOTHING");
            $stmt->execute(['book_id' => $book_id, 'author_id' => $author_id]);
        }

        echo "Adăugat: $title<br>";

    } catch (Exception $e) {
        echo "Eroare la inserarea cărții '$title': " . $e->getMessage() . "<br>";
    }
}

// Subiecte pentru căutare
$subjects = ['fiction', 'science', 'history', 'novel', 'romance', 'fantasy', 'biography', 'children', 'mystery', 'thriller'];
//$subjects = ['fantasy', 'biography', 'children', 'mystery', 'thriller'];
// La începutul scriptului, adaugă:s
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

    foreach ($books['items'] as $book) {
        insertBook($pdo, $book);
        $totalProcessed++;

        if ($totalProcessed >= $maxBooksPerRun) {
            break 2;
        }
    }

    echo "<hr>";
}

// Statistici finale
$stmt = $pdo->query("SELECT COUNT(*) FROM books");
$totalBooks = $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COUNT(*) FROM authors");
$totalAuthors = $stmt->fetchColumn();

echo "<h2>Populare finalizată!</h2>";
echo "<p><strong>Total cărți:</strong> $totalBooks</p>";
echo "<p><strong>Total autori:</strong> $totalAuthors</p>";
?>
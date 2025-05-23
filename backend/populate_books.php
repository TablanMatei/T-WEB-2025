<?php

// 1. Conectare la baza de date Postgres cu PDO
$host = 'localhost';
$db = 'postgres';
$user = 'postgres';
$pass = 'matei';
$dsn = "pgsql:host=$host;dbname=$db";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    die("Eroare conectare: " . $e->getMessage());
}

// Modifică funcția fetchBooks să accepte startIndex
function fetchBooks($query, $maxResults = 40, $startIndex = 0) {
    $url = "https://www.googleapis.com/books/v1/volumes?q=" . urlencode($query) .
        "&maxResults=$maxResults&startIndex=$startIndex";
    $json = file_get_contents($url);
    return json_decode($json, true);
}

function insertBook($pdo, $book) {
    $title = isset($book['volumeInfo']['title']) ? $book['volumeInfo']['title'] : null;
    $year = isset($book['volumeInfo']['publishedDate']) ? substr($book['volumeInfo']['publishedDate'], 0, 4) : null;
    $publisher = isset($book['volumeInfo']['publisher']) ? $book['volumeInfo']['publisher'] : null;
    $authors = isset($book['volumeInfo']['authors']) ? $book['volumeInfo']['authors'] : [];

    // Inserează cartea
    $stmt = $pdo->prepare("INSERT INTO books (title, year, publisher) VALUES (:title, :year, :publisher) RETURNING book_id");
    $stmt->execute(['title' => $title, 'year' => $year, 'publisher' => $publisher]);
    $book_id = $stmt->fetchColumn();

    // Inserează autorii și legăturile
    foreach ($authors as $author) {
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
}

$subjects = ['fiction', 'science', 'history', 'novel', 'romance', 'fantasy', 'biography', 'children'];
$totalBooksPerSubject = 800;

foreach ($subjects as $query) {
    for ($start = 0; $start < $totalBooksPerSubject; $start += 40) {
        $books = fetchBooks($query, 40, $start);
        if (isset($books['items'])) {
            foreach ($books['items'] as $book) {
                insertBook($pdo, $book);
            }
            echo "Am adăugat " . count($books['items']) . " cărți pentru '$query' (startIndex=$start)<br>";
        } else {
            echo "Nu s-au găsit cărți pentru '$query' la startIndex=$start<br>";
            break;
        }
        sleep(1); // Pauză ca să nu abuzezi API-ul
    }
}

echo "Populare finalizată!";
?>
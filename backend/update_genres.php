<?php
//require_once '../config.php';

try {
    $dsn = "pgsql:host=caboose.proxy.rlwy.net;port=31222;dbname=railway";
    $pdo = new PDO($dsn, 'postgres', 'VqLbVuGOLRJqxMuhPBLkFypyLQQqUlju');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Adaugă coloana genre dacă nu există
try {
    $pdo->exec("ALTER TABLE books ADD COLUMN genre VARCHAR(255)");
    echo "Coloana 'genre' a fost adăugată.<br>";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false || strpos($e->getMessage(), 'duplicate column') !== false) {
        echo "Coloana 'genre' există deja.<br>";
    } else {
        echo "Eroare la adăugarea coloanei: " . $e->getMessage() . "<br>";
    }
}

// Adaugă coloana genre_updated_at dacă nu există
try {
    $pdo->exec("ALTER TABLE books ADD COLUMN genre_updated_at TIMESTAMP");
    echo "Coloana 'genre_updated_at' a fost adăugată.<br>";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false || strpos($e->getMessage(), 'duplicate column') !== false) {
        echo "Coloana 'genre_updated_at' există deja.<br>";
    }
}

// Creează tabela de log dacă nu există
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS genre_update_log (
            id SERIAL PRIMARY KEY,
            book_id INTEGER,
            old_genre VARCHAR(255),
            new_genre VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "Tabela 'genre_update_log' verificată/creată.<br>";
} catch (PDOException $e) {
    echo "Eroare la crearea tabelei de log: " . $e->getMessage() . "<br>";
}

function searchBookOnGoogleBooks($title, $author = null) {
    $cleanTitle = preg_replace('/[^\w\s]/', '', $title);
    $cleanTitle = trim($cleanTitle);

    $query = '"' . $cleanTitle . '"';
    if ($author) {
        $cleanAuthor = explode(',', $author)[0]; // Ia doar primul autor
        $query .= ' inauthor:"' . trim($cleanAuthor) . '"';
    }

    $url = "https://www.googleapis.com/books/v1/volumes?q=" . urlencode($query) . "&maxResults=3";

    $context = stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Biblioxy/1.0'
        ]
    ]);

    $json = @file_get_contents($url, false, $context);
    if ($json === false) {
        return null;
    }

    $data = json_decode($json, true);

    if (isset($data['items'])) {
        // Încearcă să găsești cea mai bună potrivire
        foreach ($data['items'] as $item) {
            if (isset($item['volumeInfo']['categories'])) {
                $bookTitle = isset($item['volumeInfo']['title']) ? $item['volumeInfo']['title'] : '';
                // Verifică similaritatea titlurilor
                if (stripos($bookTitle, $cleanTitle) !== false || stripos($cleanTitle, $bookTitle) !== false) {
                    return implode(', ', $item['volumeInfo']['categories']);
                }
            }
        }

        // Dacă nu găsește potrivire exactă, ia primul cu categorii
        foreach ($data['items'] as $item) {
            if (isset($item['volumeInfo']['categories'])) {
                return implode(', ', $item['volumeInfo']['categories']);
            }
        }
    }

    return null;
}

// Setări pentru execuție
ini_set('max_execution_time', 0);
ini_set('memory_limit', '512M');

// Obține cărțile fără gen, începând cu cele mai populare
$stmt = $pdo->prepare("
    SELECT b.book_id, b.title,   
           STRING_AGG(a.name, ', ') as authors,  
           CASE   
               WHEN b.year > 2000 THEN 1  
               WHEN b.year > 1990 THEN 2  
               ELSE 3  
           END as processing_priority  
    FROM books b  
    LEFT JOIN book_authors ba ON b.book_id = ba.book_id  
    LEFT JOIN authors a ON ba.author_id = a.author_id  
    WHERE (b.genre IS NULL OR b.genre = '')  
    GROUP BY b.book_id, b.title, b.year  
    ORDER BY processing_priority, b.title  
    LIMIT 2000
");

$stmt->execute();
$books = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Actualizez " . count($books) . " cărți cu genuri din Google Books API...</h2>";

$updated = 0;
$failed = 0;
$apiErrors = 0;

foreach ($books as $index => $book) {
    $progress = $index + 1;
    echo "[$progress/" . count($books) . "] Caut genuri pentru: " . htmlspecialchars($book['title']) . "";

    if ($book['authors']) {
        echo " de " . htmlspecialchars($book['authors']);
    }
    echo "<br>";

    $genre = searchBookOnGoogleBooks($book['title'], $book['authors']);

    if ($genre) {
        try {
            // Actualizează cartea
            $updateStmt = $pdo->prepare("
                UPDATE books 
                SET genre = ?, genre_updated_at = CURRENT_TIMESTAMP 
                WHERE book_id = ?
            ");
            $updateStmt->execute([$genre, $book['book_id']]);

            // Adaugă în log
            $logStmt = $pdo->prepare("
                INSERT INTO genre_update_log (book_id, old_genre, new_genre, updated_at)
                VALUES (?, NULL, ?, CURRENT_TIMESTAMP)
            ");
            $logStmt->execute([$book['book_id'], $genre]);

            echo "Actualizat cu genul: " . htmlspecialchars($genre);
            $updated++;
        } catch (PDOException $e) {
            echo "Eroare la actualizare: " . htmlspecialchars($e->getMessage());
            $failed++;
        }
    } else {
        echo "Nu s-a găsit gen în Google Books";
        $failed++;
    }

    echo "<br>";

    // Pauză pentru a nu suprasolicita API-ul
    sleep(2);

    if (ob_get_level()) {
        ob_flush();
    }
    flush();
}

// Statistici finale
$stmt = $pdo->query("SELECT COUNT(*) FROM books WHERE genre IS NOT NULL AND genre != ''");
$booksWithGenres = $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COUNT(*) FROM books");
$totalBooks = $stmt->fetchColumn();

//echo "<h2>Rezultate finale:</h2>";
echo "<p><strong>Actualizate cu succes:</strong> $updated cărți</p>";
echo "<p><strong>Eșuate:</strong> $failed cărți</p>";
echo "<p><strong>Total cărți cu genuri:</strong> $booksWithGenres din $totalBooks</p>";
echo "<p><strong>Progres:</strong> " . round(($booksWithGenres / $totalBooks) * 100, 1) . "%</p>";
echo "</div>";

echo "<p><em>Scriptul s-a finalizat. Poți rula din nou pentru a actualiza mai multe cărți.</em></p>";
?>
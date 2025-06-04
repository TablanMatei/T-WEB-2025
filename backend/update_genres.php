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
    echo " Coloana 'genre' a fost adăugată.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false || strpos($e->getMessage(), 'duplicate column') !== false) {
        echo "Coloana 'genre' există deja.";
    } else {
        echo "Eroare la adăugarea coloanei: " . $e->getMessage();
    }
}

function searchBookOnGoogleBooks($title, $author = null) {
    // Curăță titlul pentru căutare mai bună
    $cleanTitle = preg_replace('/[^\w\s]/', '', $title);
    $cleanTitle = trim($cleanTitle);

    $query = '"' . $cleanTitle . '"'; // Folosește ghilimele pentru căutare exactă
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
    SELECT b.book_id, b.title, STRING_AGG(a.name, ', ') as authors
    FROM books b
    LEFT JOIN book_authors ba ON b.book_id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.author_id
    WHERE (b.genre IS NULL OR b.genre = '')
    GROUP BY b.book_id, b.title
    ORDER BY b.title
    LIMIT 2000
");
$stmt->execute();
$books = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Actualizez " . count($books) . " cărți cu genuri din Google Books API...</h2>";
echo "<p><em>Acest proces poate dura câteva minute...</em></p>";

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
            $updateStmt = $pdo->prepare("UPDATE books SET genre = :genre WHERE book_id = :book_id");
            $updateStmt->execute(['genre' => $genre, 'book_id' => $book['book_id']]);
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

    echo "</div>";


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

echo "<div style='margin: 20px 0; padding: 20px; background: #f0f8ff; border: 1px solid #007cba;'>";
echo "<h2>📊 Rezultate finale:</h2>";
echo "<p>✅ <strong>Actualizate cu succes:</strong> $updated cărți</p>";
echo "<p>❌ <strong>Eșuate:</strong> $failed cărți</p>";
echo "<p>📚 <strong>Total cărți cu genuri:</strong> $booksWithGenres din $totalBooks</p>";
echo "<p>📈 <strong>Progres:</strong> " . round(($booksWithGenres / $totalBooks) * 100, 1) . "%</p>";
echo "</div>";

echo "<p><em>Scriptul s-a finalizat. Poți rula din nou pentru a actualiza mai multe cărți.</em></p>";
?>
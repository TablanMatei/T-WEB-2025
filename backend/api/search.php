<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
/** @var PDO $pdo */

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // GET pentru suggestions/popular items
        $category = isset($_GET['category']) ? $_GET['category'] : 'Books';
        $limit = (int)(isset($_GET['limit']) ? $_GET['limit'] : 10);

        $suggestions = getPopularItems($pdo, $category, $limit);
        echo json_encode(['success' => true, 'data' => $suggestions]);

    } elseif ($method === 'POST') {
        // POST pentru search propriu-zis
        $input = json_decode(file_get_contents('php://input'), true);

        $query = isset($input['query']) ? $input['query'] : '';
        $category = isset($input['category']) ? $input['category'] : 'Books';
        $limit = (int)(isset($input['limit']) ? $input['limit'] : 20);
        $offset = (int)(isset($input['offset']) ? $input['offset'] : 0);

        if (empty($query)) {
            echo json_encode(['success' => false, 'error' => 'Query is required']);
            exit;
        }

        $results = searchItems($pdo, $query, $category, $limit, $offset);
        echo json_encode(['success' => true, 'data' => $results]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getPopularItems($pdo, $category, $limit) {
    switch ($category) {
        case 'Books':
            $sql = "SELECT book_id as id, title, year, publisher 
                    FROM books 
                    ORDER BY title ASC 
                    LIMIT :limit";
            break;

        case 'Authors':
            $sql = "SELECT author_id as id, name 
                    FROM authors 
                    ORDER BY name ASC 
                    LIMIT :limit";
            break;

        case 'Series':
            return [];

        case 'Publishers':
            $sql = "SELECT publisher as name, COUNT(*) as book_count 
                    FROM books 
                    WHERE publisher IS NOT NULL AND publisher != ''
                    GROUP BY publisher 
                    ORDER BY book_count DESC 
                    LIMIT :limit";
            break;

        default:
            return [];
    }

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Normalizez datele pentru frontend
        if ($category === 'Books') {
            foreach ($results as &$book) {
                $book['author'] = 'Unknown';
                $book['publication_year'] = $book['year'];
                $book['average_rating'] = null;
                $book['image_url'] = null;
            }
        } elseif ($category === 'Authors') {
            foreach ($results as &$author) {
                // Adaug câmpuri placeholder pentru frontend
                $author['nationality'] = 'Unknown';
                $author['birth_year'] = null;
                $author['book_count'] = 0;
                $author['description'] = 'Author information not available.';
            }
        }

        return $results;
    } catch (Exception $e) {
        error_log("Error in getPopularItems: " . $e->getMessage());
        return [];
    }
}

function searchItems($pdo, $query, $category, $limit, $offset) {
    $searchTerm = '%' . $query . '%';

    switch ($category) {
        case 'Books':
            $sql = "SELECT book_id as id, title, year, publisher 
                    FROM books 
                    WHERE title ILIKE :query OR publisher ILIKE :query
                    ORDER BY 
                        CASE 
                            WHEN title ILIKE :query THEN 1
                            WHEN publisher ILIKE :query THEN 2
                            ELSE 3
                        END,
                        title ASC
                    LIMIT :limit OFFSET :offset";
            break;

        case 'Authors':
            $sql = "SELECT author_id as id, name 
                    FROM authors 
                    WHERE name ILIKE :query
                    ORDER BY name ASC
                    LIMIT :limit OFFSET :offset";
            break;

        case 'Series':
            return [];

        case 'Publishers':
            $sql = "SELECT publisher as name, COUNT(*) as book_count 
                    FROM books 
                    WHERE publisher ILIKE :query AND publisher IS NOT NULL AND publisher != ''
                    GROUP BY publisher 
                    ORDER BY book_count DESC 
                    LIMIT :limit OFFSET :offset";
            break;

        default:
            return [];
    }

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':query', $searchTerm);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Normalizez datele
        if ($category === 'Books') {
            foreach ($results as &$book) {
                $book['author'] = 'Unknown';
                $book['publication_year'] = $book['year'];
                $book['average_rating'] = null;
                $book['image_url'] = null;
            }
        } elseif ($category === 'Authors') {
            foreach ($results as &$author) {
                $author['nationality'] = 'Unknown';
                $author['birth_year'] = null;
                $author['book_count'] = 0;
                $author['description'] = 'Author information not available.';
            }
        }

        return $results;
    } catch (Exception $e) {
        error_log("Error in searchItems: " . $e->getMessage());
        return [];
    }
}
?>
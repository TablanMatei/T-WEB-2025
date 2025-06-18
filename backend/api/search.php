<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
$pdo = getDbConnection();

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
    if ($category === 'Books') {
        $stmt = $pdo->prepare("
            SELECT b.book_id as id, 
                   b.title, 
                   b.title as name,
                   'Unknown' as author,
                   b.year,
                   b.year as publication_year,
                   b.publisher,
                   NULL as real_name,
                   NULL as username,
                   NULL as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   NULL as description
            FROM books b ORDER BY b.title ASC LIMIT ?
        ");
        $stmt->execute([$limit]);

    } elseif ($category === 'Authors') {
        $stmt = $pdo->prepare("
            SELECT a.author_id as id,
                   NULL as title,
                   a.name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   NULL as publisher,
                   NULL as real_name,
                   NULL as username,
                   'Unknown' as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   'Author information not available.' as description
            FROM authors a ORDER BY a.name ASC LIMIT ?
        ");
        $stmt->execute([$limit]);

    } elseif ($category === 'Users') {
        $stmt = $pdo->prepare("
            SELECT u.user_id as id,
                   NULL as title,
                   u.username as name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   NULL as publisher,
                   u.real_name,
                   u.username,
                   NULL as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   COALESCE(u.real_name, 'User') as description
            FROM users u ORDER BY u.username ASC LIMIT ?
        ");
        $stmt->execute([$limit]);

    } elseif ($category === 'Publishers') {
        $stmt = $pdo->prepare("
            SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as id,
                   NULL as title,
                   b.publisher as name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   b.publisher,
                   NULL as real_name,
                   NULL as username,
                   NULL as nationality,
                   NULL as birth_year,
                   COUNT(*) as book_count,
                   NULL as description
            FROM books b 
            WHERE b.publisher IS NOT NULL AND b.publisher != ''
            GROUP BY b.publisher 
            ORDER BY COUNT(*) DESC 
            LIMIT ?
        ");
        $stmt->execute([$limit]);
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function searchItems($pdo, $query, $category, $limit, $offset) {
    $searchTerm = '%' . $query . '%';

    if ($category === 'Books') {
        $stmt = $pdo->prepare("
            SELECT b.book_id as id, 
                   b.title, 
                   b.title as name,
                   'Unknown' as author,
                   b.year,
                   b.year as publication_year,
                   b.publisher,
                   NULL as real_name,
                   NULL as username,
                   NULL as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   NULL as description,
                   CASE 
                       WHEN b.title ILIKE ? THEN 1
                       WHEN b.publisher ILIKE ? THEN 2
                       ELSE 3
                   END as relevance_score
            FROM books b 
            WHERE b.title ILIKE ? OR b.publisher ILIKE ?
            ORDER BY relevance_score, b.title ASC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$query, $query, $searchTerm, $searchTerm, $limit, $offset]);

    } elseif ($category === 'Authors') {
        $stmt = $pdo->prepare("
            SELECT a.author_id as id,
                   NULL as title,
                   a.name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   NULL as publisher,
                   NULL as real_name,
                   NULL as username,
                   'Unknown' as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   'Author information not available.' as description,
                   1 as relevance_score
            FROM authors a 
            WHERE a.name ILIKE ?
            ORDER BY a.name ASC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$searchTerm, $limit, $offset]);

    } elseif ($category === 'Users') {
        $stmt = $pdo->prepare("
            SELECT u.user_id as id,
                   NULL as title,
                   u.username as name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   NULL as publisher,
                   u.real_name,
                   u.username,
                   NULL as nationality,
                   NULL as birth_year,
                   0 as book_count,
                   COALESCE(u.real_name, 'User') as description,
                   CASE 
                       WHEN u.username ILIKE ? THEN 1
                       WHEN u.real_name ILIKE ? THEN 2
                       ELSE 3
                   END as relevance_score
            FROM users u 
            WHERE u.username ILIKE ? OR u.real_name ILIKE ?
            ORDER BY relevance_score, u.username ASC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$query, $query, $searchTerm, $searchTerm, $limit, $offset]);

    } elseif ($category === 'Publishers') {
        $stmt = $pdo->prepare("
            SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as id,
                   NULL as title,
                   b.publisher as name,
                   NULL as author,
                   NULL as year,
                   NULL as publication_year,
                   b.publisher,
                   NULL as real_name,
                   NULL as username,
                   NULL as nationality,
                   NULL as birth_year,
                   COUNT(*) as book_count,
                   NULL as description,
                   1 as relevance_score
            FROM books b 
            WHERE b.publisher ILIKE ? AND b.publisher IS NOT NULL AND b.publisher != ''
            GROUP BY b.publisher 
            ORDER BY COUNT(*) DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$searchTerm, $limit, $offset]);
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
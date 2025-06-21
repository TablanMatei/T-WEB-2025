<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

if (!isset($_GET['format']) || !isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters: format and user_id']);
    exit;
}

$format = strtolower($_GET['format']);
$user_id = intval($_GET['user_id']);


$allowed_formats = ['csv', 'json', 'xml'];
if (!in_array($format, $allowed_formats)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid format. Allowed: csv, json, xml']);
    exit;
}

try {
    $pdo = getDbConnection();
    $userData = getUserData($pdo, $user_id);

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Generează și trimite fișierul în formatul cerut
    switch ($format) {
        case 'csv':
            exportCSV($userData);
            break;
        case 'json':
            exportJSON($userData);
            break;
        case 'xml':
            exportXML($userData);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit;
}

/**
 * Obține toate datele utilizatorului din baza de date
 */
function getUserData($pdo, $user_id) {
    // Datele utilizatorului
    $stmt = $pdo->prepare("SELECT user_id, username, email, real_name, description, birthdate, gender, location, pronouns, website, updated_at FROM users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        return null;
    }

    // Cărțile utilizatorului cu statusul lor și autorii
    $stmt = $pdo->prepare("
        SELECT b.title, b.year, b.publisher, b.genre,
               STRING_AGG(a.name, ', ') as authors,
               ubs.status, ubs.rating, ubs.review, ubs.date_added, ubs.date_updated
        FROM user_book_status ubs
        JOIN books b ON ubs.book_id = b.book_id
        LEFT JOIN book_authors ba ON b.book_id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.author_id
        WHERE ubs.user_id = ?
        GROUP BY b.book_id, b.title, b.year, b.publisher, b.genre, ubs.status, ubs.rating, ubs.review, ubs.date_added, ubs.date_updated
        ORDER BY ubs.date_added DESC
    ");
    $stmt->execute([$user_id]);
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Grupurile utilizatorului
    $stmt = $pdo->prepare("
        SELECT g.name as group_name, g.description, gm.joined_at, gm.role
        FROM group_members gm
        JOIN groups g ON gm.group_id = g.id
        WHERE gm.user_id = ?
        ORDER BY gm.joined_at DESC
    ");
    $stmt->execute([$user_id]);
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Statistici utilizator
    $stats = getUserStats($pdo, $user_id);

    return [
        'user' => $user,
        'books' => $books,
        'groups' => $groups,
        'statistics' => $stats
    ];
}

/**
 * Calculează statisticile utilizatorului
 */
function getUserStats($pdo, $user_id) {
    $stats = [];

    // Numărul total de cărți
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM user_book_status WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $stats['total_books'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Cărți pe status
    $stmt = $pdo->prepare("
        SELECT status, COUNT(*) as count 
        FROM user_book_status 
        WHERE user_id = ? 
        GROUP BY status
    ");
    $stmt->execute([$user_id]);
    $statusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($statusCounts as $status) {
        $stats['books_' . $status['status']] = $status['count'];
    }

    // Media rating-urilor
    $stmt = $pdo->prepare("
        SELECT AVG(rating) as avg_rating 
        FROM user_book_status 
        WHERE user_id = ? AND rating IS NOT NULL
    ");
    $stmt->execute([$user_id]);
    $avgRating = $stmt->fetch(PDO::FETCH_ASSOC)['avg_rating'];
    $stats['average_rating'] = $avgRating ? round($avgRating, 2) : null;

    // Genurile preferate
    $stmt = $pdo->prepare("
        SELECT b.genre, COUNT(*) as count
        FROM user_book_status ubs
        JOIN books b ON ubs.book_id = b.book_id
        WHERE ubs.user_id = ? AND b.genre IS NOT NULL
        GROUP BY b.genre
        ORDER BY count DESC
        LIMIT 5
    ");
    $stmt->execute([$user_id]);
    $stats['favorite_genres'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Autorii preferați
    $stmt = $pdo->prepare("
        SELECT a.name, COUNT(*) as count
        FROM user_book_status ubs
        JOIN books b ON ubs.book_id = b.book_id
        JOIN book_authors ba ON b.book_id = ba.book_id
        JOIN authors a ON ba.author_id = a.author_id
        WHERE ubs.user_id = ?
        GROUP BY a.author_id, a.name
        ORDER BY count DESC
        LIMIT 5
    ");
    $stmt->execute([$user_id]);
    $stats['favorite_authors'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return $stats;
}

/**
 * Export în format CSV
 */
function exportCSV($data) {
    $filename = 'user_data_' . $data['user']['username'] . '_' . date('Y-m-d') . '.csv';

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

    $output = fopen('php://output', 'w');

    // Header pentru informații utilizator
    fputcsv($output, ['USER INFORMATION']);
    fputcsv($output, ['Field', 'Value']);
    fputcsv($output, ['Username', $data['user']['username']]);
    fputcsv($output, ['Email', $data['user']['email']]);
    fputcsv($output, ['Real Name', $data['user']['real_name']]);
    fputcsv($output, ['Description', $data['user']['description']]);
    fputcsv($output, ['Birthdate', $data['user']['birthdate']]);
    fputcsv($output, ['Gender', $data['user']['gender']]);
    fputcsv($output, ['Location', $data['user']['location']]);
    fputcsv($output, ['Pronouns', $data['user']['pronouns']]);
    fputcsv($output, ['Website', $data['user']['website']]);
    fputcsv($output, ['Last Updated', $data['user']['updated_at']]);
    fputcsv($output, []);

    // Statistici
    fputcsv($output, [' STATISTICS ']);
    fputcsv($output, ['Metric', 'Value']);
    foreach ($data['statistics'] as $key => $value) {
        if (is_array($value)) {
            fputcsv($output, [ucfirst(str_replace('_', ' ', $key)), json_encode($value)]);
        } else {
            fputcsv($output, [ucfirst(str_replace('_', ' ', $key)), $value]);
        }
    }
    fputcsv($output, []);

    // Cărți
    fputcsv($output, [' BOOKS ']);
    fputcsv($output, ['Title', 'Authors', 'Year', 'Publisher', 'Genre', 'Status', 'Rating', 'Review', 'Date Added', 'Date Updated']);

    foreach ($data['books'] as $book) {
        fputcsv($output, [
            $book['title'],
            $book['authors'],
            $book['year'],
            $book['publisher'],
            $book['genre'],
            $book['status'],
            $book['rating'],
            $book['review'],
            $book['date_added'],
            $book['date_updated']
        ]);
    }

    fputcsv($output, []);

    // Grupuri
    fputcsv($output, ['GROUPS']);
    fputcsv($output, ['Group Name', 'Description', 'Role', 'Joined At']);

    foreach ($data['groups'] as $group) {
        fputcsv($output, [
            $group['group_name'],
            $group['description'],
            $group['role'],
            $group['joined_at']
        ]);
    }

    fclose($output);
}

/**
 * Export în format JSON
 */
function exportJSON($data) {
    $filename = 'user_data_' . $data['user']['username'] . '_' . date('Y-m-d') . '.json';

    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

    // Adaugă metadata
    $exportData = [
        'export_info' => [
            'exported_at' => date('Y-m-d H:i:s'),
            'format' => 'JSON',
            'version' => '1.0'
        ],
        'user_data' => $data
    ];

    echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

/**
 * Export în format XML
 */
function exportXML($data) {
    $filename = 'user_data_' . $data['user']['username'] . '_' . date('Y-m-d') . '.xml';

    header('Content-Type: application/xml');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

    $xml = new DOMDocument('1.0', 'UTF-8');
    $xml->formatOutput = true;

    // Root element
    $root = $xml->createElement('user_export');
    $root->setAttribute('exported_at', date('Y-m-d H:i:s'));
    $root->setAttribute('format', 'XML');
    $root->setAttribute('version', '1.0');
    $xml->appendChild($root);

    // User information
    $userElement = $xml->createElement('user');
    foreach ($data['user'] as $key => $value) {
        if ($value !== null) {
            $element = $xml->createElement($key, htmlspecialchars($value));
            $userElement->appendChild($element);
        }
    }
    $root->appendChild($userElement);

    // Statistics
    $statsElement = $xml->createElement('statistics');
    foreach ($data['statistics'] as $key => $value) {
        if (is_array($value)) {
            $statElement = $xml->createElement($key);
            foreach ($value as $item) {
                $itemElement = $xml->createElement('item');
                foreach ($item as $itemKey => $itemValue) {
                    $itemElement->setAttribute($itemKey, htmlspecialchars($itemValue));
                }
                $statElement->appendChild($itemElement);
            }
            $statsElement->appendChild($statElement);
        } else {
            if ($value !== null) {
                $element = $xml->createElement($key, htmlspecialchars($value));
                $statsElement->appendChild($element);
            }
        }
    }
    $root->appendChild($statsElement);

    // Books
    $booksElement = $xml->createElement('books');
    foreach ($data['books'] as $book) {
        $bookElement = $xml->createElement('book');
        foreach ($book as $key => $value) {
            if ($value !== null) {
                $element = $xml->createElement($key, htmlspecialchars($value));
                $bookElement->appendChild($element);
            }
        }
        $booksElement->appendChild($bookElement);
    }
    $root->appendChild($booksElement);

    // Groups
    $groupsElement = $xml->createElement('groups');
    foreach ($data['groups'] as $group) {
        $groupElement = $xml->createElement('group');
        foreach ($group as $key => $value) {
            if ($value !== null) {
                $element = $xml->createElement($key, htmlspecialchars($value));
                $groupElement->appendChild($element);
            }
        }
        $groupsElement->appendChild($groupElement);
    }
    $root->appendChild($groupsElement);

    echo $xml->saveXML();
}
?>
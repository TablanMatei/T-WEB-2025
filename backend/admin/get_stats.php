<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
require_once '../auth/jwt.php';

// Verifică autentificarea JWT
$user = requireAuth();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Statistici utilizatori
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_users FROM users");
    $stmt->execute();
    $userStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Statistici grupuri
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_groups FROM groups");
    $stmt->execute();
    $groupStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Statistici cărți
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_books FROM books");
    $stmt->execute();
    $bookStats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => $userStats['total_users'],
            'total_groups' => $groupStats['total_groups'],
            'total_books' => $bookStats['total_books']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
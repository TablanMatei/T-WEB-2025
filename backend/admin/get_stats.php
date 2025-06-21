<?php
// Securitate: Folosim prepared statements pentru prevenirea SQL injection

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

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

    // Statistici suplimentare
    $stmt = $pdo->prepare("SELECT COUNT(*) as admin_users FROM users WHERE role = 'admin'");
    $stmt->execute();
    $adminStats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => $userStats['total_users'],
            'total_groups' => $groupStats['total_groups'],
            'total_books' => $bookStats['total_books'],
            'admin_users' => $adminStats['admin_users']
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    // Verifică metoda HTTP  
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }

    // Obține datele JSON  
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['username'])) {
        throw new Exception('Username is required');
    }

    $username = trim($input['username']);

    // Validare username  
    if (empty($username)) {
        throw new Exception('Username cannot be empty');
    }

    if (strlen($username) < 3) {
        throw new Exception('Username must be at least 3 characters');
    }

    if (strlen($username) > 50) {
        throw new Exception('Username must be less than 50 characters');
    }

    // Verifică dacă username-ul conține doar caractere permise  
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        throw new Exception('Username can only contain letters, numbers, and underscores');
    }

    // Conectare la baza de date folosind funcția din config.php  
    $pdo = getdbConnection();

    // Verifică dacă username-ul există deja  
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $count = $stmt->fetchColumn();

    // Răspuns  
    echo json_encode([
        'success' => true,
        'available' => $count == 0,
        'message' => $count == 0 ? 'Username is available' : 'Username is already taken'
    ]);

} catch (PDOException $e) {
    error_log("Database error in check_username.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
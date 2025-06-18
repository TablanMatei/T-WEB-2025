<?php
require_once '../config.php';
/** @var PDO $pdo */
$pdo = getDbConnection();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(array('error' => 'Method not allowed'), 405);
}

// Primește datele JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(array('error' => 'Invalid JSON'), 400);
}

$realName = isset($input['real_name']) ? trim($input['real_name']) : '';
$username = isset($input['username']) ? trim($input['username']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$birthdate = isset($input['birthdate']) ? $input['birthdate'] : '';
$gender = isset($input['gender']) ? $input['gender'] : '';

// Validări
if (empty($realName) || empty($username) || empty($email) || empty($password)) {
    jsonResponse(array('error' => 'Real name, username, email and password are required'), 400);
}

if (strlen($username) < 3) {
    jsonResponse(array('error' => 'Username must be at least 3 characters'), 400);
}

if (!isValidEmail($email)) {
    jsonResponse(array('error' => 'Invalid email format'), 400);
}

if (strlen($password) < 6) {
    jsonResponse(array('error' => 'Password must be at least 6 characters'), 400);
}

// Validare dată nașterii (opțională)
if (!empty($birthdate)) {
    $date = DateTime::createFromFormat('Y-m-d', $birthdate);
    if (!$date || $date->format('Y-m-d') !== $birthdate) {
        jsonResponse(array('error' => 'Invalid birthdate format (YYYY-MM-DD)'), 400);
    }
}

// Validare gender (opțională)
$validGenders = array('male', 'female', 'other');
if (!empty($gender) && !in_array($gender, $validGenders)) {
    jsonResponse(array('error' => 'Gender must be: male, female, or other'), 400);
}

try {
    // Verifică dacă username-ul există deja
    $checkUsernameStmt = $pdo->prepare("SELECT 1 FROM users WHERE username = ?");
    $checkUsernameStmt->execute([$username]);
    if ($checkUsernameStmt->fetch()) {
        jsonResponse(array('error' => 'Username already exists'), 409);
    }

    // Verifică dacă email-ul există deja
    $checkEmailStmt = $pdo->prepare("SELECT 1 FROM users WHERE email = ?");
    $checkEmailStmt->execute([$email]);
    if ($checkEmailStmt->fetch()) {
        jsonResponse(array('error' => 'Email already exists'), 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Inserează utilizatorul nou
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password, real_name, description, birthdate, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $insertStmt->execute([
        $username,
        $email,
        $hashedPassword,
        $realName,
        $description,
        !empty($birthdate) ? $birthdate : null,
        !empty($gender) ? $gender : null
    ]);

    // Obține ID-ul utilizatorului nou creat
    $user_id = $pdo->lastInsertId();

    // Inserează notificarea de bun venit
    $notificationStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, message, created_at)
        VALUES (?, 'welcome', 'Welcome to Biblioxy!', CURRENT_TIMESTAMP)
    ");
    $notificationStmt->execute([$user_id]);

    jsonResponse(array(
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => $user_id
    ), 201);

} catch (PDOException $e) {
    jsonResponse(array(
        'error' => 'Registration failed',
        'debug' => $e->getMessage(),
        'code' => $e->getCode()
    ), 500);
}
?>
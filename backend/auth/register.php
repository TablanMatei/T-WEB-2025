<?php
require_once '../config.php';
/** @var PDO $pdo */

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
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = :username");
    $stmt->execute(array('username' => $username));
    if ($stmt->fetch()) {
        jsonResponse(array('error' => 'Username already exists'), 409);
    }

    // Verifică dacă email-ul există deja
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email");
    $stmt->execute(array('email' => $email));
    if ($stmt->fetch()) {
        jsonResponse(array('error' => 'Email already exists'), 409);
    }

    // Hash-uiește parola
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Inserează utilizatorul
    $stmt = $pdo->prepare("  
    INSERT INTO users (username, email, password, real_name, description, birthdate, gender)   
    VALUES (:username, :email, :password, :real_name, :description, :birthdate, :gender)   
    RETURNING user_id  
");

    $stmt->execute(array(
        'username' => $username,
        'email' => $email,
        'password' => $hashedPassword,  // ← SCHIMBAT DIN password_hash ÎN password
        'real_name' => $realName,
        'description' => $description,
        'birthdate' => !empty($birthdate) ? $birthdate : null,
        'gender' => !empty($gender) ? $gender : null
    ));

    $userId = $stmt->fetchColumn();

    jsonResponse(array(
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => $userId
    ), 201);

} catch (PDOException $e) {
    //jsonResponse(array('error' => 'Registration failed'), 500);
    jsonResponse(array(
        'error' => 'Registration failed',
        'debug' => $e->getMessage(),
        'code' => $e->getCode()
    ), 500);
}
?>
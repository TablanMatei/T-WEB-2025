<?php
require_once '../config.php';

class SimpleJWT {

    public static function encode($payload, $secret) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function decode($jwt, $secret) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT format');
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Invalid signature');
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }

        return $payload;
    }
}

function verifyJWT() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader || strncmp($authHeader, 'Bearer ', 7) !== 0)
    {
        // Dacă tokenul lipsește sau formatul e greșit, returnăm eroare 401
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        exit;
    }

    $token = substr($authHeader, 7);

    // Verifică dacă tokenul e în blacklist
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT 1 FROM jwt_blacklist WHERE token = ?");
    $stmt->execute([$token]);
    if ($stmt->fetch()) {
        http_response_code(401);
        echo json_encode(['error' => 'Token has been revoked']);
        exit;
    }

    // Decodează și validează semnătura + expirarea
    try {
        $payload = SimpleJWT::decode($token, JWT_SECRET);

        // Deja verifică expirarea în decode, dar re-verificăm pentru siguranță
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }

        return $payload;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
}

function requireAuth() {
    // Folosește verifyJWT, dar cu excepții în loc să dea exit, pentru flexibilitate
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader || strncmp($authHeader, 'Bearer ', 7) !== 0) {
        throw new Exception('Authorization token required');
    }

    $token = substr($authHeader, 7);

    // Verifică blacklist
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT 1 FROM jwt_blacklist WHERE token = ?");
    $stmt->execute([$token]);
    if ($stmt->fetch()) {
        throw new Exception('Token has been revoked');
    }

    $payload = SimpleJWT::decode($token, JWT_SECRET);

    if (isset($payload['exp']) && $payload['exp'] < time()) {
        throw new Exception('Token expired');
    }

    return $payload;
}

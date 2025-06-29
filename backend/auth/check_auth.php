<?php
require_once '../config.php';
require_once 'jwt.php';

setApiHeaders();

try {
    requireAuth(); // Verifică tokenul, inclusiv blacklist

    // Dacă ajunge aici, tokenul e valid
    echo json_encode([
        'success' => true,
        'message' => 'Token is valid'
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: ' . $e->getMessage()
    ]);
}

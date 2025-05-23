<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Aici poți adăuga logica pentru logout (ex: invalidare token-uri, logging, etc.)
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
?>
<?php
require_once '../config.php';
require_once '../auth/jwt.php';

// Verifică autentificarea
$user = requireAuth();

// Obține user_id din parametri sau din token
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $user['user_id'];

// Verifică dacă utilizatorul poate accesa datele (doar propriile date sau admin)
if ($user_id !== $user['user_id'] && $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

try {
    $conn = getDbConnection();

    // Query simplificat pentru structura reală a tabelei
    $query = "
        SELECT 
            g.id,
            g.name,
            g.description,
            g.created_at,
            g.member_count,
            gm.role as user_role
        FROM groups g
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = :user_id
        ORDER BY g.name
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $groups = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $groups[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'user_role' => $row['user_role'],
            'member_count' => (int)$row['member_count'],
            'book_count' => 0, // Vom calcula separat dacă e necesar
            'created_at' => $row['created_at']
        ];
    }

    echo json_encode([
        'success' => true,
        'groups' => $groups,
        'total_groups' => count($groups)
    ]);

} catch (Exception $e) {
    error_log("Error in get_user_groups.php: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred',
        'debug_message' => $e->getMessage(),
        'debug_user_id' => $user_id
    ]);
}
?>
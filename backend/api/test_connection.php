<?php
require_once '../config.php';

echo "<h2> Test conexiune Railway</h2>";

try {
    $pdo = getDbConnection();
    echo "Conexiune reușită la Railway!<br>";

    // Testează o query simplă
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo " Query test reușită - Total utilizatori: " . $result['total'] . "<br>";

    // Testează structura tabelelor
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo " Tabele găsite: " . implode(", ", $tables) . "<br>";

} catch (PDOException $e) {
    echo " Eroare conexiune: " . $e->getMessage() . "<br>";
    echo " Cod eroare: " . $e->getCode() . "<br>";
}
?>
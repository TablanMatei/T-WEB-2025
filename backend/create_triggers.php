<?php
require_once 'config.php';

try {
    $pdo = getDbConnection();

    echo "TRIGGERS:\n\n";


    echo "Trigger 1: Actualizare automată updated_at pentru utilizatori - Când un user își modifică profilul, să se actualizeze automat timpul modificării.\n";

    // Verifică dacă coloana updated_at există, dacă nu o adaugă
    $checkColumn = $pdo->query("
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ")->fetchColumn();

    if ($checkColumn == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        echo "Column updated_at added to users table\n";
    } else {
        echo "Column updated_at already exists in users table\n";
    }

    // Creează funcția trigger pentru users
    $pdo->exec("
        CREATE OR REPLACE FUNCTION update_user_timestamp()  
        RETURNS TRIGGER AS $$  
        BEGIN  
            -- Actualizează timestamp-ul doar dacă s-au făcut modificări reale  
            IF (OLD.username IS DISTINCT FROM NEW.username) OR   
               (OLD.email IS DISTINCT FROM NEW.email) OR   
               (OLD.real_name IS DISTINCT FROM NEW.real_name) OR   
               (OLD.description IS DISTINCT FROM NEW.description) OR  
               (OLD.birthdate IS DISTINCT FROM NEW.birthdate) OR  
               (OLD.gender IS DISTINCT FROM NEW.gender) OR  
               (OLD.location IS DISTINCT FROM NEW.location) OR  
               (OLD.pronouns IS DISTINCT FROM NEW.pronouns) OR  
               (OLD.website IS DISTINCT FROM NEW.website) OR  
               (OLD.profile_picture IS DISTINCT FROM NEW.profile_picture) THEN  
                  
                NEW.updated_at := CURRENT_TIMESTAMP;  
            END IF;  
              
            RETURN NEW;  
        END;  
        $$ LANGUAGE plpgsql;
    ");

    // Creează trigger-ul
    $pdo->exec("
        DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON users;
        CREATE TRIGGER trigger_update_user_timestamp
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_user_timestamp();
    ");

    echo "TRIGGER CREAT!\n\n";

    echo "Trigger 2: Auto-incrementează numărul de membri în grupuri - Când un user se alătură unui grup, să se actualizeze automat member_count în tabela groups.\n";

    // Verifică dacă coloana member_count există, dacă nu o adaugă
    $checkMemberCount = $pdo->query("
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'member_count'
    ")->fetchColumn();

    if ($checkMemberCount == 0) {
        $pdo->exec("ALTER TABLE groups ADD COLUMN member_count INTEGER DEFAULT 0");
        echo "Column member_count added to groups table\n";
    } else {
        echo "Column member_count already exists in groups table\n";
    }

    // Actualizează member_count pentru grupurile existente
    $groups = $pdo->query("SELECT id FROM groups")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($groups as $group) {
        $memberCount = $pdo->prepare("SELECT COUNT(*) FROM group_members WHERE group_id = ?");
        $memberCount->execute([$group['id']]);
        $count = $memberCount->fetchColumn();

        $updateStmt = $pdo->prepare("UPDATE groups SET member_count = ? WHERE id = ?");
        $updateStmt->execute([$count, $group['id']]);

        echo "Group {$group['id']} updated with $count members\n";
    }

    // Creează funcția trigger pentru group_members
    $pdo->exec("
        CREATE OR REPLACE FUNCTION update_group_member_count()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Determină operația și group_id-ul
            IF TG_OP = 'INSERT' THEN
                -- Incrementează member_count
                UPDATE groups   
                SET member_count = COALESCE(member_count, 0) + 1   
                WHERE id = NEW.group_id;
                
                RETURN NEW;
                
            ELSIF TG_OP = 'DELETE' THEN
                -- Decrementează member_count (nu poate fi mai mic de 0)
                UPDATE groups   
                SET member_count = GREATEST(COALESCE(member_count, 1) - 1, 0)  
                WHERE id = OLD.group_id;
                
                RETURN OLD;
            END IF;
            
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
    ");

    // Creează trigger-ul pentru group_members
    $pdo->exec("
        DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;
        CREATE TRIGGER trigger_update_group_member_count
            AFTER INSERT OR DELETE ON group_members
            FOR EACH ROW
            EXECUTE FUNCTION update_group_member_count();
    ");

    echo "TRIGGER CREAT!\n\n";

    echo "Testare\n";

    // Test trigger 1 - update user (dacă există utilizatori)
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($userCount > 0) {
        $pdo->exec("UPDATE users SET email = email WHERE user_id = 1");
        echo "Succes Trigger 1\n";
    } else {
        echo "Eșec Trigger 1 - Nu există utilizatori\n";
    }

    // Test trigger 2 - verifică dacă există grupuri și membri
    $groupCount = $pdo->query("SELECT COUNT(*) FROM groups")->fetchColumn();
    if ($groupCount > 0) {
        $memberCount = $pdo->query("SELECT COUNT(*) FROM group_members")->fetchColumn();
        echo "S-au găsit $groupCount grupe având $memberCount membri în total\n";
    } else {
        echo "Nu s-au găsit grupuri\n";
    }

} catch (PDOException $e) {
    echo "Database error creating triggers: " . $e->getMessage() . "\n";
    echo "SQL State: " . $e->getCode() . "\n";
} catch (Exception $e) {
    echo "General error creating triggers: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
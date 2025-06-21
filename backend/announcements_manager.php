<?php
require_once 'config.php';

class AnnouncementManager {
    private $pdo;

    public function __construct() {
        $this->pdo = getDbConnection();
    }

    // Adaugă un anunț nou
    public function addAnnouncement($type, $user_id, $title, $description, $link = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO announcements (type, user_id, title, description, link, created_at) 
                VALUES (:type, :user_id, :title, :description, :link, NOW())
            ");

            $stmt->execute([
                ':type' => $type,
                ':user_id' => $user_id,
                ':title' => $title,
                ':description' => $description,
                ':link' => $link
            ]);

            return true;
        } catch (Exception $e) {
            error_log("Error adding announcement: " . $e->getMessage());
            return false;
        }
    }

    // Obține cele mai recente 10 anunțuri pentru RSS
    public function getRecentAnnouncements($limit = 10) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT a.*, u.username, u.real_name
                FROM announcements a
                LEFT JOIN users u ON a.user_id = u.user_id
                ORDER BY a.created_at DESC
                LIMIT :limit
            ");

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting announcements: " . $e->getMessage());
            return [];
        }
    }

    // Funcții helper pentru fiecare tip de anunț
    public function addNewGroupAnnouncement($user_id, $group_name, $group_id) {
        $title = "Grup nou creat: {$group_name}";
        $description = "Un grup nou a fost creat și așteaptă membri!";
        $link = "/frontend/groupPage/groupPage.html?id={$group_id}";

        return $this->addAnnouncement('new_group', $user_id, $title, $description, $link);
    }

    public function addNewReviewAnnouncement($user_id, $book_title, $book_id, $rating) {
        $title = "Recenzie nouă pentru: {$book_title}";
        $description = "O nouă recenzie cu {$rating} stele a fost adăugată!";
        $link = "/frontend/bookDetails/bookDetails.html?id={$book_id}";

        return $this->addAnnouncement('new_review', $user_id, $title, $description, $link);
    }

    public function addTopBookAnnouncement($book_title, $book_id) {
        $title = "Cartea săptămânii: {$book_title}";
        $description = "Această carte a ajuns cea mai apreciată de pe site!";
        $link = "/frontend/topRatedPage/topRatedPage.html";

        return $this->addAnnouncement('top_book', null, $title, $description, $link);
    }

    public function addTopAuthorAnnouncement($author_name, $author_id) {
        $title = "Autorul lunii: {$author_name}";
        $description = "Acest autor a ajuns cel mai citit de pe site!";
        $link = "/frontend/popularAuthorsPage/popularAuthorsPage.html";

        return $this->addAnnouncement('top_author', null, $title, $description, $link);
    }
}
?>
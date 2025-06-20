<?php
require_once 'config.php';
require_once 'announcements_manager.php';

// Set content type to XML
header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: ' . gmdate('D, d M Y H:i:s') . ' GMT');

try {
    $announcementManager = new AnnouncementManager();
    $announcements = $announcementManager->getRecentAnnouncements(10);

    // Get site base URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;

    // Start XML output
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<rss version="2.0">' . "\n";
    echo '<channel>' . "\n";
    echo '<title>BookTracker - Anunțuri Comunitate</title>' . "\n";
    echo '<link>' . $baseUrl . '</link>' . "\n";
    echo '<description>Ultimele anunțuri din comunitatea BookTracker</description>' . "\n";
    echo '<language>ro-RO</language>' . "\n";
    echo '<lastBuildDate>' . date('r') . '</lastBuildDate>' . "\n";

    foreach ($announcements as $announcement) {
        $pubDate = date('r', strtotime($announcement['created_at']));
        $link = $baseUrl . $announcement['link'];
        $author = $announcement['real_name'] ?: $announcement['username'] ?: 'BookTracker';

        echo '<item>' . "\n";
        echo '<title><![CDATA[' . $announcement['title'] . ']]></title>' . "\n";
        echo '<description><![CDATA[' . $announcement['description'] . ']]></description>' . "\n";
        echo '<link>' . $link . '</link>' . "\n";
        echo '<guid>' . $baseUrl . '/rss/' . $announcement['id'] . '</guid>' . "\n";
        echo '<pubDate>' . $pubDate . '</pubDate>' . "\n";
        echo '<author><![CDATA[' . $author . ']]></author>' . "\n";
        echo '<category>' . ucfirst(str_replace('_', ' ', $announcement['type'])) . '</category>' . "\n";
        echo '</item>' . "\n";
    }

    echo '</channel>' . "\n";
    echo '</rss>' . "\n";

} catch (Exception $e) {
    // In case of error, return a basic RSS with error message
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<rss version="2.0"><channel>' . "\n";
    echo '<title>BookTracker RSS - Error</title>' . "\n";
    echo '<description>Error loading RSS feed</description>' . "\n";
    echo '</channel></rss>' . "\n";
}

?>
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

    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;

    // Create DOMDocument
    $dom = new DOMDocument('1.0', 'UTF-8');
    $dom->formatOutput = true;

    // <rss version="2.0">
    $rss = $dom->createElement('rss');
    $rss->setAttribute('version', '2.0');
    $dom->appendChild($rss);

    // <channel>
    $channel = $dom->createElement('channel');
    $rss->appendChild($channel);

    // Add channel metadata
    $channel->appendChild($dom->createElement('title', 'BookTracker - Anunțuri Comunitate'));
    $channel->appendChild($dom->createElement('link', $baseUrl));
    $channel->appendChild($dom->createElement('description', 'Ultimele anunțuri din comunitatea BookTracker'));
    $channel->appendChild($dom->createElement('language', 'ro-RO'));
    $channel->appendChild($dom->createElement('lastBuildDate', date(DATE_RSS)));

    // Add each <item>
    foreach ($announcements as $announcement) {
        $item = $dom->createElement('item');

        $title = $dom->createElement('title');
        $title->appendChild($dom->createCDATASection($announcement['title']));
        $item->appendChild($title);

        $desc = $dom->createElement('description');
        $desc->appendChild($dom->createCDATASection($announcement['description']));
        $item->appendChild($desc);

        $link = $baseUrl . $announcement['link'];
        $item->appendChild($dom->createElement('link', $link));
        $item->appendChild($dom->createElement('guid', $baseUrl . '/rss/' . $announcement['id']));
        $item->appendChild($dom->createElement('pubDate', date(DATE_RSS, strtotime($announcement['created_at']))));

        $author = $announcement['real_name'] ?: $announcement['username'] ?: 'BookTracker';
        $authorEl = $dom->createElement('author');
        $authorEl->appendChild($dom->createCDATASection($author));
        $item->appendChild($authorEl);

        $category = ucfirst(str_replace('_', ' ', $announcement['type']));
        $item->appendChild($dom->createElement('category', $category));

        $channel->appendChild($item);
    }

    // Output final XML
    echo $dom->saveXML();

} catch (Exception $e) {
    // Basic fallback RSS on error
    $dom = new DOMDocument('1.0', 'UTF-8');
    $rss = $dom->createElement('rss');
    $rss->setAttribute('version', '2.0');
    $dom->appendChild($rss);
    $channel = $dom->createElement('channel');
    $rss->appendChild($channel);
    $channel->appendChild($dom->createElement('title', 'BookTracker RSS - Error'));
    $channel->appendChild($dom->createElement('description', 'Error loading RSS feed'));
    echo $dom->saveXML();
}
?>

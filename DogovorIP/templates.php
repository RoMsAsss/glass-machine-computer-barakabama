<?php
header('Content-Type: application/json');

$category = $_GET['category'] ?? '';
$search = $_GET['search'] ?? '';

$templatesDir = __DIR__ . '/../templates/';
$result = [];

// Рекурсивный поиск файлов
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($templatesDir));
foreach ($iterator as $file) {
    if ($file->isDir()) continue;

    $path = $file->getPathname();
    $relativePath = str_replace($templatesDir, '', $path);

    // Фильтрация по категории
    if ($category && strpos($relativePath, $category) === false) continue;

    // Фильтрация по поиску
    if ($search && stripos($file->getFilename(), $search) === false) continue;

    $result[] = [
        'id' => md5($relativePath),
        'name' => pathinfo($file->getFilename(), PATHINFO_FILENAME),
        'filename' => $relativePath,
        'category' => strtok($relativePath, '/'),
        'isFree' => strpos($relativePath, 'free') !== false,
        'createdAt' => date('Y-m-d', $file->getCTime()),
        'size' => $file->getSize()
    ];
}

echo json_encode(['templates' => $result]);
?>

$templatesDir = __DIR__ . '/../templates/';
if (!is_dir($templatesDir)) {
    echo json_encode(['error' => 'Templates directory not found']);
    exit;
}
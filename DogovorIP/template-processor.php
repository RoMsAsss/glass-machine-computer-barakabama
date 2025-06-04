<?php
// Проверяем авторизацию (если нужно)
session_start();
if (!isset($_SESSION['user_id'])) {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

// Получаем запрошенный файл
$templateFile = $_GET['file'] ?? '';
$action = $_GET['action'] ?? 'preview';

// Проверяем безопасность пути
if (preg_match('/\.\.|[\/\\\\]/', $templateFile)) {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

$templatePath = __DIR__ . '/templates/' . $templateFile;

// Проверяем существование файла
if (!file_exists($templatePath)) {
    header('HTTP/1.1 404 Not Found');
    echo "Файл шаблона не найден";
    exit;
}

// Обработка скачивания
if ($action === 'download') {
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="'.basename($templatePath).'"');
    header('Content-Length: ' . filesize($templatePath));
    readfile($templatePath);
    exit;
}

// Предпросмотр
$templateContent = file_get_contents($templatePath);
$htmlContent = convertDocxToHtml($templateContent);
displayEditablePreview($htmlContent, basename($templatePath));

// Функция конвертации DOCX в HTML (заглушка)
function convertDocxToHtml($docxContent) {
    return '<div class="template-preview">
        <h3>Предпросмотр шаблона</h3>
        <div class="editable-content" contenteditable="true">
            [Это пример текста шаблона, который можно редактировать]
            <span class="placeholder">[Заменяемый текст]</span>
            Обычный текст, который нельзя изменить
            <span class="placeholder">[Другой заменяемый текст]</span>
        </div>
    </div>';
}

// Функция отображения предпросмотра
function displayEditablePreview($html, $filename) {
    echo '<!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Предпросмотр: '.htmlspecialchars($filename).'</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .template-preview { max-width: 800px; margin: 0 auto; }
            .editable-content { border: 1px solid #ddd; padding: 20px; min-height: 500px; }
            .placeholder { background-color: #fff8e1; color: #666; }
            .controls { margin: 20px 0; text-align: center; }
            button { padding: 10px 20px; margin: 0 10px; }
        </style>
    </head>
    <body>
        <div class="template-preview">
            '.$html.'
            <div class="controls">
                <button onclick="window.print()">Печать</button>
                <button onclick="saveChanges()">Сохранить изменения</button>
                <a href="template-processor.php?file='.urlencode($filename).'&action=download" class="btn">Скачать оригинал</a>
            </div>
        </div>
        <script>
            function saveChanges() {
                alert("Функция сохранения будет реализована позже");
            }

            document.addEventListener("click", function(e) {
                if (e.target.classList.contains("placeholder")) {
                    e.target.setAttribute("contenteditable", "true");
                    e.target.focus();
                } else {
                    document.querySelectorAll(".placeholder").forEach(el => {
                        el.setAttribute("contenteditable", "false");
                    });
                }
            });
        </script>
    </body>
    </html>';
}
?>
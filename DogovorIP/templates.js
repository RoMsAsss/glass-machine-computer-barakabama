// templates.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');

// Путь к логотипу для водяного знака
const watermarkLogoPath = path.join(__dirname, 'logo.jpg');

// Каталог для хранения шаблонов
const templatesDir = path.join(__dirname, 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// База данных шаблонов (в реальном проекте используйте SQLite или другую БД)
const templatesDB = {
  free: [],
  premium: []
};

// Функция для добавления водяного знака в PDF
async function addWatermarkToPDF(inputPath, outputPath) {
  try {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const { width, height } = pages[0].getSize();

    // Создаем водяной знак
    for (const page of pages) {
      // Логотип
      const logoImage = await pdfDoc.embedJpg(fs.readFileSync(watermarkLogoPath));
      const logoDims = logoImage.scale(0.3);

      page.drawImage(logoImage, {
        x: width - logoDims.width - 20,
        y: 20,
        width: logoDims.width,
        height: logoDims.height,
        opacity: 0.5
      });

      // Текст
      page.drawText('Dogovor IP', {
        x: 50,
        y: 50,
        size: 24,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: Math.PI / 4
      });
    }

    // Сохраняем результат
    const modifiedPdf = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdf);
    return true;
  } catch (error) {
    console.error('Error adding watermark to PDF:', error);
    return false;
  }
}

// Функция для добавления водяного знака в DOCX (конвертируем в PDF)
async function addWatermarkToDOCX(inputPath, outputPath) {
  try {
    // Конвертируем DOCX в PDF
    const tempPdfPath = path.join(templatesDir, `temp_${uuidv4()}.pdf`);

    // Используем mammoth для конвертации (в реальном проекте лучше использовать office-to-pdf)
    const result = await mammoth.convertToHtml({ path: inputPath });
    const html = result.value;

    // Здесь должна быть логика конвертации HTML в PDF (используйте puppeteer или другой инструмент)
    // Для демонстрации просто копируем файл
    fs.copyFileSync(inputPath, tempPdfPath);

    // Добавляем водяной знак
    const success = await addWatermarkToPDF(tempPdfPath, outputPath);

    // Удаляем временный файл
    fs.unlinkSync(tempPdfPath);

    return success;
  } catch (error) {
    console.error('Error adding watermark to DOCX:', error);
    return false;
  }
}

// Функция загрузки шаблона
async function uploadTemplate(req, res) {
  try {
    const { name, description, category } = req.body;
    const file = req.files.templateFile;
    const addWatermark = req.body.addWatermark === 'true';

    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Проверяем расширение файла
    const ext = path.extname(file.name).toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат файла' });
    }

    // Генерируем уникальное имя файла
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(templatesDir, filename);

    // Сохраняем оригинальный файл
    await file.mv(filePath);

    let finalFilePath = filePath;

    // Добавляем водяной знак если нужно
    if (addWatermark) {
      const watermarkedPath = path.join(templatesDir, `watermarked_${filename}`);

      if (ext === '.pdf') {
        await addWatermarkToPDF(filePath, watermarkedPath);
      } else {
        await addWatermarkToDOCX(filePath, watermarkedPath);
      }

      finalFilePath = watermarkedPath;
      fs.unlinkSync(filePath); // Удаляем оригинал без водяного знака
    }

    // Сохраняем информацию о шаблоне в БД
    const template = {
      id: uuidv4(),
      name,
      description,
      category,
      filename: path.basename(finalFilePath),
      createdAt: new Date().toISOString(),
      isFree: category === 'free'
    };

    if (template.isFree) {
      templatesDB.free.push(template);
    } else {
      templatesDB.premium.push(template);
    }

    // В реальном проекте сохраняем в SQLite
    // await db.run(`INSERT INTO templates VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //   [template.id, template.name, template.description, template.category,
    //    template.filename, template.createdAt, template.isFree]);

    return res.json({ success: true, template });
  } catch (error) {
    console.error('Error uploading template:', error);
    return res.status(500).json({ error: 'Ошибка загрузки шаблона' });
  }
}

// Функция получения списка шаблонов
async function getTemplates(req, res) {
  try {
    const { category, isFree, search } = req.query;

    let templates = [];

    if (isFree === 'true') {
      templates = templatesDB.free;
    } else {
      templates = templatesDB.premium;
    }

    // Фильтрация по категории
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    // Поиск по названию
    if (search) {
      const searchTerm = search.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    return res.json({ templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    return res.status(500).json({ error: 'Ошибка получения шаблонов' });
  }
}

module.exports = {
  uploadTemplate,
  getTemplates
};
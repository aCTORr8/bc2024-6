const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { program } = require('commander');
const { swaggerUi, swaggerSpec } = require('./swagger'); 
const app = express();
const upload = multer();

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); 

program
  .requiredOption('-h, --host <host>', 'Server address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Path to cache directory');

program.parse(process.argv);
const { host, port, cache } = program.opts();

/**
 * @swagger
 * /:
 *   get:
 *     description: Головна сторінка
 *     responses:
 *       200:
 *         description: Вітаю на сервісі нотаток
 */
app.get('/', (req, res) => {
  res.send('Welcome to the Note App! Go to /UploadForm.html to upload a note.');
});

/**
 * @swagger
 * /notes/{noteName}:
 *   get:
 *     description: Отримання конкретної нотатки
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         description: Ім'я нотатки
 *     responses:
 *       200:
 *         description: Повертає вміст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.get('/notes/:noteName', (req, res) => {
  const notePath = path.join(cache, req.params.noteName);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  const noteText = fs.readFileSync(notePath, 'utf-8');
  res.send(noteText);
});

/**
 * @swagger
 * /notes/{noteName}:
 *   put:
 *     description: Оновлення нотатки
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         description: Ім'я нотатки
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: Новий текст нотатки
 *     responses:
 *       200:
 *         description: Нотатка оновлена
 *       400:
 *         description: Невалідний контент нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.put('/notes/:noteName', express.text(), (req, res) => {
  const notePath = path.join(cache, req.params.noteName);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  const newText = req.body;
  if (!newText.trim()) {
    return res.status(400).send('Invalid note content');
  }

  fs.writeFileSync(notePath, newText, 'utf-8');
  res.send('Note updated');
});

/**
 * @swagger
 * /notes/{noteName}:
 *   delete:
 *     description: Видалення нотатки
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         description: Ім'я нотатки
 *     responses:
 *       200:
 *         description: Нотатка видалена
 *       404:
 *         description: Нотатка не знайдена
 */
app.delete('/notes/:noteName', (req, res) => {
  const notePath = path.join(cache, req.params.noteName);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

/**
 * @swagger
 * /notes:
 *   get:
 *     description: Отримання списку всіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cache).map(filename => ({
    name: filename,
    text: fs.readFileSync(path.join(cache, filename), 'utf-8')
  }));
  res.json(notes);
});

/**
 * @swagger
 * /write:
 *   post:
 *     description: Створення нової нотатки
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Ім'я нотатки
 *               note:
 *                 type: string
 *                 description: Текст нотатки
 *     responses:
 *       201:
 *         description: Нотатка створена
 *       400:
 *         description: Недійсні дані або нотатка вже існує
 */
app.post('/write', upload.none(), (req, res) => {
  const { note_name: noteName, note: noteText } = req.body;
  
  if (!noteName || !noteText) return res.status(400).send('Note name and content are required');

  const notePath = path.join(cache, noteName);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, noteText);
  res.status(201).send('Note created');
});

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     description: Завантаження форми для створення нотатки
 *     responses:
 *       200:
 *         description: Форма для завантаження нотатки
 */
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log('Swagger docs are available at http://localhost:8800/docs');
});

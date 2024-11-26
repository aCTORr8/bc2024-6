const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { program } = require('commander');

const app = express();
const upload = multer();

program
  .requiredOption('-h, --host <host>', 'Server address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Path to cache directory');

program.parse(process.argv);
const { host, port, cache } = program.opts();

app.get('/', (req, res) => {
  res.send('Welcome to the Note App! Go to /UploadForm.html to upload a note.');
});

app.get('/notes/:noteName', (req, res) => {
  const notePath = path.join(cache, req.params.noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  const noteText = fs.readFileSync(notePath, 'utf-8');
  res.send(noteText);
});

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

app.delete('/notes/:noteName', (req, res) => {
  const notePath = path.join(cache, req.params.noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cache).map(filename => ({
    name: filename,
    text: fs.readFileSync(path.join(cache, filename), 'utf-8')
  }));
  res.json(notes);
});

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

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

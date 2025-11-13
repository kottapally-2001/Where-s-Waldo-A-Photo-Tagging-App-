const express = require('express');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/public')));


// Initialize DB
async function initDB() {
  const dbFile = path.join(__dirname, 'db.json');
  const adapter = new JSONFile(dbFile);
  const db = new Low(adapter);
  await db.read();
  db.data ||= { characters: [], scores: [] };
  await db.write();
  return db;
}

let db;

initDB().then((database) => {
  db = database;

  // ✅ 1. Get characters
  app.get('/api/characters', async (req, res) => {
    await db.read();
    res.json(db.data.characters);
  });

  // ✅ 2. Check if click matches a character
  app.post('/api/check', async (req, res) => {
    await db.read();
    const { x, y, imageWidth, imageHeight, characterId } = req.body;
    if (!x || !y || !imageWidth || !imageHeight || !characterId)
      return res.status(400).json({ correct: false });

    const fx = x / imageWidth;
    const fy = y / imageHeight;

    const char = db.data.characters.find((c) => c.id === characterId);
    if (!char) return res.json({ correct: false });

    const dx = fx - char.cx;
    const dy = fy - char.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const correct = dist <= char.radius;

    if (correct) {
      char.found = true;
      await db.write();
    }

    const center = {
      x: Math.round(char.cx * imageWidth),
      y: Math.round(char.cy * imageHeight),
    };

    res.json({ correct, characterId, center });
  });

  // ✅ 3. Reset game (set all found=false)
  app.post('/api/reset', async (req, res) => {
    await db.read();
    db.data.characters.forEach((c) => (c.found = false));
    await db.write();
    res.json({ ok: true });
  });

  // ✅ 4. Save score
  app.post('/api/score', async (req, res) => {
    await db.read();
    const { name, timeMs } = req.body;
    db.data.scores.push({ id: Date.now().toString(), name, timeMs });
    await db.write();
    res.json({ ok: true });
  });

  // ✅ 5. Get leaderboard
  app.get('/api/scores', async (req, res) => {
    await db.read();
    const sorted = db.data.scores.sort((a, b) => a.timeMs - b.timeMs).slice(0, 10);
    res.json(sorted);
  });

  // ✅ Serve frontend
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  );
});

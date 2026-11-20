require('dotenv').config();
const express = require('express');
const { sequelize, Track } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const FIELDS = ['songTitle', 'artistName', 'albumName', 'genre', 'duration', 'releaseYear'];
const REQUIRED = ['songTitle', 'artistName', 'albumName', 'genre', 'duration', 'releaseYear'];
const STRINGS = ['songTitle', 'artistName', 'albumName', 'genre'];
const INTEGERS = ['duration', 'releaseYear'];

// Returns an error message, or null if the body is valid
function validate(body, requireAll) {
  if (requireAll) {
    const missing = REQUIRED.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
    if (missing.length) return `Missing required field(s): ${missing.join(', ')}`;
  }
  for (const f of STRINGS) {
    if (body[f] !== undefined && (typeof body[f] !== 'string' || body[f].trim() === '')) {
      return `${f} must be a non-empty string`;
    }
  }
  for (const f of INTEGERS) {
    if (body[f] !== undefined && (!Number.isInteger(body[f]) || body[f] <= 0)) {
      return `${f} must be a positive integer`;
    }
  }
  return null;
}

function pick(body) {
  return Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
}

// GET all tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await Track.findAll();
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve tracks' });
  }
});

// GET track by id
app.get('/api/tracks/:id', async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    res.json(track);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve track' });
  }
});

// POST create track
app.post('/api/tracks', async (req, res) => {
  try {
    const body = req.body || {};
    const problem = validate(body, true);
    if (problem) return res.status(400).json({ error: problem });

    const track = await Track.create(pick(body));
    res.status(201).json(track);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// PUT update track
app.put('/api/tracks/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const problem = validate(body, false);
    if (problem) return res.status(400).json({ error: problem });

    const updates = pick(body);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const [updated] = await Track.update(updates, { where: { trackId: req.params.id } });
    if (updated === 0) {
      // Either the track doesn't exist, or the values were unchanged
      const exists = await Track.findByPk(req.params.id);
      if (!exists) return res.status(404).json({ error: 'Track not found' });
    }

    res.json(await Track.findByPk(req.params.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// DELETE track
app.delete('/api/tracks/:id', async (req, res) => {
  try {
    const deleted = await Track.destroy({ where: { trackId: req.params.id } });
    if (deleted === 0) return res.status(404).json({ error: 'Track not found' });
    res.json({ message: 'Track deleted', trackId: Number(req.params.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();

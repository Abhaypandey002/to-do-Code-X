const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = __dirname;
const USERS_FILE = path.join(DATA_DIR, 'users.json');

app.use(express.json());
app.use(cors());

// Very small in-memory session store. This keeps the demo simple while providing
// a basic authentication barrier around the productivity tools.
const sessions = new Map(); // token -> username

// Read the credential store from disk. If it does not exist yet the file will
// be created with an empty schema.
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
      return { users: [] };
    }
    throw error;
  }
}

// Persist the updated credential store.
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9_-]/gi, '');
}

// Each user owns a dedicated JSON document containing their profile, todos and
// calendar events. This helper loads the bundle when it exists.
async function loadUserBundle(profileFile) {
  if (!profileFile) {
    return { profile: null, todos: [], events: [] };
  }
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, profileFile), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { profile: null, todos: [], events: [] };
    }
    throw error;
  }
}

// Persist the latest version of the user's bundle back to disk.
async function saveUserBundle(profileFile, bundle) {
  await fs.writeFile(path.join(DATA_DIR, profileFile), JSON.stringify(bundle, null, 2));
}

// Protect subsequent routes by requiring a valid session token.
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.username = sessions.get(token);
  next();
}

// Basic credential setup for demo purposes.
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  const users = await readUsers();
  if (users.users.some((user) => user.username === username)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }
  users.users.push({ username, password, profileFile: null });
  await writeUsers(users);
  res.json({ message: 'User registered successfully.' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === username && entry.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, username);
  const bundle = await loadUserBundle(user.profileFile);
  res.json({ token, bundle, profileFile: user.profileFile });
});

app.post('/api/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token && sessions.has(token)) {
    sessions.delete(token);
  }
  res.json({ message: 'Logged out.' });
});

app.get('/api/user', requireAuth, async (req, res) => {
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  const bundle = await loadUserBundle(user && user.profileFile);
  res.json({ bundle, profileFile: user && user.profileFile });
});

app.post('/api/user', requireAuth, async (req, res) => {
  const { name, phone, school, goal } = req.body;
  if (!name || !phone || !school || !goal) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const safeName = sanitizeFileName(name) || 'user';
  const profileFile = `${safeName}.json`;
  const bundle = await loadUserBundle(profileFile);
  bundle.profile = { name, phone, school, goal, updatedAt: new Date().toISOString() };
  await saveUserBundle(profileFile, bundle);

  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  if (user) {
    user.profileFile = profileFile;
    await writeUsers(users);
  }
  res.json({ message: 'Profile saved successfully.', bundle, profileFile });
});

app.get('/api/todos', requireAuth, async (req, res) => {
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  const bundle = await loadUserBundle(user && user.profileFile);
  res.json(bundle.todos || []);
});

app.post('/api/todos', requireAuth, async (req, res) => {
  const { todos } = req.body;
  if (!Array.isArray(todos)) {
    return res.status(400).json({ message: 'Todos must be an array.' });
  }
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  const profileFile = user && user.profileFile ? user.profileFile : `${sanitizeFileName(req.username)}.json`;
  const bundle = await loadUserBundle(profileFile);
  bundle.todos = todos;
  await saveUserBundle(profileFile, bundle);
  if (!user.profileFile) {
    user.profileFile = profileFile;
    await writeUsers(users);
  }
  res.json({ message: 'Todos saved.', todos: bundle.todos });
});

app.get('/api/events', requireAuth, async (req, res) => {
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  const bundle = await loadUserBundle(user && user.profileFile);
  res.json(bundle.events || []);
});

app.post('/api/events', requireAuth, async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ message: 'Events must be an array.' });
  }
  const users = await readUsers();
  const user = users.users.find((entry) => entry.username === req.username);
  const profileFile = user && user.profileFile ? user.profileFile : `${sanitizeFileName(req.username)}.json`;
  const bundle = await loadUserBundle(profileFile);
  bundle.events = events;
  await saveUserBundle(profileFile, bundle);
  if (!user.profileFile) {
    user.profileFile = profileFile;
    await writeUsers(users);
  }
  res.json({ message: 'Events saved.', events: bundle.events });
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

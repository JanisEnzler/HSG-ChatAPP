var express = require('express');
var app = express();
var port = 3000;

const dbPassword = process.env.DB_PASSWORD || 'password';
const dbUser = process.env.DB_USER || 'user';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB|| 'postgres';

const { Pool } = require('pg');

const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: dbPort,
});

app.set('port', port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chatHistory = [];
const nicknames = [];

// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  // Request headers you wish to allow
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  // Pass to next layer of middleware
  next();
});


// history
app.get('/history', async (req, res) => {
  // retrieve all messages from the database
  try {
    const result = await pool.query('SELECT * FROM chatHistory');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

app.post('/history', async (req, res) => {
  const chatMessage = req.body?.message?.toString();
  const nickname_id = req.body?.nickname_id?.toString();

  if (!chatMessage) {
    res.status(400).send('Message is missing.');
    return;
  }

  if (!nickname_id) {
    res.status(400).send('Nickname is missing.');
    return;
  }

  // Check if the nickname exists in the DB
  const result = await pool.query('SELECT * FROM nicknames WHERE id = $1', [nickname_id]);
  if (result.rows.length === 0) {
    res.status(400).send('Nickname not found.');
    return;
  }

  // Get the current, local time
  const date = new Date()

  // Add the message to the chat history in the database
  try {
    const result = await pool.query('INSERT INTO chatHistory (message, nickname_id, timestamp) VALUES ($1, $2, $3) RETURNING *', [chatMessage, nickname_id, date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// nicknames
app.get('/nicknames', async (req, res) => {
  // retrieve all nicknames from the database
  try {
    const result = await pool.query('SELECT * FROM nicknames');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/nicknames/:id', async (req, res) => {
  const id = +req.params.id;
  // make sure to handle all errors
  try {
    const result = await pool.query('SELECT * FROM nicknames WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).send('Nickname not found.');
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/nicknames', async (req, res) => {
  const userName = req.body?.nickname?.toString();

  if (!userName) {
    res.status(400).send('Nickname is missing.');
    return;
  }

  /* Nickname should only contain letters, numbers, spaces, underscores and hyphens */
  if (!/^[a-zA-Z0-9_ -]+$/.test(userName)) {
    res.status(400).send('Nickname contains invalid characters.');
    return;
  }

  /* Check if the nickname is already in the DB */
  const result = await pool.query('SELECT * FROM nicknames WHERE nickname = $1', [userName]);
  if (result.rows.length > 0) {
    res.status(400).send('Nickname already exists.');
    return;
  }

  try {
    const result = await pool.query('INSERT INTO nicknames (nickname) VALUES ($1) RETURNING *', [userName]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/nicknames/:id', async (req, res) => {
  const id = +req.params.id;

  try {
    const result = await pool.query('DELETE FROM nicknames WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).send('Nickname not found.');
      return;
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

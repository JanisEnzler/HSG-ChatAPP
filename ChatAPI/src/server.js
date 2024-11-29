var express = require('express');
require('dotenv').config();
var app = express();
var port = 3000;

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const dbPassword = process.env.DB_PASSWORD || 'password';
const dbUser = process.env.DB_USER || 'admin';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB || 'postgres';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
const adminSecret = process.env.ADMIN_SECRET || 'defaultSecret';

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
app.use(cookieParser());

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

app.post('/signup', async (req, res) => {
  const userName = req.body?.username?.toString();
  const userPassword = req.body?.password?.toString();

  if (!userName || !userPassword) {
    res.status(400).send('Username or password is missing.');
    return;
  }


  // Check username validity
  if (!/^[a-zA-Z0-9_ -]+$/.test(userName)) {
    res.status(400).send('Username contains invalid characters.');
    return;
  }

  // Username should be between 3 and 20 characters long
  if (userName.length < 3 || userName.length > 20) {
    res.status(400).send('Username should be between 3 and 20 characters long.');
    return;
  }

  // Check password validity
  if (!/^[a-zA-Z0-9!@#$%^&*]+$/.test(userPassword)) {
    res.status(400).send('Password contains invalid characters.');
    return;
  }

  // Password should be between 8 and 32 characters long
  if (userPassword.length < 8 || userPassword.length > 32) {
    res.status(400).send('Password should be between 8 and 32 characters long.');
    return;
  }

  // Check if the username is already in the DB, and if not, add it
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [userName]);
    if (result.rows.length > 0) {
      res.status(400).send('Username already exists.');
      return;
    } else {

      hashedPassword = crypto.createHash('sha256', adminSecret).update(userPassword).digest('hex');

      const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [userName, hashedPassword]);
      const token = generateToken(result.rows[0].user_id);

      res.status(201).json({ token: token });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Takes username and password and returns a token
app.get('/login', async (req, res) => {
  const userName = req.body?.username?.toString();
  const userPassword = req.body?.password?.toString();

  // Check if the username and password are provided
  if (!userName || !userPassword) {
    res.status(400).send('Username or password is missing.');
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [userName]);
    if (result.rows.length === 0) {
      res.status(404).send('User not found.');
      return;
    }

    hashedPassword = crypto.createHash('sha256', adminSecret).update(userPassword).digest('hex');

    if (result.rows[0].password !== hashedPassword) {
      res.status(401).send('Incorrect password.');
      return;
    } else {
      const token = generateToken(result.rows[0].user_id);

      res.status(200).json({ token: token });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/validate', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  
  
  if (!verifyToken(token)) {
    res.status(401).send('Invalid or expired token.');
    return;
  }
  user_id = jwt.decode(token).id;
  res.status(200).send(`Valid token for user: ${user_id}`);
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

  try {
    // Check if the nickname exists in the DB
    const result = await pool.query('SELECT * FROM nicknames WHERE id = $1', [nickname_id]);
    if (result.rows.length === 0) {
      res.status(400).send('Nickname not found.');
      return;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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

  // Nickname should be between 3 and 20 characters long
  if (userName.length < 3 || userName.length > 20) {
    res.status(400).send('Nickname should be between 3 and 20 characters long.');
    return;
  }

  try {
    /* Check if the nickname is already in the DB */
    var result = await pool.query('SELECT * FROM nicknames WHERE nickname = $1', [userName]);
    if (result.rows.length > 0) {
      res.status(400).send('Nickname already exists.');
      return;
    }
    result = await pool.query('INSERT INTO nicknames (nickname) VALUES ($1) RETURNING *', [userName]);
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

app.post('/chats/:id', async (req, res) => {
  const id = req.params.id;
  const chatMessage = req.body?.message?.toString();
  // Get beared token from the request

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const userId = jwt.decode(token).id;
  
  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  

  // Check if the user is part of the group

  try {
    const result = await pool.query(
      'SELECT * FROM user_groups WHERE user_id = $1 AND group_id = $2',
      [userId, id]
    );

    if (result.rows.length === 0) {
      res.status(403).send('User is not part of the group.');
      return;
    }

    if (!chatMessage) {
      res.status(400).send('Message is missing.');
      return;
    }

    const message_result = await pool.query('INSERT INTO messages (message, group_id, user_id, timestamp ) VALUES ($1, $2, $3, $4) RETURNING *', [chatMessage, id, userId, new Date()]);

    res.status(201).json(message_result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new chat group
app.post('/chats', async (req, res) => {
  // Get list of user ids from the request body
  const userIds = req.body?.userIds;
  const groupName = req.body?.groupName?.toString();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const userId = jwt.decode(token).id;
  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  if (!groupName) {
    res.status(400).send('Group name is missing.');
    return;
  }

  if (!userIds || userIds.length < 1) {
    res.status(400).send('Invalid UserIds.');
    return;
  }

  try {
    // Create a new group
    const groupResult = await pool.query('INSERT INTO groups (group_name) VALUES ($1) RETURNING *', [groupName]);
    const groupId = groupResult.rows[0].group_id;

    // Add users to the group
    for (const id of userIds) {
      await pool.query('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [id, groupId]);
    }

    // Add the creator to the group
    await pool.query('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);
    
    res.status(201).json(groupResult.rows[0]);

  } catch (error) {
    try {
      await pool.query('DELETE FROM groups WHERE group_name = $1', [groupName]);
    } catch (deleteError) {
      console.error('Error deleting group:', deleteError.message);
    }

    if (error.code === '23505') {
      res.status(409).json({ error: 'Duplicate entry. Unique constraint violated.' });
    } else if (error.code === '23503') {
      res.status(404).json({ error: 'Foreign key constraint violated.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


app.listen(app.get('port'), function () {
  console.log('ChatAPI app is running on port', app.get('port'));
});


function generateToken(userID) {
  const payload = { id: userID };
  const options = { expiresIn: 300 };
  token = jwt.sign(payload, adminSecret, options);
  return token;
}

// async function to verify the token
function verifyToken(token) {
  try {
    return jwt.verify(token, adminSecret);
  } catch (error) {
    // Access Denied
    return false;
  }
}
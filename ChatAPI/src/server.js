var express = require('express');
require('dotenv').config();
var app = express();
var port = 3000;

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { validate: isUuid } = require('uuid');
const cors = require('cors');


const dbPassword = process.env.DB_PASSWORD || 'password';
const dbUser = process.env.DB_USER || 'admin';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB || 'postgres';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
const adminSecret = process.env.ADMIN_SECRET || 'defaultSecret';
const origin = process.env.ORIGIN || 'http://localhost:4200';

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

app.use(cors({
  origin: origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Create a new user
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
    console.error(err.message);
  }
});

// Takes username and password and returns a token
app.post('/login', async (req, res) => {
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
    console.error(err.message);
  }
});

// Validate the token
app.get('/validate', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!verifyToken(token)) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
    return;
  }
  
  const result = await pool.query('SELECT user_id, username FROM users WHERE user_id = $1', [jwt.decode(token).id]);
  if (result.rows.length === 0) {
    res.status(404).send('User not found.');
    return;
  }
  res.status(200).json(result.rows[0]);
});

// Send a message to a specific group
app.post('/chats/:id', async (req, res) => {
  const id = req.params.id;
  const chatMessage = req.body?.message?.toString();
  // Get beared token from the request

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  

  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  const userId = jwt.decode(token).id;

  // Check if the id is in the correct format
  if (!isUuid(id)) {
    res.status(400).send('Invalid id format.');
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
    console.error(err.message);
  }
});

// Create a new group
app.post('/chats', async (req, res) => {
  // Get list of user ids from the request body
  const userIds = req.body?.userIds;
  const groupName = req.body?.groupName?.toString();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  const userId = jwt.decode(token).id;

  if (!groupName) {
    res.status(400).send('Group name is missing.');
    return;
  }

  if (!/^[a-zA-Z0-9_ -]+$/.test(groupName)) {
    res.status(400).send('Groupname contains invalid characters.');
    return;
  }

  if (groupName.length < 3 || groupName.length > 20) {
    res.status(400).send('Groupname should be between 3 and 20 characters long.');
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
      // Check if the id is in the correct format
      if (!isUuid(id)) {
        res.status(400).send('Invalid id format.');
        return;
      }
      await pool.query('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [id, groupId]);
    }

    // Add the creator to the group
    await pool.query('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);

    res.status(201).json(groupResult.rows[0]);

  } catch (err) {
    try {
      await pool.query('DELETE FROM groups WHERE group_name = $1', [groupName]);
    } catch (deleteError) {
      console.error('Error deleting group:', deleteError.message);
    }

    if (err.code === '23505') {
      res.status(409).json({ error: 'Duplicate entry. Unique constraint violated.' });
    } else if (err.code === '23503') {
      res.status(404).json({ error: 'Foreign key constraint violated.' });
    } else {
      res.status(500).json({ error: err.message });
      console.error(err.message);
    }
  }
});

// Get all groups for a specific user
app.get('/chats', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  const userId = jwt.decode(token).id;

  try {
    const result = await pool.query(
      'SELECT * FROM groups WHERE group_id IN (SELECT group_id FROM user_groups WHERE user_id = $1)',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err.message);
  }
});

// Get all messages for a specific group
app.get('/chats/:id', async (req, res) => {
  const id = req.params.id;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!verifyToken(token)) {
    res.status(401).send('Access Denied.');
    return;
  }

  const userId = jwt.decode(token).id;

  // Check if the id is in the correct format
  if (!isUuid(id)) {
    res.status(400).send('Invalid id format.');
    return;
  }

  try {
    // Check if the user is part of the group
    const memberResult = await pool.query(
      'SELECT * FROM user_groups WHERE user_id = $1 AND group_id = $2',
      [userId, id]
    );

    if (memberResult.rows.length === 0) {
      res.status(403).send('User is not part of the group.');
      return;
    }

    const messagesResult = await pool.query(
      // Join the messages table with the users table, where the group_id is the one provided
      'SELECT messages.message_id, messages.message, messages.timestamp, users.username, users.user_id FROM messages JOIN users ON messages.user_id = users.user_id WHERE group_id = $1', [id]
    );

    // Sort the messages by timestamp, with the oldest message first
    messagesResult.rows.sort((a, b) => a.timestamp - b.timestamp);

    // if the user ID of the message is the same as the user ID of the token, set the isMine property to true
    messagesResult.rows.forEach((message) => {
      message.isMine = message.user_id === userId;
    });

    // If a message has the same user ID as the previous message, set the showUsername property to false
    for (let i = 1; i < messagesResult.rows.length; i++) {
      messagesResult.rows[i].hideUsername = (messagesResult.rows[i].user_id === messagesResult.rows[i - 1].user_id)
    }

    res.status(200).json(messagesResult.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err.message);
  }

});

// Get all users
app.get('/users', async (req, res) => {
  try {
    // retrieve all users from the database and dont send the password
    const result = await pool.query('SELECT user_id, username FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err.message);
  }
});

app.listen(app.get('port'), function () {
  console.log('ChatAPI app is running on port', app.get('port'));
});

function generateToken(userID) {
  const payload = { id: userID };
  const options = { expiresIn: (7*24*60) };
  token = jwt.sign(payload, adminSecret, options);
  return token;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, adminSecret);
  } catch (error) {
    // Access Denied
    return false;
  }
}
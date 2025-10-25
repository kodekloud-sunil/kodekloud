const path = require('path');
const fs = require('fs');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());

// ✅ Modern async connection to MongoDB (Mongoose v7+)
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      user: process.env.MONGO_USERNAME,
      pass: process.env.MONGO_PASSWORD,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  }
})();

// Schema & Model
const dataSchema = new mongoose.Schema({
  name: String,
  id: Number,
  description: String,
  image: String,
  velocity: String,
  distance: String
});

const planetModel = mongoose.model('planets', dataSchema);

// Routes
app.post('/planet', async (req, res) => {
  try {
    const planetData = await planetModel.findOne({ id: req.body.id });
    if (!planetData) {
      return res.status(404).send({ error: "Planet not found. Select a number from 0 - 9" });
    }
    res.send(planetData);
  } catch (err) {
    console.error("Error in /planet:", err);
    res.status(500).send("Error in Planet Data");
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get('/api-docs', (req, res) => {
  fs.readFile('oas.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('Error reading file');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

app.get('/os', (req, res) => {
  res.json({
    "os": OS.hostname(),
    "env": process.env.NODE_ENV
  });
});

app.get('/live', (req, res) => {
  res.json({ "status": "live" });
});

app.get('/ready', (req, res) => {
  res.json({ "status": "ready" }

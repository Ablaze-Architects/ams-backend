// app.js
const express = require('express');
const app = express();

// Example middleware
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});



// Add more routes and middleware here

module.exports = app;

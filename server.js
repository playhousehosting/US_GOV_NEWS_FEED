const express = require('express');
const cors = require('cors');
const newsHandler = require('./api/news');

const app = express();
const port = 3000;

app.use(cors());

app.get('/api/news', (req, res) => {
  newsHandler(req, res);
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
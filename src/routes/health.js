const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '0.0.1',
    environment: process.env.NODE_ENV || 'development',
  });
});

router.get('/ready', (req, res) => {
  res.status(200).json({ ready: true });
});

router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

module.exports = { healthRouter: router };

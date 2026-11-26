const express = require('express');
const router = express.Router();

const items = [
  { id: 1, name: 'Item One', category: 'alpha', active: true },
  { id: 2, name: 'Item Two', category: 'beta', active: true },
  { id: 3, name: 'Item Three', category: 'alpha', active: false },
];

router.get('/items', (req, res) => {
  const { category, active } = req.query;
  let result = items;
  if (category) result = result.filter(i => i.category === category);
  if (active !== undefined) result = result.filter(i => i.active === (active === 'true'));
  res.json({ data: result, count: result.length });
});

router.get('/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ data: item });
});

router.post('/items', (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }
  const newItem = { id: items.length + 1, name, category, active: true };
  items.push(newItem);
  res.status(201).json({ data: newItem });
});

router.get('/info', (req, res) => {
  res.json({
    app: 'harness-poc-app',
    version: process.env.APP_VERSION || '0.0.1',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.DEPLOY_REGION || 'us-east-1',
    buildNumber: process.env.BUILD_NUMBER || 'local',
  });
});

module.exports = { apiRouter: router };

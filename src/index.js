const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { healthRouter } = require('./routes/health');
const { apiRouter } = require('./routes/api');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRouter);
app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Version: ${process.env.APP_VERSION || '0.0.1'}`);
});

module.exports = { app, server };

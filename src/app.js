const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { UPLOADS_ROOT } = require('./middleware/upload');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: env.corsOrigins.length ? env.corsOrigins : true,
}));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS_ROOT));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

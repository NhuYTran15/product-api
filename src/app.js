const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');
const {
  notFoundHandler,
  errorHandler,
} = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? 'healthy' : 'unhealthy',
    services: {
      api: 'healthy',
      mongodb: isMongoConnected ? 'healthy' : 'unhealthy',
    },
  });
});

app.use('/api/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

const express = require('express');
const productRoutes = require('./routes/product.routes');
const {
  notFoundHandler,
  errorHandler,
} = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Product API is running' });
});

app.use('/api/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

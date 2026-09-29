const express = require('express');
const productController = require('../controllers/product.controller');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

router
  .route('/')
  .post(asyncHandler(productController.createProduct))
  .get(asyncHandler(productController.getProducts));

router
  .route('/:pid')
  .get(asyncHandler(productController.getProductByPid))
  .put(asyncHandler(productController.updateProduct))
  .delete(asyncHandler(productController.deleteProduct));

module.exports = router;

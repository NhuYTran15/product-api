const Product = require('../models/product.model');
const AppError = require('../utils/app-error');

function buildProductPayload(body, includePid = true) {
  const allowedFields = includePid
    ? ['pid', 'pname', 'price', 'quantity']
    : ['pname', 'price', 'quantity'];

  return allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

async function createProduct(req, res) {
  const product = await Product.create(buildProductPayload(req.body));

  res.status(201).json({
    message: 'Product created successfully',
    data: product,
  });
}

async function getProducts(req, res) {
  const products = await Product.find().sort({ createdAt: -1 });

  res.status(200).json({
    count: products.length,
    data: products,
  });
}

async function getProductByPid(req, res) {
  const product = await Product.findOne({ pid: req.params.pid });

  if (!product) {
    throw new AppError(404, `Product with pid '${req.params.pid}' was not found`);
  }

  res.status(200).json({ data: product });
}

async function updateProduct(req, res) {
  if (req.body.pid !== undefined && req.body.pid !== req.params.pid) {
    throw new AppError(400, 'pid in the request body must match pid in the URL');
  }

  const updates = buildProductPayload(req.body, false);

  if (Object.keys(updates).length === 0) {
    throw new AppError(400, 'Provide at least one of: pname, price, quantity');
  }

  const product = await Product.findOneAndUpdate(
    { pid: req.params.pid },
    updates,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError(404, `Product with pid '${req.params.pid}' was not found`);
  }

  res.status(200).json({
    message: 'Product updated successfully',
    data: product,
  });
}

async function deleteProduct(req, res) {
  const product = await Product.findOneAndDelete({ pid: req.params.pid });

  if (!product) {
    throw new AppError(404, `Product with pid '${req.params.pid}' was not found`);
  }

  res.status(200).json({
    message: 'Product deleted successfully',
    data: product,
  });
}

module.exports = {
  createProduct,
  getProducts,
  getProductByPid,
  updateProduct,
  deleteProduct,
};

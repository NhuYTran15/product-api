const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    pid: {
      type: String,
      required: [true, 'pid is required'],
      unique: true,
      trim: true,
    },
    pname: {
      type: String,
      required: [true, 'pname is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price must be greater than or equal to 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: [0, 'quantity must be greater than or equal to 0'],
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Product', productSchema);

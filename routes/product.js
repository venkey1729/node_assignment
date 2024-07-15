const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Product = require('../models/product');

// Create Product - Admin only
router.post(
  '/',
  [auth, [check('title', 'Title is required').not().isEmpty(), check('description', 'Description is required').not().isEmpty(), check('inventoryCount', 'Inventory count is required').isInt()]],
  async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, inventoryCount } = req.body;

    try {
      const newProduct = new Product({
        title,
        description,
        inventoryCount,
      });

      const product = await newProduct.save();
      res.json(product);
    } catch (err) {
      res.status(500).send('Server error');
    }
  }
);

// Get Products - Admin and Manager only
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update Product - Admin and Manager only
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const { title, description, inventoryCount } = req.body;

  const productFields = {};
  if (title) productFields.title = title;
  if (description) productFields.description = description;
  if (inventoryCount) productFields.inventoryCount = inventoryCount;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    product = await Product.findByIdAndUpdate(req.params.id, { $set: productFields }, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete Product - Admin only
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    await Product.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Product removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

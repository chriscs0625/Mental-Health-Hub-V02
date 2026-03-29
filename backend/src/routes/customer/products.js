const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    // Note: You would add pagination/filters here later
    const [products] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.short_desc, p.regular_price, p.sale_price, p.thumbnail_path, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'published'
    `, [req.params.slug]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching product details' });
  }
});

module.exports = router;

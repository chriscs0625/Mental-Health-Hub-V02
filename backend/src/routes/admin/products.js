const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { uploadProductFile, uploadThumbnail } = require('../../middleware/upload');

// In a real app we would use adminAuth middleware here for all routes!

// GET /api/admin/products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name, pf.file_name as pdf_file
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_files pf ON p.id = pf.product_id
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching admin products' });
  }
});

// POST /api/admin/products
router.post('/', uploadThumbnail.single('thumbnail'), async (req, res) => {
  const { category_id, name, slug, description, short_desc, regular_price, sale_price, status } = req.body;
  const thumbnail_path = req.file ? `/uploads/products/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(`
      INSERT INTO products (category_id, name, slug, description, short_desc, regular_price, sale_price, thumbnail_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [category_id, name, slug, description, short_desc, regular_price, sale_price || null, thumbnail_path, status || 'draft']);
    
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// POST /api/admin/products/:id/file
router.post('/:id/file', uploadProductFile.single('product_pdf'), async (req, res) => {
  const productId = req.params.id;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded' });
  }

  try {
    const file_path = req.file.path; // e.g. uploads\products\uuid.pdf
    const file_name = req.file.originalname;
    const file_size_kb = Math.round(req.file.size / 1024);

    // Delete existing file record if it exists (for update) or just use ON DUPLICATE KEY UPDATE in a real app
    await pool.query('DELETE FROM product_files WHERE product_id = ?', [productId]);
    
    await pool.query(`
      INSERT INTO product_files (product_id, file_path, file_name, file_size_kb)
      VALUES (?, ?, ?, ?)
    `, [productId, file_path, file_name, file_size_kb]);

    res.json({ message: 'Product file uploaded securely' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving product file' });
  }
});

module.exports = router;

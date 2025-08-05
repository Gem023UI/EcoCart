  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const router = express.Router();
  const { verifyAdmin } = require('../middleware/auth');


  const productController = require('../controllers/manageproduct');

  const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../frontend/assets/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // ✅ Use original name without altering it
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 10
    }
  });

  router.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  router.get('/productTable/', verifyAdmin, productController.getAllProducts);
  router.get('/productFetch/:id', verifyAdmin, productController.getSingleProduct);

  router.post('/productAdd/', (req, res, next) => {
    upload.array('productImageFiles', 10)(req, res, (err) => {
      if (err) return handleMulterError(err, res);
      next();
    });
  }, productController.createProduct);

  router.put('/productUpdate/:id', (req, res, next) => {
    upload.array('productImageFiles', 10)(req, res, (err) => {
      if (err) return handleMulterError(err, res);
      next();
    });
  }, productController.updateProduct);

  router.delete('/productDelete/:id', verifyAdmin, productController.deleteProduct);
  router.delete('/image/:imageId', verifyAdmin, productController.deleteProductImage);

  function handleMulterError(err, res) {
    console.error('Multer error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large', message: 'Each file must be <5MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files', message: 'Max 10 files allowed' });
      }
      return res.status(400).json({ error: 'File upload error', message: err.message });
    }
    if (err.message.includes('Only image files')) {
      return res.status(400).json({ error: 'Invalid file type', message: err.message });
    }
    return res.status(500).json({ error: 'Upload error', message: err.message });
  }

  module.exports = router;

require('dotenv').config();
console.log('GMAIL_USER:', process.env.GMAIL_ACCOUNT);
console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? 'Loaded' : 'Missing');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');


// Import routes
const userRoutes = require('../routes/user');
const productRoutes = require('../routes/product');
const manageUserRoutes = require('../routes/manageuser');
const manageProductRoutes = require('../routes/manageproduct');
const manageOrderRoutes = require('../routes/manageorder');
const adminRoutes = require('../routes/dashboard');
const orderHistoryRoutes = require('../routes/orderhistory');
const orderRoutes = require('../routes/order');



// Import controllers directly if needed
const productController = require('../controllers/manageproduct');

// Import database connection to initialize it
const db = require('../config/database');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for image access
app.use('/assets/product', express.static(path.join(__dirname, 'assets/product')));

// ✅ Setup multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../frontend/assets/products')); // ✅ Use absolute path
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // ✅ save file as originalname
    }
});

const upload = multer({ storage: storage });

// API Routes
app.use('/api/v1', adminRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', manageUserRoutes);
app.use('/api/v1', manageProductRoutes);
app.use('/api/v1', manageOrderRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', orderHistoryRoutes);

// ✅ ✅ Add this new direct route to handle productImage uploads
app.post('/api/v1/productImage/', upload.array('images'), productController.createProduct);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

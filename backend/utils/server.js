require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/user');
const productRoutes = require('../routes/product');
const userManagementRoutes = require('../routes/dashboard');

// Import database connection to initialize it
const db = require('../config/database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1', userRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', userManagementRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
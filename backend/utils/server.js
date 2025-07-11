require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/user');

// Import database connection to initialize it
const db = require('../config/database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const router = express.Router();

const main = require('./main.js');
const parking = require('./parking.js');
const admin = require('./admin.js');

router.use('/main',main);
router.use('/parking',parking);
router.use('/admin',admin);


module.exports = router;

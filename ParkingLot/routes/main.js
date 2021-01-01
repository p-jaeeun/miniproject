var express = require('express');
var router = express.Router();
var controller = require('../controller/parking.Controller');

/* GET home page. */
router.get('/', controller.home);


module.exports = router;

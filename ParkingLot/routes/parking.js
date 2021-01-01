var express = require('express');
var router = express.Router();
var controller = require('../controller/parking.Controller');

/* GET 차량 입차페이지 */
router.get('/start', controller.carInPage);
  
/* 차량 입차  */
router.post('/start', controller.start);
  
       
/* GET 차량 출차페이지 */
router.get('/end', controller.carOutPage);

/*  요금정산 */
router.post('/payment', controller.pay);

/* 영수증 할인 */
router.post('/payment/process', controller.discount);

/* 카드결제  */
router.post('/payment/process/card', controller.bycard);

/* 현금결제 */
router.post('/payment/process/cash', controller.bycash);

/* 결제완료시 -> 출차완료 */
router.post('/exit', controller.exit);

module.exports = router;


var express = require('express');
var router = express.Router();
var controller = require('../controller/admin.Controller');

/* 관리자 로그인 화면 */
router.get('/login', controller.login);
  
/* (로그인성공) 관리자 페이지(기본화면) */
router.post('/main', controller.adminMain);

/* 관리자 메뉴- 1.주차현황 페이지 */
router.get('/parkinglog', controller.parkinglog);
  
/* 관리자 메뉴- 2.정기 주차 고객 명단 페이지*/
router.get('/membership', controller.membership);

/* 관리자 메뉴- 3. 정기권 멤버십 신규등록 페이지*/
router.get('/membership/add', controller.addMemberPage);

/* 관리자 메뉴- 4. 주차 요금 페이지 */
router.get('/changefare', controller.changefarePage);



/* 관리자 기능 1. 정기권 멤버십 신규등록*/
router.post('/membership',controller.addMember);

/* 관리자 기능 2. 주차 요금 변경 */
router.post('/changefare', controller.changefare);

module.exports = router;

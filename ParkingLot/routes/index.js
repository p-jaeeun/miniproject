var express = require('express');
var router = express.Router();
var db = require('../config/db.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '90PARKING LOT' });
});

/* GET 차량 입차페이지 */
router.get('/parking/start', function(req, res) {
  res.render('parkingIn',{title: '90주차장 - 차량 입차'});
});

/* POST 차량 입차 기록 */
router.post('/parking/start', function(req, res, next){

  var inNumber = req.body.inNumber;
  console.log('inNumber:',inNumber);
  
  var sql = `SELECT * FROM parking_log WHERE vehicle_num= ? ORDER BY enter_time DESC LIMIT 1`;
  var sql1 =`INSERT INTO parking_log(vehicle_num, enter_time) VALUES ( ?, now())`;
  var sql2 = `SELECT * FROM membership WHERE vehicle_num= ?`;
  var sql3 =`UPDATE parking_log SET paid= 1 WHERE vehicle_num = ? ORDER BY enter_time DESC LIMIT 1`;
  

  db.query(sql,[inNumber],function(err,result){
    console.log(result);
    console.log(!result.length);
    // 조건1. 주차기록이 아예 없는 차량일 경우,
    if(!result.length){ 
      db.query(sql1, [inNumber], function(){
        console.log(' enter_time is recorded.');
        res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 차량이 입차되었습니다.  "'});
      });
    }
    // 조건1. 주차기록이 1번이상 있는 경우
    else{
      var leave_time = result[0].leave_time;
      var paid = result[0].paid;
      
      if(leave_time === null  ||  paid===0) { 
        res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 이미 입차된 차량입니다. "'});
      }
      else{
        db.query(sql1, [inNumber], function(){
          console.log('enter_time is recorded.');
          res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 차량이 입차되었습니다. "'});
        });
      }
    }   
  });
  
  // 조건2. 정기권(paid=1) 고객 구분
  db.query(sql2,[inNumber],function(err,result){ 
    // 조건2-1. 정기권 고객 아닐경우 
    if(!result.length) { 
      res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 입차가 완료되었습니다. "'});
    } 
    // 조건2-2. 정기권 고객일 경우
    else {  
      var end_date = new Date(result[0].end_date);
      var today = new Date();
      console.log(end_date,end_date-today);
      // 조건3. 정기권 날짜가 유효한 경우 (paid=1로 변경)
      if(end_date-today>=0){  
       var remainedDate = Math.floor((end_date-today)/(1000*60*60*24));
       db.query(sql3,[inNumber],function(err,result){
        res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 정기주차 고객님 입차가 완료되었습니다. "',message2: remainedDate});
       })
      }
      // 조건3. 정기권 날짜가 지난 경우 -> 주차요금 내야함(paid= 0)
      else{
        res.render("parkingIn",{title: '90주차장 - 차량 입차', message:'" 입차가 완료되었습니다. "'});
      }
    }  
  });
});

     

/* GET 차량 출차페이지 */
router.get('/parking/end', function(req, res) {
  res.render('parkingOut',{title: '90주차장 - 차량 출차'});
});

/*  요금정산 페이지 */
router.post('/payment', function(req, res, next){
  var outNumber = req.body.outNumber;
  console.log('outNumber:',outNumber);
  
  var sql = `SELECT * FROM parking_log WHERE vehicle_num =? ORDER BY enter_time DESC LIMIT 1` 
  var sql1 = `UPDATE parking_log SET leave_time = now() WHERE vehicle_num= ? AND enter_time is NOT NULL ORDER BY enter_time DESC LIMIT 1`;
  var sql2 = `SELECT * FROM parking_log WHERE vehicle_num = ? AND leave_time is NOT NULL ORDER BY enter_time DESC LIMIT 1`;
  var sql3 =`UPDATE parking_log SET paid= 1 WHERE vehicle_num = ? ORDER BY leave_time DESC LIMIT 1`;

  // 1. 먼저 중복출차 막고 나서 
  db.query(sql,[outNumber],function(err,result){
    if(result[0].leave_time !== null && result[0].paid === 1){
      res.render("parkingOut",{title: '90주차장 - 차량 출차', message:'" 입차되지 않은 차량입니다."'});
    } else if(result[0].leave_time !== null  && result[0].paid === 0 ){
      console.log("출차만 누르고 결제안한 차량.");
      db.query(`UPDATE parking_log SET leave_time is null WHERE vehicle_num= ? AND enter_time is NOT NULL ORDER BY enter_time DESC LIMIT 1`,
      [outNumber],function(err,result){
        console.log('비정상 출차이므로 출차로그 삭제. 다시 정산진행');
      })
    } else {
      console.log('정상출차차량');
    }
  });
  // 2. 출차로그를 찍는다.
  db.query(sql1,[outNumber],function(err,result){
    if(err) {
      console.log("leave_time wasn't recorded.");
    } else{
      console.log(result);
      console.log('leave_time was recorded.');
    }
  });
  // 3. 주차 시간 계산
  db.query(sql2,[outNumber],function(err,result){
    console.log('selected parking log.');
    if(!result.length) {
      res.render("parkingOut",{title: '90주차장 - 차량 출차', message:'" 입차기록이 없는 차량입니다. "'});;
    } else{
      var min = Math.ceil((result[0].leave_time - result[0].enter_time)/(1000*60));  
      console.log('min:', min);
      var isPaid = result[0].paid;
      console.log('isPaid:',isPaid);

      // 정기주차 고객이면 (유효일이 남은) 자동출차
      if(isPaid === 1) {
        res.render('exit',{title: 'Good-bye',outNumber:outNumber});
      } 
      // 주차시간이 2시간 미만이면 자동 출차 (paid=1로 업데이트)
      else if(min <=120){
        db.query(sql3,[outNumber],function(err,result){
          res.render('exit',{title: 'Good-bye',outNumber:outNumber});
        }); 
      }
      // 정기권이 만료거나, 주차시간이 2시간 넘어가면 결제페이지로!
      else{ 
        var parkingTime= min-120;
        console.log('parkingTime: ',parkingTime);
        var parkingFare = 100 * parkingTime; /* 1분에 100원 */
        console.log('parkingFare:' ,parkingFare);
        res.render('payment',{title: '주차요금정산',parkingFare: parkingFare, outNumber:outNumber});
      }
    }
  });
});
  // 당일구매 영수증 번호 (오늘날짜8자리형식) 입력시, 할인적용!
router.post('/payment/process', function(req,res){
  var outNumber = req.body.outNumber;
  var parkingFare = req.body.parkingFare;
  var receiptNum = req.body.receiptNum;
  console.log(parkingFare,receiptNum);
  var date = new Date();
  var year = date.getFullYear(); 
  var month = new String(date.getMonth()+1); 
  var day = new String(date.getDate()); 
  
  // 한자리수일 경우 0을 채워준다. 
  if(month.length == 1){ 
    month = "0" + month; 
  } 
  if(day.length == 1){ 
    day = "0" + day; 
    } 

  var today = year + month + day;
  
  console.log(today);

  //영수증번호 = 오늘날짜 이면 할인!
  if(receiptNum === today){
    res.render('payment', {title: '주차요금정산',parkingFare: 0 ,outNumber:outNumber, text:'할인이 적용되었습니다. 출차버튼을 눌러 출차해주세요'})
  }else{
    res.render('payment', {title: '주차요금정산',parkingFare: parkingFare,outNumber:outNumber, text:'원하시는 결제 방식을 선택해주세요.'})
  } 
})


/* POST 카드결제  */
router.post('/payment/process/card', function(req,res){
  var outNumber = req.body.outNumber;
  res.render('payment',{title: '주차요금정산-카드결제',parkingFare:0, outNumber:outNumber, text:'결제가 완료되었습니다. 출차버튼을 눌러 출차해주세요'});
})

/* POST 현금결제 페이지 */
router.post('/payment/process/cash', function(req,res){
  var outNumber = req.body.outNumber;
  var parkingFare = req.body.parkingFare;
  var cash =req.body.cash;
  var cal = parkingFare - cash;
  if(cal === 0){
    res.render('payment',{title: '주차요금정산-현금결제',parkingFare: cal, outNumber:outNumber, text:'결제가 완료되었습니다. 출차버튼을 눌러 출차해주세요'});
  } else if(cal > 0){
    res.render('payment',{title: '주차요금정산-현금결제',parkingFare: cal,outNumber:outNumber, text:'나머지 금액만큼 지불해주세요.',paymore:1});
  } else{
    res.render('payment',{title: '주차요금정산-현금결제',parkingFare: 0,outNumber:outNumber, text:'거스름돈을 받으시고 출차해주세요.',change:-cal});
  }
})

/* 결제완료시 -> POST 출차완료 화면 */
router.post('/exit', function(req,res){
  var outNumber = req.body.outNumber;
  var sql3 =`UPDATE parking_log SET paid= 1 WHERE vehicle_num = ? ORDER BY leave_time DESC LIMIT 1`;
  db.query(sql3,[outNumber],function(err,result){
    console.log('outNumber:'.outNumber);
    res.render('exit',{title: 'Good-bye',outNumber:outNumber});
  }); 
});

/* ------------------------------------- */
/* GET 관리자 로그인 화면 */
router.get('/login', function(req, res) {
  res.render('login',{title:'관리자 로그인'});
});


/* POST(로그인성공) 관리자 페이지(기본화면) */
router.post('/admin', function(req,res){
  console.log(req.body.id, req.body.password);
  
  var body = req.body;
  var id = body.id;
  var pw = body.password;

  if(id == 'admin' && pw == '1234'){
    res.render('admin',{title: '관리자 페이지',isLogin: req.body.id});
  } else {
    res.render('login',{title: '관리자 로그인', error:'아이디와 비밀번호가 일치하지 않습니다.'});
  }
});


/* GET 관리자 메뉴- 1.주차현황 */
router.get('/admin/parkinglog', function(req, res){
  var sql =`SELECT vid,vehicle_num, DATE_FORMAT(enter_time, "%Y/%m/%d %T")as enter_time,DATE_FORMAT(leave_time, "%Y/%m/%d %T")as leave_time,paid FROM parking_log`;
  db.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      res.render('parkingLog',{title: '관리자 - 주차 현황',results: result});
      }      
    });
  });
    
/* GET 관리자 메뉴- 2.정기 주차 고객관리 */
router.get('/admin/membership', function(req, res) {
  var sql = 'SELECT mid,name,vehicle_num, DATE_FORMAT(start_date, "%Y/%m/%d")as start_date,DATE_FORMAT(end_date, "%Y/%m/%d")as end_date FROM membership';

  db.query(sql, function(err,result){
    if(err){
      console.log(err);
    } else{
    res.render('membership',{title: '관리자 - 정기주차 고객관리',results: result});
    }
  });
});

/* GET 관리자 메뉴- 3. 정기권 멤버십 신규등록 페이지*/

router.get('/admin/membership/add', function(req, res) {
  res.render('membershipAdd',{title: '관리자 - 신규 등록'});
});

/* POST 관리자 메뉴- 3. 정기권 멤버십 신규등록하기*/
router.post('/admin/membership',function(req, res){
  var newName = req.body.newName;
  var newNumber = req.body.newNumber;
  var sql = 'INSERT INTO membership (name,vehicle_num,start_date,end_date) VALUES (?,?,curdate(),curdate()+INTERVAL 30 day)';
  
  db.query(sql,[newName,newNumber],function(){
      res.render('membershipAdd',{title: '관리자 - 신규 등록', membership:'정기주차권 신규 고객이 등록되었습니다.'});
    })
});




/* GET 관리자 메뉴- 4. 주차 요금 변경 */
router.get('/admin/changefare', function(req, res) {
  res.render('changeFare',{title: '관리자 - 주차 요금 관리'});
});

router.post('/admin/changefare', function(req, res) {
  var changedFare = req.body.changedFare;
  console.log(changedFare);
  res.render('changeFare',{title: '관리자 - 주차 요금 관리',changedFare:changedFare});
});


module.exports = router;
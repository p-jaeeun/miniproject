
var db = require('../config/db.js');

exports.login = function(req, res) {
            res.render('login',{title:'관리자 로그인'});
}

exports.adminMain = function(req, res){
    console.log('id:',req.body.id,'password:', req.body.password);
    
    var body = req.body;
    var id = body.id;
    var pw = body.password;
    
    if(id == 'admin' && pw == '1234'){
      console.log('관리자 로그인 성공');
      res.render('admin',{title: '관리자 페이지',isLogin: req.body.id});
    } else {
        console.log('관리자 로그인 실패');
      res.render('login',{title: '관리자 로그인', error:'아이디와 비밀번호가 일치하지 않습니다.'});
    }
}

exports.parkinglog = function(req, res){
    var sql =`SELECT vid, vehicle_num, DATE_FORMAT(enter_time, "%Y/%m/%d %T")as enter_time,DATE_FORMAT(leave_time,  "%Y/%m/%d %T")as leave_time,paid FROM parking_log`;

    db.query(sql, function(err, result){
      if(err){
        console.log(err);
      }
      else{
        res.render('parkingLog',{title: '관리자 - 주차 현황',results: result});
        }      
    });
};

exports.membership = function(req, res) {
    var sql = 'SELECT mid,name,vehicle_num, DATE_FORMAT(start_date, "%Y/%m/%d")as start_date,DATE_FORMAT(end_date, "%Y/%m/%d")as end_date FROM membership';
    
    db.query(sql, function(err,result){
      if(err){
        console.log(err);
      } else{
      res.render('membership',{title: '관리자 - 정기주차 고객관리',results: result});
      }
    });
};

exports.addMemberPage = function(req, res) {
res.render('membershipAdd',{title: '관리자 - 신규 등록'});
};


exports.addMember = function(req, res){
    var newName = req.body.newName;
    var newNumber = req.body.newNumber;
    var sql = 'INSERT INTO membership (name,vehicle_num,start_date,end_date) VALUES (?,?,curdate(),curdate()+INTERVAL 30 day)';
    
    db.query(sql,[newName,newNumber],function(err,result){
        if(err){
            console.log(err);
        } else{
         res.render('membershipAdd',{title: '관리자 - 신규 등록', membership:'정기주차권 신규 고객이 등록되었습니다.'});
        }       
    })
};

exports.changefarePage = function(req, res) {
    res.render('changeFare',{title: '관리자 - 주차 요금 관리'});
};

exports.changefare = function(req, res) {
    var changedFare = req.body.changedFare;
    console.log(changedFare);
    res.render('changeFare',{title: '관리자 - 주차 요금 관리',changedFare:changedFare});
    };
      


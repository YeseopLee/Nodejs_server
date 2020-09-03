var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var socketio = require('socket.io');
var admin = require('firebase-admin');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var server = app.listen(3000, function () {
    console.log('서버 실행 중...');
});

var connection = mysql.createConnection({
    host: "dbinstance",
    user: "yeseoplee",
    password: "654654654",
    database: "GaGaoTalk",
    port: 3306
  });

var io = socketio.listen(server)
connection.connect();

io.on('connection', function(socket){
 
    //접속 확인
    console.log('User Conncetion');
  
    // socket.on('event name', function(user){})
    // 'event name'이름으로 클라이언트에서 request 오면 반응함.
    socket.on('connect user', function(user){
      console.log("Connected user ");
      socket.join(user['roomName']);
      console.log("roomName : ",user['roomName']);
      console.log("state : ",socket.adapter.rooms);
  
      // io.emit('event name',data) 
      // 'event name'으로 client에 data를 response 해준다.
      io.emit('connect user', user);
    });
   
    //메세지 입력시 log
    socket.on('chat message', function(msg){
      console.log("Message " + msg['script']);
      console.log("Messenger : ",msg['name']);
      io.to(msg['roomName']).emit('chat message', msg);
    });
  
  });

app.post('/user/join', function (req, res) {
    console.log(req.body);
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var userName = req.body.userName;

    // 삽입을 수행하는 sql문.
    var sql = 'INSERT INTO Users (UserEmail, UserPwd, UserName) VALUES (?, ?, ?)';
    var params = [userEmail, userPwd, userName];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {

        console.log("결과?",result);

        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '회원가입에 성공했습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

app.post('/user/login', function (req, res) {
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var sql = 'select * from Users where UserEmail = ?';

    connection.query(sql, userEmail, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if (userPwd !== result[0].UserPwd) {
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else {
                resultCode = 200;
                console.log(result)
                message = '로그인 성공! ' + result[0].UserName + '님 환영합니다!';
            }
        }

        res.json({
            'code': resultCode,
            'message': message,
            'userName': result[0].UserName
        });
    })
});

app.post('/user/loadfriend', function(req, res){
    var userEmail = req.body.userEmail;
    var sql = 'select Followee from Followlist where Follower = ?';
    var sql2 = 'select count(*) as num from ('+sql+') as num';
    var count = 0;
    var friendList = [];

    connection.query(sql2, userEmail, function(err, result){
        count = result[0].num
    })

    connection.query(sql, userEmail, function(err, result){
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if(err) {
            console.log(err)
        } else {
            resultCode = 200;
            message = result[0].Followee + '의 친구목록 불러오기 성공';

            for (var i = 0; i<count; i++){
                friendList.push(result[i].Followee);
            }

            console.log(friendList);

        }

        res.json({
            'code': resultCode,
            'message': message,
            'friendList': friendList
        })

    })

})


app.post('/user/loadfriend/setstatus', function(req, res){
    var userEmail = req.body.userEmail;
    console.log(userEmail)
    var sql = 'select UserName, UserMsg from Users where UserEmail = ?';

    connection.query(sql, userEmail, function(err, result){
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if(err) {
            console.log(err)
        } else {
            resultCode = 200;
            message = result[0].UserName + '의 상태 불러오기 성공';
            console.log(result)
            console.log(result[0].UserName);
            console.log(result[0].UserMsg);

        }

        res.json({
            'code': resultCode,
            'message': message,
            'userName': result[0].UserName,
            'userMsg': result[0].UserMsg
        })

    })

})
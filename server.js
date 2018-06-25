// project of uos-db
// made by gohn

// export modules
var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');

// 회원가입 모듈
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

// 기본 디렉토리 설정
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static('uploads'));
app.use(express.static('assets'));

// post 의 body 를 사용하기 위한 모듈 설정
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }))

// session 사용
app.use(session({
    secret: 'adfj23$#@%$%@#ndfo23jr2o3j42',
    resave: false,
    saveUninitialized: true
}));

// res.local 정의
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// 라우팅 유저
var router = require('./router/main')(app);

// 회원가입
app.use(passport.initialize());
app.use(passport.session());

// 리스닝 하는 포트 설정
var server = app.listen(80, function(){
    console.log("Express server has started on port 80")
});

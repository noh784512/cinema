// project of uos-db
// made by gohn

module.exports = function(app)
{
    const ERROR = "ERROR";
    const OK = "OK";

    app.get(['/','/index'],function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT DISTINCT MOVIE.MOVIE_CD, MOVIE.MOVIE_TITLE, MOVIE.IMAGE_URL, MOVIE.RUNNING_TIME
                            FROM MOVIE, SCREENING_SCHEDULE 
                            WHERE to_char(SCREENING_SCHEDULE.SCREENING_DATE , 'yyyy-mm-dd') >= to_char(sysdate , 'yyyy-mm-dd')
                              AND SCREENING_SCHEDULE.MOVIE_CD = MOVIE.MOVIE_CD
                            `,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('index.ejs' , { movie_arr : value });
                }
        );
    });

    app.get('/left-sidebar',function(req,res){
        res.render('left-sidebar.ejs' );
    });

    app.get('/no-sidebar',function(req,res){
        res.render('no-sidebar.ejs' );
    });

    app.get('/right-sidebar',function(req,res){
        res.render('right-sidebar.ejs' );
    });

    app.get('/booking',function(req,res){
        _movie_arr = {};
        _movie_arr.rows = [ [1,2,3],[4,5,6] ];
        res.render('booking.ejs', { movie_arr : _movie_arr });
    });


    app.post('/get_movie_list',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT MOVIE.MOVIE_CD, MOVIE.MOVIE_TITLE, MOVIE_INFO.DIRECTOR, MOVIE_INFO.CAST, MOVIE_INFO.DISTRIBUTOR, 
                                    MOVIE.IMAGE_URL, to_char(SCREENING_SCHEDULE.SCREENING_DATE, 'yyyy-mm-dd'), MOVIE.RUNNING_TIME,
                                    to_char(SCREENING_SCHEDULE.STARTING_TIME, 'HH24:MI') STARTING_TIME, THEATER.THEATER_CD, SCREENING_SCHEDULE.SCREENING_CD,
                                    THEATER.THEATER_SEAT_TYPE
                            FROM MOVIE, SCREENING_SCHEDULE , MOVIE_INFO, THEATER
                            WHERE to_char(SCREENING_SCHEDULE.SCREENING_DATE , 'yyyy-mm-dd') = :showing_date
                              AND SCREENING_SCHEDULE.MOVIE_CD = MOVIE.MOVIE_CD
                              AND MOVIE_INFO.MOVIE_CD = MOVIE.MOVIE_CD
                              AND SCREENING_SCHEDULE.THEATER_CD = THEATER.THEATER_CD
                              AND THEATER.CINEMA_CD = :cinema_list
                            ORDER BY SCREENING_SCHEDULE.SCREENING_DATE, STARTING_TIME
                            `,
            queryVariable = [  req.body.showing_date , req.body.cinema_list ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return; 
                    }

                    res.send(value);
                }
        );
    });

    app.post('/get_seat_list',function(req,res){ 
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD
                            FROM SEAT
                            WHERE THEATER_CD = :theater_cd
                            `,
            queryVariable = [  req.body.theater_cd ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }
                    res.send(value);
                }
        );
    });

    app.post('/get_reserved_seat_list',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT TICKET_CD, SEAT_CD, SCREENING_CD
                            FROM RESERVED_SEAT
                            WHERE SCREENING_CD = :screening_cd
                            `,
            queryVariable = [  req.body.screening_cd ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    res.send(value);
                }
        );
    });


    app.get('/post-text',function(req,res){
        res.render('post-text.ejs' );
    });

    // 입력한 파일이 uploads/ 폴더 내에 저장된다.
    // multer라는 모듈이 함수라서 함수에 옵션을 줘서 실행을 시키면, 해당 함수는 미들웨어를 리턴한다.
    var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
        },
        filename: function (req, file, cb) {
            cb(null, UniqueDateTime() + file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
        }
    })
    var upload = multer({ storage: storage })

    // 업로드 - 파일 업로드 폼
    app.get('/upload', function(req, res){
        res.render('upload.ejs');
    });

    app.post('/upload', upload.single('userfile'), function(req, res){
        // res.send('Uploaded! : '+req.file); // object를 리턴함
        console.log(req.file); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
        res.send(req.file['filename']);
    });

    app.get('/login',function(req,res){
        if (req.session.email){
            console.log('로그인 되었습니다!');
        }

        // 디비 모듈
        // var db_connect = require('../db_connect/db_connect.js');
        res.render('login.ejs' );

    });

    app.get('/logout',function(req,res){
        if (req.session.email){
            delete req.session.email
            delete req.session.is_member
            delete req.session.is_admin
        }

        console.log('로그아웃 되었습니다!');
        res.redirect('/login');
    });

    app.post('/login', function(req, res){

        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        // salt 값을 불러온다
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT MEM_SALT
                            FROM MEMBER
                            WHERE MEM_ID = :email`,
            queryVariable = [ req.body.email ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    try {
                        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
                        confirm_user(value.rows[0][0]);

                    }
                    catch(e) {
                        console.log(e);
                        res.send({"status" : ERROR});
                        return;
                    }
                }
        );


        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
        var confirm_user = function(user_salt){

            hasher({password: req.body.password, salt:user_salt }, function(err, pass, salt, hash){
                // 에러 발생시 다시 로그인 화면으로
                if (err){
                    console.log(err);
                    res.send({"status" : ERROR}, res.redirect('/login'));

                    return;
                }

                // 디비 모듈
                db_connect.dbQuery(
                    queryString = ` SELECT COUNT(*)
                                    FROM MEMBER
                                    WHERE MEM_ID = :email 
                                      and MEM_PASSWD = :password
                                    `,
                    queryVariable = [ req.body.email, hash ],
                    query_end_callback =
                        function(err, value){
                            if(err){
                                res.send({"status" : ERROR});
                                console.log(err);
                                return;
                            }

                            // console.log("" + value.rows);

                            // 값이 1이면 정상적으로 로그인 된 것이다
                            if (value.rows[0][0]){
                                console.log('로그인 성공!');
                                // res.send('<script type="text/javascript">alert("로그인 성공!");</script>');
                                req.session.email = req.body.email;
                                req.session.is_member = 1 ;
                                // console.log(req.session);
                                res.send({"status" : OK});

                            }else{
                                // res.send('<script type="text/javascript">alert("로그인 실패!");</script>');
                                console.log({"status" : "FAIL"});
                                res.send({"status" : "FAIL"});
                            }


                        }
                );
            });
        }

    });

    app.post('/sign-up', function(req, res){

        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        console.log(req.body);

        hasher({password: req.body.password}, function(err, pass, salt, hash){
            // 에러 발생시 다시 로그인 화면으로
            if (err){
                console.log(err);
                res.send({"status" : ERROR});
                res.redirect('/login');
                return;
            }

            // 에러가 없으면 디비에 정보 넣는다
            // salt 값을 부른다

            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = ` BEGIN
                                INSERT INTO MEMBER(MEM_ID, MEM_PASSWD, MEM_SALT, MEM_PHONE, MEM_BIRTH, MEM_NAME, MEM_ADDRESS, JOIN_DATE) 
                                VALUES (:email, :password, :salt, :phone, TO_DATE(:birth, 'YYYY-MM-DD'), :name, :address, TO_DATE(sysdate, 'YYYY-MM-DD'));
                                COMMIT;
                                END;`,
                queryVariable = [ req.body.email, hash , salt , req.body.phone, req.body.birth, req.body.username, req.body.address ],
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({"status" : ERROR});
                            console.log(err);
                            return;
                        }
                        console.log("" + value.rowsAffected);
                        console.log("가입 성공");
                        res.send({"status" : OK});
                        // res.redirect('/login');
                    }
            );

        });

    });

    app.post('/write_post',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` BEGIN
                            INSERT INTO BULLETIN(BULLETIN_CODE, BULLETIN_TITLE, BULLETIN_CONTENTS, REGISTRATION_DATE, BULLETIN_TYPE_CODE)
                            VALUES (BULLETIN_SEQ.NEXTVAL , :title, :content, TO_DATE(:date, 'YYYY-MM-DD'), 1);
                            COMMIT;
                            END;`,
            queryVariable = [ req.body.title , req.body.content, req.body.date ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    app.get('/movie_info',function(req,res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT MOVIE.MOVIE_CD, MOVIE.MOVIE_TITLE, MOVIE_INFO.DIRECTOR,  MOVIE_INFO.CAST,  MOVIE_INFO.DISTRIBUTOR, 
                                   MOVIE.IMAGE_URL, MOVIE.TRAILER_URL, MOVIE_INFO.SYNOPSIS, MOVIE.RELEASE_DATE, MOVIE.RUNNING_TIME,
                                   R.GRADE, R.REVIEW_CONTENTS, R.MEM_ID
                            FROM MOVIE, MOVIE_INFO LEFT OUTER JOIN REVIEW R
                                                ON R.MOVIE_CD=:movie_cd
                            WHERE (MOVIE.MOVIE_CD = :movie_cd and MOVIE_INFO.MOVIE_CD = MOVIE.MOVIE_CD)
                            `,
            queryVariable = [req.query.movie_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send(err);
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('movie_info.ejs' , { movie_data : value });
                }
        );

    });

    app.post('/movie_info',function(req,res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var email=req.session.email;

        db_connect.dbQuery(
            queryString = `
                            BEGIN
                                INSERT INTO REVIEW(GRADE, REVIEW_CONTENTS, MOVIE_CD, MEM_ID, REVIEW_WR_DATE, REVIEW_WR_TIME)
                                VALUES (:review_grade, :review_contents, :movie_cd, :email, :day, :time);
                            COMMIT;
                            END;        
                                `,
            queryVariable = [req.body.review_grade, req.body.review_contents, req.body.movie_cd, email, day, time],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send(err);
                        return;
                    }

                    console.log("" + value.rows);

                    res.redirect('/movie_info?movie_cd='+req.body.movie_cd);
                }
        );

    });


    app.post('/movie_search',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT MOVIE_CD, MOVIE_TITLE, to_char(RELEASE_DATE , 'yyyy-mm-dd')
                            FROM MOVIE
                            WHERE (MOVIE_TITLE LIKE '%` + req.body.search_name + `%')`,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send(err);
                        return;
                    }

                    console.log("" + value.rows);

                    res.send(value);
                }
        );
    });
    

    app.post('/cinema_search',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT CINEMA_CD, CINEMA_NAME, PARKING_INFO, CINEMA_PHONE
                            FROM CINEMA`,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send(err);
                        return;
                    }

                    console.log("" + value.rows);

                    res.send(value);
                }
        );
    });

    app.post('/theater_search',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT THEATER.THEATER_CD, THEATER.THEATER_NO, THEATER.THEATER_TYPE
                            FROM THEATER 
                            WHERE   THEATER.CINEMA_CD = :cinema_list  
                            ` ,
            queryVariable = [ req.body.cinema_list ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send(err);
                        return;
                    }

                    console.log("" + value.rows);

                    res.send(value);
                }
        );
    });


    //1:1 문의 내역

    app.get('/consulting_list',function(req,res){

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT CONSULTING_CD, CONSULTING_TITLE, CONSULTING_DATE, MEM_ID
                            FROM CONSULTING
                            `,
            queryVariable = [],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('consulting_list' , { consulting_arr : value });
                }
        );
      
    });

    //1:1 문의

    app.get('/registration_consulting',function(req,res){

        res.render('registration_consulting');

    });

    app.post('/registration_consulting',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var email=req.session.email;
        db_connect.dbQuery(
            queryString = `
                            DECLARE
                                consulting_cd integer := CONSULTING_SEQ.NEXTVAL;
                            BEGIN
                                INSERT INTO CONSULTING( CONSULTING_CD, MEM_ID, CONSULTING_TITLE, CONSULTING_CONTENTS, CONSULTING_DATE, CONSULTING_TIME)
                                VALUES (consulting_cd, :email , :title, :contents, :day, :time);      
                                            
                                COMMIT; 
                            END;`,
            queryVariable = [ email, req.body.title, req.body.contents, day, time
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //1:1 문의 수정

    app.get('/update_consulting',function(req,res){

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT CONSULTING_CD, CONSULTING_TITLE, CONSULTING_CONTENTS
                            FROM CONSULTING
                            WHERE CONSULTING_CD=:consulting_cd
                            `,
            queryVariable = [req.query.consulting_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('update_consulting' , { consulting_arr : value });
                }
        );
    });

    app.post('/update_consulting',function(req,res){

        
        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var email=req.session.email;
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            BEGIN
                            UPDATE CONSULTING
                                SET CONSULTING_CD=:consulting_cd,
                                    CONSULTING_TITLE=:consulting_title,
                                    CONSULTING_CONTENTS=:contents
                            WHERE CONSULTING_CD = :consulting_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.consulting_cd, req.body.consulting_title, req.body.contents
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //1:1 문의 삭제

    app.post('/delete_consulting',function(req,res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            DELETE FROM 
                                CONSULTING 
                            WHERE 
                                CONSULTING_CD= :consulting_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.consulting_cd,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    app.get('/notice_list',function(req,res){


        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT BULLETIN_CD, BULLETIN_TITLE, REGIST_DATE
                            FROM BULLETIN
                            WHERE BULLETIN_TYPE_CD=1
                            `,
            queryVariable = [],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('notice_list' , { notice_arr : value });
                }
        );

    });

    app.get('/notice',function(req,res){


        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT BULLETIN_TITLE, BULLETIN_CONTENTS, REGIST_DATE
                            FROM BULLETIN
                            WHERE BULLETIN_CD=:bulletin_cd
                            `,
            queryVariable = [req.query.bulletin_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('notice' , { notice : value });
                }
        );

    });

    //1:1문의 조회

    app.get('/consulting',function(req,res){


        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT CONSULTING_TITLE, CONSULTING_CONTENTS
                            FROM CONSULTING
                            WHERE CONSULTING_CD=:consulting_cd
                            `,
            queryVariable = [req.query.consulting_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('consulting' , { consulting : value });
                }
        );

    });


    //예매내역 조회

    app.get('/booking_list',function(req,res){


        if (req.session.email ){
            
            var db_connect = require('../db_connect/db_connect.js');
            var email=req.session.email;

            db_connect.dbQuery(
                queryString = ` 
                                SELECT T.TICKET_CD, M.MOVIE_TITLE, C.CINEMA_NAME, TH.THEATER_NO, S.STARTING_TIME, SE.SEAT_ROW_NO, SE.SEAT_COL_NO, P.REFUND_DATE
                                FROM TICKETING T , SCREENING_SCHEDULE S, MOVIE M, RESERVED_SEAT R, SEAT SE, THEATER TH, CINEMA C, PAYMENT P
                                WHERE MEM_ID=:email AND T.SCREENING_CD=S.SCREENING_CD AND M.MOVIE_CD=S.MOVIE_CD AND 
                                    R.TICKET_CD=T.TICKET_CD AND SE.SEAT_CD=R.SEAT_CD AND TH.THEATER_CD=S.THEATER_CD AND C.CINEMA_CD=TH.CINEMA_CD AND P.TICKET_CD=T.TICKET_CD
                                `,
                queryVariable = [email],
                query_end_callback =
                    function(err, value){
                        if(err){
                            console.log(err);
                            res.send({"status" : ERROR});
                            return;
                        }
    
                        console.log("" + value.rows);
    
                        res.render('booking_list' , { ticket_arr : value });
                    }
            );
        }
        else
        {
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return;
        }

    });

    //예매 취소
    app.post('/booking_list',function(req,res){


        if (req.session.email ){
            
            var db_connect = require('../db_connect/db_connect.js');
            var db_connect = require('../db_connect/db_connect.js');
            var moment = require('moment');
            var day = moment().format('YYYY[-]MM[-]DD');

            db_connect.dbQuery(
                queryString = ` 
                                BEGIN
                                UPDATE PAYMENT
                                    SET REFUND_DATE=:day
                                WHERE TICKET_CD=:ticket_cd;

                                DELETE FROM 
                                RESERVED_SEAT
                                WHERE 
                                TICKET_CD=:ticket_cd;
                                COMMIT;
                                END;
                                `,
                queryVariable = [day, req.body.ticket_cd],
                query_end_callback =
                    function(err, value){
                        if(err){
                            console.log(err);
                            res.send({"status" : ERROR});
                            return;
                        }
    
                        console.log("" + value.rows);
    
                        res.render('/');
                    }
            );
        }
        else
        {
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return;
        }

    });

    //회원정보 조회

    app.get('/display_memberinfo',function(req,res){

        if (!req.session.email ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return; 
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT MEM_ID, MEM_PASSWD, MEM_NAME,to_char(MEM_BIRTH , 'yyyy-mm-dd'), MEM_ADDRESS, MEM_PHONE, to_char(JOIN_DATE , 'yyyy-mm-dd'), MEM_SALT
                            FROM MEMBER
                            WHERE MEM_id=:email
                            `,
            queryVariable = [req.session.email],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send('<script type="text/javascript">alert('+ err +');</script>');
                    }

                    console.log("" + value.rows);

                    res.render('display_memberinfo' , { result_arr : value });
                }
        );
    });


    //회원 정보 수정

    app.get('/update_member',function(req,res){

        if (!req.session.email ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return; 
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT MEM_ID, MEM_PASSWD, MEM_NAME, MEM_BIRTH, MEM_ADDRESS, MEM_PHONE,JOIN_DATE, MEM_SALT
                            FROM MEMBER
                            WHERE MEM_id=:email
                            `,
            queryVariable = [req.session.email],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send('<script type="text/javascript">alert('+ err +');</script>');
                    }

                    console.log("" + value.rows);

                    res.render('update_member' , { result_arr : value });
                }
        );
    });

    app.post('/update_member',function(req,res){

        if (!req.session.email ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return; 
        }

        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        console.log(req.body);

        hasher({password: req.body.password}, function(err, pass, salt, hash){
            // 에러 발생시 다시 로그인 화면으로
            if (err){
                console.log(err);
                res.send('<script type="text/javascript">alert('+ err +');</script>');
                res.redirect('/login');
            }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            BEGIN
                            UPDATE MEMBER
                                SET MEM_PASSWD=:hash,
                                    MEM_ADDRESS=:address,
                                    MEM_PHONE=:phone,
                                    MEM_SALT=:salt
                            WHERE MEM_ID = :email;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ hash , req.body.address , req.body.phone, salt, req.session.email],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send('<script type="text/javascript">alert('+ err +');</script>');
                        console.log(err);
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
            );
        });
    });
    //비회원 예매내역 

    app.get('/nonmem_booking',function(req,res){
        
        res.render('nonmem_booking.ejs');
    });

    app.post('/nonmem_booking',function(req,res){
        
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        // salt 값을 불러온다
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT NONMEM_SALT
                            FROM NONMEMBERS
                            WHERE NONMEM_PHONE = :phone
                        `,
            queryVariable = [ req.body.phone ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);
                    console.log("" + value);

                    try {
                        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
                        confirm_user(value.rows[0][0]);

                    }
                    catch(e) {
                        console.log(e);
                        res.send({"status" : ERROR});
                        return;
                    }
                }
        );


        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
        var confirm_user = function(user_salt){

            hasher({password: req.body.password, salt:user_salt }, function(err, pass, salt, hash){
                // 에러 발생시 다시 로그인 화면으로
                if (err){
                    console.log(err);
                    res.send({"status" : ERROR}, res.redirect('/nonmem_booking'));

                    return;
                }

                // 디비 모듈
                db_connect.dbQuery(
                    queryString = ` SELECT COUNT(*)
                                    FROM NONMEMBERS
                                    WHERE NONMEM_PHONE = :phone 
                                      and NONMEM_PASSWD = :password
                                    `,
                    queryVariable = [ req.body.phone, hash ],
                    query_end_callback =
                        function(err, value){
                            if(err){
                                res.send({"status" : ERROR});
                                console.log(err);
                                return;
                            }

                            // console.log("" + value.rows);

                            // 값이 1이면 정상적으로 로그인 된 것이다
                            if (value.rows[0][0]){
                                console.log('비회원 로그인 성공!');
                                // res.send('<script type="text/javascript">alert("로그인 성공!");</script>');
                                req.session.email = req.body.phone;
                                req.session.is_member = 0 ;
                                // console.log(req.session);
                                res.send({"status" : OK});

                            }else{
                                // res.send('<script type="text/javascript">alert("로그인 실패!");</script>');
                                console.log({"status" : "FAIL"});
                                res.send({"status" : "FAIL"});
                            }


                        }
                );
            });
        }

    });
    
    //비회원 예매내역 조회
    app.get('/nonmem_booking_list',function(req,res){


        if (req.session.email ){
            
            var db_connect = require('../db_connect/db_connect.js');
            var email=req.session.email;

            db_connect.dbQuery(
                queryString = ` 
                                SELECT T.TICKET_CD, M.MOVIE_TITLE, C.CINEMA_NAME, TH.THEATER_NO, S.STARTING_TIME, SE.SEAT_ROW_NO, SE.SEAT_COL_NO, P.REFUND_DATE
                                FROM TICKETING T , SCREENING_SCHEDULE S, MOVIE M, RESERVED_SEAT R, SEAT SE, THEATER TH, CINEMA C, PAYMENT P
                                WHERE NONMEM_PHONE=:email AND T.SCREENING_CD=S.SCREENING_CD AND M.MOVIE_CD=S.MOVIE_CD AND 
                                    R.TICKET_CD=T.TICKET_CD AND SE.SEAT_CD=R.SEAT_CD AND TH.THEATER_CD=S.THEATER_CD AND C.CINEMA_CD=TH.CINEMA_CD AND P.TICKET_CD=T.TICKET_CD
                                `,
                queryVariable = [email],
                query_end_callback =
                    function(err, value){
                        if(err){
                            console.log(err);
                            res.send({"status" : ERROR});
                            return;
                        }
    
                        console.log("" + value.rows);
    
                        res.render('booking_list' , { ticket_arr : value });
                    }
            );
        }
        else
        {
            console.log('로그인 되지 않았습니다!');
            res.redirect('/login');
            return;
        }

    });

    //비회원 예매 취소

    app.post('/nonmem_booking_list',function(req,res){


        if (req.session.email ){
            
            var db_connect = require('../db_connect/db_connect.js');
            var db_connect = require('../db_connect/db_connect.js');
            var moment = require('moment');
            var day = moment().format('YYYY[-]MM[-]DD');

            db_connect.dbQuery(
                queryString = ` 
                                BEGIN
                                UPDATE PAYMENT
                                    SET REFUND_DATE=:day
                                WHERE TICKET_CD=:ticket_cd;

                                DELETE FROM 
                                RESERVED_SEAT
                                WHERE 
                                TICKET_CD=:ticket_cd;
                                COMMIT;
                                END;
                                `,
                queryVariable = [day, req.body.ticket_cd],
                query_end_callback =
                    function(err, value){
                        if(err){
                            console.log(err);
                            res.send({"status" : ERROR});
                            return;
                        }
    
                        console.log("" + value.rows);
    
                        res.send({"status" : OK});
                    }
            );
        }
        else
        {
            console.log('로그인 되지 않았습니다!');
            res.redirect('/');
            return;
        }

    });

    app.post('/memornon',function(req,res){
        
        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        console.log(req.body);

        hasher({password: req.body.password}, function(err, pass, salt, hash){
            
            var db_connect = require('../db_connect/db_connect.js');

            db_connect.dbQuery(
                queryString = `
                                BEGIN
                                    INSERT INTO NONMEMBERS(NONMEM_NAME, NONMEM_BIRTH, NONMEM_PASSWD, NONMEM_PHONE, NONMEM_SALT)
                                    VALUES (:name, :birth , :hash , :phone , :salt);      
                                                
                                    COMMIT; 
                                END;`,
                queryVariable = [ req.body.name, req.body.birth, hash, req.body.phone, salt
                ],
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            // res.send({"status" : ERROR});
                            console.log(err);
                            return;
                        }
                        console.log("" + value.rowsAffected);
                        req.session.is_member = 0;
                        req.session.email = req.body.phone;
                        res.send({status: OK});
                    }
            );
        });
    });


    //예매  회원 유형 선택

    app.get('/memornon',function(req,res){
        
        res.render('memornon.ejs');
    });

    app.post('/memornon',function(req,res){
        
        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        console.log(req.body);

        hasher({password: req.body.password}, function(err, pass, salt, hash){
            
            var db_connect = require('../db_connect/db_connect.js');

            db_connect.dbQuery(
                queryString = `
                                BEGIN
                                    INSERT INTO NONMEMBERS(NONMEM_NAME, NONMEM_BIRTH, NONMEM_PASSWD, NONMEM_PHONE, NONMEM_SALT)
                                    VALUES (:name, :birth , :hash , :phone , :salt);      
                                                
                                    COMMIT; 
                                END;`,
                queryVariable = [ req.body.name, req.body.birth, hash, req.body.phone, salt
                ],
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            // res.send({"status" : ERROR});
                            console.log(err);
                            return;
                        }
                        console.log("" + value.rowsAffected);
                        req.session.is_member = 0;
                        req.session.email = req.body.phone;
                        res.send({status: OK});
                    }
            );
        });
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////ADMIN/////////////ADMIN///////ADMIN//////////////////////////////////////
    /////////////////////////////////ADMIN/////////////ADMIN//////ADMIN////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////


    app.get('/admin/login',function(req,res){
        if (req.session.is_admin){
            console.log('로그인 되었습니다!');
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        res.render('admin/login.ejs' );

    });

    app.get('/admin/logout',function(req,res){
        if (req.session.email){
            delete req.session.email
            delete req.session.is_member
            delete req.session.is_admin
        }

        console.log('로그아웃 되었습니다!');
        res.redirect('/admin/login');
    });

    app.post('/admin/login', function(req, res){
        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        // salt 값을 불러온다
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT ADMIN_SALT
                            FROM ADMINISTRATOR
                            WHERE ADMIN_ID = :email`,
            queryVariable = [ req.body.email ],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    try {
                        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
                        confirm_user(value.rows[0][0]);

                    }
                    catch(e) {
                        console.log(e);
                        res.send({"status" : ERROR});
                        return;
                    }
                }
        );


        // salt 값을 받아 와서 실제 해쉬값을 만든 후에 실제 비밀번호와 비교한다
        var confirm_user = function(user_salt){

            hasher({password: req.body.password, salt:user_salt }, function(err, pass, salt, hash){
                // 에러 발생시 다시 로그인 화면으로
                if (err){
                    console.log(err);
                    res.send({"status" : ERROR});
                    return;
                }

                // 디비 모듈
                db_connect.dbQuery(
                    queryString = ` SELECT COUNT(*)
                                    FROM ADMINISTRATOR
                                    WHERE ADMIN_ID = :email 
                                      and ADMIN_PASSWD = :password
                                    `,
                    queryVariable = [ req.body.email, hash ],
                    query_end_callback =
                        function(err, value){
                            if(err){
                                res.send({"status" : ERROR});
                                console.log(err);
                                return;
                            }

                            // console.log("" + value.rows);

                            // 값이 1이면 정상적으로 로그인 된 것이다
                            if (value.rows[0][0]){
                                console.log('로그인 성공!');
                                // res.send('<script type="text/javascript">alert("로그인 성공!");</script>');
                                req.session.email = req.body.email;
                                req.session.is_admin = 1;
                                // console.log(req.session);
                                // res.redirect('/admin');
                                res.send({"status" : OK});
                            }else{
                                // res.send('<script type="text/javascript">alert("로그인 실패!");</script>');
                                console.log('로그인 실패!');
                                // res.redirect('/admin/login');
                                res.send({"status" : "FAIL"});
                                return;
                            }


                        }
                );
            });
        }

    });

    app.get(['/admin','/admin/index'],function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        res.render('admin/index_admin.ejs');
    });
    
    //영화 관리
    app.get('/admin/manage_movie',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT MOVIE_CD, MOVIE_TITLE, IMAGE_URL, RUNNING_TIME, FILM_RATE
                            FROM MOVIE
                            ORDER BY MOVIE_CD
                            `,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/manage_movie' , { movie_arr : value });
                }
        );
    });
    
    //영화 등록
    app.get('/admin/registration_movie',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        res.render('admin/registration_movie.ejs' );
    });

    app.post('/admin/registration_movie',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var query_plus_string = '';
        var genre_arr = req.body["genre_arr[]"];
        for ( var i = 0 ; i < genre_arr.length; i++){
            query_plus_string += `INSERT INTO MOVIE_GENRE( GENRE_CD, MOVIE_CD ) VALUES ( `+ genre_arr[i] +`, movie_cd );  `;
        }


        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            DECLARE
                                movie_cd integer := MOVIE_SEQ.NEXTVAL;
                            BEGIN
                                INSERT INTO MOVIE( MOVIE_CD, MOVIE_TITLE, TRAILER_URL, IMAGE_URL, RELEASE_DATE, RUNNING_TIME, FILM_RATE )
                                VALUES ( movie_cd , :title, :trailer, :img_url, TO_DATE(:release_date, 'YYYY-MM-DD'), :running_time, :rate_code );
                                
                                INSERT INTO MOVIE_INFO( MOVIE_CD, DIRECTOR, CAST, DISTRIBUTOR, SYNOPSIS)
                                VALUES ( movie_cd , :crew, :cast, :distributor, :synopsis );    
                                
                                `+  query_plus_string +`        
                                            
                                COMMIT; 
                            END;`,
            queryVariable = [ req.body.title, req.body.trailer,req.body.img_url, req.body.release_date, req.body.running_time, req.body.rate_code ,
                req.body.crew, req.body.cast, req.body.distributor, req.body.synopsis,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //영화 수정

    app.get('/admin/update_movie',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return; 
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT MOVIE_CD, MOVIE_TITLE
                            FROM MOVIE
                            WHERE movie_CD=:movie_cd
                            `,
            queryVariable = [req.query.movie_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/update_movie' , { movie_arr : value });
                }
        );
    });

    //영화 수정

    app.post('/admin/update_movie',function(req,res){

        var query_plus_string = '';
        var genre_arr = req.body["genre_arr[]"];
        for ( var i = 0 ; i < genre_arr.length; i++){
            query_plus_string += `INSERT INTO MOVIE_GENRE( GENRE_CD, MOVIE_CD ) VALUES ( `+ genre_arr[i] +`, `+ req.body.movie_cd +` );  `;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            BEGIN
                                DELETE FROM MOVIE_GENRE WHERE MOVIE_CD = `+ req.body.movie_cd + `; 
                                UPDATE MOVIE
                                SET MOVIE_TITLE = :title,
                                    TRAILER_URL = :trailer, 
                                    IMAGE_URL = :img_url,
                                    RELEASE_DATE = TO_DATE(:release_date, 'YYYY-MM-DD'),
                                    RUNNING_TIME = :running_time,
                                    FILM_RATE  = :rate_code
                                WHERE MOVIE_CD = `+ req.body.movie_cd + `;
                                
                                UPDATE MOVIE_INFO
                                SET DIRECTOR =  :crew,
                                    CAST = :cast,
                                    DISTRIBUTOR =  :distributor,
                                    SYNOPSIS = :synopsis
                                WHERE MOVIE_CD = `+ req.body.movie_cd + `;
                                
                               `+  query_plus_string + `     
                                COMMIT; 
                            END;`,
            queryVariable = [   req.body.title, req.body.trailer, req.body.img_url, req.body.release_date, req.body.running_time, req.body.rate_code ,
                req.body.crew, req.body.cast, req.body.distributor, req.body.synopsis
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );

    });


    //영화 삭제
    app.post('/admin/delete_movie',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            DELETE FROM 
                                MOVIE 
                            WHERE 
                                MOVIE_CD= :movie_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.movie_cd,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });


    //영화관 관리
    app.get('/admin/manage_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT CINEMA_CD, CINEMA_NAME, CINEMA_LOCATION, PARKING_INFO, CINEMA_PHONE
                            FROM CINEMA
                            `,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/manage_cinema' , { cinema_arr : value });
                }
        );
    });

    //영화관 등록 
    app.get('/admin/registration_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return; 
        }

        res.render('admin/registration_cinema.ejs' );
    });

    app.post('/admin/registration_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            DECLARE
                                cinema_cd integer := CINEMA_SEQ.NEXTVAL;
                            BEGIN
                                INSERT INTO CINEMA( CINEMA_CD, CINEMA_NAME, CINEMA_LOCATION, PARKING_INFO, CINEMA_PHONE )
                                VALUES ( cinema_cd , :cinema_name, :cinema_location, :parking_info, :cinema_phone );  
                                COMMIT; 
                            END;`,
            queryVariable = [ req.body.cinema_name, req.body.cinema_location,req.body.parking_info,req.body.cinema_phone,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });
    //영화관 수정 
    app.get('/admin/update_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return; 
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT CINEMA_CD, CINEMA_NAME, CINEMA_LOCATION, PARKING_INFO, CINEMA_PHONE
                            FROM CINEMA
                            WHERE CINEMA_CD=:cinema_cd
                            `,
            queryVariable = [req.query.cinema_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/update_cinema' , { cinema_arr : value });
                }
        );
    });

    app.post('/admin/update_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            UPDATE CINEMA
                                SET CINEMA_CD=:cinema_cd,
                                    CINEMA_NAME=:cinema_name,
                                    CINEMA_LOCATION=:cinema_location,
                                    PARKING_INFO=:parking_info,
                                    CINEMA_PHONE=:cinema_phone
                            WHERE CINEMA_CD = :cinema_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.cinema_cd, req.body.cinema_name, req.body.cinema_location,req.body.parking_info,req.body.cinema_phone,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //영화관 삭제

    app.post('/admin/delete_cinema',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            DELETE FROM 
                                CINEMA 
                            WHERE 
                                CINEMA_CD= :cinema_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.cinema_cd,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    app.get('/admin/registration_showing',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        res.render('admin/registration_showing.ejs' );
    });

    app.post('/admin/registration_showing',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` BEGIN
                                INSERT INTO SCREENING_SCHEDULE( SCREENING_CD, SCREENING_DATE, STARTING_TIME, MOVIE_CD, THEATER_CD)
                                VALUES ( SCREENING_SCHEDULE_SEQ.NEXTVAL, TO_DATE(:release_date, 'YYYY-MM-DD') , TO_DATE(:running_time, 'hh24:mi'), :movie_list, :theater_list );
                                COMMIT;
                            END;`,
            queryVariable = [ req.body.release_date, req.body.running_time, req.body.movie_list, req.body.theater_list ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });


    app.post('/admin/sign-up', function(req, res){

        // 암호화 모듈
        var bkfd2Password = require("pbkdf2-password");
        var hasher = bkfd2Password();

        console.log(req.body);

        hasher({password: req.body.password}, function(err, pass, salt, hash){
            // 에러 발생시 다시 로그인 화면으로
            if (err){
                console.log(err);
                res.send({"status" : ERROR});
                res.redirect('/login');
            }

            // 에러가 없으면 디비에 정보 넣는다
            // salt 값을 부른다

            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = ` BEGIN
                                INSERT INTO ADMINISTRATOR(ADMIN_ID, ADMIN_PASSWD, ADMIN_SALT, ADMIN_PHONE, ADMIN_BIRTH, ADMIN_NAME) 
                                VALUES (:email, :password, :salt, :phone, TO_DATE(:birth, 'YYYY-MM-DD'), :name );
                                COMMIT;
                                END;`,
                queryVariable = [ req.body.email, hash , salt , req.body.phone, req.body.birth, req.body.username],
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({"status" : ERROR});
                            console.log(err);
                            return;
                        }
                        console.log("" + value.rowsAffected);
                        console.log("가입 성공");
                        res.send({"status" : OK});
                    }
            );

        });

    });



    app.post('/get_card', function(req, res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `     SELECT CARD_COMP, CARD_COMP_CD
                                FROM CARD`,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        console.log(err);
                        return;
                    }
                    res.send(value);
                }
        );
    });


    app.post('/get_bank', function(req, res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `     SELECT BANK_COMP, ACCOUNT_HOLDER, ACCOUNT_NO
                                FROM BANK`,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        console.log(err);
                        return;
                    }
                    res.send(value);
                }
        );
    });


    //공지사항 관리
    app.get('/admin/manage_notice',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT BULLETIN_CD, BULLETIN_TITLE, REGIST_DATE, ADMIN_ID 
                            FROM BULLETIN
                            WHERE BULLETIN_TYPE_CD=1
                            `,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/manage_notice' , { notice_arr : value });
                }
        );
    });
    
    //공지사항 등록

    app.get('/admin/registration_notice',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        res.render('admin/registration_notice.ejs' );
    });

    app.post('/admin/registration_notice',function(req,res){

        var db_connect = require('../db_connect/db_connect.js');
        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var notice_type_cd=1;
        var email=req.session.email;
        db_connect.dbQuery(
            queryString = `
                            DECLARE
                                bulletin_cd integer := BULLETIN_SEQ.NEXTVAL;
                            BEGIN
                                INSERT INTO BULLETIN( BULLETIN_CD, BULLETIN_TITLE, BULLETIN_CONTENTS, REGIST_DATE, BULLETIN_TYPE_CD, ADMIN_ID, REGIST_TIME)
                                VALUES (bulletin_cd, :notice_title, :notice_contents, :day, :notice_type_cd, :email , :time);      
                                COMMIT; 
                            END;`,
            queryVariable = [ req.body.title, req.body.contents, day, notice_type_cd, email,  time
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    app.post('/pay_for_card', function(req, res){

        var queryString_plus = "";
        var picked_seat_cd_arr = req.body["picked_seat_cd_arr[]"];

        for ( var i = 0 ; i < picked_seat_cd_arr.length ; i++){
            queryString_plus +=  `INSERT INTO RESERVED_SEAT(TICKET_CD, SEAT_CD, SCREENING_CD) VALUES( ticket_cd, ` +
                picked_seat_cd_arr[i] +  `,` +  req.body.screening_cd + `);\n`;
        }

        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('HH-mm-ss');

        var queryString_point = "";
        if(req.session.is_member)
        {
            if ( !(req.body.point >0) ){
                queryString_point += `INSERT INTO POINT_LIST(POINT_VALUE, POINT_OCCUR_DATE, POINT_IS_INCREASE, MEM_ID, POINT_OCCUR_TIME, PAYMENT_CD ) VALUES( `
                    + (req.body.total_price)/10 + `, TO_DATE(:day,  'yyyy-mm-dd') , 1 , '`+ req.session.email + `' ,  TO_DATE(:time, 'hh24-mi-ss') , ticket_cd);\n`;
            }else{
                queryString_point += `INSERT INTO POINT_LIST(POINT_VALUE, POINT_OCCUR_DATE, POINT_IS_INCREASE, MEM_ID, POINT_OCCUR_TIME, PAYMENT_CD ) VALUES( `
                    + (req.body.point) + `, TO_DATE(:day,  'yyyy-mm-dd') , 0 , '`+ req.session.email + `' ,  TO_DATE(:time, 'hh24-mi-ss') , ticket_cd);\n`;
            }
    
            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = `
                                    DECLARE
                                        ticket_cd integer := TICKETED_SEQ.NEXTVAL;
                                    BEGIN
                                    INSERT INTO TICKETING(TICKET_CD, MEM_ID, ADULT, CHILD, TEENAGER, SCREENING_CD)
                                    VALUES (  ticket_cd , :email, :adult_num, :child_num, :teenage_num, :screening_cd );
    
                                    INSERT INTO PAYMENT(PAYMENT_CD, PAYMENT_DATE, TICKET_CD, CARD_COMP_CD, BASIC_PRICE, TOTAL_PRICE, PAYMENT_TYPE)
                                    VALUES ( ticket_cd, TO_DATE(sysdate , 'yyyy-mm-dd'), ticket_cd, :card_list, :basic_price, :total_price, 'CARD'  ); 
    
                                ` +
                                queryString_plus +
                                queryString_point +
                                `
                                    COMMIT;
                                    END;
                                `,
                queryVariable = [ req.session.email, req.body.adult_num, req.body.child_num, req.body.teenage_num, req.body.screening_cd ,
                                  req.body.card_list, req.body.basic_price, req.body.total_price, day, time  ],
    
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            console.log(err);
                            return;
                        }
                        res.send({status: OK});
                    }
                );
        }
        else
        {
 
            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = `
                                    DECLARE
                                        ticket_cd integer := TICKETED_SEQ.NEXTVAL;
                                    BEGIN
                                    INSERT INTO TICKETING(TICKET_CD, NONMEM_PHONE, ADULT, CHILD, TEENAGER, SCREENING_CD)
                                    VALUES (  ticket_cd , `+  req.session.email +`, :adult_num, :child_num, :teenage_num, :screening_cd );
    
                                    INSERT INTO PAYMENT(PAYMENT_CD, PAYMENT_DATE, TICKET_CD, CARD_COMP_CD, BASIC_PRICE, TOTAL_PRICE, PAYMENT_TYPE)
                                    VALUES ( ticket_cd, TO_DATE(sysdate , 'yyyy-mm-dd'), ticket_cd, :card_list, :basic_price, :total_price, 'CARD'  ); 
    
                                ` +
                                queryString_plus +
                                `
                                    COMMIT;
                                    END;
                                `,
                queryVariable = [ req.body.adult_num, req.body.child_num, req.body.teenage_num, req.body.screening_cd ,
                                  req.body.card_list, req.body.basic_price, req.body.total_price  ],
    
                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            console.log(err);
                            return;
                        }
                        res.send(value);
                    }
                );
        }
        
    });

    app.post('/pay_for_bank', function(req, res){
        //
        // // 디비 모듈
        // var db_connect = require('../db_connect/db_connect.js');
        // db_connect.dbQuery(
        //     queryString = `
        //                         BEGIN
        //                         INSERT INTO PAYMENT(PAYMENT_CD, PAYMENT_DATE, REFUND_DATE, TICKET_CD, BASIC_PRICE, TOTAL_PRICE, BANK_COMP, PAYMENT_TYPE)
        //                         VALUES (  );
        //                         COMMIT;
        //                         END;
        //                   `,
        //     queryVariable = {},
        //     query_end_callback =
        //         function(err, value){
        //             if(err){
        //                 res.send({status: ERROR});
        //                 console.log(err);
        //                 return;
        //             }
        //             res.send({status: OK});
        //         }
        // );


        var queryString_plus = "";
        var picked_seat_cd_arr = req.body["picked_seat_cd_arr[]"];

        for ( var i = 0 ; i < picked_seat_cd_arr.length ; i++){
            queryString_plus +=  `INSERT INTO RESERVED_SEAT(TICKET_CD, SEAT_CD, SCREENING_CD) VALUES( ticket_cd, ` +
                picked_seat_cd_arr[i] +  `,` +  req.body.screening_cd + `);\n`;
        }

        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('HH-mm-ss');

        var queryString_point = "";
        if(req.session.is_member)
        {
            if ( !(req.body.point >0) ){
                queryString_point += `INSERT INTO POINT_LIST(POINT_VALUE, POINT_OCCUR_DATE, POINT_IS_INCREASE, MEM_ID, POINT_OCCUR_TIME, PAYMENT_CD ) VALUES( `
                    + (req.body.total_price)/10 + `, TO_DATE(:day,  'yyyy-mm-dd') , 1 , '`+ req.session.email + `' ,  TO_DATE(:time, 'hh24-mi-ss') , ticket_cd);\n`;
            }else{
                queryString_point += `INSERT INTO POINT_LIST(POINT_VALUE, POINT_OCCUR_DATE, POINT_IS_INCREASE, MEM_ID, POINT_OCCUR_TIME, PAYMENT_CD ) VALUES( `
                    + (req.body.point) + `, TO_DATE(:day,  'yyyy-mm-dd') , 0 , '`+ req.session.email + `' ,  TO_DATE(:time, 'hh24-mi-ss') , ticket_cd);\n`;
            }

            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = `
                                    DECLARE
                                        ticket_cd integer := TICKETED_SEQ.NEXTVAL;
                                    BEGIN
                                    INSERT INTO TICKETING(TICKET_CD, MEM_ID, ADULT, CHILD, TEENAGER, SCREENING_CD)
                                    VALUES (  ticket_cd , :email, :adult_num, :child_num, :teenage_num, :screening_cd );
    
                                    INSERT INTO PAYMENT(PAYMENT_CD, PAYMENT_DATE, TICKET_CD, BANK_COMP, BASIC_PRICE, TOTAL_PRICE, PAYMENT_TYPE)
                                    VALUES ( ticket_cd, TO_DATE(sysdate , 'yyyy-mm-dd'), ticket_cd, :bank_list, :basic_price, :total_price, 'CARD'  ); 
    
                                ` +
                    queryString_plus +
                    queryString_point +
                    `
                                    COMMIT;
                                    END;
                                `,
                queryVariable = [ req.session.email, req.body.adult_num, req.body.child_num, req.body.teenage_num, req.body.screening_cd ,
                    req.body.card_list, req.body.basic_price, req.body.total_price, day, time  ],

                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            console.log(err);
                            return;
                        }
                        res.send({status: OK});
                    }
            );
        }
        else
        {

            // 디비 모듈
            var db_connect = require('../db_connect/db_connect.js');
            db_connect.dbQuery(
                queryString = `
                                    DECLARE
                                        ticket_cd integer := TICKETED_SEQ.NEXTVAL;
                                    BEGIN
                                    INSERT INTO TICKETING(TICKET_CD, NONMEM_PHONE, ADULT, CHILD, TEENAGER, SCREENING_CD)
                                    VALUES (  ticket_cd , `+  req.session.email +`, :adult_num, :child_num, :teenage_num, :screening_cd );
    
                                    INSERT INTO PAYMENT(PAYMENT_CD, PAYMENT_DATE, TICKET_CD, BANK_COMP, BASIC_PRICE, TOTAL_PRICE, PAYMENT_TYPE)
                                    VALUES ( ticket_cd, TO_DATE(sysdate , 'yyyy-mm-dd'), ticket_cd, :bank_list, :basic_price, :total_price, 'CARD'  ); 
    
                                ` +
                    queryString_plus +
                    `
                                    COMMIT;
                                    END;
                                `,
                queryVariable = [ req.body.adult_num, req.body.child_num, req.body.teenage_num, req.body.screening_cd ,
                    req.body.card_list, req.body.basic_price, req.body.total_price  ],

                query_end_callback =
                    function(err, value){
                        if(err){
                            res.send({status: ERROR});
                            console.log(err);
                            return;
                        }
                        res.send(value);
                    }
            );
        }




    });

    //공지사항 수정
    app.get('/admin/update_notice',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT BULLETIN_CD, BULLETIN_TITLE, BULLETIN_CONTENTS
                            FROM BULLETIN
                            WHERE BULLETIN_CD=:bulletin_cd
                            `,
            queryVariable = [req.query.bulletin_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/update_notice' , { notice_arr : value });
                }
        );
    });

    app.post('/admin/update_notice',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var bulletin_type_cd=1;
        var email=req.session.email;
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            BEGIN
                            UPDATE BULLETIN
                                SET BULLETIN_CD=:bulletin_cd,
                                    BULLETIN_TITLE=:title,
                                    BULLETIN_CONTENTS=:contents,
                                    REGIST_DATE=:day,
                                    BULLETIN_TYPE_CD=:bulletin_type_cd,
                                    ADMIN_ID=:email,
                                    REGIST_TIME=:time
                            WHERE BULLETIN_CD = :bulletin_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.bulletin_cd, req.body.title, req.body.contents, day, bulletin_type_cd, email,  time
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //공지사항 삭제

    app.post('/admin/delete_notice',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            DELETE FROM 
                                BULLETIN 
                            WHERE 
                                BULLETIN_CD= :bulletin_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.bulletin_cd,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //상세 공지

    app.get('/admin/notice',function(req,res){


        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT BULLETIN_TITLE, BULLETIN_CONTENTS, REGIST_DATE
                            FROM BULLETIN
                            WHERE BULLETIN_CD=bulletin_cd
                            `,
            queryVariable = [],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/notice.ejs' , { notice : value });
                }
        );

    });

    app.get('/admin/manage_consulting',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` 
                            SELECT CONSULTING_CD, CONSULTING_TITLE, CONSULTING_DATE, MEM_ID
                            FROM CONSULTING 
                            UNION
                            SELECT CONSULTING_CD, ANS_TITLE, ANS_DATE, ADMIN_ID
                            FROM ANSWER
                            ORDER BY CONSULTING_CD
                          `,
            queryVariable = [],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/manage_consulting' , { result_arr : value});
                }
        );
      
    });
    //답변 등록
    app.get('/admin/answer_consulting',function(req,res){


        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        res.render('admin/answer_consulting' , { consulting_cd : req.query.consulting_cd });     
    });

    app.post('/admin/answer_consulting',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var moment = require('moment');
        var day = moment().format('YYYY[-]MM[-]DD');
        var time = moment().format('YYYY-MM-DD HH:mm:ss');
        var email=req.session.email;
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            INSERT INTO ANSWER(ANS_TITLE, ANS_CONTENTS, ANS_DATE, ADMIN_ID, CONSULTING_CD, ANS_TIME) 
                            VALUES (:title, :contents, :day, :email, :consulting_cd, :time );
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.title, req.body.contents, day, email, req.body.consulting_cd,  time
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    //상영관 관리

    app.get('/admin/cinema',function(req,res){


        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');


        db_connect.dbQuery(
            queryString = ` 
                            SELECT THEATER_NO
                            FROM THEATER
                            WHERE CINEMA_CD = :cinema_cd
                            `,
            queryVariable = [req.query.cinema_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);
                    res.render('admin/cinema.ejs' , { result_arr : value });
                }
        );

    });
    //영화관 등록 
    app.get('/admin/registration_theater',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return; 
        }

        res.render('admin/registration_theater.ejs',{cinema_cd : req.query.cinema_cd} );
    });

    app.post('/admin/registration_theater',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var seat_plus_query = '';
        if (seat_plus_json[req.body.theater_seat_type] == null || seat_plus_json[req.body.theater_seat_type] == undefined)
            seat_plus_query += seat_plus_json[1];
        else
            seat_plus_query += seat_plus_json[req.body.theater_seat_type] ;

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            DECLARE
                                theater_cd integer := THEATER_SEQ.NEXTVAL;
                            BEGIN
                                INSERT INTO THEATER( THEATER_CD, THEATER_NO, CINEMA_CD, THEATER_TYPE, THEATER_SEAT_TYPE )
                                VALUES ( theater_cd, :theater_no , :cinema_cd, :theater_type, :theater_seat_type);  
                            ` +  seat_plus_query +
                            `COMMIT;
                            END;`,
            queryVariable = [ req.body.theater_no, req.body.cinema_cd, req.body.theater_type, req.body.theater_seat_type
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });

    app.post('/get_point', function(req,res){

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                   SELECT SUM(POINT_VALUE)
                    FROM POINT_LIST
                    WHERE MEM_ID = :mem_id
                      AND POINT_IS_INCREASE = 1
                  `,
            queryVariable = [req.body.mem_id],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);
                    plus_point = value.rows[0][0];

                    db_connect.dbQuery(
                        queryString = `
                                SELECT SUM(POINT_VALUE)
                                FROM POINT_LIST
                                WHERE MEM_ID  = :mem_id
                                  AND POINT_IS_INCREASE = 0
                            `,
                        queryVariable = [req.body.mem_id],
                        query_end_callback =
                            function(err, value){
                                if(err){
                                    console.log(err);
                                    res.send({"status" : ERROR});
                                    return;
                                }

                                console.log("" + value.rows);
                                minus_point = value.rows[0][0];

                                if ( ! (plus_point >= 0 ) ) plus_point = 0;
                                if ( ! (minus_point >= 0 ) ) minus_point = 0;

                                res.send({point:plus_point- minus_point});

                            }
                    );


                }
        );
    });

    app.post('/get_movie_genre',function(req,res){
        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT MOVIE_GENRE.GENRE_CD 
                            FROM MOVIE_GENRE
                            WHERE MOVIE_GENRE.MOVIE_CD = :movie_cd `,
            queryVariable = [req.body.movie_cd],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send(value.rows);
                }
        );
    });
    
    // 상영일정 관리

    app.get('/admin/manage_showing',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = ` SELECT to_char(S.STARTING_TIME, 'HH24:MI') , M.MOVIE_TITLE, C.CINEMA_NAME, TH.THEATER_NO, S.SCREENING_CD, to_char(S.SCREENING_DATE , 'yyyy-mm-dd')
                            FROM SCREENING_SCHEDULE S, MOVIE M , CINEMA C, THEATER TH
                            WHERE S.MOVIE_CD=M.MOVIE_CD AND S.THEATER_CD=TH.THEATER_CD AND TH.CINEMA_CD=C.CINEMA_CD
                            ORDER BY S.SCREENING_DATE, S.STARTING_TIME
                            `,
            queryVariable = {},
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send({"status" : ERROR});
                        return;
                    }

                    console.log("" + value.rows);

                    res.render('admin/manage_showing' , { showing_arr : value });
                }
        );
    });
    
    //상영 일정 삭제

    app.post('/admin/delete_showing',function(req,res){

        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        // 디비 모듈
        var db_connect = require('../db_connect/db_connect.js');
        db_connect.dbQuery(
            queryString = `
                            BEGIN
                            DELETE FROM 
                                SCREENING_SCHEDULE
                            WHERE 
                                SCREENING_CD= :screening_cd;
                            COMMIT;
                            END;
                            `,
            queryVariable = [ req.body.screening_cd,
            ],
            query_end_callback =
                function(err, value){
                    if(err){
                        res.send({status: ERROR});
                        // res.send({"status" : ERROR});
                        console.log(err);
                        return;
                    }
                    console.log("" + value.rowsAffected);
                    res.send({status: OK});
                }
        );
    });


    app.get('/admin/statistic',function(req,res){


        if (req.session.is_admin != 1 ){
            console.log('로그인 되지 않았습니다!');
            res.redirect('/admin/login');
            return;
        }

        var db_connect = require('../db_connect/db_connect.js');


        db_connect.dbQuery(
            queryString = ` 
                            SELECT  M.MOVIE_TITLE, SUM (T.ADULT)+SUM (T.TEENAGER)+SUM (T.CHILD) AS total
                            FROM TICKETING T, SCREENING_SCHEDULE S, MOVIE M
                            WHERE T.SCREENING_CD=S.SCREENING_CD AND M.MOVIE_CD=S.MOVIE_CD
                            GROUP BY M.MOVIE_TITLE
                            `,
            queryVariable = [],
            query_end_callback =
                function(err, value){
                    if(err){
                        console.log(err);
                        res.send('<script type="text/javascript">alert('+ err +');</script>');
                    }

                    console.log("" + value.rows);
                    res.render('admin/statistic' , { result_arr : value });
                }
        );

    });
}

function UniqueDateTime(format='',language='en-US'){
    //returns a meaningful unique number based on current time, and milliseconds, making it virtually unique
    //e.g : 20170428-115833-547
    //allows personal formatting like more usual :YYYYMMDDHHmmSS, or YYYYMMDD_HH:mm:SS
    var dt = new Date();
    var modele="YYYYMMDD-HHmmSS-mss";
    if (format!==''){
        modele=format;
    }
    modele=modele.replace("YYYY",dt.getFullYear());
    modele=modele.replace("MM",(dt.getMonth()+1).toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("DD",dt.getDate().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("HH",dt.getHours().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("mm",dt.getMinutes().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("SS",dt.getSeconds().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("mss",dt.getMilliseconds().toLocaleString(language, {minimumIntegerDigits: 3, useGrouping:false}));
    return modele;
}

var seat_plus_json = {
    1 : `
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '9', theater_cd );
        
    `,

    2 : `
    
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'A', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'B', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'C', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'D', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'E', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'F', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'G', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '6', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '7', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '8', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'H', '9', theater_cd );
        
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '1', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '2', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '3', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '4', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '5', theater_cd );
        INSERT INTO SEAT( SEAT_CD, SEAT_ROW_NO, SEAT_COL_NO, THEATER_CD) VALUES ( SEAT_SEQ.NEXTVAL, 'I', '6', theater_cd );
    `
}
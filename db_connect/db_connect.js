// project of uos-db
// made by gohn

var oracledb = require('oracledb');
var dbConfig = require('./db_config.js');

module.exports = {
    dbQuery: function (queryString, queryVariable, query_end_callback )
    {
        oracledb.getConnection(
            {
                user: dbConfig.user,
                password: dbConfig.password,
                connectString: dbConfig.connectString
            },
            function (err, connection) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                connection.execute(
                    queryString,
                    queryVariable,
                    function (err, result) {
                        console.log(queryString);
                        console.log(queryVariable);
                        if (err) {
                            console.log('=====================================   E R R O R    ============================================');
                            console.error(err.message);
                            doRelease(connection);
                            console.log('====================================      E  N  D  =============================================');
                            console.log('\n');
                            return;
                        }
                        console.log('=====================================   S T A R T   ============================================');
                        console.log('\n');
                        console.log('result : ');
                        console.log(result);
                        console.log('\n');
                        console.log('result.metaData : ');
                        console.log(result.metaData);
                        console.log('\n');
                        console.log('result.rows : ' );
                        console.log(result.rows);
                        console.log('\n');

                        // 커밋
                        // connection.commit(function(err){
                        //     console.error(err);
                        // });

                        // 콜백 함수가 존재하면 실행해준다
                        if (query_end_callback){
                            query_end_callback(err, result);
                            console.log('====================================      E  N  D  =============================================');
                            console.log('\n');
                        }

                        doRelease(connection);
                    });
            });
    }
}

function doRelease(connection)
{
    connection.release(
        function(err) {
            if (err) {
                console.error(err.message);
            }

        });
}

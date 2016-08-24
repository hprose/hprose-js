/**********************************************************\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\**********************************************************/

/**********************************************************\
 *                                                        *
 * clientTest.js                                          *
 *                                                        *
 * hprose client test for JavaScript.                     *
 *                                                        *
 * LastModified: Jul 26, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseHttpClient */
/*jshint eqeqeq:true, devel:true */

// some times when the network can't work, this test will fail.
/*
describe('hprose', function(){
    describe('hprose.HttpClient', function(){
        var methodList = ['hello', 'sum', 'swapKeyAndValue', 'getUserList', 'print_r'];
        var client = new hprose.HttpClient('http://hprose.com/example/', methodList);
        client.idempotent(true);
        client.onerror = function(name, err) {
            assert(false, name + ':' + err);
        };
        it('hello("world") should return "Hello World"', function(done){
            client.hello('World', function(result) {
                assert(result === "Hello World");
                done();
            });
        });
        it('print_r(binstr, true) should return binstr', function(done){
            var a = [];
            for (var i = 0; i < 256; i++) {
                a.push(String.fromCharCode(i));
            }
            var bs = hprose.binary(a.join(''));
            client.print_r(bs, true, function(result) {
                assert(result.toString() === bs.toString());
                done();
            }, {binary: true});
        });
        it('sum(1,2,3,4,5) should return 15', function(done){
            client.sum(1,2,3,4,5, function(result) {
                assert(result === 15);
                done();
            });
        });
        it('swapKeyAndValue(weeks) should swap key and value in weeks', function(done){
            var weeks = {
                'Monday': 'Mon',
                'Tuesday': 'Tue',
                'Wednesday': 'Wed',
                'Thursday': 'Thu',
                'Friday': 'Fri',
                'Saturday': 'Sat',
                'Sunday': 'Sun'
            };
            client.swapKeyAndValue(weeks, function(result, args) {
                assert(result.Mon === 'Monday');
                assert(args[0].Tue === 'Tuesday');
                done();
            }, true);
        });
        it('getUserList() should get an user list', function(done){
            client.getUserList(function(result) {
                assert(result[0].name == "Amy");
                assert(result[1].name == "Bob");
                assert(result[2].name == "Chris");
                assert(result[3].name == "Alex");
                done();
            });
        });
    });

    describe('hprose.HttpClient with JSONRPCClientFilter', function(){
        var methodList = ['hello', 'sum', 'getUserList'];
        var client = new hprose.HttpClient('http://hprose.com/example/', methodList);
        client.idempotent(true);
        client.filter(new hprose.JSONRPCClientFilter());
        client.onerror = function(name, err) {
            assert(false, name + ':' + err);
        };
        it('hello("world") should return "Hello World"', function(done){
            client.hello('World', function(result) {
                assert(result === "Hello World");
                done();
            });
        });
        it('sum(1,2,3,4,5) should return 15', function(done){
            client.sum(1,2,3,4,5, function(result) {
                assert(result === 15);
                done();
            });
        });
    });
});
*/
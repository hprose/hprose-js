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
 * LastModified: Feb 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseHttpClient */
/*jshint eqeqeq:true, devel:true */

describe('hprose', function(){
    describe('HproseHttpClient', function(){
        var methodList = ['hello', 'sum', 'swapKeyAndValue', 'getUserList'];
        var client = new HproseHttpClient('http://hprose.com/example/', methodList);
        client.onError = function(name, err) {
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
                assert(HproseFormatter.serialize(result) === 'a4{c4"User"5{s4"name"s3"sex"s8"birthday"s3"age"s7"married"}o0{s3"Amy"2D19831203;i26;t}o0{s3"Bob"1D19890612;i20;f}o0{s5"Chris"0D19800308;i29;t}o0{s4"Alex"3D19920614;i17;f}}');
                done();
            }, true);
        });
    });
});

/*
(function() {
    'use strict';
    var methodList = ['hello', 'sum', 'swapKeyAndValue', 'getUserList'];
    var client = new HproseHttpClient('http://hprose.com/example/', methodList);
    client.onError = function(name, err) {
        console.error(name + ':' + err);
    };
    client.beginBatch();
    client.hello('World', function(result) {
        console.info(result);
    });
    client.sum(1,2,3,4,5, function(result) {
        console.info(result);
    });
    client.swapKeyAndValue(weeks, function(result, args) {
        console.info(weeks);
        console.info(result);
        console.info(args[0]);
    }, true);
    client.getUserList(function(result) {
        console.info(result);
    });
    client.endBatch();
})();
*/

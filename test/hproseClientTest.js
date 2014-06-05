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
 * hproseSerializeTest.js                                 *
 *                                                        *
 * hprose serialize test for JavaScript.                  *
 *                                                        *
 * LastModified: Mar 29, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseHttpClient */
/*jshint eqeqeq:true, devel:true */

(function() {
    'use strict';
    var methodList = ['hello', 'sum', 'swapKeyAndValue', 'getUserList'];
    var client = new HproseHttpClient('http://hprose.com/example/', methodList);
    client.onError = function(name, err) {
        console.error(name + ':' + err);
    };
    client.hello('World', function(result) {
        console.info(result);
    });
    client.sum(1,2,3,4,5, function(result) {
        console.info(result);
    });
    var weeks = {
        'Monday': 'Mon',
        'Tuesday': 'Tue',
        'Wednesday': 'Wed',
        'Thursday': 'Thu',
        'Friday': 'Fri',
        'Saturday': 'Sat',
        'Sunday': 'Sun',
    };
    client.swapKeyAndValue(weeks, function(result, args) {
        console.info(weeks);
        console.info(result);
        console.info(args[0]);
    }, true);
    client.getUserList(function(result) {
        console.info(result);
    });
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
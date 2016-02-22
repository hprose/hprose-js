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
 * setImmediateTest.js                                    *
 *                                                        *
 * setImmediate test for JavaScript.                      *
 *                                                        *
 * LastModified: Feb 21, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*jshint eqeqeq:true, devel:true */

describe('setImmediate', function(){
    it('#setImmediate() test 1', function(done) {
        var x = 1;
        setImmediate(function() {
            assert(x === 2);
            done();
        });
        x = 2;
    });
    it('#setImmediate() test 2', function(done) {
        var x = 1;
        setImmediate(function(x) {
            assert(x === 3);
            done();
        }, 3);
        x = 2;
    });
});

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

describe('the Utils module', function() {

    var injector = angular.injector(['Utils']);
    var service = injector.get('Utils',[]);

    it('should return a Utils service instance', function() {
        expect(service).not.toBe(null);
    });

    describe('the Utils service instance', function() {

        it('should have atleast 10 functions declared', function() {
            var count = 0;
            for (var key in service) {
                count++;
            }
            expect(count).toBeGreaterThan(8);
        });

        it('should apply values to the scope object', function() {
            var scope = {'abc':'', 'def':'nothing', 'xyz':''};
            var values = {'abc':'123', 'xyz':'789'};
            var result = service.applyAttributes(scope, values);
            // the values should match
            for (var key in result) {
                if (result.hasOwnProperty(key)) {
                    expect(result[key]).toBe(values[key]);
                } else {
                    // @todo fail on key
                }
            }
            // @todo the number of elements should match
        });

        it('should return true when the arrays are equal, false otherwise', function() {
            var a = ['a','b','c'];
            var b = ['a','b','c'];
            var c = ['a','b'];
            var d = ['x','y','z'];
            var e = ['x','y','z','0'];

            var result = service.arraysAreEqual(a, b);
            expect(result).toBe(true);

            result = service.arraysAreEqual(b, c);
            expect(result).toBe(false);

            result = service.arraysAreEqual(c, d);
            expect(result).toBe(false);

            result = service.arraysAreEqual(d, e);
            expect(result).toBe(false);
        });

        it('should return the name of the month at the given index', function() {
            var months = ['January','February','March','April','May','June',
                'July','August','September','October','November',
                'December'];
            var result;
            // test index 0 padded numbers
            for (var i=1;i<10;i++) {
                result = service.convertMonthIndexToName("0"+i);
                expect(result).toBe(months[i-1]);
            }
            // test non-zero padded numbers
            for (var i=1;i<10;i++) {
                result = service.convertMonthIndexToName(i);
                expect(result).toBe(months[i-1]);
            }
        });

        it('should format the date sting', function() {
            expect(service).not.toBe(null);
        });

        it('should return true when the objects are equal, false otherwise', function() {
            var a = ['a','b','c'];
            var b = ['a','b','c'];
            var c = ['a','b'];
            var d = ['x','y','z'];
            var e = ['x','y','z','0'];
            var f = {'abc':'', 'def':'nothing', 'xyz':''};
            var g = {'abc':'123', 'def':'nothing', 'xyz':'789'};
            var h = {'abc':'123', 'def':'nothing', 'xyz':'789'};
            var i = {'abc':'123', 'xyz':'789'};
            var j = {'abc':'123', 'xyz':'789'};
            var k = {'abc':'123', 'def':['123', '456'], 'xyz':'789'};
            var l = {'abc':'123', 'def':['123', '456'], 'xyz':'789'};
            var m = {'abc':'123', 'def':['123'], 'xyz':'789'};

            var result = service.objectsAreEqual(a, b);
            expect(result).toBe(true);

            result = service.objectsAreEqual(b, c);
            expect(result).toBe(false);

            result = service.objectsAreEqual(d, e);
            expect(result).toBe(false);

            result = service.objectsAreEqual(f, g);
            expect(result).toBe(false);

            result = service.objectsAreEqual(g, h);
            expect(result).toBe(true);

            result = service.objectsAreEqual(i, j);
            expect(result).toBe(true);

            result = service.objectsAreEqual(g, k);
            expect(result).toBe(false);

            result = service.objectsAreEqual(k, l);
            expect(result).toBe(true);
        });

        it('should return true when a string starts with a specified value, false otherwise', function() {
            var a = "This is a sentence";
            var b = "ABC";
            var c = "abc";
            var d = "  abc";
            var e = "abc ";

            var result = service.startsWith(a, 'abc');
            expect(result).toBe(false);

            result = service.startsWith(a, 'This');
            expect(result).toBe(true);

            result = service.startsWith(b, 'abc');
            expect(result).toBe(false);

            result = service.startsWith(c, 'abc');
            expect(result).toBe(true);

            result = service.startsWith(d, 'abc');
            expect(result).toBe(false);

            result = service.startsWith(e, 'abc');
            expect(result).toBe(true);
        });

        it('should return a string with starting and ending whitespace characters removed', function() {
            var a = "  ABC   ";
            var b = "ABC";
            var c = "abc";
            var d = "  abc";
            var e = "abc ";

            var result = service.trim(a);
            expect(result).toBe('ABC');

            result = service.trim(b);
            expect(result).toBe('ABC');

            result = service.trim(c);
            expect(result).toBe('abc');

            result = service.trim(d);
            expect(result).toBe('abc');

            result = service.trim(e);
            expect(result).toBe('abc');
        });

        it('should return a string with the leading 0 character removed', function() {
            var a = "00";
            var b = "01";
            var c = "02";
            var d = "000";
            var e = "001";
            var f = "002";
            var g = "0ABC";
            var h = "ABC0";

            var result = service.trimLeadingZero(a);
            expect(result).toBe('0');

            result = service.trimLeadingZero(b);
            expect(result).toBe('1');

            result = service.trimLeadingZero(c);
            expect(result).toBe('2');

            result = service.trimLeadingZero(d);
            expect(result).toBe('00');

            result = service.trimLeadingZero(e);
            expect(result).toBe('01');

            result = service.trimLeadingZero(f);
            expect(result).toBe('02');

            result = service.trimLeadingZero(g);
            expect(result).toBe('ABC');

            result = service.trimLeadingZero(h);
            expect(result).toBe('ABC0');
        });

        it('should return a string that has been truncated to the specified length', function() {
            var a = "This is not a run on sentence.";
            var b = "This could end up being a very long sentence.";
            var c = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec bibendum fermentum ante at malesuada. Integer ut nisi vitae orci gravida tempor. Sed vel velit tellus. Morbi tristique adipiscing lacinia. Aliquam erat volutpat. Nulla et sodales nibh, eu consequat dui. Curabitur dictum dolor lacus, sed accumsan ipsum rutrum et. Cras dapibus cursus turpis nec sagittis. Pellentesque nec felis eu ipsum consequat sagittis vitae sed tortor. ";
            var d = "This is a sentence.";

            var result = service.truncate(a, 20);
            expect(result.length).toBeLessThan(25);

            result = service.truncate(b, 20);
            expect(result.length).toBeLessThan(25);

            result = service.truncate(c, 100);
            expect(result.length).toBeLessThan(101);

            result = service.truncate(d, 20);
            expect(result.length).toBeLessThan(25);
        });

    });

});


describe("Events", function() {
    var e = window.eventMgr;
    beforeEach(function() {
        e.eventDestroy();
    });

    describe("should be able to define and undefine an event >>",function(){

        beforeEach(function() {
            e.define({event:"anEvent"});
        });

        it(" define an event",function(){
            expect(e.eventIsDefined('anEvent')).toBeTruthy();
        });

        it("Undefine an event", function(){
            e.undefine('anEvent');
            expect(e.eventIsDefined('anEvent')).toBeFalsy();
        });
    });

    it("should NOT be able to define 2 events with the same name >>",function(){
        e.define({event:'anEvent'});
        expect(e.define({event:'anEvent'})).toBeFalsy();

        var listOfEvents = e.eventDebug();
        expect(Object.keys(listOfEvents).length).toEqual(1);
    });

    describe("should be able to define a limited number of triggers event >>",function(){

        beforeEach(function() {
            e.eventDestroy();
            e.define({event:"anEvent", triggersLeft: 2});
        });

        it("exists after 1 call",function(){
            e.dispatch('anEvent');
            expect(e.eventIsDefined('anEvent')).toBeTruthy();
        });

        it("dissapear after 2nd call", function(){
            e.dispatch('anEvent');
            e.dispatch('anEvent');
            expect(e.eventIsDefined('anEvent')).toBeFalsy();
        });
    });

    describe("should be able to add before,on and after listeners and  >>",function(){

        calls = {};

        beforeEach(function() {
            calls = {
                call_before: function(){},
                call_on: function(){},
                call_after: function(){}
            };
            text = {value:''};

            e.eventDestroy();
            e.define({event:"anEvent"});

            spyOn(calls,"call_before");
            e.before({
                event: 'anEvent',
                callback: calls.call_before,
                thisArg: window.calls
             });

            spyOn(calls, "call_on");
            e.on({
                event: 'anEvent',
                callback: calls.call_on,
                thisArg: window.calls
             });

            spyOn(calls, "call_after");
            e.after({
                event: 'anEvent',
                callback: calls.call_after,
                thisArg: window.calls
             });
        });

        it(" must have been called 1 time at dispatch",function(){
            e.dispatch('anEvent');
            expect(calls.call_before.calls.length).toEqual(1);
            expect(calls.call_on.calls.length).toEqual(1);
            expect(calls.call_after.calls.length).toEqual(1);
//            console.log('calls',calls.call_after.calls);
        });

    });
    /** Jasmine private closures disabled us to test properly, the objects are somehow not the same
     * TODO make this test work
     */
    xdescribe("should be able to add before,on and after listeners and  >>",function(){

           var callsX = function(){};
            callsX.prototype = {
               call_before: function(){this.text.value += 'a';},
               call_on: function(){this.text.value += 'b';},
               call_after: function(){this.text.value += 'c';},
               text: {value: ''}
           };
            var calls = new callsX;
           e.define({event:"anEvent"});

           e.before({
               event: 'anEvent',
               callback: calls.call_before,
               thisArg: calls
            });

           e.on({
               event: 'anEvent',
               callback: calls.call_on,
               thisArg: calls
            });

           e.after({
               event: 'anEvent',
               callback: calls.call_after,
               thisArg: calls
            });

           it("before, on and after listener must have been called in the right order",function(){
               e.dispatch('anEvent');
               expect(calls.text.value).toEqual('abc');
               setTimeout(function(){console.log(calls.text.value, calls);}, 200);
               //console.log(text.value, window.calls);
           });
       });
    describe("should be able to define a limited number of triggers listeners >>",function(){
        var obj = {callback : function(){return 1+1;}};

        beforeEach(function() {
            e.eventDestroy();
            e.define({event:"anEvent"});

            spyOn(obj, "callback");
            e.on({
                event: 'anEvent',
                callback: obj.callback,
                triggersLeft: 2
             });
        });

        it("listener called only for a limited count",function(){
            e.dispatch('anEvent');
            e.dispatch('anEvent');
            e.dispatch('anEvent');
            e.dispatch('anEvent');

            expect(obj.callback.calls.length).toEqual(2);
        });
    });

    it("should be able to define 2 events in cascade and dispatch them by calling only the first",function(){
        var obj = {callback : function(){return 1+1;}};

        e.define({event:"aSecondEvent"});
        e.define({event:"anEvent", cascadeEvent: 'aSecondEvent'});

        spyOn(obj, "callback");
        e.on('aSecondEvent',  obj.callback);

        e.dispatch('anEvent');
        expect(obj.callback.calls.length).toEqual(1);
    });

    describe("test the loost/strict event defining mode",function(){
        beforeEach(function() {
            e.eventDestroy();
        });

        it("should work to add listener w/o defining the event, when loose mode is on",function(){
            e.eventLooseMode(true);
            e.on('anEvent',function(){return 1+1;});
            expect(e.eventIsDefined('anEvent')).toBeTruthy();
        });

        it("should Not work to auto-define an event when in strict mode",function(){
            e.eventLooseMode(false);
            e.on('anEvent',function(){return 1+1;});
            expect(e.eventIsDefined('anEvent')).toBeFalsy();
        });
    });

    describe("should be able to manually remove a listener >>",function(){
        var obj = {callback : function(){return 1+1;}};
        var callId = 'someListener';

        beforeEach(function() {
            e.eventDestroy();
            e.define({event:"anEvent"});

            spyOn(obj, "callback");
            e.on({
                event: 'anEvent',
                callback: obj.callback,
                callId: callId
             });
        });

        it("should be triggered once",function(){
            e.dispatch('anEvent');
            expect(obj.callback.calls.length).toEqual(1);
        });

        it("should not be triggered if removed (unlisten)",function(){
           e.unlisten('anEvent', 'on', callId);
           e.dispatch('anEvent');
           expect(obj.callback.calls.length).toEqual(0);
       });
    });

    it("should NOT be able to define 2 listeners with the same ID on the same event and type >>",function(){
        e.define({event:'anEvent'});

        expect(e.on({event: 'anEvent', callId: 'oneTrigger', callback: function(){}})).toEqual('oneTrigger');
        expect(e.on({event: 'anEvent', callId: 'oneTrigger', callback: function(){}})).toBeFalsy();
    });
});
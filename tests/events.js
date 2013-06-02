
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

    describe("should be able to add before,on and after listeners and trigger them >>",function(){

        window.calls = {};
        var calls = {
            call_before: function(){window.calls.call_before_time = new Date().getTime();},
            call_on: function(){window.calls.call_on_time = new Date().getTime();},
            call_after: function(){window.calls.call_after_time = new Date().getTime();}
        };

        beforeEach(function() {
            e.eventDestroy();
            e.define({event:"anEvent"});

            spyOn(calls,"call_before");
            e.before('anEvent', calls.call_before);

            spyOn(calls, "call_on");
            e.on('anEvent', calls.call_on);

            spyOn(calls, "call_after");
            e.after('anEvent', calls.call_after);
        });

        it("before, on and after listner must have been called 1 time at dispatch",function(){
            e.dispatch('anEvent');
            expect(calls.call_before.calls.length).toEqual(1);
            expect(calls.call_on.calls.length).toEqual(1);
            expect(calls.call_after.calls.length).toEqual(1);
        });

        //to do this I modified jasmine library - added timestamp in ms when the call is made
        //spyObj.calls.push({object: this, args: args, time: new Date().getTime()});
        it("before, on and after listner must have been called in the right order",function(){
            e.dispatch('anEvent');
            expect(calls.call_before.calls[0].time <=
                       calls.call_on.calls[0].time <=
                       calls.call_after.calls[0].time).toBeTruthy();
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
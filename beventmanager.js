/*
    BEventManager - Javascript Custom Event Manager
    version 0.2
    31.05.2013
    http://btools.eu
    https://github.com/BTooLs/BEventManager/
 */
(function(applyTo){

    var _events = {};
    var _unique = 0;//helper to generate unique listeners ID's
    var debug = false;//prints to console error messages
    var looseMode = true;//auto define the events, may lead to logic errors / misspells

    function _defineEvent(params){

        if ( ! params ||  ! params.event || typeof(_events[params.event]) != 'undefined') {
            return false;//already defined
        }

        params = $.extend({},{
            event           : false,//string, unique name of event
            triggersLeft    : false,//numeric, counts of triggers until it's auto-destruct
            before          : [],//list of listeners triggered before event
            on              : [],//list of listeners triggered at the event
            after           : [],//list of listeners triggered after event
            cascadeEvent    : false //string, name of another event
        },params);

        if (params.cascadeEvent && typeof(_events[params.cascadeEvent]) == 'undefined'){
            if (looseMode){
                _defineEvent({event: params.cascadeEvent});//define it
            } else {
                debug && console.log('err: cascadeEvent not defined', params.cascadeEvent);
                return false;
            }
        }

        _events[params.event] = params;
        return true;
    };

    /**
     *
     * @param {String} event Name of the event we want to delete.
     * @private
     */
    function _undefineEvent(event){
        _events[event] = undefined;
        try{
            delete _events[event];
        }catch(e){}

        //delete it from the cascade if found
        for (var i in _events){
            if (_events[i].cascadeEvent === event){
                _events[i].cascadeEvent = false;
            }
        }
    };

    this.define = function(/* list of events to be defined */){
        var result = false;
        for (var i = 0 ; i < arguments.length; i++){
            var params = arguments[i];
            if (typeof(params) == 'undefined' || typeof(params.event) !== 'string' ){
                debug && console.log('err: event name missing');
                result = false;
                continue;
            }

            //sanity check and restrict bad options
            var toParams = {
                event: params.event
            };

            if ((typeof(params.triggersLeft) == 'number' && params.triggersLeft > 0)
                    || params.triggersLeft === false){
                toParams.triggersLeft = params.triggersLeft;
            }

            if (typeof(params.cascadeEvent) == 'string' || params.cascadeEvent === false){
                toParams.cascadeEvent = params.cascadeEvent;
            }
            result =  _defineEvent(toParams);
        }
        return result;
    };

    /**
     * Destroy an event and it's listeners, and removes itself as cascade event if any.
     * @param event
     * @return {*}
     */
    this.undefine = function(event){
        return _undefineEvent(event);
    }

    //add a custom callback function to be called when an event triggers
    function _defineListener(params,type){
        params = $.extend({},{
                   event       : false,//string, name of the event we attach it
                   callId      : false,//unique identifier of the callback
                   callback    : false,//the function itself
                   thisArg     : window,
                   argsArray   : [],
                   triggersLeft: false,//number or calls left before auto destroy
                   queueEnd    : true //add at the end of queue, false to add as first (override callback order)
       },params);

       if (typeof(_events[params.event]) == 'undefined'){
           if (looseMode){
               _defineEvent({event: params.event});//auto define the event
           } else {
               debug && console.log('err: event not defined',params.event);
               return false;
           }
       }
       if ( ! params.event
           || typeof(params.callback) != 'function'){
           debug && console.log('err: callback not valid',params);
           return false;
       }

       //we allow custom string listeners naming, or automatically generated numeric ones
       if (typeof(params.callId) === 'string'){
           //we search to make sure the callId is unique
           var len = _events[params.event][type].length;
           for (var i = 0; i < len; i++){
               if (_events[params.event][type][i].callId == params.callId){
                   debug && console.log('err: callId already used for this event/type');
                   return false;
               }
           }
       } else {
           params.callId = _unique++;
       }

       //copy the function as prototype - experimental
//         var F = function () {};
//          F.prototype = params.callback;
//          params.callback = new F();
        //TODO make this work

        if (params.queueEnd){
            //TODO remove params.queueEnd from object
            _events[params.event][type].push(params);
        } else {
            //TODO remove params.queueEnd from object
            _events[params.event][type].unshift(params);
        }

       return params.callId;
    }

    this.on =  function(/**mixins*/){
        if (arguments.length == 1){
            var params = arguments[0];
        } else if (arguments.length == 2){
            var params = {
                event: arguments[0],
                callback: arguments[1]
            };
        } else {
            debug && console.log('err: wrong number of parameters (on)');
            return false;
        }
        return _defineListener(params,'on');
    };
    this.before =  function(params){
        if (arguments.length == 1){
               var params = arguments[0];
        } else if (arguments.length == 2){
           var params = {
               event: arguments[0],
               callback: arguments[1]
           };
        } else {
           debug && console.log('err: wrong number of parameters (on)');
           return false;
        }
        return _defineListener(params,'before');
    };
    this.after =  function(params){
        if (arguments.length == 1){
           var params = arguments[0];
        } else if (arguments.length == 2){
           var params = {
               event: arguments[0],
               callback: arguments[1]
           };
        } else {
           debug && console.log('err: wrong number of parameters (on)');
           return false;
        }
        return _defineListener(params,'after');
    };

    this.unlisten = function(event, type, callId){
        if (event && type && (type === 'on' || type == 'before' || type == 'after') && typeof(callId) != 'undefined'){
            return _undefineListener(event, type, callId);
        }
        debug && console.log('err: wrong parameters');
        return false;
    }

    function _undefineListener(event, type, callId){
        if (_events[event] == undefined){
            debug && console.log('err: event not exists');
            return false;
        }

        debug && console.log('undefining',event, type, callId);
        var len = _events[event][type].length;
        for (var i = 0; i < len; i++){
            if (_events[event][type][i].callId == callId){
                _events[event][type].splice(i,1);
                break;
            }
        }
        return true;
    };

    /**
     * Triggeres a series of callbacks attacked to a specific event and list
     * @param event Name of the event
     * @param type Type (before,on,after)
     * @private
     */
    function _dispatchListeners(event,type){

        debug && console.log('dispatching ',event,type);
        var len = _events[event][type].length;
        for (var i=0; i < len; i++){
           var call = _events[event][type][i];

           debug && console.log('calling ',call.callId);
           //actual Calling
           call.callback.call(call.thisArg, call.argsArray);

            //decrement and/or remove if necessary
            if (typeof(call.triggersLeft) === 'number'){
                if (--call.triggersLeft <= 0){
                    _undefineListener(event, type, call.callId)
                }
            }
       }
    }

    /**
     * Triggers a custom event.
     * @param event Name of the event
     * @return {Boolean}
     */
    this.dispatch = function(event){
         if (typeof(_events[event]) == 'undefined'){
            debug && console.log('err: trigger event not exists',event);
            return false;
        }
        debug && console.log('dispatching ',event);

        _events[event].before.length &&  _dispatchListeners(event,'before');
        _events[event].on.length &&  _dispatchListeners(event,'on');
        _events[event].after.length && _dispatchListeners(event,'after');

        //if cascade exists
        if (_events[event].cascadeEvent){
            //setTimeout to make another thread ?
            this.dispatch(_events[event].cascadeEvent);
        }

        //has a limited number of triggers ?
       if (typeof(_events[event].triggersLeft) === 'number'
           && (--_events[event].triggersLeft <= 0)){
           _undefineEvent(event);
       }
        return true;
    };

    /**
     * Enable or disable the looseMode.
     * @param value
     */
    this.eventLooseMode = function(value){
        looseMode = (value);
    }
    this.eventDebugMode = function(value){
        debug = (value);
    }
    /**
     * Returns the events big object.
     * @return {Object}
     */
    this.eventDebug = function(){
        return _events;
    }

    return applyTo.eventMgr = this;

//TODO make this compatible with requirejs
//TODO make this jQuery plugin
})(window);//end event Manager
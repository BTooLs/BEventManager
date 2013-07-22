/*
    BEventManager - Javascript Custom Event Manager
    version 0.4.2
    21.07.2013
    http://btools.eu
    https://github.com/BTooLs/BEventManager/
 */
(function(){

    var EventManager = function(){
        var _events = {};
        var _unique = 0;//helper to generate unique listeners ID's
        var debug = false;//prints to console error messages
        var looseMode = true;//auto define the events, may lead to logic errors / misspells
        var dispatchTimeout = false;//the listeners are dispatched with setTimeout to make another execution line

        function _defineEvent(params){

            if ( ! params ||  ! params.event || typeof(_events[params.event]) != 'undefined') {
                return false;//already defined
            }

            params = extend({},{
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
                    debug && log('err: cascadeEvent not defined', params.cascadeEvent);
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
            var result = false, toParams, params;
            for (var i = 0 ; i < arguments.length; i++){
                params = arguments[i];
                if (typeof(params) == 'undefined' || typeof(params.event) !== 'string' ){
                    debug && log('err: event name missing');
                    result = false;
                    continue;
                }

                //sanity check and restrict bad options
                toParams = {
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

        this.eventIsDefined = function(event){
            return (typeof(_events[event]) !== 'undefined');
        };

        /**
         * Destroy an event and it's listeners, and removes itself as cascade event if any.
         * @param event
         * @return {*}
         */
        this.undefine = function(event){
            return _undefineEvent(event);
        };

        //add a custom callback function to be called when an event triggers
        function _defineListener(params, type){
            params = extend({},{
                       event       : false,//string, name of the event we attach it
                       callId      : false,//unique identifier of the callback
                       callback    : false,//the function itself
                       thisArg     : window,
                       argsArray   : [],
                       triggersLeft: false,//number or calls left before auto destroy
                       queueEnd    : true, //add at the end of queue, false to add as first (override callback order)
                       delay       : 0, //adds a delay at calling (setTimeout) in ms
                       timeout     : null //used to keep the timeout id, if any, for the ability to clear it
           },params);

           if (typeof(_events[params.event]) == 'undefined'){
               if (looseMode){
                   _defineEvent({event: params.event});//auto define the event
               } else {
                   debug && log('err: event not defined at listener create',params.event);
                   return false;
               }
           }
           if ( ! params.event
               || typeof(params.callback) != 'function'){
               debug && log('err: listener/callback not a function',params);
               return false;
           }

           //we allow custom string listeners naming, or automatically generated numeric ones
           if (typeof(params.callId) === 'string'){
               //we search to make sure the callId is unique
               var len = _events[params.event][type].length;
               for (var i = 0; i < len; i++){
                   if (_events[params.event][type][i].callId == params.callId){
                       debug && log('err: callId already used for this event/type');
                       return false;
                   }
               }
           } else {
               params.callId = _unique++;
           }

            //we make sure the argsArray is an actual array
            if (params.argsArray instanceof Array == false){
                params.argsArray = [params.argsArray];
            }

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
            if (arguments.length === 1){
                var params = arguments[0];
            } else if (arguments.length === 2){
                var params = {
                    event: arguments[0],
                    callback: arguments[1]
                };
            } else {
                debug && log('err: wrong number of parameters (on)');
                return false;
            }
            return _defineListener(params,'on');
        };
        this.before =  function(/**mixins*/){
            if (arguments.length === 1){
               var params = arguments[0];
            } else if (arguments.length === 2){
               var params = {
                   event: arguments[0],
                   callback: arguments[1]
               };
            } else {
               debug && log('err: wrong number of parameters (on)');
               return false;
            }
            return _defineListener(params,'before');
        };
        this.after =  function(/**mixins*/){
            if (arguments.length === 1){
               var params = arguments[0];
            } else if (arguments.length === 2){
               var params = {
                   event: arguments[0],
                   callback: arguments[1]
               };
            } else {
               debug && log('err: wrong number of parameters (on)');
               return false;
            }
            return _defineListener(params,'after');
        };

        this.unlisten = function(event, type, callId){
            if (event && type && (type === 'on' || type == 'before' || type == 'after') && typeof(callId) != 'undefined'){
                return _undefineListener(event, type, callId);
            }
            debug && log('err: wrong parameters');
            return false;
        }

        function _undefineListener(event, type, callId){
            if (_events[event] == undefined){
                debug && log('err: event not exists');
                return false;
            }

            debug && log('undefining',event, type, callId);
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
         * Triggers a series of callbacks attacked to a specific event and list
         * @param event Name of the event
         * @param type Type (before,on,after)
         * @param data Array of data will be passed along with args Array
         * @private
         */
        function _dispatchListeners(event, type, data){

            debug && log('dispatching ',event,type);
            var len = _events[event][type].length;
            for (var i=0; i < len; i++){
                //because call is a reference type variable so we need to create a scope for the value
                //in order to dispatchTimeout work properly
                (function(){
                   var call = _events[event][type][i];

                    //TODO make a separate function for the actual calling to remove duplicate code
                   //actual Calling
                    if (dispatchTimeout || call.delay > 0){
                        call.timeout = setTimeout(function(){
                            call.callback.apply(call.thisArg, call.argsArray.concat(data));
                            call.timeout = null;
                            debug && log('calling listener',call.callId);

                            //decrement and/or remove if necessary
                            if (typeof(call.triggersLeft) === 'number'){
                                if (--call.triggersLeft <= 0){
                                    _undefineListener(event, type, call.callId)
                                }
                            }

                        }, call.delay);
                    }
                    else {
                        call.callback.apply(call.thisArg, call.argsArray.concat(data));
                        debug && log('calling listener',call.callId);


                        //decrement and/or remove if necessary
                        if (typeof(call.triggersLeft) === 'number'){
                            if (--call.triggersLeft <= 0){
                                _undefineListener(event, type, call.callId)
                            }
                        }
                    }
                })();
           }
        }

        /**
         * Triggers a custom event.
         * @param event Name of the event
         * @param data Array of data that will be passed to listeners, concats with each listener argsArray
         * @return {Boolean}
         */
        this.dispatch = function(event, data){
             if (typeof(_events[event]) == 'undefined'){
                debug && log('err: trigger event not exists',event);
                return false;
            }
            debug && log('dispatching ', event);
            var data = (data === undefined) ? [] : ((data instanceof Array) ? data : [data]);

            _events[event].before.length &&  _dispatchListeners(event, 'before', data);
            _events[event].on.length &&  _dispatchListeners(event, 'on', data);
            _events[event].after.length && _dispatchListeners(event, 'after', data);

            //if cascade exists
            if (_events[event].cascadeEvent){
                //setTimeout to make another thread ?
                this.dispatch(_events[event].cascadeEvent, data);
            }

            //has a limited number of triggers ?
           if (typeof(_events[event].triggersLeft) === 'number'
               && (--_events[event].triggersLeft <= 0)){
               _undefineEvent(event);
           }
            return true;
        };

        /**
         * Enable or disable the looseMode (pre-defining events)
         * @param value
         */
        this.setLooseMode = function(value){
            looseMode = !!(value);
        };
        /**
         * Enable or disable debug mode (messages in console)
         * @param value
         */
        this.setDebugMode = function(value){
            debug = !!(value);
        };
        /**
         * Enable or disable the setTimeout call listeners (for execution stacks)
         * @param value
         */
        this.setDispatchTimeout = function(value){
            dispatchTimeout = !!(value);
        };
        /**
         * Returns the events big object.
         * @return {Object}
         */
        this.eventDebug = function(){
            return _events;
        };

        /**
         * Cleans all the events and listeners, internally.
         */
        this.destroy = function(){
            _events = {};
            _unique = 0;
        };

        function log(){
            //TODO make this work with util.print nodeJS function too
            if ( ! console || ! typeof(console.log) == 'function')
                return false;

            //transform arguments to array and add a module prefix
            var toPrint = ['EventMgr:'].concat(Array.prototype.slice.call(arguments));
            console.log(toPrint);
            return true;
        }
        /** Thanks to jQuery - 1.10.1 */
        function extend() {
            var src, copyIsArray, copy, name, options, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if ( typeof target === "boolean" ) {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
                target = {};
            }

            // extend jQuery itself if only one argument is passed
            if ( length === i ) {
                target = this;
                --i;
            }

            for ( ; i < length; i++ ) {
                // Only deal with non-null/undefined values
                if ( (options = arguments[ i ]) != null ) {
                    // Extend the base object
                    for ( name in options ) {
                        src = target[ name ];
                        copy = options[ name ];

                        // Prevent never-ending loop
                        if ( target === copy ) {
                            continue;
                        }

                        // Recurse if we're merging plain objects or arrays
                        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                            if ( copyIsArray ) {
                                copyIsArray = false;
                                clone = src && jQuery.isArray(src) ? src : [];

                            } else {
                                clone = src && jQuery.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[ name ] = jQuery.extend( deep, clone, copy );

                        // Don't bring in undefined values
                        } else if ( copy !== undefined ) {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        };
    }//end of EventManager

    //TODO test compatibility with requirejs
    //if (typeof exports !== 'undefined') {
    //  module.exports = EventManager;
    //} else if (typeof window !== 'undefined'){
      window.EventManager = EventManager;
    //} else {
        //error do some fallback ?!
    //}

})();
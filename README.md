BEventManager
=============
    BEventManager - Javascript Custom Event Manager
    version 0.4.2
    21.07.2013
    http://btools.eu
    https://github.com/BTooLs/BEventManager/

##Description
Class/Object that handles custom JavaScript events.
When to use this class ? Was created for these cases in mind:
* easily implement the Inversion of Control (IoC)
* decouple small-medium size projects (not yet optimized for large listeners queues) into modules/files/objects
* event-driven programming in JavaScript (EDP)

##Requirements
* javascript environment

###Features - Events
* add your own events and dispatch them manually
* cascade events - automatically trigger an event after another
* loose / strict mode - auto define the events when defining the listeners, or not
* create more events with one call
* limit the number of event dispatches - auto destruct the event after a specific number of triggers
* when dispatching an event, a data array can be send to all listeners as parameters

###Features - listeners (callbacks)
* unique ID's - automatically generated or manually defined, each listener have one
* limit the number of calls  - auto destruct the listener after a specific number of triggers
* 3 types of listeners (before, on, after) - order your listeners by groups
* manually remove a listener (by type and id)
* add a listener to the beginning of the queue (array shift)
* custom thisArg and argsArray for each listener (used at call)
* static arguments can be defined for each listeners and will be combined with the event sent data at dispatch
* timeout global option for listeners to clear the callstacks
* a delay can be set for each listener individually (setTimeout is used)

###Examples
Examples can be found in examples folder and more in the actual unit tests (tests/events.js).

### Unit testing
* Unit testing using jasmine  covering around 90% of the code

Any clone / feedback / help / test is appreciated.

####To Do
* make it work with nodeJS (including log function)
* add try/catch blocks and make it more secure
* optimize it for large listeners queues
* test it in requireJS as a module
* option to lock/disable parallel/async event triggering - unable to dispatch if the previous run didn't finished to
run all listeners
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeSpread = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global,__dirname){
/*!
Copyright © 2016 Max Franz

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.weaver = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('./is');
var util = _dereq_('./util');
var Promise = _dereq_('./promise');
var Event = _dereq_('./event');

var define = {

  // event function reusable stuff
  event: {
    regex: /(\w+)(\.\w+)?/, // regex for matching event strings (e.g. "click.namespace")
    optionalTypeRegex: /(\w+)?(\.\w+)?/,
    falseCallback: function(){ return false; }
  },

  // event binding
  on: function( params ){
    var defaults = {
      unbindSelfOnTrigger: false,
      unbindAllBindersOnTrigger: false
    };
    params = util.extend({}, defaults, params);

    return function onImpl(events, data, callback){
      var self = this;
      var selfIsArrayLike = self.length !== undefined;
      var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
      var eventsIsString = is.string(events);
      var p = params;

      if( is.fn(data) || data === false ){ // data is actually callback
        callback = data;
        data = undefined;
      }

      // if there isn't a callback, we can't really do anything
      // (can't speak for mapped events arg version)
      if( !(is.fn(callback) || callback === false) && eventsIsString ){
        return self; // maintain chaining
      }

      if( eventsIsString ){ // then convert to map
        var map = {};
        map[ events ] = callback;
        events = map;
      }

      for( var evts in events ){
        callback = events[evts];
        if( callback === false ){
          callback = define.event.falseCallback;
        }

        if( !is.fn(callback) ){ continue; }

        evts = evts.split(/\s+/);
        for( var i = 0; i < evts.length; i++ ){
          var evt = evts[i];
          if( is.emptyString(evt) ){ continue; }

          var match = evt.match( define.event.regex ); // type[.namespace]

          if( match ){
            var type = match[1];
            var namespace = match[2] ? match[2] : undefined;

            var listener = {
              callback: callback, // callback to run
              data: data, // extra data in eventObj.data
              type: type, // the event type (e.g. 'click')
              namespace: namespace, // the event namespace (e.g. ".foo")
              unbindSelfOnTrigger: p.unbindSelfOnTrigger,
              unbindAllBindersOnTrigger: p.unbindAllBindersOnTrigger,
              binders: all // who bound together
            };

            for( var j = 0; j < all.length; j++ ){
              var _p = all[j]._private;

              _p.listeners = _p.listeners || [];
              _p.listeners.push( listener );
            }
          }
        } // for events array
      } // for events map

      return self; // maintain chaining
    }; // function
  }, // on

  eventAliasesOn: function( proto ){
    var p = proto;

    p.addListener = p.listen = p.bind = p.on;
    p.removeListener = p.unlisten = p.unbind = p.off;
    p.emit = p.trigger;

    // this is just a wrapper alias of .on()
    p.pon = p.promiseOn = function( events, selector ){
      var self = this;
      var args = Array.prototype.slice.call( arguments, 0 );

      return new Promise(function( resolve, reject ){
        var callback = function( e ){
          self.off.apply( self, offArgs );

          resolve( e );
        };

        var onArgs = args.concat([ callback ]);
        var offArgs = onArgs.concat([]);

        self.on.apply( self, onArgs );
      });
    };
  },

  off: function offImpl( params ){
    var defaults = {
    };
    params = util.extend({}, defaults, params);

    return function(events, callback){
      var self = this;
      var selfIsArrayLike = self.length !== undefined;
      var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
      var eventsIsString = is.string(events);

      if( arguments.length === 0 ){ // then unbind all

        for( var i = 0; i < all.length; i++ ){
          all[i]._private.listeners = [];
        }

        return self; // maintain chaining
      }

      if( eventsIsString ){ // then convert to map
        var map = {};
        map[ events ] = callback;
        events = map;
      }

      for( var evts in events ){
        callback = events[evts];

        if( callback === false ){
          callback = define.event.falseCallback;
        }

        evts = evts.split(/\s+/);
        for( var h = 0; h < evts.length; h++ ){
          var evt = evts[h];
          if( is.emptyString(evt) ){ continue; }

          var match = evt.match( define.event.optionalTypeRegex ); // [type][.namespace]
          if( match ){
            var type = match[1] ? match[1] : undefined;
            var namespace = match[2] ? match[2] : undefined;

            for( var i = 0; i < all.length; i++ ){ //
              var listeners = all[i]._private.listeners = all[i]._private.listeners || [];

              for( var j = 0; j < listeners.length; j++ ){
                var listener = listeners[j];
                var nsMatches = !namespace || namespace === listener.namespace;
                var typeMatches = !type || listener.type === type;
                var cbMatches = !callback || callback === listener.callback;
                var listenerMatches = nsMatches && typeMatches && cbMatches;

                // delete listener if it matches
                if( listenerMatches ){
                  listeners.splice(j, 1);
                  j--;
                }
              } // for listeners
            } // for all
          } // if match
        } // for events array

      } // for events map

      return self; // maintain chaining
    }; // function
  }, // off

  trigger: function( params ){
    var defaults = {};
    params = util.extend({}, defaults, params);

    return function triggerImpl(events, extraParams, fnToTrigger){
      var self = this;
      var selfIsArrayLike = self.length !== undefined;
      var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
      var eventsIsString = is.string(events);
      var eventsIsObject = is.plainObject(events);
      var eventsIsEvent = is.event(events);

      if( eventsIsString ){ // then make a plain event object for each event name
        var evts = events.split(/\s+/);
        events = [];

        for( var i = 0; i < evts.length; i++ ){
          var evt = evts[i];
          if( is.emptyString(evt) ){ continue; }

          var match = evt.match( define.event.regex ); // type[.namespace]
          var type = match[1];
          var namespace = match[2] ? match[2] : undefined;

          events.push( {
            type: type,
            namespace: namespace
          } );
        }
      } else if( eventsIsObject ){ // put in length 1 array
        var eventArgObj = events;

        events = [ eventArgObj ];
      }

      if( extraParams ){
        if( !is.array(extraParams) ){ // make sure extra params are in an array if specified
          extraParams = [ extraParams ];
        }
      } else { // otherwise, we've got nothing
        extraParams = [];
      }

      for( var i = 0; i < events.length; i++ ){ // trigger each event in order
        var evtObj = events[i];

        for( var j = 0; j < all.length; j++ ){ // for each
          var triggerer = all[j];
          var listeners = triggerer._private.listeners = triggerer._private.listeners || [];
          var bubbleUp = false;

          // create the event for this element from the event object
          var evt;

          if( eventsIsEvent ){ // then just get the object
            evt = evtObj;

          } else { // then we have to make one
            evt = new Event( evtObj, {
              namespace: evtObj.namespace
            } );
          }

          if( fnToTrigger ){ // then override the listeners list with just the one we specified
            listeners = [{
              namespace: evt.namespace,
              type: evt.type,
              callback: fnToTrigger
            }];
          }

          for( var k = 0; k < listeners.length; k++ ){ // check each listener
            var lis = listeners[k];
            var nsMatches = !lis.namespace || lis.namespace === evt.namespace;
            var typeMatches = lis.type === evt.type;
            var targetMatches = true;
            var listenerMatches = nsMatches && typeMatches && targetMatches;

            if( listenerMatches ){ // then trigger it
              var args = [ evt ];
              args = args.concat( extraParams ); // add extra params to args list

              if( lis.data ){ // add on data plugged into binding
                evt.data = lis.data;
              } else { // or clear it in case the event obj is reused
                evt.data = undefined;
              }

              if( lis.unbindSelfOnTrigger || lis.unbindAllBindersOnTrigger ){ // then remove listener
                listeners.splice(k, 1);
                k--;
              }

              if( lis.unbindAllBindersOnTrigger ){ // then delete the listener for all binders
                var binders = lis.binders;
                for( var l = 0; l < binders.length; l++ ){
                  var binder = binders[l];
                  if( !binder || binder === triggerer ){ continue; } // already handled triggerer or we can't handle it

                  var binderListeners = binder._private.listeners;
                  for( var m = 0; m < binderListeners.length; m++ ){
                    var binderListener = binderListeners[m];

                    if( binderListener === lis ){ // delete listener from list
                      binderListeners.splice(m, 1);
                      m--;
                    }
                  }
                }
              }

              // run the callback
              var context = triggerer;
              var ret = lis.callback.apply( context, args );

              if( ret === false || evt.isPropagationStopped() ){
                // then don't bubble
                bubbleUp = false;

                if( ret === false ){
                  // returning false is a shorthand for stopping propagation and preventing the def. action
                  evt.stopPropagation();
                  evt.preventDefault();
                }
              }
            } // if listener matches
          } // for each listener

          if( bubbleUp ){
            // TODO if bubbling is supported...
          }

        } // for each of all
      } // for each event

      return self; // maintain chaining
    }; // function
  } // trigger

}; // define

module.exports = define;

},{"./event":2,"./is":5,"./promise":6,"./util":8}],2:[function(_dereq_,module,exports){
'use strict';

// https://github.com/jquery/jquery/blob/master/src/event.js

var Event = function( src, props ) {
  // Allow instantiation without the 'new' keyword
  if ( !(this instanceof Event) ) {
    return new Event( src, props );
  }

  // Event object
  if ( src && src.type ) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = ( src.defaultPrevented ) ? returnTrue : returnFalse;

  // Event type
  } else {
    this.type = src;
  }

  // Put explicitly provided properties onto the event object
  if ( props ) {

    // more efficient to manually copy fields we use
    this.type = props.type !== undefined ? props.type : this.type;
    this.namespace = props.namespace;
    this.layout = props.layout;
    this.data = props.data;
    this.message = props.message;
  }

  // Create a timestamp if incoming event doesn't have one
  this.timeStamp = src && src.timeStamp || +new Date();
};

function returnFalse() {
  return false;
}
function returnTrue() {
  return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
Event.prototype = {
  instanceString: function(){ return 'event'; },

  preventDefault: function() {
    this.isDefaultPrevented = returnTrue;

    var e = this.originalEvent;
    if ( !e ) {
      return;
    }

    // if preventDefault exists run it on the original event
    if ( e.preventDefault ) {
      e.preventDefault();
    }
  },

  stopPropagation: function() {
    this.isPropagationStopped = returnTrue;

    var e = this.originalEvent;
    if ( !e ) {
      return;
    }
    // if stopPropagation exists run it on the original event
    if ( e.stopPropagation ) {
      e.stopPropagation();
    }
  },

  stopImmediatePropagation: function() {
    this.isImmediatePropagationStopped = returnTrue;
    this.stopPropagation();
  },

  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse
};


module.exports = Event;

},{}],3:[function(_dereq_,module,exports){
/*! Weaver licensed under MIT (https://tldrlegal.com/license/mit-license), copyright Max Franz */

'use strict';

var is = _dereq_('./is');
var util = _dereq_('./util');
var Thread = _dereq_('./thread');
var Promise = _dereq_('./promise');
var define = _dereq_('./define');

var Fabric = function( N ){
  if( !(this instanceof Fabric) ){
    return new Fabric( N );
  }

  this._private = {
    pass: []
  };

  var defN = 4;

  if( is.number(N) ){
    // then use the specified number of threads
  } if( typeof navigator !== 'undefined' && navigator.hardwareConcurrency != null ){
    N = navigator.hardwareConcurrency;
  } else {
    try{
      N = _dereq_('os').cpus().length;
    } catch( err ){
      N = defN;
    }
  } // TODO could use an estimation here but would the additional expense be worth it?

  for( var i = 0; i < N; i++ ){
    this[i] = new Thread();
  }

  this.length = N;
};

var fabfn = Fabric.prototype; // short alias

util.extend(fabfn, {

  instanceString: function(){ return 'fabric'; },

  // require fn in all threads
  require: function( fn, as ){
    for( var i = 0; i < this.length; i++ ){
      var thread = this[i];

      thread.require( fn, as );
    }

    return this;
  },

  // get a random thread
  random: function(){
    var i = Math.round( (this.length - 1) * Math.random() );
    var thread = this[i];

    return thread;
  },

  // run on random thread
  run: function( fn ){
    var pass = this._private.pass.shift();

    return this.random().pass( pass ).run( fn );
  },

  // sends a random thread a message
  message: function( m ){
    return this.random().message( m );
  },

  // send all threads a message
  broadcast: function( m ){
    for( var i = 0; i < this.length; i++ ){
      var thread = this[i];

      thread.message( m );
    }

    return this; // chaining
  },

  // stop all threads
  stop: function(){
    for( var i = 0; i < this.length; i++ ){
      var thread = this[i];

      thread.stop();
    }

    return this; // chaining
  },

  // pass data to be used with .spread() etc.
  pass: function( data ){
    var pass = this._private.pass;

    if( is.array(data) ){
      pass.push( data );
    } else {
      throw 'Only arrays may be used with fabric.pass()';
    }

    return this; // chaining
  },

  spreadSize: function(){
    var subsize =  Math.ceil( this._private.pass[0].length / this.length );

    subsize = Math.max( 1, subsize ); // don't pass less than one ele to each thread

    return subsize;
  },

  // split the data into slices to spread the data equally among threads
  spread: function( fn ){
    var self = this;
    var _p = self._private;
    var subsize = self.spreadSize(); // number of pass eles to handle in each thread
    var pass = _p.pass.shift().concat([]); // keep a copy
    var runPs = [];

    for( var i = 0; i < this.length; i++ ){
      var thread = this[i];
      var slice = pass.splice( 0, subsize );

      var runP = thread.pass( slice ).run( fn );

      runPs.push( runP );

      var doneEarly = pass.length === 0;
      if( doneEarly ){ break; }
    }

    return Promise.all( runPs ).then(function( thens ){
      var postpass = [];
      var p = 0;

      // fill postpass with the total result joined from all threads
      for( var i = 0; i < thens.length; i++ ){
        var then = thens[i]; // array result from thread i

        for( var j = 0; j < then.length; j++ ){
          var t = then[j]; // array element

          postpass[ p++ ] = t;
        }
      }

      return postpass;
    });
  },

  // parallel version of array.map()
  map: function( fn ){
    var self = this;

    self.require( fn, '_$_$_fabmap' );

    return self.spread(function( split ){
      var mapped = [];
      var origResolve = resolve; // jshint ignore:line

      resolve = function( val ){ // jshint ignore:line
        mapped.push( val );
      };

      for( var i = 0; i < split.length; i++ ){
        var oldLen = mapped.length;
        var ret = _$_$_fabmap( split[i] ); // jshint ignore:line
        var nothingInsdByResolve = oldLen === mapped.length;

        if( nothingInsdByResolve ){
          mapped.push( ret );
        }
      }

      resolve = origResolve; // jshint ignore:line

      return mapped;
    });

  },

  // parallel version of array.filter()
  filter: function( fn ){
    var _p = this._private;
    var pass = _p.pass[0];

    return this.map( fn ).then(function( include ){
      var ret = [];

      for( var i = 0; i < pass.length; i++ ){
        var datum = pass[i];
        var incDatum = include[i];

        if( incDatum ){
          ret.push( datum );
        }
      }

      return ret;
    });
  },

  // sorts the passed array using a divide and conquer strategy
  sort: function( cmp ){
    var self = this;
    var P = this._private.pass[0].length;
    var subsize = this.spreadSize();

    cmp = cmp || function( a, b ){ // default comparison function
      if( a < b ){
        return -1;
      } else if( a > b ){
        return 1;
      }

      return 0;
    };

    self.require( cmp, '_$_$_cmp' );

    return self.spread(function( split ){ // sort each split normally
      var sortedSplit = split.sort( _$_$_cmp ); // jshint ignore:line
      resolve( sortedSplit ); // jshint ignore:line

    }).then(function( joined ){
      // do all the merging in the main thread to minimise data transfer

      // TODO could do merging in separate threads but would incur add'l cost of data transfer
      // for each level of the merge

      var merge = function( i, j, max ){
        // don't overflow array
        j = Math.min( j, P );
        max = Math.min( max, P );

        // left and right sides of merge
        var l = i;
        var r = j;

        var sorted = [];

        for( var k = l; k < max; k++ ){

          var eleI = joined[i];
          var eleJ = joined[j];

          if( i < r && ( j >= max || cmp(eleI, eleJ) <= 0 ) ){
            sorted.push( eleI );
            i++;
          } else {
            sorted.push( eleJ );
            j++;
          }

        }

        // in the array proper, put the sorted values
        for( var k = 0; k < sorted.length; k++ ){ // kth sorted item
          var index = l + k;

          joined[ index ] = sorted[k];
        }
      };

      for( var splitL = subsize; splitL < P; splitL *= 2 ){ // merge until array is "split" as 1

        for( var i = 0; i < P; i += 2*splitL ){
          merge( i, i + splitL, i + 2*splitL );
        }

      }

      return joined;
    });
  }


});

var defineRandomPasser = function( opts ){
  opts = opts || {};

  return function( fn, arg1 ){
    var pass = this._private.pass.shift();

    return this.random().pass( pass )[ opts.threadFn ]( fn, arg1 );
  };
};

util.extend(fabfn, {
  randomMap: defineRandomPasser({ threadFn: 'map' }),

  reduce: defineRandomPasser({ threadFn: 'reduce' }),

  reduceRight: defineRandomPasser({ threadFn: 'reduceRight' })
});

// aliases
var fn = fabfn;
fn.promise = fn.run;
fn.terminate = fn.halt = fn.stop;
fn.include = fn.require;

// pull in event apis
util.extend(fabfn, {
  on: define.on(),
  one: define.on({ unbindSelfOnTrigger: true }),
  off: define.off(),
  trigger: define.trigger()
});

define.eventAliasesOn( fabfn );

module.exports = Fabric;

},{"./define":1,"./is":5,"./promise":6,"./thread":7,"./util":8,"os":undefined}],4:[function(_dereq_,module,exports){
'use strict';

var Thread = _dereq_('./thread');
var Fabric = _dereq_('./fabric');

var weaver = function(){ // jshint ignore:line
  return;
};

weaver.version = '1.2.0';

weaver.thread = weaver.Thread = weaver.worker = weaver.Worker = Thread;
weaver.fabric = weaver.Fabric = Fabric;

module.exports = weaver;

},{"./fabric":3,"./thread":7}],5:[function(_dereq_,module,exports){
// type testing utility functions

'use strict';

var typeofstr = typeof '';
var typeofobj = typeof {};
var typeoffn = typeof function(){};

var instanceStr = function( obj ){
  return obj && obj.instanceString && is.fn( obj.instanceString ) ? obj.instanceString() : null;
};

var is = {
  defined: function(obj){
    return obj != null; // not undefined or null
  },

  string: function(obj){
    return obj != null && typeof obj == typeofstr;
  },

  fn: function(obj){
    return obj != null && typeof obj === typeoffn;
  },

  array: function(obj){
    return Array.isArray ? Array.isArray(obj) : obj != null && obj instanceof Array;
  },

  plainObject: function(obj){
    return obj != null && typeof obj === typeofobj && !is.array(obj) && obj.constructor === Object;
  },

  object: function(obj){
    return obj != null && typeof obj === typeofobj;
  },

  number: function(obj){
    return obj != null && typeof obj === typeof 1 && !isNaN(obj);
  },

  integer: function( obj ){
    return is.number(obj) && Math.floor(obj) === obj;
  },

  bool: function(obj){
    return obj != null && typeof obj === typeof true;
  },

  event: function(obj){
    return instanceStr(obj) === 'event';
  },

  thread: function(obj){
    return instanceStr(obj) === 'thread';
  },

  fabric: function(obj){
    return instanceStr(obj) === 'fabric';
  },

  emptyString: function(obj){
    if( !obj ){ // null is empty
      return true;
    } else if( is.string(obj) ){
      if( obj === '' || obj.match(/^\s+$/) ){
        return true; // empty string is empty
      }
    }

    return false; // otherwise, we don't know what we've got
  },

  nonemptyString: function(obj){
    if( obj && is.string(obj) && obj !== '' && !obj.match(/^\s+$/) ){
      return true;
    }

    return false;
  }
};

module.exports = is;

},{}],6:[function(_dereq_,module,exports){
// internal, minimal Promise impl s.t. apis can return promises in old envs
// based on thenable (http://github.com/rse/thenable)

'use strict';

/*  promise states [Promises/A+ 2.1]  */
var STATE_PENDING   = 0;                                         /*  [Promises/A+ 2.1.1]  */
var STATE_FULFILLED = 1;                                         /*  [Promises/A+ 2.1.2]  */
var STATE_REJECTED  = 2;                                         /*  [Promises/A+ 2.1.3]  */

/*  promise object constructor  */
var api = function (executor) {
  /*  optionally support non-constructor/plain-function call  */
  if (!(this instanceof api))
    return new api(executor);

  /*  initialize object  */
  this.id           = "Thenable/1.0.7";
  this.state        = STATE_PENDING; /*  initial state  */
  this.fulfillValue = undefined;     /*  initial value  */     /*  [Promises/A+ 1.3, 2.1.2.2]  */
  this.rejectReason = undefined;     /*  initial reason */     /*  [Promises/A+ 1.5, 2.1.3.2]  */
  this.onFulfilled  = [];            /*  initial handlers  */
  this.onRejected   = [];            /*  initial handlers  */

  /*  provide optional information-hiding proxy  */
  this.proxy = {
    then: this.then.bind(this)
  };

  /*  support optional executor function  */
  if (typeof executor === "function")
    executor.call(this, this.fulfill.bind(this), this.reject.bind(this));
};

/*  promise API methods  */
api.prototype = {
  /*  promise resolving methods  */
  fulfill: function (value) { return deliver(this, STATE_FULFILLED, "fulfillValue", value); },
  reject:  function (value) { return deliver(this, STATE_REJECTED,  "rejectReason", value); },

  /*  "The then Method" [Promises/A+ 1.1, 1.2, 2.2]  */
  then: function (onFulfilled, onRejected) {
    var curr = this;
    var next = new api();                                    /*  [Promises/A+ 2.2.7]  */
    curr.onFulfilled.push(
      resolver(onFulfilled, next, "fulfill"));             /*  [Promises/A+ 2.2.2/2.2.6]  */
    curr.onRejected.push(
      resolver(onRejected,  next, "reject" ));             /*  [Promises/A+ 2.2.3/2.2.6]  */
    execute(curr);
    return next.proxy;                                       /*  [Promises/A+ 2.2.7, 3.3]  */
  }
};

/*  deliver an action  */
var deliver = function (curr, state, name, value) {
  if (curr.state === STATE_PENDING) {
    curr.state = state;                                      /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
    curr[name] = value;                                      /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
    execute(curr);
  }
  return curr;
};

/*  execute all handlers  */
var execute = function (curr) {
  if (curr.state === STATE_FULFILLED)
    execute_handlers(curr, "onFulfilled", curr.fulfillValue);
  else if (curr.state === STATE_REJECTED)
    execute_handlers(curr, "onRejected",  curr.rejectReason);
};

/*  execute particular set of handlers  */
var execute_handlers = function (curr, name, value) {
  /* global setImmediate: true */
  /* global setTimeout: true */

  /*  short-circuit processing  */
  if (curr[name].length === 0)
    return;

  /*  iterate over all handlers, exactly once  */
  var handlers = curr[name];
  curr[name] = [];                                             /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
  var func = function () {
    for (var i = 0; i < handlers.length; i++)
      handlers[i](value);                                  /*  [Promises/A+ 2.2.5]  */
  };

  /*  execute procedure asynchronously  */                     /*  [Promises/A+ 2.2.4, 3.1]  */
  if (typeof setImmediate === "function")
    setImmediate(func);
  else
    setTimeout(func, 0);
};

/*  generate a resolver function  */
var resolver = function (cb, next, method) {
  return function (value) {
    if (typeof cb !== "function")                            /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
      next[method].call(next, value);                      /*  [Promises/A+ 2.2.7.3, 2.2.7.4]  */
    else {
      var result;
      try { result = cb(value); }                          /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */
      catch (e) {
        next.reject(e);                                  /*  [Promises/A+ 2.2.7.2]  */
        return;
      }
      resolve(next, result);                               /*  [Promises/A+ 2.2.7.1]  */
    }
  };
};

/*  "Promise Resolution Procedure"  */                           /*  [Promises/A+ 2.3]  */
var resolve = function (promise, x) {
  /*  sanity check arguments  */                               /*  [Promises/A+ 2.3.1]  */
  if (promise === x || promise.proxy === x) {
    promise.reject(new TypeError("cannot resolve promise with itself"));
    return;
  }

  /*  surgically check for a "then" method
    (mainly to just call the "getter" of "then" only once)  */
  var then;
  if ((typeof x === "object" && x !== null) || typeof x === "function") {
    try { then = x.then; }                                   /*  [Promises/A+ 2.3.3.1, 3.5]  */
    catch (e) {
      promise.reject(e);                                   /*  [Promises/A+ 2.3.3.2]  */
      return;
    }
  }

  /*  handle own Thenables    [Promises/A+ 2.3.2]
    and similar "thenables" [Promises/A+ 2.3.3]  */
  if (typeof then === "function") {
    var resolved = false;
    try {
      /*  call retrieved "then" method */                  /*  [Promises/A+ 2.3.3.3]  */
      then.call(x,
        /*  resolvePromise  */                           /*  [Promises/A+ 2.3.3.3.1]  */
        function (y) {
          if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
          if (y === x)                                 /*  [Promises/A+ 3.6]  */
            promise.reject(new TypeError("circular thenable chain"));
          else
            resolve(promise, y);
        },

        /*  rejectPromise  */                            /*  [Promises/A+ 2.3.3.3.2]  */
        function (r) {
          if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
          promise.reject(r);
        }
      );
    }
    catch (e) {
      if (!resolved)                                       /*  [Promises/A+ 2.3.3.3.3]  */
        promise.reject(e);                               /*  [Promises/A+ 2.3.3.3.4]  */
    }
    return;
  }

  /*  handle other values  */
  promise.fulfill(x);                                          /*  [Promises/A+ 2.3.4, 2.3.3.4]  */
};

// use native promises where possible
var Promise = typeof Promise === 'undefined' ? api : Promise;

// so we always have Promise.all()
Promise.all = Promise.all || function( ps ){
  return new Promise(function( resolveAll, rejectAll ){
    var vals = new Array( ps.length );
    var doneCount = 0;

    var fulfill = function( i, val ){
      vals[i] = val;
      doneCount++;

      if( doneCount === ps.length ){
        resolveAll( vals );
      }
    };

    for( var i = 0; i < ps.length; i++ ){
      (function( i ){
        var p = ps[i];
        var isPromise = p.then != null;

        if( isPromise ){
          p.then(function( val ){
            fulfill( i, val );
          }, function( err ){
            rejectAll( err );
          });
        } else {
          var val = p;
          fulfill( i, val );
        }
      })( i );
    }

  });
};

module.exports = Promise;

},{}],7:[function(_dereq_,module,exports){
/*! Weaver licensed under MIT (https://tldrlegal.com/license/mit-license), copyright Max Franz */

// cross-env thread/worker
// NB : uses (heavyweight) processes on nodejs so best not to create too many threads

'use strict';

var window = _dereq_('./window');
var util = _dereq_('./util');
var Promise = _dereq_('./promise');
var Event = _dereq_('./event');
var define = _dereq_('./define');
var is = _dereq_('./is');

var Thread = function( opts ){
  if( !(this instanceof Thread) ){
    return new Thread( opts );
  }

  var _p = this._private = {
    requires: [],
    files: [],
    queue: null,
    pass: [],
    disabled: false
  };

  if( is.plainObject(opts) ){
    if( opts.disabled != null ){
      _p.disabled = !!opts.disabled;
    }
  }

};

var thdfn = Thread.prototype; // short alias

var stringifyFieldVal = function( val ){
  var valStr = is.fn( val ) ? val.toString() : "JSON.parse('" + JSON.stringify(val) + "')";

  return valStr;
};

// allows for requires with prototypes and subobjs etc
var fnAsRequire = function( fn ){
  var req;
  var fnName;

  if( is.object(fn) && fn.fn ){ // manual fn
    req = fnAs( fn.fn, fn.name );
    fnName = fn.name;
    fn = fn.fn;
  } else if( is.fn(fn) ){ // auto fn
    req = fn.toString();
    fnName = fn.name;
  } else if( is.string(fn) ){ // stringified fn
    req = fn;
  } else if( is.object(fn) ){ // plain object
    if( fn.proto ){
      req = '';
    } else {
      req = fn.name + ' = {};';
    }

    fnName = fn.name;
    fn = fn.obj;
  }

  req += '\n';

  var protoreq = function( val, subname ){
    if( val.prototype ){
      var protoNonempty = false;
      for( var prop in val.prototype ){ protoNonempty = true; break; } // jshint ignore:line

      if( protoNonempty ){
        req += fnAsRequire( {
          name: subname,
          obj: val,
          proto: true
        }, val );
      }
    }
  };

  // pull in prototype
  if( fn.prototype && fnName != null ){

    for( var name in fn.prototype ){
      var protoStr = '';

      var val = fn.prototype[ name ];
      var valStr = stringifyFieldVal( val );
      var subname = fnName + '.prototype.' + name;

      protoStr += subname + ' = ' + valStr + ';\n';

      if( protoStr ){
        req += protoStr;
      }

      protoreq( val, subname ); // subobject with prototype
    }

  }

  // pull in properties for obj/fns
  if( !is.string(fn) ){ for( var name in fn ){
    var propsStr = '';

    if( fn.hasOwnProperty(name) ){
      var val = fn[ name ];
      var valStr = stringifyFieldVal( val );
      var subname = fnName + '["' + name + '"]';

      propsStr += subname + ' = ' + valStr + ';\n';
    }

    if( propsStr ){
      req += propsStr;
    }

    protoreq( val, subname ); // subobject with prototype
  } }

  return req;
};

var isPathStr = function( str ){
  return is.string(str) && str.match(/\.js$/);
};

util.extend(thdfn, {

  instanceString: function(){ return 'thread'; },

  require: function( fn, as ){
    var requires = this._private.requires;

    if( isPathStr(fn) ){
      this._private.files.push( fn );

      return this;
    }

    if( as ){
      if( is.fn(fn) ){
        fn = { name: as, fn: fn };
      } else {
        fn = { name: as, obj: fn };
      }
    } else {
      if( is.fn(fn) ){
        if( !fn.name ){
          throw 'The function name could not be automatically determined.  Use thread.require( someFunction, "someFunction" )';
        }

        fn = { name: fn.name, fn: fn };
      }
    }

    requires.push( fn );

    return this; // chaining
  },

  pass: function( data ){
    this._private.pass.push( data );

    return this; // chaining
  },

  run: function( fn, pass ){ // fn used like main()
    var self = this;
    var _p = this._private;
    pass = pass || _p.pass.shift();

    if( _p.stopped ){
      throw 'Attempted to run a stopped thread!  Start a new thread or do not stop the existing thread and reuse it.';
    }

    if( _p.running ){
      return ( _p.queue = _p.queue.then(function(){ // inductive step
        return self.run( fn, pass );
      }) );
    }

    var useWW = window != null && !_p.disabled;
    var useNode = !window && typeof module !== 'undefined' && !_p.disabled;

    self.trigger('run');

    var runP = new Promise(function( resolve, reject ){

      _p.running = true;

      var threadTechAlreadyExists = _p.ran;

      var fnImplStr = is.string( fn ) ? fn : fn.toString();

      // worker code to exec
      var fnStr = '\n' + ( _p.requires.map(function( r ){
        return fnAsRequire( r );
      }) ).concat( _p.files.map(function( f ){
        if( useWW ){
          var wwifyFile = function( file ){
            if( file.match(/^\.\//) || file.match(/^\.\./) ){
              return window.location.origin + window.location.pathname + file;
            } else if( file.match(/^\//) ){
              return window.location.origin + '/' + file;
            }
            return file;
          };

          return 'importScripts("' + wwifyFile(f) + '");';
        } else if( useNode ) {
          return 'eval( require("fs").readFileSync("' + f + '", { encoding: "utf8" }) );';
        } else {
          throw 'External file `' + f + '` can not be required without any threading technology.';
        }
      }) ).concat([
        '( function(){',
          'var ret = (' + fnImplStr + ')(' + JSON.stringify(pass) + ');',
          'if( ret !== undefined ){ resolve(ret); }', // assume if ran fn returns defined value (incl. null), that we want to resolve to it
        '} )()\n'
      ]).join('\n');

      // because we've now consumed the requires, empty the list so we don't dupe on next run()
      _p.requires = [];
      _p.files = [];

      if( useWW ){
        var fnBlob, fnUrl;

        // add normalised thread api functions
        if( !threadTechAlreadyExists ){
          var fnPre = fnStr + '';

          fnStr = [
            'function _ref_(o){ return eval(o); };',
            'function broadcast(m){ return message(m); };', // alias
            'function message(m){ postMessage(m); };',
            'function listen(fn){',
            '  self.addEventListener("message", function(m){ ',
            '    if( typeof m === "object" && (m.data.$$eval || m.data === "$$start") ){',
            '    } else { ',
            '      fn( m.data );',
            '    }',
            '  });',
            '};',
            'self.addEventListener("message", function(m){  if( m.data.$$eval ){ eval( m.data.$$eval ); }  });',
            'function resolve(v){ postMessage({ $$resolve: v }); };',
            'function reject(v){ postMessage({ $$reject: v }); };'
          ].join('\n');

          fnStr += fnPre;

          fnBlob = new Blob([ fnStr ], {
            type: 'application/javascript'
          });
          fnUrl = window.URL.createObjectURL( fnBlob );
        }
        // create webworker and let it exec the serialised code
        var ww = _p.webworker = _p.webworker || new Worker( fnUrl );

        if( threadTechAlreadyExists ){ // then just exec new run() code
          ww.postMessage({
            $$eval: fnStr
          });
        }

        // worker messages => events
        var cb;
        ww.addEventListener('message', cb = function( m ){
          var isObject = is.object(m) && is.object( m.data );

          if( isObject && ('$$resolve' in m.data) ){
            ww.removeEventListener('message', cb); // done listening b/c resolve()

            resolve( m.data.$$resolve );
          } else if( isObject && ('$$reject' in m.data) ){
            ww.removeEventListener('message', cb); // done listening b/c reject()

            reject( m.data.$$reject );
          } else {
            self.trigger( new Event(m, { type: 'message', message: m.data }) );
          }
        }, false);

        if( !threadTechAlreadyExists ){
          ww.postMessage('$$start'); // start up the worker
        }

      } else if( useNode ){
        // create a new process

        if( !_p.child ){
          _p.child = ( _dereq_('child_process').fork( _dereq_('path').join(__dirname, 'thread-node-fork') ) );
        }

        var child = _p.child;

        // child process messages => events
        var cb;
        child.on('message', cb = function( m ){
          if( is.object(m) && ('$$resolve' in m) ){
            child.removeListener('message', cb); // done listening b/c resolve()

            resolve( m.$$resolve );
          } else if( is.object(m) && ('$$reject' in m) ){
            child.removeListener('message', cb); // done listening b/c reject()

            reject( m.$$reject );
          } else {
            self.trigger( new Event({}, { type: 'message', message: m }) );
          }
        });

        // ask the child process to eval the worker code
        child.send({
          $$eval: fnStr
        });

      } else { // use a fallback mechanism using a timeout

        var promiseResolve = resolve;
        var promiseReject = reject;

        var timer = _p.timer = _p.timer || {

          listeners: [],

          exec: function(){
            // as a string so it can't be mangled by minifiers and processors
            fnStr = [
              'function _ref_(o){ return eval(o); };',
              'function broadcast(m){ return message(m); };',
              'function message(m){ self.trigger( new Event({}, { type: "message", message: m }) ); };',
              'function listen(fn){ timer.listeners.push( fn ); };',
              'function resolve(v){ promiseResolve(v); };',
              'function reject(v){ promiseReject(v); };'
            ].join('\n') + fnStr;

            // the .run() code
            eval( fnStr ); // jshint ignore:line
          },

          message: function( m ){
            var ls = timer.listeners;

            for( var i = 0; i < ls.length; i++ ){
              var fn = ls[i];

              fn( m );
            }
          }

        };

        timer.exec();
      }

    }).then(function( v ){
      _p.running = false;
      _p.ran = true;

      self.trigger('ran');

      return v;
    });

    if( _p.queue == null ){
      _p.queue = runP; // i.e. first step of inductive promise chain (for queue)
    }

    return runP;
  },

  // send the thread a message
  message: function( m ){
    var _p = this._private;

    if( _p.webworker ){
      _p.webworker.postMessage( m );
    }

    if( _p.child ){
      _p.child.send( m );
    }

    if( _p.timer ){
      _p.timer.message( m );
    }

    return this; // chaining
  },

  stop: function(){
    var _p = this._private;

    if( _p.webworker ){
      _p.webworker.terminate();
    }

    if( _p.child ){
      _p.child.kill();
    }

    if( _p.timer ){
      // nothing we can do if we've run a timeout
    }

    _p.stopped = true;

    return this.trigger('stop'); // chaining
  },

  stopped: function(){
    return this._private.stopped;
  }

});

// turns a stringified function into a (re)named function
var fnAs = function( fn, name ){
  var fnStr = fn.toString();
  fnStr = fnStr.replace(/function\s*?\S*?\s*?\(/, 'function ' + name + '(');

  return fnStr;
};

var defineFnal = function( opts ){
  opts = opts || {};

  return function fnalImpl( fn, arg1 ){
    var fnStr = fnAs( fn, '_$_$_' + opts.name );

    this.require( fnStr );

    return this.run( [
      'function( data ){',
      '  var origResolve = resolve;',
      '  var res = [];',
      '  ',
      '  resolve = function( val ){',
      '    res.push( val );',
      '  };',
      '  ',
      '  var ret = data.' + opts.name + '( _$_$_' + opts.name + ( arguments.length > 1 ? ', ' + JSON.stringify(arg1) : '' ) + ' );',
      '  ',
      '  resolve = origResolve;',
      '  resolve( res.length > 0 ? res : ret );',
      '}'
    ].join('\n') );
  };
};

util.extend(thdfn, {
  reduce: defineFnal({ name: 'reduce' }),

  reduceRight: defineFnal({ name: 'reduceRight' }),

  map: defineFnal({ name: 'map' })
});

// aliases
var fn = thdfn;
fn.promise = fn.run;
fn.terminate = fn.halt = fn.stop;
fn.include = fn.require;

// pull in event apis
util.extend(thdfn, {
  on: define.on(),
  one: define.on({ unbindSelfOnTrigger: true }),
  off: define.off(),
  trigger: define.trigger()
});

define.eventAliasesOn( thdfn );

module.exports = Thread;

},{"./define":1,"./event":2,"./is":5,"./promise":6,"./util":8,"./window":9,"child_process":undefined,"path":undefined}],8:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('./is');
var util;

// utility functions only for internal use
util = {

  // the jquery extend() function
  // NB: modified to use is etc since we can't use jquery functions
  extend: function() {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if ( typeof target === 'boolean' ) {
      deep = target;
      target = arguments[1] || {};
      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== 'object' && !is.fn(target) ) {
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
          if ( deep && copy && ( is.plainObject(copy) || (copyIsArray = is.array(copy)) ) ) {
            if ( copyIsArray ) {
              copyIsArray = false;
              clone = src && is.array(src) ? src : [];

            } else {
              clone = src && is.plainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[ name ] = util.extend( deep, clone, copy );

          // Don't bring in undefined values
          } else if ( copy !== undefined ) {
            target[ name ] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  },

  error: function( msg ){
    if( console ){
      if( console.error ){
        console.error.apply( console, arguments );
      } else if( console.log ){
        console.log.apply( console, arguments );
      } else {
        throw msg;
      }
    } else {
      throw msg;
    }
  }
};

module.exports = util;

},{"./is":5}],9:[function(_dereq_,module,exports){
module.exports = ( typeof window === 'undefined' ? null : window );

},{}]},{},[4])(4)
});



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/node_modules/weaverjs/dist")

},{}],2:[function(_dereq_,module,exports){
window.foograph = {
  /**
   * Insert a vertex into this graph.
   *
   * @param vertex A valid Vertex instance
   */
  insertVertex: function(vertex) {
      this.vertices.push(vertex);
      this.vertexCount++;
    },

  /**
   * Insert an edge vertex1 --> vertex2.
   *
   * @param label Label for this edge
   * @param weight Weight of this edge
   * @param vertex1 Starting Vertex instance
   * @param vertex2 Ending Vertex instance
   * @return Newly created Edge instance
   */
  insertEdge: function(label, weight, vertex1, vertex2, style) {
      var e1 = new foograph.Edge(label, weight, vertex2, style);
      var e2 = new foograph.Edge(null, weight, vertex1, null);

      vertex1.edges.push(e1);
      vertex2.reverseEdges.push(e2);

      return e1;
    },

  /**
   * Delete edge.
   *
   * @param vertex Starting vertex
   * @param edge Edge to remove
   */
  removeEdge: function(vertex1, vertex2) {
      for (var i = vertex1.edges.length - 1; i >= 0; i--) {
        if (vertex1.edges[i].endVertex == vertex2) {
          vertex1.edges.splice(i,1);
          break;
        }
      }

      for (var i = vertex2.reverseEdges.length - 1; i >= 0; i--) {
        if (vertex2.reverseEdges[i].endVertex == vertex1) {
          vertex2.reverseEdges.splice(i,1);
          break;
        }
      }
    },

  /**
   * Delete vertex.
   *
   * @param vertex Vertex to remove from the graph
   */
  removeVertex: function(vertex) {
      for (var i = vertex.edges.length - 1; i >= 0; i-- ) {
        this.removeEdge(vertex, vertex.edges[i].endVertex);
      }

      for (var i = vertex.reverseEdges.length - 1; i >= 0; i-- ) {
        this.removeEdge(vertex.reverseEdges[i].endVertex, vertex);
      }

      for (var i = this.vertices.length - 1; i >= 0; i-- ) {
        if (this.vertices[i] == vertex) {
          this.vertices.splice(i,1);
          break;
        }
      }

      this.vertexCount--;
    },

  /**
   * Plots this graph to a canvas.
   *
   * @param canvas A proper canvas instance
   */
  plot: function(canvas) {
      var i = 0;
      /* Draw edges first */
      for (i = 0; i < this.vertices.length; i++) {
        var v = this.vertices[i];
        if (!v.hidden) {
          for (var j = 0; j < v.edges.length; j++) {
            var e = v.edges[j];
            /* Draw edge (if not hidden) */
            if (!e.hidden)
              e.draw(canvas, v);
          }
        }
      }

      /* Draw the vertices. */
      for (i = 0; i < this.vertices.length; i++) {
        v = this.vertices[i];

        /* Draw vertex (if not hidden) */
        if (!v.hidden)
          v.draw(canvas);
      }
    },

  /**
   * Graph object constructor.
   *
   * @param label Label of this graph
   * @param directed true or false
   */
  Graph: function (label, directed) {
      /* Fields. */
      this.label = label;
      this.vertices = new Array();
      this.directed = directed;
      this.vertexCount = 0;

      /* Graph methods. */
      this.insertVertex = foograph.insertVertex;
      this.removeVertex = foograph.removeVertex;
      this.insertEdge = foograph.insertEdge;
      this.removeEdge = foograph.removeEdge;
      this.plot = foograph.plot;
    },

  /**
   * Vertex object constructor.
   *
   * @param label Label of this vertex
   * @param next Reference to the next vertex of this graph
   * @param firstEdge First edge of a linked list of edges
   */
  Vertex: function(label, x, y, style) {
      this.label = label;
      this.edges = new Array();
      this.reverseEdges = new Array();
      this.x = x;
      this.y = y;
      this.dx = 0;
      this.dy = 0;
      this.level = -1;
      this.numberOfParents = 0;
      this.hidden = false;
      this.fixed = false;     // Fixed vertices are static (unmovable)

      if(style != null) {
          this.style = style;
      }
      else { // Default
          this.style = new foograph.VertexStyle('ellipse', 80, 40, '#ffffff', '#000000', true);
      }
    },


   /**
   * VertexStyle object type for defining vertex style options.
   *
   * @param shape Shape of the vertex ('ellipse' or 'rect')
   * @param width Width in px
   * @param height Height in px
   * @param fillColor The color with which the vertex is drawn (RGB HEX string)
   * @param borderColor The color with which the border of the vertex is drawn (RGB HEX string)
   * @param showLabel Show the vertex label or not
   */
  VertexStyle: function(shape, width, height, fillColor, borderColor, showLabel) {
      this.shape = shape;
      this.width = width;
      this.height = height;
      this.fillColor = fillColor;
      this.borderColor = borderColor;
      this.showLabel = showLabel;
    },

  /**
   * Edge object constructor.
   *
   * @param label Label of this edge
   * @param next Next edge reference
   * @param weight Edge weight
   * @param endVertex Destination Vertex instance
   */
  Edge: function (label, weight, endVertex, style) {
      this.label = label;
      this.weight = weight;
      this.endVertex = endVertex;
      this.style = null;
      this.hidden = false;

      // Curving information
      this.curved = false;
      this.controlX = -1;   // Control coordinates for Bezier curve drawing
      this.controlY = -1;
      this.original = null; // If this is a temporary edge it holds the original edge

      if(style != null) {
        this.style = style;
      }
      else {  // Set to default
        this.style = new foograph.EdgeStyle(2, '#000000', true, false);
      }
    },



  /**
   * EdgeStyle object type for defining vertex style options.
   *
   * @param width Edge line width
   * @param color The color with which the edge is drawn
   * @param showArrow Draw the edge arrow (only if directed)
   * @param showLabel Show the edge label or not
   */
  EdgeStyle: function(width, color, showArrow, showLabel) {
      this.width = width;
      this.color = color;
      this.showArrow = showArrow;
      this.showLabel = showLabel;
    },

  /**
   * This file is part of foograph Javascript graph library.
   *
   * Description: Random vertex layout manager
   */

  /**
   * Class constructor.
   *
   * @param width Layout width
   * @param height Layout height
   */
  RandomVertexLayout: function (width, height) {
      this.width = width;
      this.height = height;
    },


  /**
   * This file is part of foograph Javascript graph library.
   *
   * Description: Fruchterman-Reingold force-directed vertex
   *              layout manager
   */

  /**
   * Class constructor.
   *
   * @param width Layout width
   * @param height Layout height
   * @param iterations Number of iterations -
   * with more iterations it is more likely the layout has converged into a static equilibrium.
   */
  ForceDirectedVertexLayout: function (width, height, iterations, randomize, eps) {
      this.width = width;
      this.height = height;
      this.iterations = iterations;
      this.randomize = randomize;
      this.eps = eps;
      this.callback = function() {};
    },

  A: 1.5, // Fine tune attraction

  R: 0.5  // Fine tune repulsion
};

/**
 * toString overload for easier debugging
 */
foograph.Vertex.prototype.toString = function() {
  return "[v:" + this.label + "] ";
};

/**
 * toString overload for easier debugging
 */
foograph.Edge.prototype.toString = function() {
  return "[e:" + this.endVertex.label + "] ";
};

/**
 * Draw vertex method.
 *
 * @param canvas jsGraphics instance
 */
foograph.Vertex.prototype.draw = function(canvas) {
  var x = this.x;
  var y = this.y;
  var width = this.style.width;
  var height = this.style.height;
  var shape = this.style.shape;

  canvas.setStroke(2);
  canvas.setColor(this.style.fillColor);

  if(shape == 'rect') {
    canvas.fillRect(x, y, width, height);
    canvas.setColor(this.style.borderColor);
    canvas.drawRect(x, y, width, height);
  }
  else { // Default to ellipse
    canvas.fillEllipse(x, y, width, height);
    canvas.setColor(this.style.borderColor);
    canvas.drawEllipse(x, y, width, height);
  }

  if(this.style.showLabel) {
    canvas.drawStringRect(this.label, x, y + height/2 - 7, width, 'center');
  }
};

/**
 * Fits the graph into the bounding box
 *
 * @param width
 * @param height
 * @param preserveAspect
 */
foograph.Graph.prototype.normalize = function(width, height, preserveAspect) {
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.oldX = v.x;
    v.oldY = v.y;
  }
  var mnx = width  * 0.1;
  var mxx = width  * 0.9;
  var mny = height * 0.1;
  var mxy = height * 0.9;
  if (preserveAspect == null)
    preserveAspect = true;

  var minx = Number.MAX_VALUE;
  var miny = Number.MAX_VALUE;
  var maxx = Number.MIN_VALUE;
  var maxy = Number.MIN_VALUE;

  for (var i7 in this.vertices) {
    var v = this.vertices[i7];
    if (v.x < minx) minx = v.x;
    if (v.y < miny) miny = v.y;
    if (v.x > maxx) maxx = v.x;
    if (v.y > maxy) maxy = v.y;
  }
  var kx = (mxx-mnx) / (maxx - minx);
  var ky = (mxy-mny) / (maxy - miny);

  if (preserveAspect) {
    kx = Math.min(kx, ky);
    ky = Math.min(kx, ky);
  }

  var newMaxx = Number.MIN_VALUE;
  var newMaxy = Number.MIN_VALUE;
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.x = (v.x - minx) * kx;
    v.y = (v.y - miny) * ky;
    if (v.x > newMaxx) newMaxx = v.x;
    if (v.y > newMaxy) newMaxy = v.y;
  }

  var dx = ( width  - newMaxx ) / 2.0;
  var dy = ( height - newMaxy ) / 2.0;
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.x += dx;
    v.y += dy;
  }
};

/**
 * Draw edge method. Draws edge "v" --> "this".
 *
 * @param canvas jsGraphics instance
 * @param v Start vertex
 */
foograph.Edge.prototype.draw = function(canvas, v) {
  var x1 = Math.round(v.x + v.style.width/2);
  var y1 = Math.round(v.y + v.style.height/2);
  var x2 = Math.round(this.endVertex.x + this.endVertex.style.width/2);
  var y2 = Math.round(this.endVertex.y + this.endVertex.style.height/2);

  // Control point (needed only for curved edges)
  var x3 = this.controlX;
  var y3 = this.controlY;

  // Arrow tip and angle
  var X_TIP, Y_TIP, ANGLE;

  /* Quadric Bezier curve definition. */
  function Bx(t) { return (1-t)*(1-t)*x1 + 2*(1-t)*t*x3 + t*t*x2; }
  function By(t) { return (1-t)*(1-t)*y1 + 2*(1-t)*t*y3 + t*t*y2; }

  canvas.setStroke(this.style.width);
  canvas.setColor(this.style.color);

  if(this.curved) { // Draw a quadric Bezier curve
    this.curved = false; // Reset
    var t = 0, dt = 1/10;
    var xs = x1, ys = y1, xn, yn;

    while (t < 1-dt) {
      t += dt;
      xn = Bx(t);
      yn = By(t);
      canvas.drawLine(xs, ys, xn, yn);
      xs = xn;
      ys = yn;
    }

    // Set the arrow tip coordinates
    X_TIP = xs;
    Y_TIP = ys;

    // Move the tip to (0,0) and calculate the angle
    // of the arrow head
    ANGLE = angularCoord(Bx(1-2*dt) - X_TIP, By(1-2*dt) - Y_TIP);

  } else {
    canvas.drawLine(x1, y1, x2, y2);

    // Set the arrow tip coordinates
    X_TIP = x2;
    Y_TIP = y2;

    // Move the tip to (0,0) and calculate the angle
    // of the arrow head
    ANGLE = angularCoord(x1 - X_TIP, y1 - Y_TIP);
  }

  if(this.style.showArrow) {
    drawArrow(ANGLE, X_TIP, Y_TIP);
  }

  // TODO
  if(this.style.showLabel) {
  }

  /**
   * Draws an edge arrow.
   * @param phi The angle (in radians) of the arrow in polar coordinates.
   * @param x X coordinate of the arrow tip.
   * @param y Y coordinate of the arrow tip.
   */
  function drawArrow(phi, x, y)
  {
    // Arrow bounding box (in px)
    var H = 50;
    var W = 10;

    // Set cartesian coordinates of the arrow
    var p11 = 0, p12 = 0;
    var p21 = H, p22 = W/2;
    var p31 = H, p32 = -W/2;

    // Convert to polar coordinates
    var r2 = radialCoord(p21, p22);
    var r3 = radialCoord(p31, p32);
    var phi2 = angularCoord(p21, p22);
    var phi3 = angularCoord(p31, p32);

    // Rotate the arrow
    phi2 += phi;
    phi3 += phi;

    // Update cartesian coordinates
    p21 = r2 * Math.cos(phi2);
    p22 = r2 * Math.sin(phi2);
    p31 = r3 * Math.cos(phi3);
    p32 = r3 * Math.sin(phi3);

    // Translate
    p11 += x;
    p12 += y;
    p21 += x;
    p22 += y;
    p31 += x;
    p32 += y;

    // Draw
    canvas.fillPolygon(new Array(p11, p21, p31), new Array(p12, p22, p32));
  }

  /**
   * Get the angular coordinate.
   * @param x X coordinate
   * @param y Y coordinate
   */
   function angularCoord(x, y)
   {
     var phi = 0.0;

     if (x > 0 && y >= 0) {
      phi = Math.atan(y/x);
     }
     if (x > 0 && y < 0) {
       phi = Math.atan(y/x) + 2*Math.PI;
     }
     if (x < 0) {
       phi = Math.atan(y/x) + Math.PI;
     }
     if (x = 0 && y > 0) {
       phi = Math.PI/2;
     }
     if (x = 0 && y < 0) {
       phi = 3*Math.PI/2;
     }

     return phi;
   }

   /**
    * Get the radian coordiante.
    * @param x1
    * @param y1
    * @param x2
    * @param y2
    */
   function radialCoord(x, y)
   {
     return Math.sqrt(x*x + y*y);
   }
};

/**
 * Calculates the coordinates based on pure chance.
 *
 * @param graph A valid graph instance
 */
foograph.RandomVertexLayout.prototype.layout = function(graph) {
  for (var i = 0; i<graph.vertices.length; i++) {
    var v = graph.vertices[i];
    v.x = Math.round(Math.random() * this.width);
    v.y = Math.round(Math.random() * this.height);
  }
};

/**
 * Identifies connected components of a graph and creates "central"
 * vertices for each component. If there is more than one component,
 * all central vertices of individual components are connected to
 * each other to prevent component drift.
 *
 * @param graph A valid graph instance
 * @return A list of component center vertices or null when there
 *         is only one component.
 */
foograph.ForceDirectedVertexLayout.prototype.__identifyComponents = function(graph) {
  var componentCenters = new Array();
  var components = new Array();

  // Depth first search
  function dfs(vertex)
  {
    var stack = new Array();
    var component = new Array();
    var centerVertex = new foograph.Vertex("component_center", -1, -1);
    centerVertex.hidden = true;
    componentCenters.push(centerVertex);
    components.push(component);

    function visitVertex(v)
    {
      component.push(v);
      v.__dfsVisited = true;

      for (var i in v.edges) {
        var e = v.edges[i];
        if (!e.hidden)
          stack.push(e.endVertex);
      }

      for (var i in v.reverseEdges) {
        if (!v.reverseEdges[i].hidden)
          stack.push(v.reverseEdges[i].endVertex);
      }
    }

    visitVertex(vertex);
    while (stack.length > 0) {
      var u = stack.pop();

      if (!u.__dfsVisited && !u.hidden) {
        visitVertex(u);
      }
    }
  }

  // Clear DFS visited flag
  for (var i in graph.vertices) {
    var v = graph.vertices[i];
    v.__dfsVisited = false;
  }

  // Iterate through all vertices starting DFS from each vertex
  // that hasn't been visited yet.
  for (var k in graph.vertices) {
    var v = graph.vertices[k];
    if (!v.__dfsVisited && !v.hidden)
      dfs(v);
  }

  // Interconnect all center vertices
  if (componentCenters.length > 1) {
    for (var i in componentCenters) {
      graph.insertVertex(componentCenters[i]);
    }
    for (var i in components) {
      for (var j in components[i]) {
        // Connect visited vertex to "central" component vertex
        edge = graph.insertEdge("", 1, components[i][j], componentCenters[i]);
        edge.hidden = true;
      }
    }

    for (var i in componentCenters) {
      for (var j in componentCenters) {
        if (i != j) {
          e = graph.insertEdge("", 3, componentCenters[i], componentCenters[j]);
          e.hidden = true;
        }
      }
    }

    return componentCenters;
  }

  return null;
};

/**
 * Calculates the coordinates based on force-directed placement
 * algorithm.
 *
 * @param graph A valid graph instance
 */
foograph.ForceDirectedVertexLayout.prototype.layout = function(graph) {
  this.graph = graph;
  var area = this.width * this.height;
  var k = Math.sqrt(area / graph.vertexCount);

  var t = this.width / 10; // Temperature.
  var dt = t / (this.iterations + 1);

  var eps = this.eps; // Minimum distance between the vertices

  // Attractive and repulsive forces
  function Fa(z) { return foograph.A*z*z/k; }
  function Fr(z) { return foograph.R*k*k/z; }
  function Fw(z) { return 1/z*z; }  // Force emited by the walls

  // Initiate component identification and virtual vertex creation
  // to prevent disconnected graph components from drifting too far apart
  centers = this.__identifyComponents(graph);

  // Assign initial random positions
  if(this.randomize) {
    randomLayout = new foograph.RandomVertexLayout(this.width, this.height);
    randomLayout.layout(graph);
  }

  // Run through some iterations
  for (var q = 0; q < this.iterations; q++) {

    /* Calculate repulsive forces. */
    for (var i1 in graph.vertices) {
      var v = graph.vertices[i1];

      v.dx = 0;
      v.dy = 0;
      // Do not move fixed vertices
      if(!v.fixed) {
        for (var i2 in graph.vertices) {
          var u = graph.vertices[i2];
          if (v != u && !u.fixed) {
            /* Difference vector between the two vertices. */
            var difx = v.x - u.x;
            var dify = v.y - u.y;

            /* Length of the dif vector. */
            var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
            var force = Fr(d);
            v.dx = v.dx + (difx/d) * force;
            v.dy = v.dy + (dify/d) * force;
          }
        }
        /* Treat the walls as static objects emiting force Fw. */
        // Calculate the sum of "wall" forces in (v.x, v.y)
        /*
        var x = Math.max(eps, v.x);
        var y = Math.max(eps, v.y);
        var wx = Math.max(eps, this.width - v.x);
        var wy = Math.max(eps, this.height - v.y);   // Gotta love all those NaN's :)
        var Rx = Fw(x) - Fw(wx);
        var Ry = Fw(y) - Fw(wy);

        v.dx = v.dx + Rx;
        v.dy = v.dy + Ry;
        */
      }
    }

    /* Calculate attractive forces. */
    for (var i3 in graph.vertices) {
      var v = graph.vertices[i3];

      // Do not move fixed vertices
      if(!v.fixed) {
        for (var i4 in v.edges) {
          var e = v.edges[i4];
          var u = e.endVertex;
          var difx = v.x - u.x;
          var dify = v.y - u.y;
          var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
          var force = Fa(d);

          /* Length of the dif vector. */
          var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
          v.dx = v.dx - (difx/d) * force;
          v.dy = v.dy - (dify/d) * force;

          u.dx = u.dx + (difx/d) * force;
          u.dy = u.dy + (dify/d) * force;
        }
      }
    }

    /* Limit the maximum displacement to the temperature t
        and prevent from being displaced outside frame.     */
    for (var i5 in graph.vertices) {
      var v = graph.vertices[i5];
      if(!v.fixed) {
        /* Length of the displacement vector. */
        var d = Math.max(eps, Math.sqrt(v.dx*v.dx + v.dy*v.dy));

        /* Limit to the temperature t. */
        v.x = v.x + (v.dx/d) * Math.min(d, t);
        v.y = v.y + (v.dy/d) * Math.min(d, t);

        /* Stay inside the frame. */
        /*
        borderWidth = this.width / 50;
        if (v.x < borderWidth) {
          v.x = borderWidth;
        } else if (v.x > this.width - borderWidth) {
          v.x = this.width - borderWidth;
        }

        if (v.y < borderWidth) {
          v.y = borderWidth;
        } else if (v.y > this.height - borderWidth) {
          v.y = this.height - borderWidth;
        }
        */
        v.x = Math.round(v.x);
        v.y = Math.round(v.y);
      }
    }

    /* Cool. */
    t -= dt;

    if (q % 10 == 0) {
      this.callback();
    }
  }

  // Remove virtual center vertices
  if (centers) {
    for (var i in centers) {
      graph.removeVertex(centers[i]);
    }
  }

  graph.normalize(this.width, this.height, true);
};

module.exports = foograph;

},{}],3:[function(_dereq_,module,exports){
'use strict';

// registers the extension on a cytoscape lib ref
var getLayout = _dereq_('./layout');

var register = function( cytoscape, weaver ){
  var layout = getLayout( cytoscape, weaver || _dereq_('weaverjs') );

  cytoscape('layout', 'spread', layout);
};

if( typeof cytoscape !== 'undefined' && ( typeof weaver !== 'undefined' || typeof cytoscape.Thread !== 'undefined' ) ){ // expose to global cytoscape (i.e. window.cytoscape)
  register( cytoscape, weaver || cytoscape );
}

module.exports = register;

},{"./layout":4,"weaverjs":1}],4:[function(_dereq_,module,exports){
var Thread;

var foograph = _dereq_('./foograph');
var Voronoi = _dereq_('./rhill-voronoi-core');

/*
 * This layout combines several algorithms:
 *
 * - It generates an initial position of the nodes by using the
 *   Fruchterman-Reingold algorithm (doi:10.1002/spe.4380211102)
 *
 * - Finally it eliminates overlaps by using the method described by
 *   Gansner and North (doi:10.1007/3-540-37623-2_28)
 */

var defaults = {
  animate: true, // whether to show the layout as it's running
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  fit: true, // Reset viewport to fit default simulationBounds
  minDist: 20, // Minimum distance between nodes
  padding: 20, // Padding
  expandingFactor: -1.0, // If the network does not satisfy the minDist
  // criterium then it expands the network of this amount
  // If it is set to -1.0 the amount of expansion is automatically
  // calculated based on the minDist, the aspect ratio and the
  // number of nodes
  maxFruchtermanReingoldIterations: 50, // Maximum number of initial force-directed iterations
  maxExpandIterations: 4, // Maximum number of expanding iterations
  boundingBox: undefined, // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  randomize: false // uses random initial node positions on true
};

function SpreadLayout( options ) {
  var opts = this.options = {};
  for( var i in defaults ){ opts[i] = defaults[i]; }
  for( var i in options ){ opts[i] = options[i]; }
}

SpreadLayout.prototype.run = function() {

  var layout = this;
  var options = this.options;
  var cy = options.cy;

  var bb = options.boundingBox || { x1: 0, y1: 0, w: cy.width(), h: cy.height() };
  if( bb.x2 === undefined ){ bb.x2 = bb.x1 + bb.w; }
  if( bb.w === undefined ){ bb.w = bb.x2 - bb.x1; }
  if( bb.y2 === undefined ){ bb.y2 = bb.y1 + bb.h; }
  if( bb.h === undefined ){ bb.h = bb.y2 - bb.y1; }

  var nodes = cy.nodes();
  var edges = cy.edges();
  var cWidth = cy.width();
  var cHeight = cy.height();
  var simulationBounds = bb;
  var padding = options.padding;
  var simBBFactor = Math.max( 1, Math.log(nodes.length) * 0.8 );

  if( nodes.length < 100 ){
    simBBFactor /= 2;
  }

  layout.trigger( {
    type: 'layoutstart',
    layout: layout
  } );

  var simBB = {
    x1: 0,
    y1: 0,
    x2: cWidth * simBBFactor,
    y2: cHeight * simBBFactor
  };

  if( simulationBounds ) {
    simBB.x1 = simulationBounds.x1;
    simBB.y1 = simulationBounds.y1;
    simBB.x2 = simulationBounds.x2;
    simBB.y2 = simulationBounds.y2;
  }

  simBB.x1 += padding;
  simBB.y1 += padding;
  simBB.x2 -= padding;
  simBB.y2 -= padding;

  var width = simBB.x2 - simBB.x1;
  var height = simBB.y2 - simBB.y1;

  // Get start time
  var startTime = Date.now();

  // layout doesn't work with just 1 node
  if( nodes.size() <= 1 ) {
    nodes.positions( {
      x: Math.round( ( simBB.x1 + simBB.x2 ) / 2 ),
      y: Math.round( ( simBB.y1 + simBB.y2 ) / 2 )
    } );

    if( options.fit ) {
      cy.fit( options.padding );
    }

    // Get end time
    var endTime = Date.now();
    console.info( "Layout on " + nodes.size() + " nodes took " + ( endTime - startTime ) + " ms" );

    layout.one( "layoutready", options.ready );
    layout.trigger( "layoutready" );

    layout.one( "layoutstop", options.stop );
    layout.trigger( "layoutstop" );

    return;
  }

  // First I need to create the data structure to pass to the worker
  var pData = {
    'width': width,
    'height': height,
    'minDist': options.minDist,
    'expFact': options.expandingFactor,
    'expIt': 0,
    'maxExpIt': options.maxExpandIterations,
    'vertices': [],
    'edges': [],
    'startTime': startTime,
    'maxFruchtermanReingoldIterations': options.maxFruchtermanReingoldIterations
  };

  for(var i = nodes.length - 1; i >= 0 ; i--) {
    var nodeId = nodes[i].id();
    var pos = nodes[i].position();

    if( options.randomize ){
      pos = {
        x: Math.round( simBB.x1 + (simBB.x2 - simBB.x1) * Math.random() ),
        y: Math.round( simBB.y1 + (simBB.y2 - simBB.y1) * Math.random() )
      };
    }

    pData[ 'vertices' ].push( {
      id: nodeId,
      x: pos.x,
      y: pos.y
    } );
  };

  for(var i = edges.length - 1; i >= 0; i--) {
    var srcNodeId = edges[i].source().id();
    var tgtNodeId = edges[i].target().id();
    pData[ 'edges' ].push( {
      src: srcNodeId,
      tgt: tgtNodeId
    } );
  };

  //Decleration
  var t1 = layout.thread;

  // reuse old thread if possible
  if( !t1 || t1.stopped() ){
    t1 = layout.thread = Thread();

    // And to add the required scripts
    //EXTERNAL 1
    t1.require( foograph, 'foograph' );
    //EXTERNAL 2
    t1.require( Voronoi, 'Voronoi' );
  }

  function setPositions( pData ){ //console.log('set posns')
    // First we retrieve the important data
    // var expandIteration = pData[ 'expIt' ];
    var dataVertices = pData[ 'vertices' ];
    var vertices = [];
    for( var i = 0; i < dataVertices.length; ++i ) {
      var dv = dataVertices[ i ];
      vertices[ dv.id ] = {
        x: dv.x,
        y: dv.y
      };
    }
    /*
     * FINALLY:
     *
     * We position the nodes based on the calculation
     */
    nodes.positions(
      function( node, i ) {
        // Perform 2.x and 1.x backwards compatibility check
        if( typeof node === "number" ){
          node = i;
        }
        var id = node.id()
        var vertex = vertices[ id ];

        return {
          x: Math.round( simBB.x1 + vertex.x ),
          y: Math.round( simBB.y1 + vertex.y )
        };
      } );

    if( options.fit ) {
      cy.fit( options.padding );
    }

    cy.nodes().rtrigger( "position" );
  }

  var didLayoutReady = false;
  t1.on('message', function(e){
    var pData = e.message; //console.log('message', e)

    if( !options.animate ){
      return;
    }

    setPositions( pData );

    if( !didLayoutReady ){
      layout.trigger( "layoutready" );

      didLayoutReady = true;
    }
  });

  layout.one( "layoutready", options.ready );

  t1.pass( pData ).run( function( pData ) {

    function cellCentroid( cell ) {
      var hes = cell.halfedges;
      var area = 0,
        x = 0,
        y = 0;
      var p1, p2, f;

      for( var i = 0; i < hes.length; ++i ) {
        p1 = hes[ i ].getEndpoint();
        p2 = hes[ i ].getStartpoint();

        area += p1.x * p2.y;
        area -= p1.y * p2.x;

        f = p1.x * p2.y - p2.x * p1.y;
        x += ( p1.x + p2.x ) * f;
        y += ( p1.y + p2.y ) * f;
      }

      area /= 2;
      f = area * 6;
      return {
        x: x / f,
        y: y / f
      };
    }

    function sitesDistance( ls, rs ) {
      var dx = ls.x - rs.x;
      var dy = ls.y - rs.y;
      return Math.sqrt( dx * dx + dy * dy );
    }

    foograph = _ref_('foograph');
    Voronoi = _ref_('Voronoi');

    // I need to retrieve the important data
    var lWidth = pData[ 'width' ];
    var lHeight = pData[ 'height' ];
    var lMinDist = pData[ 'minDist' ];
    var lExpFact = pData[ 'expFact' ];
    var lMaxExpIt = pData[ 'maxExpIt' ];
    var lMaxFruchtermanReingoldIterations = pData[ 'maxFruchtermanReingoldIterations' ];

    // Prepare the data to output
    var savePositions = function(){
      pData[ 'width' ] = lWidth;
      pData[ 'height' ] = lHeight;
      pData[ 'expIt' ] = expandIteration;
      pData[ 'expFact' ] = lExpFact;

      pData[ 'vertices' ] = [];
      for( var i = 0; i < fv.length; ++i ) {
        pData[ 'vertices' ].push( {
          id: fv[ i ].label,
          x: fv[ i ].x,
          y: fv[ i ].y
        } );
      }
    };

    var messagePositions = function(){
      broadcast( pData );
    };

    /*
     * FIRST STEP: Application of the Fruchterman-Reingold algorithm
     *
     * We use the version implemented by the foograph library
     *
     * Ref.: https://code.google.com/p/foograph/
     */

    // We need to create an instance of a graph compatible with the library
    var frg = new foograph.Graph( "FRgraph", false );

    var frgNodes = {};

    // Then we have to add the vertices
    var dataVertices = pData[ 'vertices' ];
    for( var ni = 0; ni < dataVertices.length; ++ni ) {
      var id = dataVertices[ ni ][ 'id' ];
      var v = new foograph.Vertex( id, Math.round( Math.random() * lHeight ), Math.round( Math.random() * lHeight ) );
      frgNodes[ id ] = v;
      frg.insertVertex( v );
    }

    var dataEdges = pData[ 'edges' ];
    for( var ei = 0; ei < dataEdges.length; ++ei ) {
      var srcNodeId = dataEdges[ ei ][ 'src' ];
      var tgtNodeId = dataEdges[ ei ][ 'tgt' ];
      frg.insertEdge( "", 1, frgNodes[ srcNodeId ], frgNodes[ tgtNodeId ] );
    }

    var fv = frg.vertices;

    // Then we apply the layout
    var iterations = lMaxFruchtermanReingoldIterations;
    var frLayoutManager = new foograph.ForceDirectedVertexLayout( lWidth, lHeight, iterations, false, lMinDist );

    frLayoutManager.callback = function(){
      savePositions();
      messagePositions();
    };

    frLayoutManager.layout( frg );

    savePositions();
    messagePositions();

    if( lMaxExpIt <= 0 ){
      return pData;
    }

    /*
     * SECOND STEP: Tiding up of the graph.
     *
     * We use the method described by Gansner and North, based on Voronoi
     * diagrams.
     *
     * Ref: doi:10.1007/3-540-37623-2_28
     */

    // We calculate the Voronoi diagram dor the position of the nodes
    var voronoi = new Voronoi();
    var bbox = {
      xl: 0,
      xr: lWidth,
      yt: 0,
      yb: lHeight
    };
    var vSites = [];
    for( var i = 0; i < fv.length; ++i ) {
      vSites[ fv[ i ].label ] = fv[ i ];
    }

    function checkMinDist( ee ) {
      var infractions = 0;
      // Then we check if the minimum distance is satisfied
      for( var eei = 0; eei < ee.length; ++eei ) {
        var e = ee[ eei ];
        if( ( e.lSite != null ) && ( e.rSite != null ) && sitesDistance( e.lSite, e.rSite ) < lMinDist ) {
          ++infractions;
        }
      }
      return infractions;
    }

    var diagram = voronoi.compute( fv, bbox );

    // Then we reposition the nodes at the centroid of their Voronoi cells
    var cells = diagram.cells;
    for( var i = 0; i < cells.length; ++i ) {
      var cell = cells[ i ];
      var site = cell.site;
      var centroid = cellCentroid( cell );
      var currv = vSites[ site.label ];
      currv.x = centroid.x;
      currv.y = centroid.y;
    }

    if( lExpFact < 0.0 ) {
      // Calculates the expanding factor
      lExpFact = Math.max( 0.05, Math.min( 0.10, lMinDist / Math.sqrt( ( lWidth * lHeight ) / fv.length ) * 0.5 ) );
      //console.info("Expanding factor is " + (options.expandingFactor * 100.0) + "%");
    }

    var prevInfractions = checkMinDist( diagram.edges );
    //console.info("Initial infractions " + prevInfractions);

    var bStop = ( prevInfractions <= 0 ) || lMaxExpIt <= 0;

    var voronoiIteration = 0;
    var expandIteration = 0;

    // var initWidth = lWidth;

    while( !bStop ) {
      ++voronoiIteration;
      for( var it = 0; it <= 4; ++it ) {
        voronoi.recycle( diagram );
        diagram = voronoi.compute( fv, bbox );

        // Then we reposition the nodes at the centroid of their Voronoi cells
        // cells = diagram.cells;
        for( var i = 0; i < cells.length; ++i ) {
          var cell = cells[ i ];
          var site = cell.site;
          var centroid = cellCentroid( cell );
          var currv = vSites[ site.label ];
          currv.x = centroid.x;
          currv.y = centroid.y;
        }
      }

      var currInfractions = checkMinDist( diagram.edges );
      //console.info("Current infractions " + currInfractions);

      if( currInfractions <= 0 ) {
        bStop = true;
      } else {
        if( currInfractions >= prevInfractions || voronoiIteration >= 4 ) {
          if( expandIteration >= lMaxExpIt ) {
            bStop = true;
          } else {
            lWidth += lWidth * lExpFact;
            lHeight += lHeight * lExpFact;
            bbox = {
              xl: 0,
              xr: lWidth,
              yt: 0,
              yb: lHeight
            };
            ++expandIteration;
            voronoiIteration = 0;
            //console.info("Expanded to ("+width+","+height+")");
          }
        }
      }
      prevInfractions = currInfractions;

      savePositions();
      messagePositions();
    }

    savePositions();
    return pData;

  } ).then( function( pData ) {
    // var expandIteration = pData[ 'expIt' ];
    var dataVertices = pData[ 'vertices' ];

    setPositions( pData );

    // Get end time
    var startTime = pData[ 'startTime' ];
    var endTime = new Date();
    console.info( "Layout on " + dataVertices.length + " nodes took " + ( endTime - startTime ) + " ms" );

    layout.one( "layoutstop", options.stop );

    if( !options.animate ){
      layout.trigger( "layoutready" );
    }

    layout.trigger( "layoutstop" );

    t1.stop();
  } );


  return this;
}; // run

SpreadLayout.prototype.stop = function(){
  if( this.thread ){
    this.thread.stop();
  }

  this.trigger('layoutstop');
};

SpreadLayout.prototype.destroy = function(){
  if( this.thread ){
    this.thread.stop();
  }
};

module.exports = function get( cytoscape, weaver ){
  Thread = weaver.Thread;

  return SpreadLayout;
};

},{"./foograph":2,"./rhill-voronoi-core":5}],5:[function(_dereq_,module,exports){
/*!
Copyright (C) 2010-2013 Raymond Hill: https://github.com/gorhill/Javascript-Voronoi
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
*/
/*
Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
File: rhill-voronoi-core.js
Version: 0.98
Date: January 21, 2013
Description: This is my personal Javascript implementation of
Steven Fortune's algorithm to compute Voronoi diagrams.

License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md

## Usage:

  var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
  // xl, xr means x left, x right
  // yt, yb means y top, y bottom
  var bbox = {xl:0, xr:800, yt:0, yb:600};
  var voronoi = new Voronoi();
  // pass an object which exhibits xl, xr, yt, yb properties. The bounding
  // box will be used to connect unbound edges, and to close open cells
  result = voronoi.compute(sites, bbox);
  // render, further analyze, etc.

Return value:
  An object with the following properties:

  result.vertices = an array of unordered, unique Voronoi.Vertex objects making
    up the Voronoi diagram.
  result.edges = an array of unordered, unique Voronoi.Edge objects making up
    the Voronoi diagram.
  result.cells = an array of Voronoi.Cell object making up the Voronoi diagram.
    A Cell object might have an empty array of halfedges, meaning no Voronoi
    cell could be computed for a particular cell.
  result.execTime = the time it took to compute the Voronoi diagram, in
    milliseconds.

Voronoi.Vertex object:
  x: The x position of the vertex.
  y: The y position of the vertex.

Voronoi.Edge object:
  lSite: the Voronoi site object at the left of this Voronoi.Edge object.
  rSite: the Voronoi site object at the right of this Voronoi.Edge object (can
    be null).
  va: an object with an 'x' and a 'y' property defining the start point
    (relative to the Voronoi site on the left) of this Voronoi.Edge object.
  vb: an object with an 'x' and a 'y' property defining the end point
    (relative to Voronoi site on the left) of this Voronoi.Edge object.

  For edges which are used to close open cells (using the supplied bounding
  box), the rSite property will be null.

Voronoi.Cell object:
  site: the Voronoi site object associated with the Voronoi cell.
  halfedges: an array of Voronoi.Halfedge objects, ordered counterclockwise,
    defining the polygon for this Voronoi cell.

Voronoi.Halfedge object:
  site: the Voronoi site object owning this Voronoi.Halfedge object.
  edge: a reference to the unique Voronoi.Edge object underlying this
    Voronoi.Halfedge object.
  getStartpoint(): a method returning an object with an 'x' and a 'y' property
    for the start point of this halfedge. Keep in mind halfedges are always
    countercockwise.
  getEndpoint(): a method returning an object with an 'x' and a 'y' property
    for the end point of this halfedge. Keep in mind halfedges are always
    countercockwise.

TODO: Identify opportunities for performance improvement.

TODO: Let the user close the Voronoi cells, do not do it automatically. Not only let
      him close the cells, but also allow him to close more than once using a different
      bounding box for the same Voronoi diagram.
*/

/*global Math */

// ---------------------------------------------------------------------------

function Voronoi() {
    this.vertices = null;
    this.edges = null;
    this.cells = null;
    this.toRecycle = null;
    this.beachsectionJunkyard = [];
    this.circleEventJunkyard = [];
    this.vertexJunkyard = [];
    this.edgeJunkyard = [];
    this.cellJunkyard = [];
    }

// ---------------------------------------------------------------------------

Voronoi.prototype.reset = function() {
    if (!this.beachline) {
        this.beachline = new this.RBTree();
        }
    // Move leftover beachsections to the beachsection junkyard.
    if (this.beachline.root) {
        var beachsection = this.beachline.getFirst(this.beachline.root);
        while (beachsection) {
            this.beachsectionJunkyard.push(beachsection); // mark for reuse
            beachsection = beachsection.rbNext;
            }
        }
    this.beachline.root = null;
    if (!this.circleEvents) {
        this.circleEvents = new this.RBTree();
        }
    this.circleEvents.root = this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = [];
    };

Voronoi.prototype.sqrt = function(n){ return Math.sqrt(n); };
Voronoi.prototype.abs = function(n){ return Math.abs(n); };
Voronoi.prototype.ε = Voronoi.ε = 1e-9;
Voronoi.prototype.invε = Voronoi.invε = 1.0 / Voronoi.ε;
Voronoi.prototype.equalWithEpsilon = function(a,b){return this.abs(a-b)<1e-9;};
Voronoi.prototype.greaterThanWithEpsilon = function(a,b){return a-b>1e-9;};
Voronoi.prototype.greaterThanOrEqualWithEpsilon = function(a,b){return b-a<1e-9;};
Voronoi.prototype.lessThanWithEpsilon = function(a,b){return b-a>1e-9;};
Voronoi.prototype.lessThanOrEqualWithEpsilon = function(a,b){return a-b<1e-9;};

// ---------------------------------------------------------------------------
// Red-Black tree code (based on C version of "rbtree" by Franck Bui-Huu
// https://github.com/fbuihuu/libtree/blob/master/rb.c

Voronoi.prototype.RBTree = function() {
    this.root = null;
    };

Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function(node, successor) {
    var parent;
    if (node) {
        // >>> rhill 2011-05-27: Performance: cache previous/next nodes
        successor.rbPrevious = node;
        successor.rbNext = node.rbNext;
        if (node.rbNext) {
            node.rbNext.rbPrevious = successor;
            }
        node.rbNext = successor;
        // <<<
        if (node.rbRight) {
            // in-place expansion of node.rbRight.getFirst();
            node = node.rbRight;
            while (node.rbLeft) {node = node.rbLeft;}
            node.rbLeft = successor;
            }
        else {
            node.rbRight = successor;
            }
        parent = node;
        }
    // rhill 2011-06-07: if node is null, successor must be inserted
    // to the left-most part of the tree
    else if (this.root) {
        node = this.getFirst(this.root);
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = null;
        successor.rbNext = node;
        node.rbPrevious = successor;
        // <<<
        node.rbLeft = successor;
        parent = node;
        }
    else {
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = successor.rbNext = null;
        // <<<
        this.root = successor;
        parent = null;
        }
    successor.rbLeft = successor.rbRight = null;
    successor.rbParent = parent;
    successor.rbRed = true;
    // Fixup the modified tree by recoloring nodes and performing
    // rotations (2 at most) hence the red-black tree properties are
    // preserved.
    var grandpa, uncle;
    node = successor;
    while (parent && parent.rbRed) {
        grandpa = parent.rbParent;
        if (parent === grandpa.rbLeft) {
            uncle = grandpa.rbRight;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
                }
            else {
                if (node === parent.rbRight) {
                    this.rbRotateLeft(parent);
                    node = parent;
                    parent = node.rbParent;
                    }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateRight(grandpa);
                }
            }
        else {
            uncle = grandpa.rbLeft;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
                }
            else {
                if (node === parent.rbLeft) {
                    this.rbRotateRight(parent);
                    node = parent;
                    parent = node.rbParent;
                    }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateLeft(grandpa);
                }
            }
        parent = node.rbParent;
        }
    this.root.rbRed = false;
    };

Voronoi.prototype.RBTree.prototype.rbRemoveNode = function(node) {
    // >>> rhill 2011-05-27: Performance: cache previous/next nodes
    if (node.rbNext) {
        node.rbNext.rbPrevious = node.rbPrevious;
        }
    if (node.rbPrevious) {
        node.rbPrevious.rbNext = node.rbNext;
        }
    node.rbNext = node.rbPrevious = null;
    // <<<
    var parent = node.rbParent,
        left = node.rbLeft,
        right = node.rbRight,
        next;
    if (!left) {
        next = right;
        }
    else if (!right) {
        next = left;
        }
    else {
        next = this.getFirst(right);
        }
    if (parent) {
        if (parent.rbLeft === node) {
            parent.rbLeft = next;
            }
        else {
            parent.rbRight = next;
            }
        }
    else {
        this.root = next;
        }
    // enforce red-black rules
    var isRed;
    if (left && right) {
        isRed = next.rbRed;
        next.rbRed = node.rbRed;
        next.rbLeft = left;
        left.rbParent = next;
        if (next !== right) {
            parent = next.rbParent;
            next.rbParent = node.rbParent;
            node = next.rbRight;
            parent.rbLeft = node;
            next.rbRight = right;
            right.rbParent = next;
            }
        else {
            next.rbParent = parent;
            parent = next;
            node = next.rbRight;
            }
        }
    else {
        isRed = node.rbRed;
        node = next;
        }
    // 'node' is now the sole successor's child and 'parent' its
    // new parent (since the successor can have been moved)
    if (node) {
        node.rbParent = parent;
        }
    // the 'easy' cases
    if (isRed) {return;}
    if (node && node.rbRed) {
        node.rbRed = false;
        return;
        }
    // the other cases
    var sibling;
    do {
        if (node === this.root) {
            break;
            }
        if (node === parent.rbLeft) {
            sibling = parent.rbRight;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateLeft(parent);
                sibling = parent.rbRight;
                }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbRight || !sibling.rbRight.rbRed) {
                    sibling.rbLeft.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateRight(sibling);
                    sibling = parent.rbRight;
                    }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbRight.rbRed = false;
                this.rbRotateLeft(parent);
                node = this.root;
                break;
                }
            }
        else {
            sibling = parent.rbLeft;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateRight(parent);
                sibling = parent.rbLeft;
                }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
                    sibling.rbRight.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateLeft(sibling);
                    sibling = parent.rbLeft;
                    }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbLeft.rbRed = false;
                this.rbRotateRight(parent);
                node = this.root;
                break;
                }
            }
        sibling.rbRed = true;
        node = parent;
        parent = parent.rbParent;
    } while (!node.rbRed);
    if (node) {node.rbRed = false;}
    };

Voronoi.prototype.RBTree.prototype.rbRotateLeft = function(node) {
    var p = node,
        q = node.rbRight, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
            }
        else {
            parent.rbRight = q;
            }
        }
    else {
        this.root = q;
        }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbRight = q.rbLeft;
    if (p.rbRight) {
        p.rbRight.rbParent = p;
        }
    q.rbLeft = p;
    };

Voronoi.prototype.RBTree.prototype.rbRotateRight = function(node) {
    var p = node,
        q = node.rbLeft, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
            }
        else {
            parent.rbRight = q;
            }
        }
    else {
        this.root = q;
        }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbLeft = q.rbRight;
    if (p.rbLeft) {
        p.rbLeft.rbParent = p;
        }
    q.rbRight = p;
    };

Voronoi.prototype.RBTree.prototype.getFirst = function(node) {
    while (node.rbLeft) {
        node = node.rbLeft;
        }
    return node;
    };

Voronoi.prototype.RBTree.prototype.getLast = function(node) {
    while (node.rbRight) {
        node = node.rbRight;
        }
    return node;
    };

// ---------------------------------------------------------------------------
// Diagram methods

Voronoi.prototype.Diagram = function(site) {
    this.site = site;
    };

// ---------------------------------------------------------------------------
// Cell methods

Voronoi.prototype.Cell = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    };

Voronoi.prototype.Cell.prototype.init = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    return this;
    };

Voronoi.prototype.createCell = function(site) {
    var cell = this.cellJunkyard.pop();
    if ( cell ) {
        return cell.init(site);
        }
    return new this.Cell(site);
    };

Voronoi.prototype.Cell.prototype.prepareHalfedges = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        edge;
    // get rid of unused halfedges
    // rhill 2011-05-27: Keep it simple, no point here in trying
    // to be fancy: dangling edges are a typically a minority.
    while (iHalfedge--) {
        edge = halfedges[iHalfedge].edge;
        if (!edge.vb || !edge.va) {
            halfedges.splice(iHalfedge,1);
            }
        }

    // rhill 2011-05-26: I tried to use a binary search at insertion
    // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
    // There was no real benefits in doing so, performance on
    // Firefox 3.6 was improved marginally, while performance on
    // Opera 11 was penalized marginally.
    halfedges.sort(function(a,b){return b.angle-a.angle;});
    return halfedges.length;
    };

// Return a list of the neighbor Ids
Voronoi.prototype.Cell.prototype.getNeighborIds = function() {
    var neighbors = [],
        iHalfedge = this.halfedges.length,
        edge;
    while (iHalfedge--){
        edge = this.halfedges[iHalfedge].edge;
        if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
            neighbors.push(edge.lSite.voronoiId);
            }
        else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId){
            neighbors.push(edge.rSite.voronoiId);
            }
        }
    return neighbors;
    };

// Compute bounding box
//
Voronoi.prototype.Cell.prototype.getBbox = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity,
        v, vx, vy;
    while (iHalfedge--) {
        v = halfedges[iHalfedge].getStartpoint();
        vx = v.x;
        vy = v.y;
        if (vx < xmin) {xmin = vx;}
        if (vy < ymin) {ymin = vy;}
        if (vx > xmax) {xmax = vx;}
        if (vy > ymax) {ymax = vy;}
        // we dont need to take into account end point,
        // since each end point matches a start point
        }
    return {
        x: xmin,
        y: ymin,
        width: xmax-xmin,
        height: ymax-ymin
        };
    };

// Return whether a point is inside, on, or outside the cell:
//   -1: point is outside the perimeter of the cell
//    0: point is on the perimeter of the cell
//    1: point is inside the perimeter of the cell
//
Voronoi.prototype.Cell.prototype.pointIntersection = function(x, y) {
    // Check if point in polygon. Since all polygons of a Voronoi
    // diagram are convex, then:
    // http://paulbourke.net/geometry/polygonmesh/
    // Solution 3 (2D):
    //   "If the polygon is convex then one can consider the polygon
    //   "as a 'path' from the first vertex. A point is on the interior
    //   "of this polygons if it is always on the same side of all the
    //   "line segments making up the path. ...
    //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
    //   "if it is less than 0 then P is to the right of the line segment,
    //   "if greater than 0 it is to the left, if equal to 0 then it lies
    //   "on the line segment"
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        p0, p1, r;
    while (iHalfedge--) {
        halfedge = halfedges[iHalfedge];
        p0 = halfedge.getStartpoint();
        p1 = halfedge.getEndpoint();
        r = (y-p0.y)*(p1.x-p0.x)-(x-p0.x)*(p1.y-p0.y);
        if (!r) {
            return 0;
            }
        if (r > 0) {
            return -1;
            }
        }
    return 1;
    };

// ---------------------------------------------------------------------------
// Edge methods
//

Voronoi.prototype.Vertex = function(x, y) {
    this.x = x;
    this.y = y;
    };

Voronoi.prototype.Edge = function(lSite, rSite) {
    this.lSite = lSite;
    this.rSite = rSite;
    this.va = this.vb = null;
    };

Voronoi.prototype.Halfedge = function(edge, lSite, rSite) {
    this.site = lSite;
    this.edge = edge;
    // 'angle' is a value to be used for properly sorting the
    // halfsegments counterclockwise. By convention, we will
    // use the angle of the line defined by the 'site to the left'
    // to the 'site to the right'.
    // However, border edges have no 'site to the right': thus we
    // use the angle of line perpendicular to the halfsegment (the
    // edge should have both end points defined in such case.)
    if (rSite) {
        this.angle = Math.atan2(rSite.y-lSite.y, rSite.x-lSite.x);
        }
    else {
        var va = edge.va,
            vb = edge.vb;
        // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
        // but for performance purpose, these are expanded in place here.
        this.angle = edge.lSite === lSite ?
            Math.atan2(vb.x-va.x, va.y-vb.y) :
            Math.atan2(va.x-vb.x, vb.y-va.y);
        }
    };

Voronoi.prototype.createHalfedge = function(edge, lSite, rSite) {
    return new this.Halfedge(edge, lSite, rSite);
    };

Voronoi.prototype.Halfedge.prototype.getStartpoint = function() {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
    };

Voronoi.prototype.Halfedge.prototype.getEndpoint = function() {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
    };



// this create and add a vertex to the internal collection

Voronoi.prototype.createVertex = function(x, y) {
    var v = this.vertexJunkyard.pop();
    if ( !v ) {
        v = new this.Vertex(x, y);
        }
    else {
        v.x = x;
        v.y = y;
        }
    this.vertices.push(v);
    return v;
    };

// this create and add an edge to internal collection, and also create
// two halfedges which are added to each site's counterclockwise array
// of halfedges.

Voronoi.prototype.createEdge = function(lSite, rSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if ( !edge ) {
        edge = new this.Edge(lSite, rSite);
        }
    else {
        edge.lSite = lSite;
        edge.rSite = rSite;
        edge.va = edge.vb = null;
        }

    this.edges.push(edge);
    if (va) {
        this.setEdgeStartpoint(edge, lSite, rSite, va);
        }
    if (vb) {
        this.setEdgeEndpoint(edge, lSite, rSite, vb);
        }
    this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
    this.cells[rSite.voronoiId].halfedges.push(this.createHalfedge(edge, rSite, lSite));
    return edge;
    };

Voronoi.prototype.createBorderEdge = function(lSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if ( !edge ) {
        edge = new this.Edge(lSite, null);
        }
    else {
        edge.lSite = lSite;
        edge.rSite = null;
        }
    edge.va = va;
    edge.vb = vb;
    this.edges.push(edge);
    return edge;
    };

Voronoi.prototype.setEdgeStartpoint = function(edge, lSite, rSite, vertex) {
    if (!edge.va && !edge.vb) {
        edge.va = vertex;
        edge.lSite = lSite;
        edge.rSite = rSite;
        }
    else if (edge.lSite === rSite) {
        edge.vb = vertex;
        }
    else {
        edge.va = vertex;
        }
    };

Voronoi.prototype.setEdgeEndpoint = function(edge, lSite, rSite, vertex) {
    this.setEdgeStartpoint(edge, rSite, lSite, vertex);
    };

// ---------------------------------------------------------------------------
// Beachline methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.Beachsection = function() {
    };

// rhill 2011-06-02: A lot of Beachsection instanciations
// occur during the computation of the Voronoi diagram,
// somewhere between the number of sites and twice the
// number of sites, while the number of Beachsections on the
// beachline at any given time is comparatively low. For this
// reason, we reuse already created Beachsections, in order
// to avoid new memory allocation. This resulted in a measurable
// performance gain.

Voronoi.prototype.createBeachsection = function(site) {
    var beachsection = this.beachsectionJunkyard.pop();
    if (!beachsection) {
        beachsection = new this.Beachsection();
        }
    beachsection.site = site;
    return beachsection;
    };

// calculate the left break point of a particular beach section,
// given a particular sweep line
Voronoi.prototype.leftBreakPoint = function(arc, directrix) {
    // http://en.wikipedia.org/wiki/Parabola
    // http://en.wikipedia.org/wiki/Quadratic_equation
    // h1 = x1,
    // k1 = (y1+directrix)/2,
    // h2 = x2,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = -h1/(2*p1),
    // c1 = h1*h1/(4*p1)+k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
    // When x1 become the x-origin:
    // h1 = 0,
    // k1 = (y1+directrix)/2,
    // h2 = x2-x1,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = 0,
    // c1 = k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1

    // change code below at your own risk: care has been taken to
    // reduce errors due to computers' finite arithmetic precision.
    // Maybe can still be improved, will see if any more of this
    // kind of errors pop up again.
    var site = arc.site,
        rfocx = site.x,
        rfocy = site.y,
        pby2 = rfocy-directrix;
    // parabola in degenerate case where focus is on directrix
    if (!pby2) {
        return rfocx;
        }
    var lArc = arc.rbPrevious;
    if (!lArc) {
        return -Infinity;
        }
    site = lArc.site;
    var lfocx = site.x,
        lfocy = site.y,
        plby2 = lfocy-directrix;
    // parabola in degenerate case where focus is on directrix
    if (!plby2) {
        return lfocx;
        }
    var hl = lfocx-rfocx,
        aby2 = 1/pby2-1/plby2,
        b = hl/plby2;
    if (aby2) {
        return (-b+this.sqrt(b*b-2*aby2*(hl*hl/(-2*plby2)-lfocy+plby2/2+rfocy-pby2/2)))/aby2+rfocx;
        }
    // both parabolas have same distance to directrix, thus break point is midway
    return (rfocx+lfocx)/2;
    };

// calculate the right break point of a particular beach section,
// given a particular directrix
Voronoi.prototype.rightBreakPoint = function(arc, directrix) {
    var rArc = arc.rbNext;
    if (rArc) {
        return this.leftBreakPoint(rArc, directrix);
        }
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
    };

Voronoi.prototype.detachBeachsection = function(beachsection) {
    this.detachCircleEvent(beachsection); // detach potentially attached circle event
    this.beachline.rbRemoveNode(beachsection); // remove from RB-tree
    this.beachsectionJunkyard.push(beachsection); // mark for reuse
    };

Voronoi.prototype.removeBeachsection = function(beachsection) {
    var circle = beachsection.circleEvent,
        x = circle.x,
        y = circle.ycenter,
        vertex = this.createVertex(x, y),
        previous = beachsection.rbPrevious,
        next = beachsection.rbNext,
        disappearingTransitions = [beachsection],
        abs_fn = Math.abs;

    // remove collapsed beachsection from beachline
    this.detachBeachsection(beachsection);

    // there could be more than one empty arc at the deletion point, this
    // happens when more than two edges are linked by the same vertex,
    // so we will collect all those edges by looking up both sides of
    // the deletion point.
    // by the way, there is *always* a predecessor/successor to any collapsed
    // beach section, it's just impossible to have a collapsing first/last
    // beach sections on the beachline, since they obviously are unconstrained
    // on their left/right side.

    // look left
    var lArc = previous;
    while (lArc.circleEvent && abs_fn(x-lArc.circleEvent.x)<1e-9 && abs_fn(y-lArc.circleEvent.ycenter)<1e-9) {
        previous = lArc.rbPrevious;
        disappearingTransitions.unshift(lArc);
        this.detachBeachsection(lArc); // mark for reuse
        lArc = previous;
        }
    // even though it is not disappearing, I will also add the beach section
    // immediately to the left of the left-most collapsed beach section, for
    // convenience, since we need to refer to it later as this beach section
    // is the 'left' site of an edge for which a start point is set.
    disappearingTransitions.unshift(lArc);
    this.detachCircleEvent(lArc);

    // look right
    var rArc = next;
    while (rArc.circleEvent && abs_fn(x-rArc.circleEvent.x)<1e-9 && abs_fn(y-rArc.circleEvent.ycenter)<1e-9) {
        next = rArc.rbNext;
        disappearingTransitions.push(rArc);
        this.detachBeachsection(rArc); // mark for reuse
        rArc = next;
        }
    // we also have to add the beach section immediately to the right of the
    // right-most collapsed beach section, since there is also a disappearing
    // transition representing an edge's start point on its left.
    disappearingTransitions.push(rArc);
    this.detachCircleEvent(rArc);

    // walk through all the disappearing transitions between beach sections and
    // set the start point of their (implied) edge.
    var nArcs = disappearingTransitions.length,
        iArc;
    for (iArc=1; iArc<nArcs; iArc++) {
        rArc = disappearingTransitions[iArc];
        lArc = disappearingTransitions[iArc-1];
        this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
        }

    // create a new edge as we have now a new transition between
    // two beach sections which were previously not adjacent.
    // since this edge appears as a new vertex is defined, the vertex
    // actually define an end point of the edge (relative to the site
    // on the left)
    lArc = disappearingTransitions[0];
    rArc = disappearingTransitions[nArcs-1];
    rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

    // create circle events if any for beach sections left in the beachline
    // adjacent to collapsed sections
    this.attachCircleEvent(lArc);
    this.attachCircleEvent(rArc);
    };

Voronoi.prototype.addBeachsection = function(site) {
    var x = site.x,
        directrix = site.y;

    // find the left and right beach sections which will surround the newly
    // created beach section.
    // rhill 2011-06-01: This loop is one of the most often executed,
    // hence we expand in-place the comparison-against-epsilon calls.
    var lArc, rArc,
        dxl, dxr,
        node = this.beachline.root;

    while (node) {
        dxl = this.leftBreakPoint(node,directrix)-x;
        // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection
        if (dxl > 1e-9) {
            // this case should never happen
            // if (!node.rbLeft) {
            //    rArc = node.rbLeft;
            //    break;
            //    }
            node = node.rbLeft;
            }
        else {
            dxr = x-this.rightBreakPoint(node,directrix);
            // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection
            if (dxr > 1e-9) {
                if (!node.rbRight) {
                    lArc = node;
                    break;
                    }
                node = node.rbRight;
                }
            else {
                // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
                if (dxl > -1e-9) {
                    lArc = node.rbPrevious;
                    rArc = node;
                    }
                // x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
                else if (dxr > -1e-9) {
                    lArc = node;
                    rArc = node.rbNext;
                    }
                // falls exactly somewhere in the middle of the beachsection
                else {
                    lArc = rArc = node;
                    }
                break;
                }
            }
        }
    // at this point, keep in mind that lArc and/or rArc could be
    // undefined or null.

    // create a new beach section object for the site and add it to RB-tree
    var newArc = this.createBeachsection(site);
    this.beachline.rbInsertSuccessor(lArc, newArc);

    // cases:
    //

    // [null,null]
    // least likely case: new beach section is the first beach section on the
    // beachline.
    // This case means:
    //   no new transition appears
    //   no collapsing beach section
    //   new beachsection become root of the RB-tree
    if (!lArc && !rArc) {
        return;
        }

    // [lArc,rArc] where lArc == rArc
    // most likely case: new beach section split an existing beach
    // section.
    // This case means:
    //   one new transition appears
    //   the left and right beach section might be collapsing as a result
    //   two new nodes added to the RB-tree
    if (lArc === rArc) {
        // invalidate circle event of split beach section
        this.detachCircleEvent(lArc);

        // split the beach section into two separate beach sections
        rArc = this.createBeachsection(lArc.site);
        this.beachline.rbInsertSuccessor(newArc, rArc);

        // since we have a new transition between two beach sections,
        // a new edge is born
        newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to be notified when the point of
        // collapse is reached.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
        }

    // [lArc,null]
    // even less likely case: new beach section is the *last* beach section
    // on the beachline -- this can happen *only* if *all* the previous beach
    // sections currently on the beachline share the same y value as
    // the new beach section.
    // This case means:
    //   one new transition appears
    //   no collapsing beach section as a result
    //   new beach section become right-most node of the RB-tree
    if (lArc && !rArc) {
        newArc.edge = this.createEdge(lArc.site,newArc.site);
        return;
        }

    // [null,rArc]
    // impossible case: because sites are strictly processed from top to bottom,
    // and left to right, which guarantees that there will always be a beach section
    // on the left -- except of course when there are no beach section at all on
    // the beach line, which case was handled above.
    // rhill 2011-06-02: No point testing in non-debug version
    //if (!lArc && rArc) {
    //    throw "Voronoi.addBeachsection(): What is this I don't even";
    //    }

    // [lArc,rArc] where lArc != rArc
    // somewhat less likely case: new beach section falls *exactly* in between two
    // existing beach sections
    // This case means:
    //   one transition disappears
    //   two new transitions appear
    //   the left and right beach section might be collapsing as a result
    //   only one new node added to the RB-tree
    if (lArc !== rArc) {
        // invalidate circle events of left and right sites
        this.detachCircleEvent(lArc);
        this.detachCircleEvent(rArc);

        // an existing transition disappears, meaning a vertex is defined at
        // the disappearance point.
        // since the disappearance is caused by the new beachsection, the
        // vertex is at the center of the circumscribed circle of the left,
        // new and right beachsections.
        // http://mathforum.org/library/drmath/view/55002.html
        // Except that I bring the origin at A to simplify
        // calculation
        var lSite = lArc.site,
            ax = lSite.x,
            ay = lSite.y,
            bx=site.x-ax,
            by=site.y-ay,
            rSite = rArc.site,
            cx=rSite.x-ax,
            cy=rSite.y-ay,
            d=2*(bx*cy-by*cx),
            hb=bx*bx+by*by,
            hc=cx*cx+cy*cy,
            vertex = this.createVertex((cy*hb-by*hc)/d+ax, (bx*hc-cx*hb)/d+ay);

        // one transition disappear
        this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);

        // two new transitions appear at the new vertex location
        newArc.edge = this.createEdge(lSite, site, undefined, vertex);
        rArc.edge = this.createEdge(site, rSite, undefined, vertex);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to handle the point of collapse.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
        }
    };

// ---------------------------------------------------------------------------
// Circle event methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.CircleEvent = function() {
    // rhill 2013-10-12: it helps to state exactly what we are at ctor time.
    this.arc = null;
    this.rbLeft = null;
    this.rbNext = null;
    this.rbParent = null;
    this.rbPrevious = null;
    this.rbRed = false;
    this.rbRight = null;
    this.site = null;
    this.x = this.y = this.ycenter = 0;
    };

Voronoi.prototype.attachCircleEvent = function(arc) {
    var lArc = arc.rbPrevious,
        rArc = arc.rbNext;
    if (!lArc || !rArc) {return;} // does that ever happen?
    var lSite = lArc.site,
        cSite = arc.site,
        rSite = rArc.site;

    // If site of left beachsection is same as site of
    // right beachsection, there can't be convergence
    if (lSite===rSite) {return;}

    // Find the circumscribed circle for the three sites associated
    // with the beachsection triplet.
    // rhill 2011-05-26: It is more efficient to calculate in-place
    // rather than getting the resulting circumscribed circle from an
    // object returned by calling Voronoi.circumcircle()
    // http://mathforum.org/library/drmath/view/55002.html
    // Except that I bring the origin at cSite to simplify calculations.
    // The bottom-most part of the circumcircle is our Fortune 'circle
    // event', and its center is a vertex potentially part of the final
    // Voronoi diagram.
    var bx = cSite.x,
        by = cSite.y,
        ax = lSite.x-bx,
        ay = lSite.y-by,
        cx = rSite.x-bx,
        cy = rSite.y-by;

    // If points l->c->r are clockwise, then center beach section does not
    // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
    // sign is reverse of the orientation, hence we reverse the test.
    // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
    // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
    // return infinites: 1e-12 seems to fix the problem.
    var d = 2*(ax*cy-ay*cx);
    if (d >= -2e-12){return;}

    var ha = ax*ax+ay*ay,
        hc = cx*cx+cy*cy,
        x = (cy*ha-ay*hc)/d,
        y = (ax*hc-cx*ha)/d,
        ycenter = y+by;

    // Important: ybottom should always be under or at sweep, so no need
    // to waste CPU cycles by checking

    // recycle circle event object if possible
    var circleEvent = this.circleEventJunkyard.pop();
    if (!circleEvent) {
        circleEvent = new this.CircleEvent();
        }
    circleEvent.arc = arc;
    circleEvent.site = cSite;
    circleEvent.x = x+bx;
    circleEvent.y = ycenter+this.sqrt(x*x+y*y); // y bottom
    circleEvent.ycenter = ycenter;
    arc.circleEvent = circleEvent;

    // find insertion point in RB-tree: circle events are ordered from
    // smallest to largest
    var predecessor = null,
        node = this.circleEvents.root;
    while (node) {
        if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
            if (node.rbLeft) {
                node = node.rbLeft;
                }
            else {
                predecessor = node.rbPrevious;
                break;
                }
            }
        else {
            if (node.rbRight) {
                node = node.rbRight;
                }
            else {
                predecessor = node;
                break;
                }
            }
        }
    this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);
    if (!predecessor) {
        this.firstCircleEvent = circleEvent;
        }
    };

Voronoi.prototype.detachCircleEvent = function(arc) {
    var circleEvent = arc.circleEvent;
    if (circleEvent) {
        if (!circleEvent.rbPrevious) {
            this.firstCircleEvent = circleEvent.rbNext;
            }
        this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree
        this.circleEventJunkyard.push(circleEvent);
        arc.circleEvent = null;
        }
    };

// ---------------------------------------------------------------------------
// Diagram completion methods

// connect dangling edges (not if a cursory test tells us
// it is not going to be visible.
// return value:
//   false: the dangling endpoint couldn't be connected
//   true: the dangling endpoint could be connected
Voronoi.prototype.connectEdge = function(edge, bbox) {
    // skip if end point already connected
    var vb = edge.vb;
    if (!!vb) {return true;}

    // make local copy for performance purpose
    var va = edge.va,
        xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        lSite = edge.lSite,
        rSite = edge.rSite,
        lx = lSite.x,
        ly = lSite.y,
        rx = rSite.x,
        ry = rSite.y,
        fx = (lx+rx)/2,
        fy = (ly+ry)/2,
        fm, fb;

    // if we reach here, this means cells which use this edge will need
    // to be closed, whether because the edge was removed, or because it
    // was connected to the bounding box.
    this.cells[lSite.voronoiId].closeMe = true;
    this.cells[rSite.voronoiId].closeMe = true;

    // get the line equation of the bisector if line is not vertical
    if (ry !== ly) {
        fm = (lx-rx)/(ry-ly);
        fb = fy-fm*fx;
        }

    // remember, direction of line (relative to left site):
    // upward: left.x < right.x
    // downward: left.x > right.x
    // horizontal: left.x == right.x
    // upward: left.x < right.x
    // rightward: left.y < right.y
    // leftward: left.y > right.y
    // vertical: left.y == right.y

    // depending on the direction, find the best side of the
    // bounding box to use to determine a reasonable start point

    // rhill 2013-12-02:
    // While at it, since we have the values which define the line,
    // clip the end of va if it is outside the bbox.
    // https://github.com/gorhill/Javascript-Voronoi/issues/15
    // TODO: Do all the clipping here rather than rely on Liang-Barsky
    // which does not do well sometimes due to loss of arithmetic
    // precision. The code here doesn't degrade if one of the vertex is
    // at a huge distance.

    // special case: vertical line
    if (fm === undefined) {
        // doesn't intersect with viewport
        if (fx < xl || fx >= xr) {return false;}
        // downward
        if (lx > rx) {
            if (!va || va.y < yt) {
                va = this.createVertex(fx, yt);
                }
            else if (va.y >= yb) {
                return false;
                }
            vb = this.createVertex(fx, yb);
            }
        // upward
        else {
            if (!va || va.y > yb) {
                va = this.createVertex(fx, yb);
                }
            else if (va.y < yt) {
                return false;
                }
            vb = this.createVertex(fx, yt);
            }
        }
    // closer to vertical than horizontal, connect start point to the
    // top or bottom side of the bounding box
    else if (fm < -1 || fm > 1) {
        // downward
        if (lx > rx) {
            if (!va || va.y < yt) {
                va = this.createVertex((yt-fb)/fm, yt);
                }
            else if (va.y >= yb) {
                return false;
                }
            vb = this.createVertex((yb-fb)/fm, yb);
            }
        // upward
        else {
            if (!va || va.y > yb) {
                va = this.createVertex((yb-fb)/fm, yb);
                }
            else if (va.y < yt) {
                return false;
                }
            vb = this.createVertex((yt-fb)/fm, yt);
            }
        }
    // closer to horizontal than vertical, connect start point to the
    // left or right side of the bounding box
    else {
        // rightward
        if (ly < ry) {
            if (!va || va.x < xl) {
                va = this.createVertex(xl, fm*xl+fb);
                }
            else if (va.x >= xr) {
                return false;
                }
            vb = this.createVertex(xr, fm*xr+fb);
            }
        // leftward
        else {
            if (!va || va.x > xr) {
                va = this.createVertex(xr, fm*xr+fb);
                }
            else if (va.x < xl) {
                return false;
                }
            vb = this.createVertex(xl, fm*xl+fb);
            }
        }
    edge.va = va;
    edge.vb = vb;

    return true;
    };

// line-clipping code taken from:
//   Liang-Barsky function by Daniel White
//   http://www.skytopia.com/project/articles/compsci/clipping.html
// Thanks!
// A bit modified to minimize code paths
Voronoi.prototype.clipEdge = function(edge, bbox) {
    var ax = edge.va.x,
        ay = edge.va.y,
        bx = edge.vb.x,
        by = edge.vb.y,
        t0 = 0,
        t1 = 1,
        dx = bx-ax,
        dy = by-ay;
    // left
    var q = ax-bbox.xl;
    if (dx===0 && q<0) {return false;}
    var r = -q/dx;
    if (dx<0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    else if (dx>0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    // right
    q = bbox.xr-ax;
    if (dx===0 && q<0) {return false;}
    r = q/dx;
    if (dx<0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    else if (dx>0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    // top
    q = ay-bbox.yt;
    if (dy===0 && q<0) {return false;}
    r = -q/dy;
    if (dy<0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    else if (dy>0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    // bottom
    q = bbox.yb-ay;
    if (dy===0 && q<0) {return false;}
    r = q/dy;
    if (dy<0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    else if (dy>0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }

    // if we reach this point, Voronoi edge is within bbox

    // if t0 > 0, va needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t0 > 0) {
        edge.va = this.createVertex(ax+t0*dx, ay+t0*dy);
        }

    // if t1 < 1, vb needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t1 < 1) {
        edge.vb = this.createVertex(ax+t1*dx, ay+t1*dy);
        }

    // va and/or vb were clipped, thus we will need to close
    // cells which use this edge.
    if ( t0 > 0 || t1 < 1 ) {
        this.cells[edge.lSite.voronoiId].closeMe = true;
        this.cells[edge.rSite.voronoiId].closeMe = true;
    }

    return true;
    };

// Connect/cut edges at bounding box
Voronoi.prototype.clipEdges = function(bbox) {
    // connect all dangling edges to bounding box
    // or get rid of them if it can't be done
    var edges = this.edges,
        iEdge = edges.length,
        edge,
        abs_fn = Math.abs;

    // iterate backward so we can splice safely
    while (iEdge--) {
        edge = edges[iEdge];
        // edge is removed if:
        //   it is wholly outside the bounding box
        //   it is looking more like a point than a line
        if (!this.connectEdge(edge, bbox) ||
            !this.clipEdge(edge, bbox) ||
            (abs_fn(edge.va.x-edge.vb.x)<1e-9 && abs_fn(edge.va.y-edge.vb.y)<1e-9)) {
            edge.va = edge.vb = null;
            edges.splice(iEdge,1);
            }
        }
    };

// Close the cells.
// The cells are bound by the supplied bounding box.
// Each cell refers to its associated site, and a list
// of halfedges ordered counterclockwise.
Voronoi.prototype.closeCells = function(bbox) {
    var xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        cells = this.cells,
        iCell = cells.length,
        cell,
        iLeft,
        halfedges, nHalfedges,
        edge,
        va, vb, vz,
        lastBorderSegment,
        abs_fn = Math.abs;

    while (iCell--) {
        cell = cells[iCell];
        // prune, order halfedges counterclockwise, then add missing ones
        // required to close cells
        if (!cell.prepareHalfedges()) {
            continue;
            }
        if (!cell.closeMe) {
            continue;
            }
        // find first 'unclosed' point.
        // an 'unclosed' point will be the end point of a halfedge which
        // does not match the start point of the following halfedge
        halfedges = cell.halfedges;
        nHalfedges = halfedges.length;
        // special case: only one site, in which case, the viewport is the cell
        // ...

        // all other cases
        iLeft = 0;
        while (iLeft < nHalfedges) {
            va = halfedges[iLeft].getEndpoint();
            vz = halfedges[(iLeft+1) % nHalfedges].getStartpoint();
            // if end point is not equal to start point, we need to add the missing
            // halfedge(s) up to vz
            if (abs_fn(va.x-vz.x)>=1e-9 || abs_fn(va.y-vz.y)>=1e-9) {

                // rhill 2013-12-02:
                // "Holes" in the halfedges are not necessarily always adjacent.
                // https://github.com/gorhill/Javascript-Voronoi/issues/16

                // find entry point:
                switch (true) {

                    // walk downward along left side
                    case this.equalWithEpsilon(va.x,xl) && this.lessThanWithEpsilon(va.y,yb):
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xl);
                        vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk rightward along bottom side
                    case this.equalWithEpsilon(va.y,yb) && this.lessThanWithEpsilon(va.x,xr):
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yb);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk upward along right side
                    case this.equalWithEpsilon(va.x,xr) && this.greaterThanWithEpsilon(va.y,yt):
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xr);
                        vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk leftward along top side
                    case this.equalWithEpsilon(va.y,yt) && this.greaterThanWithEpsilon(va.x,xl):
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yt);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk downward along left side
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xl);
                        vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk rightward along bottom side
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yb);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk upward along right side
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xr);
                        vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        // fall through

                    default:
                        throw "Voronoi.closeCells() > this makes no sense!";
                    }
                }
            iLeft++;
            }
        cell.closeMe = false;
        }
    };

// ---------------------------------------------------------------------------
// Debugging helper
/*
Voronoi.prototype.dumpBeachline = function(y) {
    console.log('Voronoi.dumpBeachline(%f) > Beachsections, from left to right:', y);
    if ( !this.beachline ) {
        console.log('  None');
        }
    else {
        var bs = this.beachline.getFirst(this.beachline.root);
        while ( bs ) {
            console.log('  site %d: xl: %f, xr: %f', bs.site.voronoiId, this.leftBreakPoint(bs, y), this.rightBreakPoint(bs, y));
            bs = bs.rbNext;
            }
        }
    };
*/

// ---------------------------------------------------------------------------
// Helper: Quantize sites

// rhill 2013-10-12:
// This is to solve https://github.com/gorhill/Javascript-Voronoi/issues/15
// Since not all users will end up using the kind of coord values which would
// cause the issue to arise, I chose to let the user decide whether or not
// he should sanitize his coord values through this helper. This way, for
// those users who uses coord values which are known to be fine, no overhead is
// added.

Voronoi.prototype.quantizeSites = function(sites) {
    var ε = this.ε,
        n = sites.length,
        site;
    while ( n-- ) {
        site = sites[n];
        site.x = Math.floor(site.x / ε) * ε;
        site.y = Math.floor(site.y / ε) * ε;
        }
    };

// ---------------------------------------------------------------------------
// Helper: Recycle diagram: all vertex, edge and cell objects are
// "surrendered" to the Voronoi object for reuse.
// TODO: rhill-voronoi-core v2: more performance to be gained
// when I change the semantic of what is returned.

Voronoi.prototype.recycle = function(diagram) {
    if ( diagram ) {
        if ( diagram instanceof this.Diagram ) {
            this.toRecycle = diagram;
            }
        else {
            throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
            }
        }
    };

// ---------------------------------------------------------------------------
// Top-level Fortune loop

// rhill 2011-05-19:
//   Voronoi sites are kept client-side now, to allow
//   user to freely modify content. At compute time,
//   *references* to sites are copied locally.

Voronoi.prototype.compute = function(sites, bbox) {
    // to measure execution time
    var startTime = new Date();

    // init internal state
    this.reset();

    // any diagram data available for recycling?
    // I do that here so that this is included in execution time
    if ( this.toRecycle ) {
        this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
        this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
        this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
        this.toRecycle = null;
        }

    // Initialize site event queue
    var siteEvents = sites.slice(0);
    siteEvents.sort(function(a,b){
        var r = b.y - a.y;
        if (r) {return r;}
        return b.x - a.x;
        });

    // process queue
    var site = siteEvents.pop(),
        siteid = 0,
        xsitex, // to avoid duplicate sites
        xsitey,
        cells = this.cells,
        circle;

    // main loop
    for (;;) {
        // we need to figure whether we handle a site or circle event
        // for this we find out if there is a site event and it is
        // 'earlier' than the circle event
        circle = this.firstCircleEvent;

        // add beach section
        if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
            // only if site is not a duplicate
            if (site.x !== xsitex || site.y !== xsitey) {
                // first create cell for new site
                cells[siteid] = this.createCell(site);
                site.voronoiId = siteid++;
                // then create a beachsection for that site
                this.addBeachsection(site);
                // remember last site coords to detect duplicate
                xsitey = site.y;
                xsitex = site.x;
                }
            site = siteEvents.pop();
            }

        // remove beach section
        else if (circle) {
            this.removeBeachsection(circle.arc);
            }

        // all done, quit
        else {
            break;
            }
        }

    // wrapping-up:
    //   connect dangling edges to bounding box
    //   cut edges as per bounding box
    //   discard edges completely outside bounding box
    //   discard edges which are point-like
    this.clipEdges(bbox);

    //   add missing edges in order to close opened cells
    this.closeCells(bbox);

    // to measure execution time
    var stopTime = new Date();

    // prepare return values
    var diagram = new this.Diagram();
    diagram.cells = this.cells;
    diagram.edges = this.edges;
    diagram.vertices = this.vertices;
    diagram.execTime = stopTime.getTime()-startTime.getTime();

    // clean up
    this.reset();

    return diagram;
    };

module.exports = Voronoi;

},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvd2VhdmVyanMvZGlzdC93ZWF2ZXIuanMiLCJzcmMvZm9vZ3JhcGguanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbGF5b3V0LmpzIiwic3JjL3JoaWxsLXZvcm9ub2ktY29yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzluREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuQ29weXJpZ2h0IMKpIDIwMTYgTWF4IEZyYW56XG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbnRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIOKAnFNvZnR3YXJl4oCdKSwgdG8gZGVhbCBpblxudGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xudXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcbm9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkb1xuc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbmNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCDigJxBUyBJU+KAnSwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuU09GVFdBUkUuXG4qL1xuXG4oZnVuY3Rpb24oZil7aWYodHlwZW9mIGV4cG9ydHM9PT1cIm9iamVjdFwiJiZ0eXBlb2YgbW9kdWxlIT09XCJ1bmRlZmluZWRcIil7bW9kdWxlLmV4cG9ydHM9ZigpfWVsc2UgaWYodHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZCl7ZGVmaW5lKFtdLGYpfWVsc2V7dmFyIGc7aWYodHlwZW9mIHdpbmRvdyE9PVwidW5kZWZpbmVkXCIpe2c9d2luZG93fWVsc2UgaWYodHlwZW9mIGdsb2JhbCE9PVwidW5kZWZpbmVkXCIpe2c9Z2xvYmFsfWVsc2UgaWYodHlwZW9mIHNlbGYhPT1cInVuZGVmaW5lZFwiKXtnPXNlbGZ9ZWxzZXtnPXRoaXN9Zy53ZWF2ZXIgPSBmKCl9fSkoZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBpcyA9IF9kZXJlcV8oJy4vaXMnKTtcbnZhciB1dGlsID0gX2RlcmVxXygnLi91dGlsJyk7XG52YXIgUHJvbWlzZSA9IF9kZXJlcV8oJy4vcHJvbWlzZScpO1xudmFyIEV2ZW50ID0gX2RlcmVxXygnLi9ldmVudCcpO1xuXG52YXIgZGVmaW5lID0ge1xuXG4gIC8vIGV2ZW50IGZ1bmN0aW9uIHJldXNhYmxlIHN0dWZmXG4gIGV2ZW50OiB7XG4gICAgcmVnZXg6IC8oXFx3KykoXFwuXFx3Kyk/LywgLy8gcmVnZXggZm9yIG1hdGNoaW5nIGV2ZW50IHN0cmluZ3MgKGUuZy4gXCJjbGljay5uYW1lc3BhY2VcIilcbiAgICBvcHRpb25hbFR5cGVSZWdleDogLyhcXHcrKT8oXFwuXFx3Kyk/LyxcbiAgICBmYWxzZUNhbGxiYWNrOiBmdW5jdGlvbigpeyByZXR1cm4gZmFsc2U7IH1cbiAgfSxcblxuICAvLyBldmVudCBiaW5kaW5nXG4gIG9uOiBmdW5jdGlvbiggcGFyYW1zICl7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgdW5iaW5kU2VsZk9uVHJpZ2dlcjogZmFsc2UsXG4gICAgICB1bmJpbmRBbGxCaW5kZXJzT25UcmlnZ2VyOiBmYWxzZVxuICAgIH07XG4gICAgcGFyYW1zID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBwYXJhbXMpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9uSW1wbChldmVudHMsIGRhdGEsIGNhbGxiYWNrKXtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBzZWxmSXNBcnJheUxpa2UgPSBzZWxmLmxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgdmFyIGFsbCA9IHNlbGZJc0FycmF5TGlrZSA/IHNlbGYgOiBbc2VsZl07IC8vIHB1dCBpbiBhcnJheSBpZiBub3QgYXJyYXktbGlrZVxuICAgICAgdmFyIGV2ZW50c0lzU3RyaW5nID0gaXMuc3RyaW5nKGV2ZW50cyk7XG4gICAgICB2YXIgcCA9IHBhcmFtcztcblxuICAgICAgaWYoIGlzLmZuKGRhdGEpIHx8IGRhdGEgPT09IGZhbHNlICl7IC8vIGRhdGEgaXMgYWN0dWFsbHkgY2FsbGJhY2tcbiAgICAgICAgY2FsbGJhY2sgPSBkYXRhO1xuICAgICAgICBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGVyZSBpc24ndCBhIGNhbGxiYWNrLCB3ZSBjYW4ndCByZWFsbHkgZG8gYW55dGhpbmdcbiAgICAgIC8vIChjYW4ndCBzcGVhayBmb3IgbWFwcGVkIGV2ZW50cyBhcmcgdmVyc2lvbilcbiAgICAgIGlmKCAhKGlzLmZuKGNhbGxiYWNrKSB8fCBjYWxsYmFjayA9PT0gZmFsc2UpICYmIGV2ZW50c0lzU3RyaW5nICl7XG4gICAgICAgIHJldHVybiBzZWxmOyAvLyBtYWludGFpbiBjaGFpbmluZ1xuICAgICAgfVxuXG4gICAgICBpZiggZXZlbnRzSXNTdHJpbmcgKXsgLy8gdGhlbiBjb252ZXJ0IHRvIG1hcFxuICAgICAgICB2YXIgbWFwID0ge307XG4gICAgICAgIG1hcFsgZXZlbnRzIF0gPSBjYWxsYmFjaztcbiAgICAgICAgZXZlbnRzID0gbWFwO1xuICAgICAgfVxuXG4gICAgICBmb3IoIHZhciBldnRzIGluIGV2ZW50cyApe1xuICAgICAgICBjYWxsYmFjayA9IGV2ZW50c1tldnRzXTtcbiAgICAgICAgaWYoIGNhbGxiYWNrID09PSBmYWxzZSApe1xuICAgICAgICAgIGNhbGxiYWNrID0gZGVmaW5lLmV2ZW50LmZhbHNlQ2FsbGJhY2s7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggIWlzLmZuKGNhbGxiYWNrKSApeyBjb250aW51ZTsgfVxuXG4gICAgICAgIGV2dHMgPSBldnRzLnNwbGl0KC9cXHMrLyk7XG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkrKyApe1xuICAgICAgICAgIHZhciBldnQgPSBldnRzW2ldO1xuICAgICAgICAgIGlmKCBpcy5lbXB0eVN0cmluZyhldnQpICl7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICB2YXIgbWF0Y2ggPSBldnQubWF0Y2goIGRlZmluZS5ldmVudC5yZWdleCApOyAvLyB0eXBlWy5uYW1lc3BhY2VdXG5cbiAgICAgICAgICBpZiggbWF0Y2ggKXtcbiAgICAgICAgICAgIHZhciB0eXBlID0gbWF0Y2hbMV07XG4gICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gbWF0Y2hbMl0gPyBtYXRjaFsyXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgdmFyIGxpc3RlbmVyID0ge1xuICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssIC8vIGNhbGxiYWNrIHRvIHJ1blxuICAgICAgICAgICAgICBkYXRhOiBkYXRhLCAvLyBleHRyYSBkYXRhIGluIGV2ZW50T2JqLmRhdGFcbiAgICAgICAgICAgICAgdHlwZTogdHlwZSwgLy8gdGhlIGV2ZW50IHR5cGUgKGUuZy4gJ2NsaWNrJylcbiAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2UsIC8vIHRoZSBldmVudCBuYW1lc3BhY2UgKGUuZy4gXCIuZm9vXCIpXG4gICAgICAgICAgICAgIHVuYmluZFNlbGZPblRyaWdnZXI6IHAudW5iaW5kU2VsZk9uVHJpZ2dlcixcbiAgICAgICAgICAgICAgdW5iaW5kQWxsQmluZGVyc09uVHJpZ2dlcjogcC51bmJpbmRBbGxCaW5kZXJzT25UcmlnZ2VyLFxuICAgICAgICAgICAgICBiaW5kZXJzOiBhbGwgLy8gd2hvIGJvdW5kIHRvZ2V0aGVyXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IoIHZhciBqID0gMDsgaiA8IGFsbC5sZW5ndGg7IGorKyApe1xuICAgICAgICAgICAgICB2YXIgX3AgPSBhbGxbal0uX3ByaXZhdGU7XG5cbiAgICAgICAgICAgICAgX3AubGlzdGVuZXJzID0gX3AubGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICAgICAgICBfcC5saXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gLy8gZm9yIGV2ZW50cyBhcnJheVxuICAgICAgfSAvLyBmb3IgZXZlbnRzIG1hcFxuXG4gICAgICByZXR1cm4gc2VsZjsgLy8gbWFpbnRhaW4gY2hhaW5pbmdcbiAgICB9OyAvLyBmdW5jdGlvblxuICB9LCAvLyBvblxuXG4gIGV2ZW50QWxpYXNlc09uOiBmdW5jdGlvbiggcHJvdG8gKXtcbiAgICB2YXIgcCA9IHByb3RvO1xuXG4gICAgcC5hZGRMaXN0ZW5lciA9IHAubGlzdGVuID0gcC5iaW5kID0gcC5vbjtcbiAgICBwLnJlbW92ZUxpc3RlbmVyID0gcC51bmxpc3RlbiA9IHAudW5iaW5kID0gcC5vZmY7XG4gICAgcC5lbWl0ID0gcC50cmlnZ2VyO1xuXG4gICAgLy8gdGhpcyBpcyBqdXN0IGEgd3JhcHBlciBhbGlhcyBvZiAub24oKVxuICAgIHAucG9uID0gcC5wcm9taXNlT24gPSBmdW5jdGlvbiggZXZlbnRzLCBzZWxlY3RvciApe1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAwICk7XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICl7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCBlICl7XG4gICAgICAgICAgc2VsZi5vZmYuYXBwbHkoIHNlbGYsIG9mZkFyZ3MgKTtcblxuICAgICAgICAgIHJlc29sdmUoIGUgKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb25BcmdzID0gYXJncy5jb25jYXQoWyBjYWxsYmFjayBdKTtcbiAgICAgICAgdmFyIG9mZkFyZ3MgPSBvbkFyZ3MuY29uY2F0KFtdKTtcblxuICAgICAgICBzZWxmLm9uLmFwcGx5KCBzZWxmLCBvbkFyZ3MgKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbiBvZmZJbXBsKCBwYXJhbXMgKXtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgfTtcbiAgICBwYXJhbXMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnRzLCBjYWxsYmFjayl7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc2VsZklzQXJyYXlMaWtlID0gc2VsZi5sZW5ndGggIT09IHVuZGVmaW5lZDtcbiAgICAgIHZhciBhbGwgPSBzZWxmSXNBcnJheUxpa2UgPyBzZWxmIDogW3NlbGZdOyAvLyBwdXQgaW4gYXJyYXkgaWYgbm90IGFycmF5LWxpa2VcbiAgICAgIHZhciBldmVudHNJc1N0cmluZyA9IGlzLnN0cmluZyhldmVudHMpO1xuXG4gICAgICBpZiggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCApeyAvLyB0aGVuIHVuYmluZCBhbGxcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGFsbC5sZW5ndGg7IGkrKyApe1xuICAgICAgICAgIGFsbFtpXS5fcHJpdmF0ZS5saXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxmOyAvLyBtYWludGFpbiBjaGFpbmluZ1xuICAgICAgfVxuXG4gICAgICBpZiggZXZlbnRzSXNTdHJpbmcgKXsgLy8gdGhlbiBjb252ZXJ0IHRvIG1hcFxuICAgICAgICB2YXIgbWFwID0ge307XG4gICAgICAgIG1hcFsgZXZlbnRzIF0gPSBjYWxsYmFjaztcbiAgICAgICAgZXZlbnRzID0gbWFwO1xuICAgICAgfVxuXG4gICAgICBmb3IoIHZhciBldnRzIGluIGV2ZW50cyApe1xuICAgICAgICBjYWxsYmFjayA9IGV2ZW50c1tldnRzXTtcblxuICAgICAgICBpZiggY2FsbGJhY2sgPT09IGZhbHNlICl7XG4gICAgICAgICAgY2FsbGJhY2sgPSBkZWZpbmUuZXZlbnQuZmFsc2VDYWxsYmFjaztcbiAgICAgICAgfVxuXG4gICAgICAgIGV2dHMgPSBldnRzLnNwbGl0KC9cXHMrLyk7XG4gICAgICAgIGZvciggdmFyIGggPSAwOyBoIDwgZXZ0cy5sZW5ndGg7IGgrKyApe1xuICAgICAgICAgIHZhciBldnQgPSBldnRzW2hdO1xuICAgICAgICAgIGlmKCBpcy5lbXB0eVN0cmluZyhldnQpICl7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICB2YXIgbWF0Y2ggPSBldnQubWF0Y2goIGRlZmluZS5ldmVudC5vcHRpb25hbFR5cGVSZWdleCApOyAvLyBbdHlwZV1bLm5hbWVzcGFjZV1cbiAgICAgICAgICBpZiggbWF0Y2ggKXtcbiAgICAgICAgICAgIHZhciB0eXBlID0gbWF0Y2hbMV0gPyBtYXRjaFsxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBtYXRjaFsyXSA/IG1hdGNoWzJdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGFsbC5sZW5ndGg7IGkrKyApeyAvL1xuICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gYWxsW2ldLl9wcml2YXRlLmxpc3RlbmVycyA9IGFsbFtpXS5fcHJpdmF0ZS5saXN0ZW5lcnMgfHwgW107XG5cbiAgICAgICAgICAgICAgZm9yKCB2YXIgaiA9IDA7IGogPCBsaXN0ZW5lcnMubGVuZ3RoOyBqKysgKXtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbal07XG4gICAgICAgICAgICAgICAgdmFyIG5zTWF0Y2hlcyA9ICFuYW1lc3BhY2UgfHwgbmFtZXNwYWNlID09PSBsaXN0ZW5lci5uYW1lc3BhY2U7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGVNYXRjaGVzID0gIXR5cGUgfHwgbGlzdGVuZXIudHlwZSA9PT0gdHlwZTtcbiAgICAgICAgICAgICAgICB2YXIgY2JNYXRjaGVzID0gIWNhbGxiYWNrIHx8IGNhbGxiYWNrID09PSBsaXN0ZW5lci5jYWxsYmFjaztcbiAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJNYXRjaGVzID0gbnNNYXRjaGVzICYmIHR5cGVNYXRjaGVzICYmIGNiTWF0Y2hlcztcblxuICAgICAgICAgICAgICAgIC8vIGRlbGV0ZSBsaXN0ZW5lciBpZiBpdCBtYXRjaGVzXG4gICAgICAgICAgICAgICAgaWYoIGxpc3RlbmVyTWF0Y2hlcyApe1xuICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gLy8gZm9yIGxpc3RlbmVyc1xuICAgICAgICAgICAgfSAvLyBmb3IgYWxsXG4gICAgICAgICAgfSAvLyBpZiBtYXRjaFxuICAgICAgICB9IC8vIGZvciBldmVudHMgYXJyYXlcblxuICAgICAgfSAvLyBmb3IgZXZlbnRzIG1hcFxuXG4gICAgICByZXR1cm4gc2VsZjsgLy8gbWFpbnRhaW4gY2hhaW5pbmdcbiAgICB9OyAvLyBmdW5jdGlvblxuICB9LCAvLyBvZmZcblxuICB0cmlnZ2VyOiBmdW5jdGlvbiggcGFyYW1zICl7XG4gICAgdmFyIGRlZmF1bHRzID0ge307XG4gICAgcGFyYW1zID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBwYXJhbXMpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHRyaWdnZXJJbXBsKGV2ZW50cywgZXh0cmFQYXJhbXMsIGZuVG9UcmlnZ2VyKXtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBzZWxmSXNBcnJheUxpa2UgPSBzZWxmLmxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgdmFyIGFsbCA9IHNlbGZJc0FycmF5TGlrZSA/IHNlbGYgOiBbc2VsZl07IC8vIHB1dCBpbiBhcnJheSBpZiBub3QgYXJyYXktbGlrZVxuICAgICAgdmFyIGV2ZW50c0lzU3RyaW5nID0gaXMuc3RyaW5nKGV2ZW50cyk7XG4gICAgICB2YXIgZXZlbnRzSXNPYmplY3QgPSBpcy5wbGFpbk9iamVjdChldmVudHMpO1xuICAgICAgdmFyIGV2ZW50c0lzRXZlbnQgPSBpcy5ldmVudChldmVudHMpO1xuXG4gICAgICBpZiggZXZlbnRzSXNTdHJpbmcgKXsgLy8gdGhlbiBtYWtlIGEgcGxhaW4gZXZlbnQgb2JqZWN0IGZvciBlYWNoIGV2ZW50IG5hbWVcbiAgICAgICAgdmFyIGV2dHMgPSBldmVudHMuc3BsaXQoL1xccysvKTtcbiAgICAgICAgZXZlbnRzID0gW107XG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSsrICl7XG4gICAgICAgICAgdmFyIGV2dCA9IGV2dHNbaV07XG4gICAgICAgICAgaWYoIGlzLmVtcHR5U3RyaW5nKGV2dCkgKXsgY29udGludWU7IH1cblxuICAgICAgICAgIHZhciBtYXRjaCA9IGV2dC5tYXRjaCggZGVmaW5lLmV2ZW50LnJlZ2V4ICk7IC8vIHR5cGVbLm5hbWVzcGFjZV1cbiAgICAgICAgICB2YXIgdHlwZSA9IG1hdGNoWzFdO1xuICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBtYXRjaFsyXSA/IG1hdGNoWzJdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgZXZlbnRzLnB1c2goIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IG5hbWVzcGFjZVxuICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKCBldmVudHNJc09iamVjdCApeyAvLyBwdXQgaW4gbGVuZ3RoIDEgYXJyYXlcbiAgICAgICAgdmFyIGV2ZW50QXJnT2JqID0gZXZlbnRzO1xuXG4gICAgICAgIGV2ZW50cyA9IFsgZXZlbnRBcmdPYmogXTtcbiAgICAgIH1cblxuICAgICAgaWYoIGV4dHJhUGFyYW1zICl7XG4gICAgICAgIGlmKCAhaXMuYXJyYXkoZXh0cmFQYXJhbXMpICl7IC8vIG1ha2Ugc3VyZSBleHRyYSBwYXJhbXMgYXJlIGluIGFuIGFycmF5IGlmIHNwZWNpZmllZFxuICAgICAgICAgIGV4dHJhUGFyYW1zID0gWyBleHRyYVBhcmFtcyBdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBvdGhlcndpc2UsIHdlJ3ZlIGdvdCBub3RoaW5nXG4gICAgICAgIGV4dHJhUGFyYW1zID0gW107XG4gICAgICB9XG5cbiAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrICl7IC8vIHRyaWdnZXIgZWFjaCBldmVudCBpbiBvcmRlclxuICAgICAgICB2YXIgZXZ0T2JqID0gZXZlbnRzW2ldO1xuXG4gICAgICAgIGZvciggdmFyIGogPSAwOyBqIDwgYWxsLmxlbmd0aDsgaisrICl7IC8vIGZvciBlYWNoXG4gICAgICAgICAgdmFyIHRyaWdnZXJlciA9IGFsbFtqXTtcbiAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gdHJpZ2dlcmVyLl9wcml2YXRlLmxpc3RlbmVycyA9IHRyaWdnZXJlci5fcHJpdmF0ZS5saXN0ZW5lcnMgfHwgW107XG4gICAgICAgICAgdmFyIGJ1YmJsZVVwID0gZmFsc2U7XG5cbiAgICAgICAgICAvLyBjcmVhdGUgdGhlIGV2ZW50IGZvciB0aGlzIGVsZW1lbnQgZnJvbSB0aGUgZXZlbnQgb2JqZWN0XG4gICAgICAgICAgdmFyIGV2dDtcblxuICAgICAgICAgIGlmKCBldmVudHNJc0V2ZW50ICl7IC8vIHRoZW4ganVzdCBnZXQgdGhlIG9iamVjdFxuICAgICAgICAgICAgZXZ0ID0gZXZ0T2JqO1xuXG4gICAgICAgICAgfSBlbHNlIHsgLy8gdGhlbiB3ZSBoYXZlIHRvIG1ha2Ugb25lXG4gICAgICAgICAgICBldnQgPSBuZXcgRXZlbnQoIGV2dE9iaiwge1xuICAgICAgICAgICAgICBuYW1lc3BhY2U6IGV2dE9iai5uYW1lc3BhY2VcbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiggZm5Ub1RyaWdnZXIgKXsgLy8gdGhlbiBvdmVycmlkZSB0aGUgbGlzdGVuZXJzIGxpc3Qgd2l0aCBqdXN0IHRoZSBvbmUgd2Ugc3BlY2lmaWVkXG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBbe1xuICAgICAgICAgICAgICBuYW1lc3BhY2U6IGV2dC5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgIHR5cGU6IGV2dC50eXBlLFxuICAgICAgICAgICAgICBjYWxsYmFjazogZm5Ub1RyaWdnZXJcbiAgICAgICAgICAgIH1dO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciggdmFyIGsgPSAwOyBrIDwgbGlzdGVuZXJzLmxlbmd0aDsgaysrICl7IC8vIGNoZWNrIGVhY2ggbGlzdGVuZXJcbiAgICAgICAgICAgIHZhciBsaXMgPSBsaXN0ZW5lcnNba107XG4gICAgICAgICAgICB2YXIgbnNNYXRjaGVzID0gIWxpcy5uYW1lc3BhY2UgfHwgbGlzLm5hbWVzcGFjZSA9PT0gZXZ0Lm5hbWVzcGFjZTtcbiAgICAgICAgICAgIHZhciB0eXBlTWF0Y2hlcyA9IGxpcy50eXBlID09PSBldnQudHlwZTtcbiAgICAgICAgICAgIHZhciB0YXJnZXRNYXRjaGVzID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lck1hdGNoZXMgPSBuc01hdGNoZXMgJiYgdHlwZU1hdGNoZXMgJiYgdGFyZ2V0TWF0Y2hlcztcblxuICAgICAgICAgICAgaWYoIGxpc3RlbmVyTWF0Y2hlcyApeyAvLyB0aGVuIHRyaWdnZXIgaXRcbiAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbIGV2dCBdO1xuICAgICAgICAgICAgICBhcmdzID0gYXJncy5jb25jYXQoIGV4dHJhUGFyYW1zICk7IC8vIGFkZCBleHRyYSBwYXJhbXMgdG8gYXJncyBsaXN0XG5cbiAgICAgICAgICAgICAgaWYoIGxpcy5kYXRhICl7IC8vIGFkZCBvbiBkYXRhIHBsdWdnZWQgaW50byBiaW5kaW5nXG4gICAgICAgICAgICAgICAgZXZ0LmRhdGEgPSBsaXMuZGF0YTtcbiAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gb3IgY2xlYXIgaXQgaW4gY2FzZSB0aGUgZXZlbnQgb2JqIGlzIHJldXNlZFxuICAgICAgICAgICAgICAgIGV2dC5kYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYoIGxpcy51bmJpbmRTZWxmT25UcmlnZ2VyIHx8IGxpcy51bmJpbmRBbGxCaW5kZXJzT25UcmlnZ2VyICl7IC8vIHRoZW4gcmVtb3ZlIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShrLCAxKTtcbiAgICAgICAgICAgICAgICBrLS07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiggbGlzLnVuYmluZEFsbEJpbmRlcnNPblRyaWdnZXIgKXsgLy8gdGhlbiBkZWxldGUgdGhlIGxpc3RlbmVyIGZvciBhbGwgYmluZGVyc1xuICAgICAgICAgICAgICAgIHZhciBiaW5kZXJzID0gbGlzLmJpbmRlcnM7XG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgbCA9IDA7IGwgPCBiaW5kZXJzLmxlbmd0aDsgbCsrICl7XG4gICAgICAgICAgICAgICAgICB2YXIgYmluZGVyID0gYmluZGVyc1tsXTtcbiAgICAgICAgICAgICAgICAgIGlmKCAhYmluZGVyIHx8IGJpbmRlciA9PT0gdHJpZ2dlcmVyICl7IGNvbnRpbnVlOyB9IC8vIGFscmVhZHkgaGFuZGxlZCB0cmlnZ2VyZXIgb3Igd2UgY2FuJ3QgaGFuZGxlIGl0XG5cbiAgICAgICAgICAgICAgICAgIHZhciBiaW5kZXJMaXN0ZW5lcnMgPSBiaW5kZXIuX3ByaXZhdGUubGlzdGVuZXJzO1xuICAgICAgICAgICAgICAgICAgZm9yKCB2YXIgbSA9IDA7IG0gPCBiaW5kZXJMaXN0ZW5lcnMubGVuZ3RoOyBtKysgKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRlckxpc3RlbmVyID0gYmluZGVyTGlzdGVuZXJzW21dO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCBiaW5kZXJMaXN0ZW5lciA9PT0gbGlzICl7IC8vIGRlbGV0ZSBsaXN0ZW5lciBmcm9tIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICBiaW5kZXJMaXN0ZW5lcnMuc3BsaWNlKG0sIDEpO1xuICAgICAgICAgICAgICAgICAgICAgIG0tLTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIHJ1biB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0cmlnZ2VyZXI7XG4gICAgICAgICAgICAgIHZhciByZXQgPSBsaXMuY2FsbGJhY2suYXBwbHkoIGNvbnRleHQsIGFyZ3MgKTtcblxuICAgICAgICAgICAgICBpZiggcmV0ID09PSBmYWxzZSB8fCBldnQuaXNQcm9wYWdhdGlvblN0b3BwZWQoKSApe1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gZG9uJ3QgYnViYmxlXG4gICAgICAgICAgICAgICAgYnViYmxlVXAgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmKCByZXQgPT09IGZhbHNlICl7XG4gICAgICAgICAgICAgICAgICAvLyByZXR1cm5pbmcgZmFsc2UgaXMgYSBzaG9ydGhhbmQgZm9yIHN0b3BwaW5nIHByb3BhZ2F0aW9uIGFuZCBwcmV2ZW50aW5nIHRoZSBkZWYuIGFjdGlvblxuICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IC8vIGlmIGxpc3RlbmVyIG1hdGNoZXNcbiAgICAgICAgICB9IC8vIGZvciBlYWNoIGxpc3RlbmVyXG5cbiAgICAgICAgICBpZiggYnViYmxlVXAgKXtcbiAgICAgICAgICAgIC8vIFRPRE8gaWYgYnViYmxpbmcgaXMgc3VwcG9ydGVkLi4uXG4gICAgICAgICAgfVxuXG4gICAgICAgIH0gLy8gZm9yIGVhY2ggb2YgYWxsXG4gICAgICB9IC8vIGZvciBlYWNoIGV2ZW50XG5cbiAgICAgIHJldHVybiBzZWxmOyAvLyBtYWludGFpbiBjaGFpbmluZ1xuICAgIH07IC8vIGZ1bmN0aW9uXG4gIH0gLy8gdHJpZ2dlclxuXG59OyAvLyBkZWZpbmVcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmU7XG5cbn0se1wiLi9ldmVudFwiOjIsXCIuL2lzXCI6NSxcIi4vcHJvbWlzZVwiOjYsXCIuL3V0aWxcIjo4fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvanF1ZXJ5L2Jsb2IvbWFzdGVyL3NyYy9ldmVudC5qc1xuXG52YXIgRXZlbnQgPSBmdW5jdGlvbiggc3JjLCBwcm9wcyApIHtcbiAgLy8gQWxsb3cgaW5zdGFudGlhdGlvbiB3aXRob3V0IHRoZSAnbmV3JyBrZXl3b3JkXG4gIGlmICggISh0aGlzIGluc3RhbmNlb2YgRXZlbnQpICkge1xuICAgIHJldHVybiBuZXcgRXZlbnQoIHNyYywgcHJvcHMgKTtcbiAgfVxuXG4gIC8vIEV2ZW50IG9iamVjdFxuICBpZiAoIHNyYyAmJiBzcmMudHlwZSApIHtcbiAgICB0aGlzLm9yaWdpbmFsRXZlbnQgPSBzcmM7XG4gICAgdGhpcy50eXBlID0gc3JjLnR5cGU7XG5cbiAgICAvLyBFdmVudHMgYnViYmxpbmcgdXAgdGhlIGRvY3VtZW50IG1heSBoYXZlIGJlZW4gbWFya2VkIGFzIHByZXZlbnRlZFxuICAgIC8vIGJ5IGEgaGFuZGxlciBsb3dlciBkb3duIHRoZSB0cmVlOyByZWZsZWN0IHRoZSBjb3JyZWN0IHZhbHVlLlxuICAgIHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gKCBzcmMuZGVmYXVsdFByZXZlbnRlZCApID8gcmV0dXJuVHJ1ZSA6IHJldHVybkZhbHNlO1xuXG4gIC8vIEV2ZW50IHR5cGVcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnR5cGUgPSBzcmM7XG4gIH1cblxuICAvLyBQdXQgZXhwbGljaXRseSBwcm92aWRlZCBwcm9wZXJ0aWVzIG9udG8gdGhlIGV2ZW50IG9iamVjdFxuICBpZiAoIHByb3BzICkge1xuXG4gICAgLy8gbW9yZSBlZmZpY2llbnQgdG8gbWFudWFsbHkgY29weSBmaWVsZHMgd2UgdXNlXG4gICAgdGhpcy50eXBlID0gcHJvcHMudHlwZSAhPT0gdW5kZWZpbmVkID8gcHJvcHMudHlwZSA6IHRoaXMudHlwZTtcbiAgICB0aGlzLm5hbWVzcGFjZSA9IHByb3BzLm5hbWVzcGFjZTtcbiAgICB0aGlzLmxheW91dCA9IHByb3BzLmxheW91dDtcbiAgICB0aGlzLmRhdGEgPSBwcm9wcy5kYXRhO1xuICAgIHRoaXMubWVzc2FnZSA9IHByb3BzLm1lc3NhZ2U7XG4gIH1cblxuICAvLyBDcmVhdGUgYSB0aW1lc3RhbXAgaWYgaW5jb21pbmcgZXZlbnQgZG9lc24ndCBoYXZlIG9uZVxuICB0aGlzLnRpbWVTdGFtcCA9IHNyYyAmJiBzcmMudGltZVN0YW1wIHx8ICtuZXcgRGF0ZSgpO1xufTtcblxuZnVuY3Rpb24gcmV0dXJuRmFsc2UoKSB7XG4gIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHJldHVyblRydWUoKSB7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBqUXVlcnkuRXZlbnQgaXMgYmFzZWQgb24gRE9NMyBFdmVudHMgYXMgc3BlY2lmaWVkIGJ5IHRoZSBFQ01BU2NyaXB0IExhbmd1YWdlIEJpbmRpbmdcbi8vIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDMvV0QtRE9NLUxldmVsLTMtRXZlbnRzLTIwMDMwMzMxL2VjbWEtc2NyaXB0LWJpbmRpbmcuaHRtbFxuRXZlbnQucHJvdG90eXBlID0ge1xuICBpbnN0YW5jZVN0cmluZzogZnVuY3Rpb24oKXsgcmV0dXJuICdldmVudCc7IH0sXG5cbiAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gcmV0dXJuVHJ1ZTtcblxuICAgIHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuICAgIGlmICggIWUgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaWYgcHJldmVudERlZmF1bHQgZXhpc3RzIHJ1biBpdCBvbiB0aGUgb3JpZ2luYWwgZXZlbnRcbiAgICBpZiAoIGUucHJldmVudERlZmF1bHQgKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1Byb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cbiAgICB2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcbiAgICBpZiAoICFlICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBpZiBzdG9wUHJvcGFnYXRpb24gZXhpc3RzIHJ1biBpdCBvbiB0aGUgb3JpZ2luYWwgZXZlbnRcbiAgICBpZiAoIGUuc3RvcFByb3BhZ2F0aW9uICkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9LFxuXG4gIGlzRGVmYXVsdFByZXZlbnRlZDogcmV0dXJuRmFsc2UsXG4gIGlzUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcbiAgaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnQ7XG5cbn0se31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLyohIFdlYXZlciBsaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vdGxkcmxlZ2FsLmNvbS9saWNlbnNlL21pdC1saWNlbnNlKSwgY29weXJpZ2h0IE1heCBGcmFueiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpcyA9IF9kZXJlcV8oJy4vaXMnKTtcbnZhciB1dGlsID0gX2RlcmVxXygnLi91dGlsJyk7XG52YXIgVGhyZWFkID0gX2RlcmVxXygnLi90aHJlYWQnKTtcbnZhciBQcm9taXNlID0gX2RlcmVxXygnLi9wcm9taXNlJyk7XG52YXIgZGVmaW5lID0gX2RlcmVxXygnLi9kZWZpbmUnKTtcblxudmFyIEZhYnJpYyA9IGZ1bmN0aW9uKCBOICl7XG4gIGlmKCAhKHRoaXMgaW5zdGFuY2VvZiBGYWJyaWMpICl7XG4gICAgcmV0dXJuIG5ldyBGYWJyaWMoIE4gKTtcbiAgfVxuXG4gIHRoaXMuX3ByaXZhdGUgPSB7XG4gICAgcGFzczogW11cbiAgfTtcblxuICB2YXIgZGVmTiA9IDQ7XG5cbiAgaWYoIGlzLm51bWJlcihOKSApe1xuICAgIC8vIHRoZW4gdXNlIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIHRocmVhZHNcbiAgfSBpZiggdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLmhhcmR3YXJlQ29uY3VycmVuY3kgIT0gbnVsbCApe1xuICAgIE4gPSBuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeTtcbiAgfSBlbHNlIHtcbiAgICB0cnl7XG4gICAgICBOID0gX2RlcmVxXygnb3MnKS5jcHVzKCkubGVuZ3RoO1xuICAgIH0gY2F0Y2goIGVyciApe1xuICAgICAgTiA9IGRlZk47XG4gICAgfVxuICB9IC8vIFRPRE8gY291bGQgdXNlIGFuIGVzdGltYXRpb24gaGVyZSBidXQgd291bGQgdGhlIGFkZGl0aW9uYWwgZXhwZW5zZSBiZSB3b3J0aCBpdD9cblxuICBmb3IoIHZhciBpID0gMDsgaSA8IE47IGkrKyApe1xuICAgIHRoaXNbaV0gPSBuZXcgVGhyZWFkKCk7XG4gIH1cblxuICB0aGlzLmxlbmd0aCA9IE47XG59O1xuXG52YXIgZmFiZm4gPSBGYWJyaWMucHJvdG90eXBlOyAvLyBzaG9ydCBhbGlhc1xuXG51dGlsLmV4dGVuZChmYWJmbiwge1xuXG4gIGluc3RhbmNlU3RyaW5nOiBmdW5jdGlvbigpeyByZXR1cm4gJ2ZhYnJpYyc7IH0sXG5cbiAgLy8gcmVxdWlyZSBmbiBpbiBhbGwgdGhyZWFkc1xuICByZXF1aXJlOiBmdW5jdGlvbiggZm4sIGFzICl7XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrICl7XG4gICAgICB2YXIgdGhyZWFkID0gdGhpc1tpXTtcblxuICAgICAgdGhyZWFkLnJlcXVpcmUoIGZuLCBhcyApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIGdldCBhIHJhbmRvbSB0aHJlYWRcbiAgcmFuZG9tOiBmdW5jdGlvbigpe1xuICAgIHZhciBpID0gTWF0aC5yb3VuZCggKHRoaXMubGVuZ3RoIC0gMSkgKiBNYXRoLnJhbmRvbSgpICk7XG4gICAgdmFyIHRocmVhZCA9IHRoaXNbaV07XG5cbiAgICByZXR1cm4gdGhyZWFkO1xuICB9LFxuXG4gIC8vIHJ1biBvbiByYW5kb20gdGhyZWFkXG4gIHJ1bjogZnVuY3Rpb24oIGZuICl7XG4gICAgdmFyIHBhc3MgPSB0aGlzLl9wcml2YXRlLnBhc3Muc2hpZnQoKTtcblxuICAgIHJldHVybiB0aGlzLnJhbmRvbSgpLnBhc3MoIHBhc3MgKS5ydW4oIGZuICk7XG4gIH0sXG5cbiAgLy8gc2VuZHMgYSByYW5kb20gdGhyZWFkIGEgbWVzc2FnZVxuICBtZXNzYWdlOiBmdW5jdGlvbiggbSApe1xuICAgIHJldHVybiB0aGlzLnJhbmRvbSgpLm1lc3NhZ2UoIG0gKTtcbiAgfSxcblxuICAvLyBzZW5kIGFsbCB0aHJlYWRzIGEgbWVzc2FnZVxuICBicm9hZGNhc3Q6IGZ1bmN0aW9uKCBtICl7XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrICl7XG4gICAgICB2YXIgdGhyZWFkID0gdGhpc1tpXTtcblxuICAgICAgdGhyZWFkLm1lc3NhZ2UoIG0gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcbiAgfSxcblxuICAvLyBzdG9wIGFsbCB0aHJlYWRzXG4gIHN0b3A6IGZ1bmN0aW9uKCl7XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrICl7XG4gICAgICB2YXIgdGhyZWFkID0gdGhpc1tpXTtcblxuICAgICAgdGhyZWFkLnN0b3AoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcbiAgfSxcblxuICAvLyBwYXNzIGRhdGEgdG8gYmUgdXNlZCB3aXRoIC5zcHJlYWQoKSBldGMuXG4gIHBhc3M6IGZ1bmN0aW9uKCBkYXRhICl7XG4gICAgdmFyIHBhc3MgPSB0aGlzLl9wcml2YXRlLnBhc3M7XG5cbiAgICBpZiggaXMuYXJyYXkoZGF0YSkgKXtcbiAgICAgIHBhc3MucHVzaCggZGF0YSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyAnT25seSBhcnJheXMgbWF5IGJlIHVzZWQgd2l0aCBmYWJyaWMucGFzcygpJztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcbiAgfSxcblxuICBzcHJlYWRTaXplOiBmdW5jdGlvbigpe1xuICAgIHZhciBzdWJzaXplID0gIE1hdGguY2VpbCggdGhpcy5fcHJpdmF0ZS5wYXNzWzBdLmxlbmd0aCAvIHRoaXMubGVuZ3RoICk7XG5cbiAgICBzdWJzaXplID0gTWF0aC5tYXgoIDEsIHN1YnNpemUgKTsgLy8gZG9uJ3QgcGFzcyBsZXNzIHRoYW4gb25lIGVsZSB0byBlYWNoIHRocmVhZFxuXG4gICAgcmV0dXJuIHN1YnNpemU7XG4gIH0sXG5cbiAgLy8gc3BsaXQgdGhlIGRhdGEgaW50byBzbGljZXMgdG8gc3ByZWFkIHRoZSBkYXRhIGVxdWFsbHkgYW1vbmcgdGhyZWFkc1xuICBzcHJlYWQ6IGZ1bmN0aW9uKCBmbiApe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgX3AgPSBzZWxmLl9wcml2YXRlO1xuICAgIHZhciBzdWJzaXplID0gc2VsZi5zcHJlYWRTaXplKCk7IC8vIG51bWJlciBvZiBwYXNzIGVsZXMgdG8gaGFuZGxlIGluIGVhY2ggdGhyZWFkXG4gICAgdmFyIHBhc3MgPSBfcC5wYXNzLnNoaWZ0KCkuY29uY2F0KFtdKTsgLy8ga2VlcCBhIGNvcHlcbiAgICB2YXIgcnVuUHMgPSBbXTtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKyApe1xuICAgICAgdmFyIHRocmVhZCA9IHRoaXNbaV07XG4gICAgICB2YXIgc2xpY2UgPSBwYXNzLnNwbGljZSggMCwgc3Vic2l6ZSApO1xuXG4gICAgICB2YXIgcnVuUCA9IHRocmVhZC5wYXNzKCBzbGljZSApLnJ1biggZm4gKTtcblxuICAgICAgcnVuUHMucHVzaCggcnVuUCApO1xuXG4gICAgICB2YXIgZG9uZUVhcmx5ID0gcGFzcy5sZW5ndGggPT09IDA7XG4gICAgICBpZiggZG9uZUVhcmx5ICl7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKCBydW5QcyApLnRoZW4oZnVuY3Rpb24oIHRoZW5zICl7XG4gICAgICB2YXIgcG9zdHBhc3MgPSBbXTtcbiAgICAgIHZhciBwID0gMDtcblxuICAgICAgLy8gZmlsbCBwb3N0cGFzcyB3aXRoIHRoZSB0b3RhbCByZXN1bHQgam9pbmVkIGZyb20gYWxsIHRocmVhZHNcbiAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGhlbnMubGVuZ3RoOyBpKysgKXtcbiAgICAgICAgdmFyIHRoZW4gPSB0aGVuc1tpXTsgLy8gYXJyYXkgcmVzdWx0IGZyb20gdGhyZWFkIGlcblxuICAgICAgICBmb3IoIHZhciBqID0gMDsgaiA8IHRoZW4ubGVuZ3RoOyBqKysgKXtcbiAgICAgICAgICB2YXIgdCA9IHRoZW5bal07IC8vIGFycmF5IGVsZW1lbnRcblxuICAgICAgICAgIHBvc3RwYXNzWyBwKysgXSA9IHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBvc3RwYXNzO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIHBhcmFsbGVsIHZlcnNpb24gb2YgYXJyYXkubWFwKClcbiAgbWFwOiBmdW5jdGlvbiggZm4gKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnJlcXVpcmUoIGZuLCAnXyRfJF9mYWJtYXAnICk7XG5cbiAgICByZXR1cm4gc2VsZi5zcHJlYWQoZnVuY3Rpb24oIHNwbGl0ICl7XG4gICAgICB2YXIgbWFwcGVkID0gW107XG4gICAgICB2YXIgb3JpZ1Jlc29sdmUgPSByZXNvbHZlOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgICAgcmVzb2x2ZSA9IGZ1bmN0aW9uKCB2YWwgKXsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIG1hcHBlZC5wdXNoKCB2YWwgKTtcbiAgICAgIH07XG5cbiAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgc3BsaXQubGVuZ3RoOyBpKysgKXtcbiAgICAgICAgdmFyIG9sZExlbiA9IG1hcHBlZC5sZW5ndGg7XG4gICAgICAgIHZhciByZXQgPSBfJF8kX2ZhYm1hcCggc3BsaXRbaV0gKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHZhciBub3RoaW5nSW5zZEJ5UmVzb2x2ZSA9IG9sZExlbiA9PT0gbWFwcGVkLmxlbmd0aDtcblxuICAgICAgICBpZiggbm90aGluZ0luc2RCeVJlc29sdmUgKXtcbiAgICAgICAgICBtYXBwZWQucHVzaCggcmV0ICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSA9IG9yaWdSZXNvbHZlOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICB9KTtcblxuICB9LFxuXG4gIC8vIHBhcmFsbGVsIHZlcnNpb24gb2YgYXJyYXkuZmlsdGVyKClcbiAgZmlsdGVyOiBmdW5jdGlvbiggZm4gKXtcbiAgICB2YXIgX3AgPSB0aGlzLl9wcml2YXRlO1xuICAgIHZhciBwYXNzID0gX3AucGFzc1swXTtcblxuICAgIHJldHVybiB0aGlzLm1hcCggZm4gKS50aGVuKGZ1bmN0aW9uKCBpbmNsdWRlICl7XG4gICAgICB2YXIgcmV0ID0gW107XG5cbiAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgcGFzcy5sZW5ndGg7IGkrKyApe1xuICAgICAgICB2YXIgZGF0dW0gPSBwYXNzW2ldO1xuICAgICAgICB2YXIgaW5jRGF0dW0gPSBpbmNsdWRlW2ldO1xuXG4gICAgICAgIGlmKCBpbmNEYXR1bSApe1xuICAgICAgICAgIHJldC5wdXNoKCBkYXR1bSApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gc29ydHMgdGhlIHBhc3NlZCBhcnJheSB1c2luZyBhIGRpdmlkZSBhbmQgY29ucXVlciBzdHJhdGVneVxuICBzb3J0OiBmdW5jdGlvbiggY21wICl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBQID0gdGhpcy5fcHJpdmF0ZS5wYXNzWzBdLmxlbmd0aDtcbiAgICB2YXIgc3Vic2l6ZSA9IHRoaXMuc3ByZWFkU2l6ZSgpO1xuXG4gICAgY21wID0gY21wIHx8IGZ1bmN0aW9uKCBhLCBiICl7IC8vIGRlZmF1bHQgY29tcGFyaXNvbiBmdW5jdGlvblxuICAgICAgaWYoIGEgPCBiICl7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH0gZWxzZSBpZiggYSA+IGIgKXtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH07XG5cbiAgICBzZWxmLnJlcXVpcmUoIGNtcCwgJ18kXyRfY21wJyApO1xuXG4gICAgcmV0dXJuIHNlbGYuc3ByZWFkKGZ1bmN0aW9uKCBzcGxpdCApeyAvLyBzb3J0IGVhY2ggc3BsaXQgbm9ybWFsbHlcbiAgICAgIHZhciBzb3J0ZWRTcGxpdCA9IHNwbGl0LnNvcnQoIF8kXyRfY21wICk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgcmVzb2x2ZSggc29ydGVkU3BsaXQgKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cbiAgICB9KS50aGVuKGZ1bmN0aW9uKCBqb2luZWQgKXtcbiAgICAgIC8vIGRvIGFsbCB0aGUgbWVyZ2luZyBpbiB0aGUgbWFpbiB0aHJlYWQgdG8gbWluaW1pc2UgZGF0YSB0cmFuc2ZlclxuXG4gICAgICAvLyBUT0RPIGNvdWxkIGRvIG1lcmdpbmcgaW4gc2VwYXJhdGUgdGhyZWFkcyBidXQgd291bGQgaW5jdXIgYWRkJ2wgY29zdCBvZiBkYXRhIHRyYW5zZmVyXG4gICAgICAvLyBmb3IgZWFjaCBsZXZlbCBvZiB0aGUgbWVyZ2VcblxuICAgICAgdmFyIG1lcmdlID0gZnVuY3Rpb24oIGksIGosIG1heCApe1xuICAgICAgICAvLyBkb24ndCBvdmVyZmxvdyBhcnJheVxuICAgICAgICBqID0gTWF0aC5taW4oIGosIFAgKTtcbiAgICAgICAgbWF4ID0gTWF0aC5taW4oIG1heCwgUCApO1xuXG4gICAgICAgIC8vIGxlZnQgYW5kIHJpZ2h0IHNpZGVzIG9mIG1lcmdlXG4gICAgICAgIHZhciBsID0gaTtcbiAgICAgICAgdmFyIHIgPSBqO1xuXG4gICAgICAgIHZhciBzb3J0ZWQgPSBbXTtcblxuICAgICAgICBmb3IoIHZhciBrID0gbDsgayA8IG1heDsgaysrICl7XG5cbiAgICAgICAgICB2YXIgZWxlSSA9IGpvaW5lZFtpXTtcbiAgICAgICAgICB2YXIgZWxlSiA9IGpvaW5lZFtqXTtcblxuICAgICAgICAgIGlmKCBpIDwgciAmJiAoIGogPj0gbWF4IHx8IGNtcChlbGVJLCBlbGVKKSA8PSAwICkgKXtcbiAgICAgICAgICAgIHNvcnRlZC5wdXNoKCBlbGVJICk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvcnRlZC5wdXNoKCBlbGVKICk7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbiB0aGUgYXJyYXkgcHJvcGVyLCBwdXQgdGhlIHNvcnRlZCB2YWx1ZXNcbiAgICAgICAgZm9yKCB2YXIgayA9IDA7IGsgPCBzb3J0ZWQubGVuZ3RoOyBrKysgKXsgLy8ga3RoIHNvcnRlZCBpdGVtXG4gICAgICAgICAgdmFyIGluZGV4ID0gbCArIGs7XG5cbiAgICAgICAgICBqb2luZWRbIGluZGV4IF0gPSBzb3J0ZWRba107XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZvciggdmFyIHNwbGl0TCA9IHN1YnNpemU7IHNwbGl0TCA8IFA7IHNwbGl0TCAqPSAyICl7IC8vIG1lcmdlIHVudGlsIGFycmF5IGlzIFwic3BsaXRcIiBhcyAxXG5cbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBQOyBpICs9IDIqc3BsaXRMICl7XG4gICAgICAgICAgbWVyZ2UoIGksIGkgKyBzcGxpdEwsIGkgKyAyKnNwbGl0TCApO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGpvaW5lZDtcbiAgICB9KTtcbiAgfVxuXG5cbn0pO1xuXG52YXIgZGVmaW5lUmFuZG9tUGFzc2VyID0gZnVuY3Rpb24oIG9wdHMgKXtcbiAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCBmbiwgYXJnMSApe1xuICAgIHZhciBwYXNzID0gdGhpcy5fcHJpdmF0ZS5wYXNzLnNoaWZ0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5yYW5kb20oKS5wYXNzKCBwYXNzIClbIG9wdHMudGhyZWFkRm4gXSggZm4sIGFyZzEgKTtcbiAgfTtcbn07XG5cbnV0aWwuZXh0ZW5kKGZhYmZuLCB7XG4gIHJhbmRvbU1hcDogZGVmaW5lUmFuZG9tUGFzc2VyKHsgdGhyZWFkRm46ICdtYXAnIH0pLFxuXG4gIHJlZHVjZTogZGVmaW5lUmFuZG9tUGFzc2VyKHsgdGhyZWFkRm46ICdyZWR1Y2UnIH0pLFxuXG4gIHJlZHVjZVJpZ2h0OiBkZWZpbmVSYW5kb21QYXNzZXIoeyB0aHJlYWRGbjogJ3JlZHVjZVJpZ2h0JyB9KVxufSk7XG5cbi8vIGFsaWFzZXNcbnZhciBmbiA9IGZhYmZuO1xuZm4ucHJvbWlzZSA9IGZuLnJ1bjtcbmZuLnRlcm1pbmF0ZSA9IGZuLmhhbHQgPSBmbi5zdG9wO1xuZm4uaW5jbHVkZSA9IGZuLnJlcXVpcmU7XG5cbi8vIHB1bGwgaW4gZXZlbnQgYXBpc1xudXRpbC5leHRlbmQoZmFiZm4sIHtcbiAgb246IGRlZmluZS5vbigpLFxuICBvbmU6IGRlZmluZS5vbih7IHVuYmluZFNlbGZPblRyaWdnZXI6IHRydWUgfSksXG4gIG9mZjogZGVmaW5lLm9mZigpLFxuICB0cmlnZ2VyOiBkZWZpbmUudHJpZ2dlcigpXG59KTtcblxuZGVmaW5lLmV2ZW50QWxpYXNlc09uKCBmYWJmbiApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhYnJpYztcblxufSx7XCIuL2RlZmluZVwiOjEsXCIuL2lzXCI6NSxcIi4vcHJvbWlzZVwiOjYsXCIuL3RocmVhZFwiOjcsXCIuL3V0aWxcIjo4LFwib3NcIjp1bmRlZmluZWR9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIFRocmVhZCA9IF9kZXJlcV8oJy4vdGhyZWFkJyk7XG52YXIgRmFicmljID0gX2RlcmVxXygnLi9mYWJyaWMnKTtcblxudmFyIHdlYXZlciA9IGZ1bmN0aW9uKCl7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICByZXR1cm47XG59O1xuXG53ZWF2ZXIudmVyc2lvbiA9ICcxLjIuMCc7XG5cbndlYXZlci50aHJlYWQgPSB3ZWF2ZXIuVGhyZWFkID0gd2VhdmVyLndvcmtlciA9IHdlYXZlci5Xb3JrZXIgPSBUaHJlYWQ7XG53ZWF2ZXIuZmFicmljID0gd2VhdmVyLkZhYnJpYyA9IEZhYnJpYztcblxubW9kdWxlLmV4cG9ydHMgPSB3ZWF2ZXI7XG5cbn0se1wiLi9mYWJyaWNcIjozLFwiLi90aHJlYWRcIjo3fV0sNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vLyB0eXBlIHRlc3RpbmcgdXRpbGl0eSBmdW5jdGlvbnNcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZW9mc3RyID0gdHlwZW9mICcnO1xudmFyIHR5cGVvZm9iaiA9IHR5cGVvZiB7fTtcbnZhciB0eXBlb2ZmbiA9IHR5cGVvZiBmdW5jdGlvbigpe307XG5cbnZhciBpbnN0YW5jZVN0ciA9IGZ1bmN0aW9uKCBvYmogKXtcbiAgcmV0dXJuIG9iaiAmJiBvYmouaW5zdGFuY2VTdHJpbmcgJiYgaXMuZm4oIG9iai5pbnN0YW5jZVN0cmluZyApID8gb2JqLmluc3RhbmNlU3RyaW5nKCkgOiBudWxsO1xufTtcblxudmFyIGlzID0ge1xuICBkZWZpbmVkOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbDsgLy8gbm90IHVuZGVmaW5lZCBvciBudWxsXG4gIH0sXG5cbiAgc3RyaW5nOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09IHR5cGVvZnN0cjtcbiAgfSxcblxuICBmbjogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gdHlwZW9mZm47XG4gIH0sXG5cbiAgYXJyYXk6IGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5KG9iaikgOiBvYmogIT0gbnVsbCAmJiBvYmogaW5zdGFuY2VvZiBBcnJheTtcbiAgfSxcblxuICBwbGFpbk9iamVjdDogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gdHlwZW9mb2JqICYmICFpcy5hcnJheShvYmopICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0O1xuICB9LFxuXG4gIG9iamVjdDogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gdHlwZW9mb2JqO1xuICB9LFxuXG4gIG51bWJlcjogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gdHlwZW9mIDEgJiYgIWlzTmFOKG9iaik7XG4gIH0sXG5cbiAgaW50ZWdlcjogZnVuY3Rpb24oIG9iaiApe1xuICAgIHJldHVybiBpcy5udW1iZXIob2JqKSAmJiBNYXRoLmZsb29yKG9iaikgPT09IG9iajtcbiAgfSxcblxuICBib29sOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSB0eXBlb2YgdHJ1ZTtcbiAgfSxcblxuICBldmVudDogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gaW5zdGFuY2VTdHIob2JqKSA9PT0gJ2V2ZW50JztcbiAgfSxcblxuICB0aHJlYWQ6IGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIGluc3RhbmNlU3RyKG9iaikgPT09ICd0aHJlYWQnO1xuICB9LFxuXG4gIGZhYnJpYzogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gaW5zdGFuY2VTdHIob2JqKSA9PT0gJ2ZhYnJpYyc7XG4gIH0sXG5cbiAgZW1wdHlTdHJpbmc6IGZ1bmN0aW9uKG9iail7XG4gICAgaWYoICFvYmogKXsgLy8gbnVsbCBpcyBlbXB0eVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmKCBpcy5zdHJpbmcob2JqKSApe1xuICAgICAgaWYoIG9iaiA9PT0gJycgfHwgb2JqLm1hdGNoKC9eXFxzKyQvKSApe1xuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gZW1wdHkgc3RyaW5nIGlzIGVtcHR5XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlOyAvLyBvdGhlcndpc2UsIHdlIGRvbid0IGtub3cgd2hhdCB3ZSd2ZSBnb3RcbiAgfSxcblxuICBub25lbXB0eVN0cmluZzogZnVuY3Rpb24ob2JqKXtcbiAgICBpZiggb2JqICYmIGlzLnN0cmluZyhvYmopICYmIG9iaiAhPT0gJycgJiYgIW9iai5tYXRjaCgvXlxccyskLykgKXtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpcztcblxufSx7fV0sNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vLyBpbnRlcm5hbCwgbWluaW1hbCBQcm9taXNlIGltcGwgcy50LiBhcGlzIGNhbiByZXR1cm4gcHJvbWlzZXMgaW4gb2xkIGVudnNcbi8vIGJhc2VkIG9uIHRoZW5hYmxlIChodHRwOi8vZ2l0aHViLmNvbS9yc2UvdGhlbmFibGUpXG5cbid1c2Ugc3RyaWN0JztcblxuLyogIHByb21pc2Ugc3RhdGVzIFtQcm9taXNlcy9BKyAyLjFdICAqL1xudmFyIFNUQVRFX1BFTkRJTkcgICA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMS4xXSAgKi9cbnZhciBTVEFURV9GVUxGSUxMRUQgPSAxOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjEuMl0gICovXG52YXIgU1RBVEVfUkVKRUNURUQgID0gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4xLjNdICAqL1xuXG4vKiAgcHJvbWlzZSBvYmplY3QgY29uc3RydWN0b3IgICovXG52YXIgYXBpID0gZnVuY3Rpb24gKGV4ZWN1dG9yKSB7XG4gIC8qICBvcHRpb25hbGx5IHN1cHBvcnQgbm9uLWNvbnN0cnVjdG9yL3BsYWluLWZ1bmN0aW9uIGNhbGwgICovXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBhcGkpKVxuICAgIHJldHVybiBuZXcgYXBpKGV4ZWN1dG9yKTtcblxuICAvKiAgaW5pdGlhbGl6ZSBvYmplY3QgICovXG4gIHRoaXMuaWQgICAgICAgICAgID0gXCJUaGVuYWJsZS8xLjAuN1wiO1xuICB0aGlzLnN0YXRlICAgICAgICA9IFNUQVRFX1BFTkRJTkc7IC8qICBpbml0aWFsIHN0YXRlICAqL1xuICB0aGlzLmZ1bGZpbGxWYWx1ZSA9IHVuZGVmaW5lZDsgICAgIC8qICBpbml0aWFsIHZhbHVlICAqLyAgICAgLyogIFtQcm9taXNlcy9BKyAxLjMsIDIuMS4yLjJdICAqL1xuICB0aGlzLnJlamVjdFJlYXNvbiA9IHVuZGVmaW5lZDsgICAgIC8qICBpbml0aWFsIHJlYXNvbiAqLyAgICAgLyogIFtQcm9taXNlcy9BKyAxLjUsIDIuMS4zLjJdICAqL1xuICB0aGlzLm9uRnVsZmlsbGVkICA9IFtdOyAgICAgICAgICAgIC8qICBpbml0aWFsIGhhbmRsZXJzICAqL1xuICB0aGlzLm9uUmVqZWN0ZWQgICA9IFtdOyAgICAgICAgICAgIC8qICBpbml0aWFsIGhhbmRsZXJzICAqL1xuXG4gIC8qICBwcm92aWRlIG9wdGlvbmFsIGluZm9ybWF0aW9uLWhpZGluZyBwcm94eSAgKi9cbiAgdGhpcy5wcm94eSA9IHtcbiAgICB0aGVuOiB0aGlzLnRoZW4uYmluZCh0aGlzKVxuICB9O1xuXG4gIC8qICBzdXBwb3J0IG9wdGlvbmFsIGV4ZWN1dG9yIGZ1bmN0aW9uICAqL1xuICBpZiAodHlwZW9mIGV4ZWN1dG9yID09PSBcImZ1bmN0aW9uXCIpXG4gICAgZXhlY3V0b3IuY2FsbCh0aGlzLCB0aGlzLmZ1bGZpbGwuYmluZCh0aGlzKSwgdGhpcy5yZWplY3QuYmluZCh0aGlzKSk7XG59O1xuXG4vKiAgcHJvbWlzZSBBUEkgbWV0aG9kcyAgKi9cbmFwaS5wcm90b3R5cGUgPSB7XG4gIC8qICBwcm9taXNlIHJlc29sdmluZyBtZXRob2RzICAqL1xuICBmdWxmaWxsOiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIGRlbGl2ZXIodGhpcywgU1RBVEVfRlVMRklMTEVELCBcImZ1bGZpbGxWYWx1ZVwiLCB2YWx1ZSk7IH0sXG4gIHJlamVjdDogIGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gZGVsaXZlcih0aGlzLCBTVEFURV9SRUpFQ1RFRCwgIFwicmVqZWN0UmVhc29uXCIsIHZhbHVlKTsgfSxcblxuICAvKiAgXCJUaGUgdGhlbiBNZXRob2RcIiBbUHJvbWlzZXMvQSsgMS4xLCAxLjIsIDIuMl0gICovXG4gIHRoZW46IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgIHZhciBjdXJyID0gdGhpcztcbiAgICB2YXIgbmV4dCA9IG5ldyBhcGkoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi43XSAgKi9cbiAgICBjdXJyLm9uRnVsZmlsbGVkLnB1c2goXG4gICAgICByZXNvbHZlcihvbkZ1bGZpbGxlZCwgbmV4dCwgXCJmdWxmaWxsXCIpKTsgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuMi8yLjIuNl0gICovXG4gICAgY3Vyci5vblJlamVjdGVkLnB1c2goXG4gICAgICByZXNvbHZlcihvblJlamVjdGVkLCAgbmV4dCwgXCJyZWplY3RcIiApKTsgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuMy8yLjIuNl0gICovXG4gICAgZXhlY3V0ZShjdXJyKTtcbiAgICByZXR1cm4gbmV4dC5wcm94eTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi43LCAzLjNdICAqL1xuICB9XG59O1xuXG4vKiAgZGVsaXZlciBhbiBhY3Rpb24gICovXG52YXIgZGVsaXZlciA9IGZ1bmN0aW9uIChjdXJyLCBzdGF0ZSwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKGN1cnIuc3RhdGUgPT09IFNUQVRFX1BFTkRJTkcpIHtcbiAgICBjdXJyLnN0YXRlID0gc3RhdGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMS4yLjEsIDIuMS4zLjFdICAqL1xuICAgIGN1cnJbbmFtZV0gPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4xLjIuMiwgMi4xLjMuMl0gICovXG4gICAgZXhlY3V0ZShjdXJyKTtcbiAgfVxuICByZXR1cm4gY3Vycjtcbn07XG5cbi8qICBleGVjdXRlIGFsbCBoYW5kbGVycyAgKi9cbnZhciBleGVjdXRlID0gZnVuY3Rpb24gKGN1cnIpIHtcbiAgaWYgKGN1cnIuc3RhdGUgPT09IFNUQVRFX0ZVTEZJTExFRClcbiAgICBleGVjdXRlX2hhbmRsZXJzKGN1cnIsIFwib25GdWxmaWxsZWRcIiwgY3Vyci5mdWxmaWxsVmFsdWUpO1xuICBlbHNlIGlmIChjdXJyLnN0YXRlID09PSBTVEFURV9SRUpFQ1RFRClcbiAgICBleGVjdXRlX2hhbmRsZXJzKGN1cnIsIFwib25SZWplY3RlZFwiLCAgY3Vyci5yZWplY3RSZWFzb24pO1xufTtcblxuLyogIGV4ZWN1dGUgcGFydGljdWxhciBzZXQgb2YgaGFuZGxlcnMgICovXG52YXIgZXhlY3V0ZV9oYW5kbGVycyA9IGZ1bmN0aW9uIChjdXJyLCBuYW1lLCB2YWx1ZSkge1xuICAvKiBnbG9iYWwgc2V0SW1tZWRpYXRlOiB0cnVlICovXG4gIC8qIGdsb2JhbCBzZXRUaW1lb3V0OiB0cnVlICovXG5cbiAgLyogIHNob3J0LWNpcmN1aXQgcHJvY2Vzc2luZyAgKi9cbiAgaWYgKGN1cnJbbmFtZV0ubGVuZ3RoID09PSAwKVxuICAgIHJldHVybjtcblxuICAvKiAgaXRlcmF0ZSBvdmVyIGFsbCBoYW5kbGVycywgZXhhY3RseSBvbmNlICAqL1xuICB2YXIgaGFuZGxlcnMgPSBjdXJyW25hbWVdO1xuICBjdXJyW25hbWVdID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuMi4zLCAyLjIuMy4zXSAgKi9cbiAgdmFyIGZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKylcbiAgICAgIGhhbmRsZXJzW2ldKHZhbHVlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuNV0gICovXG4gIH07XG5cbiAgLyogIGV4ZWN1dGUgcHJvY2VkdXJlIGFzeW5jaHJvbm91c2x5ICAqLyAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjQsIDMuMV0gICovXG4gIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpXG4gICAgc2V0SW1tZWRpYXRlKGZ1bmMpO1xuICBlbHNlXG4gICAgc2V0VGltZW91dChmdW5jLCAwKTtcbn07XG5cbi8qICBnZW5lcmF0ZSBhIHJlc29sdmVyIGZ1bmN0aW9uICAqL1xudmFyIHJlc29sdmVyID0gZnVuY3Rpb24gKGNiLCBuZXh0LCBtZXRob2QpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgY2IgIT09IFwiZnVuY3Rpb25cIikgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuMSwgMi4yLjcuMywgMi4yLjcuNF0gICovXG4gICAgICBuZXh0W21ldGhvZF0uY2FsbChuZXh0LCB2YWx1ZSk7ICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjcuMywgMi4yLjcuNF0gICovXG4gICAgZWxzZSB7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgdHJ5IHsgcmVzdWx0ID0gY2IodmFsdWUpOyB9ICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi4yLjEsIDIuMi4zLjEsIDIuMi41LCAzLjJdICAqL1xuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgbmV4dC5yZWplY3QoZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjcuMl0gICovXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUobmV4dCwgcmVzdWx0KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuNy4xXSAgKi9cbiAgICB9XG4gIH07XG59O1xuXG4vKiAgXCJQcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlXCIgICovICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjNdICAqL1xudmFyIHJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgeCkge1xuICAvKiAgc2FuaXR5IGNoZWNrIGFyZ3VtZW50cyAgKi8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMV0gICovXG4gIGlmIChwcm9taXNlID09PSB4IHx8IHByb21pc2UucHJveHkgPT09IHgpIHtcbiAgICBwcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFwiY2Fubm90IHJlc29sdmUgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyogIHN1cmdpY2FsbHkgY2hlY2sgZm9yIGEgXCJ0aGVuXCIgbWV0aG9kXG4gICAgKG1haW5seSB0byBqdXN0IGNhbGwgdGhlIFwiZ2V0dGVyXCIgb2YgXCJ0aGVuXCIgb25seSBvbmNlKSAgKi9cbiAgdmFyIHRoZW47XG4gIGlmICgodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbCkgfHwgdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRyeSB7IHRoZW4gPSB4LnRoZW47IH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMSwgMy41XSAgKi9cbiAgICBjYXRjaCAoZSkge1xuICAgICAgcHJvbWlzZS5yZWplY3QoZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy4zLjJdICAqL1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8qICBoYW5kbGUgb3duIFRoZW5hYmxlcyAgICBbUHJvbWlzZXMvQSsgMi4zLjJdXG4gICAgYW5kIHNpbWlsYXIgXCJ0aGVuYWJsZXNcIiBbUHJvbWlzZXMvQSsgMi4zLjNdICAqL1xuICBpZiAodHlwZW9mIHRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciByZXNvbHZlZCA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAvKiAgY2FsbCByZXRyaWV2ZWQgXCJ0aGVuXCIgbWV0aG9kICovICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zXSAgKi9cbiAgICAgIHRoZW4uY2FsbCh4LFxuICAgICAgICAvKiAgcmVzb2x2ZVByb21pc2UgICovICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zLjFdICAqL1xuICAgICAgICBmdW5jdGlvbiAoeSkge1xuICAgICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuOyByZXNvbHZlZCA9IHRydWU7ICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMy4zXSAgKi9cbiAgICAgICAgICBpZiAoeSA9PT0geCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDMuNl0gICovXG4gICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFwiY2lyY3VsYXIgdGhlbmFibGUgY2hhaW5cIikpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc29sdmUocHJvbWlzZSwgeSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogIHJlamVjdFByb21pc2UgICovICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMy4yXSAgKi9cbiAgICAgICAgZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVybjsgcmVzb2x2ZWQgPSB0cnVlOyAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy4zLjMuM10gICovXG4gICAgICAgICAgcHJvbWlzZS5yZWplY3Qocik7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIXJlc29sdmVkKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMy4zXSAgKi9cbiAgICAgICAgcHJvbWlzZS5yZWplY3QoZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMy40XSAgKi9cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyogIGhhbmRsZSBvdGhlciB2YWx1ZXMgICovXG4gIHByb21pc2UuZnVsZmlsbCh4KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy40LCAyLjMuMy40XSAgKi9cbn07XG5cbi8vIHVzZSBuYXRpdmUgcHJvbWlzZXMgd2hlcmUgcG9zc2libGVcbnZhciBQcm9taXNlID0gdHlwZW9mIFByb21pc2UgPT09ICd1bmRlZmluZWQnID8gYXBpIDogUHJvbWlzZTtcblxuLy8gc28gd2UgYWx3YXlzIGhhdmUgUHJvbWlzZS5hbGwoKVxuUHJvbWlzZS5hbGwgPSBQcm9taXNlLmFsbCB8fCBmdW5jdGlvbiggcHMgKXtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKCByZXNvbHZlQWxsLCByZWplY3RBbGwgKXtcbiAgICB2YXIgdmFscyA9IG5ldyBBcnJheSggcHMubGVuZ3RoICk7XG4gICAgdmFyIGRvbmVDb3VudCA9IDA7XG5cbiAgICB2YXIgZnVsZmlsbCA9IGZ1bmN0aW9uKCBpLCB2YWwgKXtcbiAgICAgIHZhbHNbaV0gPSB2YWw7XG4gICAgICBkb25lQ291bnQrKztcblxuICAgICAgaWYoIGRvbmVDb3VudCA9PT0gcHMubGVuZ3RoICl7XG4gICAgICAgIHJlc29sdmVBbGwoIHZhbHMgKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBwcy5sZW5ndGg7IGkrKyApe1xuICAgICAgKGZ1bmN0aW9uKCBpICl7XG4gICAgICAgIHZhciBwID0gcHNbaV07XG4gICAgICAgIHZhciBpc1Byb21pc2UgPSBwLnRoZW4gIT0gbnVsbDtcblxuICAgICAgICBpZiggaXNQcm9taXNlICl7XG4gICAgICAgICAgcC50aGVuKGZ1bmN0aW9uKCB2YWwgKXtcbiAgICAgICAgICAgIGZ1bGZpbGwoIGksIHZhbCApO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKXtcbiAgICAgICAgICAgIHJlamVjdEFsbCggZXJyICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHZhbCA9IHA7XG4gICAgICAgICAgZnVsZmlsbCggaSwgdmFsICk7XG4gICAgICAgIH1cbiAgICAgIH0pKCBpICk7XG4gICAgfVxuXG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuXG59LHt9XSw3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qISBXZWF2ZXIgbGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL3RsZHJsZWdhbC5jb20vbGljZW5zZS9taXQtbGljZW5zZSksIGNvcHlyaWdodCBNYXggRnJhbnogKi9cblxuLy8gY3Jvc3MtZW52IHRocmVhZC93b3JrZXJcbi8vIE5CIDogdXNlcyAoaGVhdnl3ZWlnaHQpIHByb2Nlc3NlcyBvbiBub2RlanMgc28gYmVzdCBub3QgdG8gY3JlYXRlIHRvbyBtYW55IHRocmVhZHNcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgd2luZG93ID0gX2RlcmVxXygnLi93aW5kb3cnKTtcbnZhciB1dGlsID0gX2RlcmVxXygnLi91dGlsJyk7XG52YXIgUHJvbWlzZSA9IF9kZXJlcV8oJy4vcHJvbWlzZScpO1xudmFyIEV2ZW50ID0gX2RlcmVxXygnLi9ldmVudCcpO1xudmFyIGRlZmluZSA9IF9kZXJlcV8oJy4vZGVmaW5lJyk7XG52YXIgaXMgPSBfZGVyZXFfKCcuL2lzJyk7XG5cbnZhciBUaHJlYWQgPSBmdW5jdGlvbiggb3B0cyApe1xuICBpZiggISh0aGlzIGluc3RhbmNlb2YgVGhyZWFkKSApe1xuICAgIHJldHVybiBuZXcgVGhyZWFkKCBvcHRzICk7XG4gIH1cblxuICB2YXIgX3AgPSB0aGlzLl9wcml2YXRlID0ge1xuICAgIHJlcXVpcmVzOiBbXSxcbiAgICBmaWxlczogW10sXG4gICAgcXVldWU6IG51bGwsXG4gICAgcGFzczogW10sXG4gICAgZGlzYWJsZWQ6IGZhbHNlXG4gIH07XG5cbiAgaWYoIGlzLnBsYWluT2JqZWN0KG9wdHMpICl7XG4gICAgaWYoIG9wdHMuZGlzYWJsZWQgIT0gbnVsbCApe1xuICAgICAgX3AuZGlzYWJsZWQgPSAhIW9wdHMuZGlzYWJsZWQ7XG4gICAgfVxuICB9XG5cbn07XG5cbnZhciB0aGRmbiA9IFRocmVhZC5wcm90b3R5cGU7IC8vIHNob3J0IGFsaWFzXG5cbnZhciBzdHJpbmdpZnlGaWVsZFZhbCA9IGZ1bmN0aW9uKCB2YWwgKXtcbiAgdmFyIHZhbFN0ciA9IGlzLmZuKCB2YWwgKSA/IHZhbC50b1N0cmluZygpIDogXCJKU09OLnBhcnNlKCdcIiArIEpTT04uc3RyaW5naWZ5KHZhbCkgKyBcIicpXCI7XG5cbiAgcmV0dXJuIHZhbFN0cjtcbn07XG5cbi8vIGFsbG93cyBmb3IgcmVxdWlyZXMgd2l0aCBwcm90b3R5cGVzIGFuZCBzdWJvYmpzIGV0Y1xudmFyIGZuQXNSZXF1aXJlID0gZnVuY3Rpb24oIGZuICl7XG4gIHZhciByZXE7XG4gIHZhciBmbk5hbWU7XG5cbiAgaWYoIGlzLm9iamVjdChmbikgJiYgZm4uZm4gKXsgLy8gbWFudWFsIGZuXG4gICAgcmVxID0gZm5BcyggZm4uZm4sIGZuLm5hbWUgKTtcbiAgICBmbk5hbWUgPSBmbi5uYW1lO1xuICAgIGZuID0gZm4uZm47XG4gIH0gZWxzZSBpZiggaXMuZm4oZm4pICl7IC8vIGF1dG8gZm5cbiAgICByZXEgPSBmbi50b1N0cmluZygpO1xuICAgIGZuTmFtZSA9IGZuLm5hbWU7XG4gIH0gZWxzZSBpZiggaXMuc3RyaW5nKGZuKSApeyAvLyBzdHJpbmdpZmllZCBmblxuICAgIHJlcSA9IGZuO1xuICB9IGVsc2UgaWYoIGlzLm9iamVjdChmbikgKXsgLy8gcGxhaW4gb2JqZWN0XG4gICAgaWYoIGZuLnByb3RvICl7XG4gICAgICByZXEgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxID0gZm4ubmFtZSArICcgPSB7fTsnO1xuICAgIH1cblxuICAgIGZuTmFtZSA9IGZuLm5hbWU7XG4gICAgZm4gPSBmbi5vYmo7XG4gIH1cblxuICByZXEgKz0gJ1xcbic7XG5cbiAgdmFyIHByb3RvcmVxID0gZnVuY3Rpb24oIHZhbCwgc3VibmFtZSApe1xuICAgIGlmKCB2YWwucHJvdG90eXBlICl7XG4gICAgICB2YXIgcHJvdG9Ob25lbXB0eSA9IGZhbHNlO1xuICAgICAgZm9yKCB2YXIgcHJvcCBpbiB2YWwucHJvdG90eXBlICl7IHByb3RvTm9uZW1wdHkgPSB0cnVlOyBicmVhazsgfSAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgICAgaWYoIHByb3RvTm9uZW1wdHkgKXtcbiAgICAgICAgcmVxICs9IGZuQXNSZXF1aXJlKCB7XG4gICAgICAgICAgbmFtZTogc3VibmFtZSxcbiAgICAgICAgICBvYmo6IHZhbCxcbiAgICAgICAgICBwcm90bzogdHJ1ZVxuICAgICAgICB9LCB2YWwgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gcHVsbCBpbiBwcm90b3R5cGVcbiAgaWYoIGZuLnByb3RvdHlwZSAmJiBmbk5hbWUgIT0gbnVsbCApe1xuXG4gICAgZm9yKCB2YXIgbmFtZSBpbiBmbi5wcm90b3R5cGUgKXtcbiAgICAgIHZhciBwcm90b1N0ciA9ICcnO1xuXG4gICAgICB2YXIgdmFsID0gZm4ucHJvdG90eXBlWyBuYW1lIF07XG4gICAgICB2YXIgdmFsU3RyID0gc3RyaW5naWZ5RmllbGRWYWwoIHZhbCApO1xuICAgICAgdmFyIHN1Ym5hbWUgPSBmbk5hbWUgKyAnLnByb3RvdHlwZS4nICsgbmFtZTtcblxuICAgICAgcHJvdG9TdHIgKz0gc3VibmFtZSArICcgPSAnICsgdmFsU3RyICsgJztcXG4nO1xuXG4gICAgICBpZiggcHJvdG9TdHIgKXtcbiAgICAgICAgcmVxICs9IHByb3RvU3RyO1xuICAgICAgfVxuXG4gICAgICBwcm90b3JlcSggdmFsLCBzdWJuYW1lICk7IC8vIHN1Ym9iamVjdCB3aXRoIHByb3RvdHlwZVxuICAgIH1cblxuICB9XG5cbiAgLy8gcHVsbCBpbiBwcm9wZXJ0aWVzIGZvciBvYmovZm5zXG4gIGlmKCAhaXMuc3RyaW5nKGZuKSApeyBmb3IoIHZhciBuYW1lIGluIGZuICl7XG4gICAgdmFyIHByb3BzU3RyID0gJyc7XG5cbiAgICBpZiggZm4uaGFzT3duUHJvcGVydHkobmFtZSkgKXtcbiAgICAgIHZhciB2YWwgPSBmblsgbmFtZSBdO1xuICAgICAgdmFyIHZhbFN0ciA9IHN0cmluZ2lmeUZpZWxkVmFsKCB2YWwgKTtcbiAgICAgIHZhciBzdWJuYW1lID0gZm5OYW1lICsgJ1tcIicgKyBuYW1lICsgJ1wiXSc7XG5cbiAgICAgIHByb3BzU3RyICs9IHN1Ym5hbWUgKyAnID0gJyArIHZhbFN0ciArICc7XFxuJztcbiAgICB9XG5cbiAgICBpZiggcHJvcHNTdHIgKXtcbiAgICAgIHJlcSArPSBwcm9wc1N0cjtcbiAgICB9XG5cbiAgICBwcm90b3JlcSggdmFsLCBzdWJuYW1lICk7IC8vIHN1Ym9iamVjdCB3aXRoIHByb3RvdHlwZVxuICB9IH1cblxuICByZXR1cm4gcmVxO1xufTtcblxudmFyIGlzUGF0aFN0ciA9IGZ1bmN0aW9uKCBzdHIgKXtcbiAgcmV0dXJuIGlzLnN0cmluZyhzdHIpICYmIHN0ci5tYXRjaCgvXFwuanMkLyk7XG59O1xuXG51dGlsLmV4dGVuZCh0aGRmbiwge1xuXG4gIGluc3RhbmNlU3RyaW5nOiBmdW5jdGlvbigpeyByZXR1cm4gJ3RocmVhZCc7IH0sXG5cbiAgcmVxdWlyZTogZnVuY3Rpb24oIGZuLCBhcyApe1xuICAgIHZhciByZXF1aXJlcyA9IHRoaXMuX3ByaXZhdGUucmVxdWlyZXM7XG5cbiAgICBpZiggaXNQYXRoU3RyKGZuKSApe1xuICAgICAgdGhpcy5fcHJpdmF0ZS5maWxlcy5wdXNoKCBmbiApO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiggYXMgKXtcbiAgICAgIGlmKCBpcy5mbihmbikgKXtcbiAgICAgICAgZm4gPSB7IG5hbWU6IGFzLCBmbjogZm4gfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuID0geyBuYW1lOiBhcywgb2JqOiBmbiB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiggaXMuZm4oZm4pICl7XG4gICAgICAgIGlmKCAhZm4ubmFtZSApe1xuICAgICAgICAgIHRocm93ICdUaGUgZnVuY3Rpb24gbmFtZSBjb3VsZCBub3QgYmUgYXV0b21hdGljYWxseSBkZXRlcm1pbmVkLiAgVXNlIHRocmVhZC5yZXF1aXJlKCBzb21lRnVuY3Rpb24sIFwic29tZUZ1bmN0aW9uXCIgKSc7XG4gICAgICAgIH1cblxuICAgICAgICBmbiA9IHsgbmFtZTogZm4ubmFtZSwgZm46IGZuIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWlyZXMucHVzaCggZm4gKTtcblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIHBhc3M6IGZ1bmN0aW9uKCBkYXRhICl7XG4gICAgdGhpcy5fcHJpdmF0ZS5wYXNzLnB1c2goIGRhdGEgKTtcblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIHJ1bjogZnVuY3Rpb24oIGZuLCBwYXNzICl7IC8vIGZuIHVzZWQgbGlrZSBtYWluKClcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIF9wID0gdGhpcy5fcHJpdmF0ZTtcbiAgICBwYXNzID0gcGFzcyB8fCBfcC5wYXNzLnNoaWZ0KCk7XG5cbiAgICBpZiggX3Auc3RvcHBlZCApe1xuICAgICAgdGhyb3cgJ0F0dGVtcHRlZCB0byBydW4gYSBzdG9wcGVkIHRocmVhZCEgIFN0YXJ0IGEgbmV3IHRocmVhZCBvciBkbyBub3Qgc3RvcCB0aGUgZXhpc3RpbmcgdGhyZWFkIGFuZCByZXVzZSBpdC4nO1xuICAgIH1cblxuICAgIGlmKCBfcC5ydW5uaW5nICl7XG4gICAgICByZXR1cm4gKCBfcC5xdWV1ZSA9IF9wLnF1ZXVlLnRoZW4oZnVuY3Rpb24oKXsgLy8gaW5kdWN0aXZlIHN0ZXBcbiAgICAgICAgcmV0dXJuIHNlbGYucnVuKCBmbiwgcGFzcyApO1xuICAgICAgfSkgKTtcbiAgICB9XG5cbiAgICB2YXIgdXNlV1cgPSB3aW5kb3cgIT0gbnVsbCAmJiAhX3AuZGlzYWJsZWQ7XG4gICAgdmFyIHVzZU5vZGUgPSAhd2luZG93ICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmICFfcC5kaXNhYmxlZDtcblxuICAgIHNlbGYudHJpZ2dlcigncnVuJyk7XG5cbiAgICB2YXIgcnVuUCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKCByZXNvbHZlLCByZWplY3QgKXtcblxuICAgICAgX3AucnVubmluZyA9IHRydWU7XG5cbiAgICAgIHZhciB0aHJlYWRUZWNoQWxyZWFkeUV4aXN0cyA9IF9wLnJhbjtcblxuICAgICAgdmFyIGZuSW1wbFN0ciA9IGlzLnN0cmluZyggZm4gKSA/IGZuIDogZm4udG9TdHJpbmcoKTtcblxuICAgICAgLy8gd29ya2VyIGNvZGUgdG8gZXhlY1xuICAgICAgdmFyIGZuU3RyID0gJ1xcbicgKyAoIF9wLnJlcXVpcmVzLm1hcChmdW5jdGlvbiggciApe1xuICAgICAgICByZXR1cm4gZm5Bc1JlcXVpcmUoIHIgKTtcbiAgICAgIH0pICkuY29uY2F0KCBfcC5maWxlcy5tYXAoZnVuY3Rpb24oIGYgKXtcbiAgICAgICAgaWYoIHVzZVdXICl7XG4gICAgICAgICAgdmFyIHd3aWZ5RmlsZSA9IGZ1bmN0aW9uKCBmaWxlICl7XG4gICAgICAgICAgICBpZiggZmlsZS5tYXRjaCgvXlxcLlxcLy8pIHx8IGZpbGUubWF0Y2goL15cXC5cXC4vKSApe1xuICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGZpbGU7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIGZpbGUubWF0Y2goL15cXC8vKSApe1xuICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArICcvJyArIGZpbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcmV0dXJuICdpbXBvcnRTY3JpcHRzKFwiJyArIHd3aWZ5RmlsZShmKSArICdcIik7JztcbiAgICAgICAgfSBlbHNlIGlmKCB1c2VOb2RlICkge1xuICAgICAgICAgIHJldHVybiAnZXZhbCggcmVxdWlyZShcImZzXCIpLnJlYWRGaWxlU3luYyhcIicgKyBmICsgJ1wiLCB7IGVuY29kaW5nOiBcInV0ZjhcIiB9KSApOyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgJ0V4dGVybmFsIGZpbGUgYCcgKyBmICsgJ2AgY2FuIG5vdCBiZSByZXF1aXJlZCB3aXRob3V0IGFueSB0aHJlYWRpbmcgdGVjaG5vbG9neS4nO1xuICAgICAgICB9XG4gICAgICB9KSApLmNvbmNhdChbXG4gICAgICAgICcoIGZ1bmN0aW9uKCl7JyxcbiAgICAgICAgICAndmFyIHJldCA9ICgnICsgZm5JbXBsU3RyICsgJykoJyArIEpTT04uc3RyaW5naWZ5KHBhc3MpICsgJyk7JyxcbiAgICAgICAgICAnaWYoIHJldCAhPT0gdW5kZWZpbmVkICl7IHJlc29sdmUocmV0KTsgfScsIC8vIGFzc3VtZSBpZiByYW4gZm4gcmV0dXJucyBkZWZpbmVkIHZhbHVlIChpbmNsLiBudWxsKSwgdGhhdCB3ZSB3YW50IHRvIHJlc29sdmUgdG8gaXRcbiAgICAgICAgJ30gKSgpXFxuJ1xuICAgICAgXSkuam9pbignXFxuJyk7XG5cbiAgICAgIC8vIGJlY2F1c2Ugd2UndmUgbm93IGNvbnN1bWVkIHRoZSByZXF1aXJlcywgZW1wdHkgdGhlIGxpc3Qgc28gd2UgZG9uJ3QgZHVwZSBvbiBuZXh0IHJ1bigpXG4gICAgICBfcC5yZXF1aXJlcyA9IFtdO1xuICAgICAgX3AuZmlsZXMgPSBbXTtcblxuICAgICAgaWYoIHVzZVdXICl7XG4gICAgICAgIHZhciBmbkJsb2IsIGZuVXJsO1xuXG4gICAgICAgIC8vIGFkZCBub3JtYWxpc2VkIHRocmVhZCBhcGkgZnVuY3Rpb25zXG4gICAgICAgIGlmKCAhdGhyZWFkVGVjaEFscmVhZHlFeGlzdHMgKXtcbiAgICAgICAgICB2YXIgZm5QcmUgPSBmblN0ciArICcnO1xuXG4gICAgICAgICAgZm5TdHIgPSBbXG4gICAgICAgICAgICAnZnVuY3Rpb24gX3JlZl8obyl7IHJldHVybiBldmFsKG8pOyB9OycsXG4gICAgICAgICAgICAnZnVuY3Rpb24gYnJvYWRjYXN0KG0peyByZXR1cm4gbWVzc2FnZShtKTsgfTsnLCAvLyBhbGlhc1xuICAgICAgICAgICAgJ2Z1bmN0aW9uIG1lc3NhZ2UobSl7IHBvc3RNZXNzYWdlKG0pOyB9OycsXG4gICAgICAgICAgICAnZnVuY3Rpb24gbGlzdGVuKGZuKXsnLFxuICAgICAgICAgICAgJyAgc2VsZi5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbihtKXsgJyxcbiAgICAgICAgICAgICcgICAgaWYoIHR5cGVvZiBtID09PSBcIm9iamVjdFwiICYmIChtLmRhdGEuJCRldmFsIHx8IG0uZGF0YSA9PT0gXCIkJHN0YXJ0XCIpICl7JyxcbiAgICAgICAgICAgICcgICAgfSBlbHNlIHsgJyxcbiAgICAgICAgICAgICcgICAgICBmbiggbS5kYXRhICk7JyxcbiAgICAgICAgICAgICcgICAgfScsXG4gICAgICAgICAgICAnICB9KTsnLFxuICAgICAgICAgICAgJ307JyxcbiAgICAgICAgICAgICdzZWxmLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKG0peyAgaWYoIG0uZGF0YS4kJGV2YWwgKXsgZXZhbCggbS5kYXRhLiQkZXZhbCApOyB9ICB9KTsnLFxuICAgICAgICAgICAgJ2Z1bmN0aW9uIHJlc29sdmUodil7IHBvc3RNZXNzYWdlKHsgJCRyZXNvbHZlOiB2IH0pOyB9OycsXG4gICAgICAgICAgICAnZnVuY3Rpb24gcmVqZWN0KHYpeyBwb3N0TWVzc2FnZSh7ICQkcmVqZWN0OiB2IH0pOyB9OydcbiAgICAgICAgICBdLmpvaW4oJ1xcbicpO1xuXG4gICAgICAgICAgZm5TdHIgKz0gZm5QcmU7XG5cbiAgICAgICAgICBmbkJsb2IgPSBuZXcgQmxvYihbIGZuU3RyIF0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGZuVXJsID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoIGZuQmxvYiApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNyZWF0ZSB3ZWJ3b3JrZXIgYW5kIGxldCBpdCBleGVjIHRoZSBzZXJpYWxpc2VkIGNvZGVcbiAgICAgICAgdmFyIHd3ID0gX3Aud2Vid29ya2VyID0gX3Aud2Vid29ya2VyIHx8IG5ldyBXb3JrZXIoIGZuVXJsICk7XG5cbiAgICAgICAgaWYoIHRocmVhZFRlY2hBbHJlYWR5RXhpc3RzICl7IC8vIHRoZW4ganVzdCBleGVjIG5ldyBydW4oKSBjb2RlXG4gICAgICAgICAgd3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgJCRldmFsOiBmblN0clxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd29ya2VyIG1lc3NhZ2VzID0+IGV2ZW50c1xuICAgICAgICB2YXIgY2I7XG4gICAgICAgIHd3LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBjYiA9IGZ1bmN0aW9uKCBtICl7XG4gICAgICAgICAgdmFyIGlzT2JqZWN0ID0gaXMub2JqZWN0KG0pICYmIGlzLm9iamVjdCggbS5kYXRhICk7XG5cbiAgICAgICAgICBpZiggaXNPYmplY3QgJiYgKCckJHJlc29sdmUnIGluIG0uZGF0YSkgKXtcbiAgICAgICAgICAgIHd3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBjYik7IC8vIGRvbmUgbGlzdGVuaW5nIGIvYyByZXNvbHZlKClcblxuICAgICAgICAgICAgcmVzb2x2ZSggbS5kYXRhLiQkcmVzb2x2ZSApO1xuICAgICAgICAgIH0gZWxzZSBpZiggaXNPYmplY3QgJiYgKCckJHJlamVjdCcgaW4gbS5kYXRhKSApe1xuICAgICAgICAgICAgd3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGNiKTsgLy8gZG9uZSBsaXN0ZW5pbmcgYi9jIHJlamVjdCgpXG5cbiAgICAgICAgICAgIHJlamVjdCggbS5kYXRhLiQkcmVqZWN0ICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYudHJpZ2dlciggbmV3IEV2ZW50KG0sIHsgdHlwZTogJ21lc3NhZ2UnLCBtZXNzYWdlOiBtLmRhdGEgfSkgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICBpZiggIXRocmVhZFRlY2hBbHJlYWR5RXhpc3RzICl7XG4gICAgICAgICAgd3cucG9zdE1lc3NhZ2UoJyQkc3RhcnQnKTsgLy8gc3RhcnQgdXAgdGhlIHdvcmtlclxuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSBpZiggdXNlTm9kZSApe1xuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgcHJvY2Vzc1xuXG4gICAgICAgIGlmKCAhX3AuY2hpbGQgKXtcbiAgICAgICAgICBfcC5jaGlsZCA9ICggX2RlcmVxXygnY2hpbGRfcHJvY2VzcycpLmZvcmsoIF9kZXJlcV8oJ3BhdGgnKS5qb2luKF9fZGlybmFtZSwgJ3RocmVhZC1ub2RlLWZvcmsnKSApICk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBfcC5jaGlsZDtcblxuICAgICAgICAvLyBjaGlsZCBwcm9jZXNzIG1lc3NhZ2VzID0+IGV2ZW50c1xuICAgICAgICB2YXIgY2I7XG4gICAgICAgIGNoaWxkLm9uKCdtZXNzYWdlJywgY2IgPSBmdW5jdGlvbiggbSApe1xuICAgICAgICAgIGlmKCBpcy5vYmplY3QobSkgJiYgKCckJHJlc29sdmUnIGluIG0pICl7XG4gICAgICAgICAgICBjaGlsZC5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIGNiKTsgLy8gZG9uZSBsaXN0ZW5pbmcgYi9jIHJlc29sdmUoKVxuXG4gICAgICAgICAgICByZXNvbHZlKCBtLiQkcmVzb2x2ZSApO1xuICAgICAgICAgIH0gZWxzZSBpZiggaXMub2JqZWN0KG0pICYmICgnJCRyZWplY3QnIGluIG0pICl7XG4gICAgICAgICAgICBjaGlsZC5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIGNiKTsgLy8gZG9uZSBsaXN0ZW5pbmcgYi9jIHJlamVjdCgpXG5cbiAgICAgICAgICAgIHJlamVjdCggbS4kJHJlamVjdCApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnRyaWdnZXIoIG5ldyBFdmVudCh7fSwgeyB0eXBlOiAnbWVzc2FnZScsIG1lc3NhZ2U6IG0gfSkgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGFzayB0aGUgY2hpbGQgcHJvY2VzcyB0byBldmFsIHRoZSB3b3JrZXIgY29kZVxuICAgICAgICBjaGlsZC5zZW5kKHtcbiAgICAgICAgICAkJGV2YWw6IGZuU3RyXG4gICAgICAgIH0pO1xuXG4gICAgICB9IGVsc2UgeyAvLyB1c2UgYSBmYWxsYmFjayBtZWNoYW5pc20gdXNpbmcgYSB0aW1lb3V0XG5cbiAgICAgICAgdmFyIHByb21pc2VSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgdmFyIHByb21pc2VSZWplY3QgPSByZWplY3Q7XG5cbiAgICAgICAgdmFyIHRpbWVyID0gX3AudGltZXIgPSBfcC50aW1lciB8fCB7XG5cbiAgICAgICAgICBsaXN0ZW5lcnM6IFtdLFxuXG4gICAgICAgICAgZXhlYzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGFzIGEgc3RyaW5nIHNvIGl0IGNhbid0IGJlIG1hbmdsZWQgYnkgbWluaWZpZXJzIGFuZCBwcm9jZXNzb3JzXG4gICAgICAgICAgICBmblN0ciA9IFtcbiAgICAgICAgICAgICAgJ2Z1bmN0aW9uIF9yZWZfKG8peyByZXR1cm4gZXZhbChvKTsgfTsnLFxuICAgICAgICAgICAgICAnZnVuY3Rpb24gYnJvYWRjYXN0KG0peyByZXR1cm4gbWVzc2FnZShtKTsgfTsnLFxuICAgICAgICAgICAgICAnZnVuY3Rpb24gbWVzc2FnZShtKXsgc2VsZi50cmlnZ2VyKCBuZXcgRXZlbnQoe30sIHsgdHlwZTogXCJtZXNzYWdlXCIsIG1lc3NhZ2U6IG0gfSkgKTsgfTsnLFxuICAgICAgICAgICAgICAnZnVuY3Rpb24gbGlzdGVuKGZuKXsgdGltZXIubGlzdGVuZXJzLnB1c2goIGZuICk7IH07JyxcbiAgICAgICAgICAgICAgJ2Z1bmN0aW9uIHJlc29sdmUodil7IHByb21pc2VSZXNvbHZlKHYpOyB9OycsXG4gICAgICAgICAgICAgICdmdW5jdGlvbiByZWplY3Qodil7IHByb21pc2VSZWplY3Qodik7IH07J1xuICAgICAgICAgICAgXS5qb2luKCdcXG4nKSArIGZuU3RyO1xuXG4gICAgICAgICAgICAvLyB0aGUgLnJ1bigpIGNvZGVcbiAgICAgICAgICAgIGV2YWwoIGZuU3RyICk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBtZXNzYWdlOiBmdW5jdGlvbiggbSApe1xuICAgICAgICAgICAgdmFyIGxzID0gdGltZXIubGlzdGVuZXJzO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGxzLmxlbmd0aDsgaSsrICl7XG4gICAgICAgICAgICAgIHZhciBmbiA9IGxzW2ldO1xuXG4gICAgICAgICAgICAgIGZuKCBtICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGltZXIuZXhlYygpO1xuICAgICAgfVxuXG4gICAgfSkudGhlbihmdW5jdGlvbiggdiApe1xuICAgICAgX3AucnVubmluZyA9IGZhbHNlO1xuICAgICAgX3AucmFuID0gdHJ1ZTtcblxuICAgICAgc2VsZi50cmlnZ2VyKCdyYW4nKTtcblxuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG5cbiAgICBpZiggX3AucXVldWUgPT0gbnVsbCApe1xuICAgICAgX3AucXVldWUgPSBydW5QOyAvLyBpLmUuIGZpcnN0IHN0ZXAgb2YgaW5kdWN0aXZlIHByb21pc2UgY2hhaW4gKGZvciBxdWV1ZSlcbiAgICB9XG5cbiAgICByZXR1cm4gcnVuUDtcbiAgfSxcblxuICAvLyBzZW5kIHRoZSB0aHJlYWQgYSBtZXNzYWdlXG4gIG1lc3NhZ2U6IGZ1bmN0aW9uKCBtICl7XG4gICAgdmFyIF9wID0gdGhpcy5fcHJpdmF0ZTtcblxuICAgIGlmKCBfcC53ZWJ3b3JrZXIgKXtcbiAgICAgIF9wLndlYndvcmtlci5wb3N0TWVzc2FnZSggbSApO1xuICAgIH1cblxuICAgIGlmKCBfcC5jaGlsZCApe1xuICAgICAgX3AuY2hpbGQuc2VuZCggbSApO1xuICAgIH1cblxuICAgIGlmKCBfcC50aW1lciApe1xuICAgICAgX3AudGltZXIubWVzc2FnZSggbSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIHN0b3A6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIF9wID0gdGhpcy5fcHJpdmF0ZTtcblxuICAgIGlmKCBfcC53ZWJ3b3JrZXIgKXtcbiAgICAgIF9wLndlYndvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9XG5cbiAgICBpZiggX3AuY2hpbGQgKXtcbiAgICAgIF9wLmNoaWxkLmtpbGwoKTtcbiAgICB9XG5cbiAgICBpZiggX3AudGltZXIgKXtcbiAgICAgIC8vIG5vdGhpbmcgd2UgY2FuIGRvIGlmIHdlJ3ZlIHJ1biBhIHRpbWVvdXRcbiAgICB9XG5cbiAgICBfcC5zdG9wcGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzLnRyaWdnZXIoJ3N0b3AnKTsgLy8gY2hhaW5pbmdcbiAgfSxcblxuICBzdG9wcGVkOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLl9wcml2YXRlLnN0b3BwZWQ7XG4gIH1cblxufSk7XG5cbi8vIHR1cm5zIGEgc3RyaW5naWZpZWQgZnVuY3Rpb24gaW50byBhIChyZSluYW1lZCBmdW5jdGlvblxudmFyIGZuQXMgPSBmdW5jdGlvbiggZm4sIG5hbWUgKXtcbiAgdmFyIGZuU3RyID0gZm4udG9TdHJpbmcoKTtcbiAgZm5TdHIgPSBmblN0ci5yZXBsYWNlKC9mdW5jdGlvblxccyo/XFxTKj9cXHMqP1xcKC8sICdmdW5jdGlvbiAnICsgbmFtZSArICcoJyk7XG5cbiAgcmV0dXJuIGZuU3RyO1xufTtcblxudmFyIGRlZmluZUZuYWwgPSBmdW5jdGlvbiggb3B0cyApe1xuICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICByZXR1cm4gZnVuY3Rpb24gZm5hbEltcGwoIGZuLCBhcmcxICl7XG4gICAgdmFyIGZuU3RyID0gZm5BcyggZm4sICdfJF8kXycgKyBvcHRzLm5hbWUgKTtcblxuICAgIHRoaXMucmVxdWlyZSggZm5TdHIgKTtcblxuICAgIHJldHVybiB0aGlzLnJ1biggW1xuICAgICAgJ2Z1bmN0aW9uKCBkYXRhICl7JyxcbiAgICAgICcgIHZhciBvcmlnUmVzb2x2ZSA9IHJlc29sdmU7JyxcbiAgICAgICcgIHZhciByZXMgPSBbXTsnLFxuICAgICAgJyAgJyxcbiAgICAgICcgIHJlc29sdmUgPSBmdW5jdGlvbiggdmFsICl7JyxcbiAgICAgICcgICAgcmVzLnB1c2goIHZhbCApOycsXG4gICAgICAnICB9OycsXG4gICAgICAnICAnLFxuICAgICAgJyAgdmFyIHJldCA9IGRhdGEuJyArIG9wdHMubmFtZSArICcoIF8kXyRfJyArIG9wdHMubmFtZSArICggYXJndW1lbnRzLmxlbmd0aCA+IDEgPyAnLCAnICsgSlNPTi5zdHJpbmdpZnkoYXJnMSkgOiAnJyApICsgJyApOycsXG4gICAgICAnICAnLFxuICAgICAgJyAgcmVzb2x2ZSA9IG9yaWdSZXNvbHZlOycsXG4gICAgICAnICByZXNvbHZlKCByZXMubGVuZ3RoID4gMCA/IHJlcyA6IHJldCApOycsXG4gICAgICAnfSdcbiAgICBdLmpvaW4oJ1xcbicpICk7XG4gIH07XG59O1xuXG51dGlsLmV4dGVuZCh0aGRmbiwge1xuICByZWR1Y2U6IGRlZmluZUZuYWwoeyBuYW1lOiAncmVkdWNlJyB9KSxcblxuICByZWR1Y2VSaWdodDogZGVmaW5lRm5hbCh7IG5hbWU6ICdyZWR1Y2VSaWdodCcgfSksXG5cbiAgbWFwOiBkZWZpbmVGbmFsKHsgbmFtZTogJ21hcCcgfSlcbn0pO1xuXG4vLyBhbGlhc2VzXG52YXIgZm4gPSB0aGRmbjtcbmZuLnByb21pc2UgPSBmbi5ydW47XG5mbi50ZXJtaW5hdGUgPSBmbi5oYWx0ID0gZm4uc3RvcDtcbmZuLmluY2x1ZGUgPSBmbi5yZXF1aXJlO1xuXG4vLyBwdWxsIGluIGV2ZW50IGFwaXNcbnV0aWwuZXh0ZW5kKHRoZGZuLCB7XG4gIG9uOiBkZWZpbmUub24oKSxcbiAgb25lOiBkZWZpbmUub24oeyB1bmJpbmRTZWxmT25UcmlnZ2VyOiB0cnVlIH0pLFxuICBvZmY6IGRlZmluZS5vZmYoKSxcbiAgdHJpZ2dlcjogZGVmaW5lLnRyaWdnZXIoKVxufSk7XG5cbmRlZmluZS5ldmVudEFsaWFzZXNPbiggdGhkZm4gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaHJlYWQ7XG5cbn0se1wiLi9kZWZpbmVcIjoxLFwiLi9ldmVudFwiOjIsXCIuL2lzXCI6NSxcIi4vcHJvbWlzZVwiOjYsXCIuL3V0aWxcIjo4LFwiLi93aW5kb3dcIjo5LFwiY2hpbGRfcHJvY2Vzc1wiOnVuZGVmaW5lZCxcInBhdGhcIjp1bmRlZmluZWR9XSw4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzID0gX2RlcmVxXygnLi9pcycpO1xudmFyIHV0aWw7XG5cbi8vIHV0aWxpdHkgZnVuY3Rpb25zIG9ubHkgZm9yIGludGVybmFsIHVzZVxudXRpbCA9IHtcblxuICAvLyB0aGUganF1ZXJ5IGV4dGVuZCgpIGZ1bmN0aW9uXG4gIC8vIE5COiBtb2RpZmllZCB0byB1c2UgaXMgZXRjIHNpbmNlIHdlIGNhbid0IHVzZSBqcXVlcnkgZnVuY3Rpb25zXG4gIGV4dGVuZDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9wdGlvbnMsIG5hbWUsIHNyYywgY29weSwgY29weUlzQXJyYXksIGNsb25lLFxuICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgaSA9IDEsXG4gICAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAgZGVlcCA9IGZhbHNlO1xuXG4gICAgLy8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuICAgIGlmICggdHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nICkge1xuICAgICAgZGVlcCA9IHRhcmdldDtcbiAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcbiAgICAgIC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcbiAgICAgIGkgPSAyO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBjYXNlIHdoZW4gdGFyZ2V0IGlzIGEgc3RyaW5nIG9yIHNvbWV0aGluZyAocG9zc2libGUgaW4gZGVlcCBjb3B5KVxuICAgIGlmICggdHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgIWlzLmZuKHRhcmdldCkgKSB7XG4gICAgICB0YXJnZXQgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBleHRlbmQgalF1ZXJ5IGl0c2VsZiBpZiBvbmx5IG9uZSBhcmd1bWVudCBpcyBwYXNzZWRcbiAgICBpZiAoIGxlbmd0aCA9PT0gaSApIHtcbiAgICAgIHRhcmdldCA9IHRoaXM7XG4gICAgICAtLWk7XG4gICAgfVxuXG4gICAgZm9yICggOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG4gICAgICAvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG4gICAgICBpZiAoIChvcHRpb25zID0gYXJndW1lbnRzWyBpIF0pICE9IG51bGwgKSB7XG4gICAgICAgIC8vIEV4dGVuZCB0aGUgYmFzZSBvYmplY3RcbiAgICAgICAgZm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuICAgICAgICAgIHNyYyA9IHRhcmdldFsgbmFtZSBdO1xuICAgICAgICAgIGNvcHkgPSBvcHRpb25zWyBuYW1lIF07XG5cbiAgICAgICAgICAvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG4gICAgICAgICAgaWYgKCB0YXJnZXQgPT09IGNvcHkgKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgICBpZiAoIGRlZXAgJiYgY29weSAmJiAoIGlzLnBsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IGlzLmFycmF5KGNvcHkpKSApICkge1xuICAgICAgICAgICAgaWYgKCBjb3B5SXNBcnJheSApIHtcbiAgICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgaXMuYXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiBpcy5wbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuICAgICAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSB1dGlsLmV4dGVuZCggZGVlcCwgY2xvbmUsIGNvcHkgKTtcblxuICAgICAgICAgIC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICB9IGVsc2UgaWYgKCBjb3B5ICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICB0YXJnZXRbIG5hbWUgXSA9IGNvcHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3RcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9LFxuXG4gIGVycm9yOiBmdW5jdGlvbiggbXNnICl7XG4gICAgaWYoIGNvbnNvbGUgKXtcbiAgICAgIGlmKCBjb25zb2xlLmVycm9yICl7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoIGNvbnNvbGUsIGFyZ3VtZW50cyApO1xuICAgICAgfSBlbHNlIGlmKCBjb25zb2xlLmxvZyApe1xuICAgICAgICBjb25zb2xlLmxvZy5hcHBseSggY29uc29sZSwgYXJndW1lbnRzICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBtc2c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG1zZztcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcblxufSx7XCIuL2lzXCI6NX1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSAoIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHdpbmRvdyApO1xuXG59LHt9XX0se30sWzRdKSg0KVxufSk7XG5cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9d2VhdmVyLmpzLm1hcCIsIndpbmRvdy5mb29ncmFwaCA9IHtcbiAgLyoqXG4gICAqIEluc2VydCBhIHZlcnRleCBpbnRvIHRoaXMgZ3JhcGguXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJ0ZXggQSB2YWxpZCBWZXJ0ZXggaW5zdGFuY2VcbiAgICovXG4gIGluc2VydFZlcnRleDogZnVuY3Rpb24odmVydGV4KSB7XG4gICAgICB0aGlzLnZlcnRpY2VzLnB1c2godmVydGV4KTtcbiAgICAgIHRoaXMudmVydGV4Q291bnQrKztcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYW4gZWRnZSB2ZXJ0ZXgxIC0tPiB2ZXJ0ZXgyLlxuICAgKlxuICAgKiBAcGFyYW0gbGFiZWwgTGFiZWwgZm9yIHRoaXMgZWRnZVxuICAgKiBAcGFyYW0gd2VpZ2h0IFdlaWdodCBvZiB0aGlzIGVkZ2VcbiAgICogQHBhcmFtIHZlcnRleDEgU3RhcnRpbmcgVmVydGV4IGluc3RhbmNlXG4gICAqIEBwYXJhbSB2ZXJ0ZXgyIEVuZGluZyBWZXJ0ZXggaW5zdGFuY2VcbiAgICogQHJldHVybiBOZXdseSBjcmVhdGVkIEVkZ2UgaW5zdGFuY2VcbiAgICovXG4gIGluc2VydEVkZ2U6IGZ1bmN0aW9uKGxhYmVsLCB3ZWlnaHQsIHZlcnRleDEsIHZlcnRleDIsIHN0eWxlKSB7XG4gICAgICB2YXIgZTEgPSBuZXcgZm9vZ3JhcGguRWRnZShsYWJlbCwgd2VpZ2h0LCB2ZXJ0ZXgyLCBzdHlsZSk7XG4gICAgICB2YXIgZTIgPSBuZXcgZm9vZ3JhcGguRWRnZShudWxsLCB3ZWlnaHQsIHZlcnRleDEsIG51bGwpO1xuXG4gICAgICB2ZXJ0ZXgxLmVkZ2VzLnB1c2goZTEpO1xuICAgICAgdmVydGV4Mi5yZXZlcnNlRWRnZXMucHVzaChlMik7XG5cbiAgICAgIHJldHVybiBlMTtcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgZWRnZS5cbiAgICpcbiAgICogQHBhcmFtIHZlcnRleCBTdGFydGluZyB2ZXJ0ZXhcbiAgICogQHBhcmFtIGVkZ2UgRWRnZSB0byByZW1vdmVcbiAgICovXG4gIHJlbW92ZUVkZ2U6IGZ1bmN0aW9uKHZlcnRleDEsIHZlcnRleDIpIHtcbiAgICAgIGZvciAodmFyIGkgPSB2ZXJ0ZXgxLmVkZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmICh2ZXJ0ZXgxLmVkZ2VzW2ldLmVuZFZlcnRleCA9PSB2ZXJ0ZXgyKSB7XG4gICAgICAgICAgdmVydGV4MS5lZGdlcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gdmVydGV4Mi5yZXZlcnNlRWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHZlcnRleDIucmV2ZXJzZUVkZ2VzW2ldLmVuZFZlcnRleCA9PSB2ZXJ0ZXgxKSB7XG4gICAgICAgICAgdmVydGV4Mi5yZXZlcnNlRWRnZXMuc3BsaWNlKGksMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgdmVydGV4LlxuICAgKlxuICAgKiBAcGFyYW0gdmVydGV4IFZlcnRleCB0byByZW1vdmUgZnJvbSB0aGUgZ3JhcGhcbiAgICovXG4gIHJlbW92ZVZlcnRleDogZnVuY3Rpb24odmVydGV4KSB7XG4gICAgICBmb3IgKHZhciBpID0gdmVydGV4LmVkZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xuICAgICAgICB0aGlzLnJlbW92ZUVkZ2UodmVydGV4LCB2ZXJ0ZXguZWRnZXNbaV0uZW5kVmVydGV4KTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IHZlcnRleC5yZXZlcnNlRWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlRWRnZSh2ZXJ0ZXgucmV2ZXJzZUVkZ2VzW2ldLmVuZFZlcnRleCwgdmVydGV4KTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudmVydGljZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XG4gICAgICAgIGlmICh0aGlzLnZlcnRpY2VzW2ldID09IHZlcnRleCkge1xuICAgICAgICAgIHRoaXMudmVydGljZXMuc3BsaWNlKGksMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy52ZXJ0ZXhDb3VudC0tO1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIFBsb3RzIHRoaXMgZ3JhcGggdG8gYSBjYW52YXMuXG4gICAqXG4gICAqIEBwYXJhbSBjYW52YXMgQSBwcm9wZXIgY2FudmFzIGluc3RhbmNlXG4gICAqL1xuICBwbG90OiBmdW5jdGlvbihjYW52YXMpIHtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIC8qIERyYXcgZWRnZXMgZmlyc3QgKi9cbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlc1tpXTtcbiAgICAgICAgaWYgKCF2LmhpZGRlbikge1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdi5lZGdlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIGUgPSB2LmVkZ2VzW2pdO1xuICAgICAgICAgICAgLyogRHJhdyBlZGdlIChpZiBub3QgaGlkZGVuKSAqL1xuICAgICAgICAgICAgaWYgKCFlLmhpZGRlbilcbiAgICAgICAgICAgICAgZS5kcmF3KGNhbnZhcywgdik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIERyYXcgdGhlIHZlcnRpY2VzLiAqL1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbaV07XG5cbiAgICAgICAgLyogRHJhdyB2ZXJ0ZXggKGlmIG5vdCBoaWRkZW4pICovXG4gICAgICAgIGlmICghdi5oaWRkZW4pXG4gICAgICAgICAgdi5kcmF3KGNhbnZhcyk7XG4gICAgICB9XG4gICAgfSxcblxuICAvKipcbiAgICogR3JhcGggb2JqZWN0IGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbGFiZWwgTGFiZWwgb2YgdGhpcyBncmFwaFxuICAgKiBAcGFyYW0gZGlyZWN0ZWQgdHJ1ZSBvciBmYWxzZVxuICAgKi9cbiAgR3JhcGg6IGZ1bmN0aW9uIChsYWJlbCwgZGlyZWN0ZWQpIHtcbiAgICAgIC8qIEZpZWxkcy4gKi9cbiAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgQXJyYXkoKTtcbiAgICAgIHRoaXMuZGlyZWN0ZWQgPSBkaXJlY3RlZDtcbiAgICAgIHRoaXMudmVydGV4Q291bnQgPSAwO1xuXG4gICAgICAvKiBHcmFwaCBtZXRob2RzLiAqL1xuICAgICAgdGhpcy5pbnNlcnRWZXJ0ZXggPSBmb29ncmFwaC5pbnNlcnRWZXJ0ZXg7XG4gICAgICB0aGlzLnJlbW92ZVZlcnRleCA9IGZvb2dyYXBoLnJlbW92ZVZlcnRleDtcbiAgICAgIHRoaXMuaW5zZXJ0RWRnZSA9IGZvb2dyYXBoLmluc2VydEVkZ2U7XG4gICAgICB0aGlzLnJlbW92ZUVkZ2UgPSBmb29ncmFwaC5yZW1vdmVFZGdlO1xuICAgICAgdGhpcy5wbG90ID0gZm9vZ3JhcGgucGxvdDtcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBWZXJ0ZXggb2JqZWN0IGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbGFiZWwgTGFiZWwgb2YgdGhpcyB2ZXJ0ZXhcbiAgICogQHBhcmFtIG5leHQgUmVmZXJlbmNlIHRvIHRoZSBuZXh0IHZlcnRleCBvZiB0aGlzIGdyYXBoXG4gICAqIEBwYXJhbSBmaXJzdEVkZ2UgRmlyc3QgZWRnZSBvZiBhIGxpbmtlZCBsaXN0IG9mIGVkZ2VzXG4gICAqL1xuICBWZXJ0ZXg6IGZ1bmN0aW9uKGxhYmVsLCB4LCB5LCBzdHlsZSkge1xuICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgdGhpcy5lZGdlcyA9IG5ldyBBcnJheSgpO1xuICAgICAgdGhpcy5yZXZlcnNlRWRnZXMgPSBuZXcgQXJyYXkoKTtcbiAgICAgIHRoaXMueCA9IHg7XG4gICAgICB0aGlzLnkgPSB5O1xuICAgICAgdGhpcy5keCA9IDA7XG4gICAgICB0aGlzLmR5ID0gMDtcbiAgICAgIHRoaXMubGV2ZWwgPSAtMTtcbiAgICAgIHRoaXMubnVtYmVyT2ZQYXJlbnRzID0gMDtcbiAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XG4gICAgICB0aGlzLmZpeGVkID0gZmFsc2U7ICAgICAvLyBGaXhlZCB2ZXJ0aWNlcyBhcmUgc3RhdGljICh1bm1vdmFibGUpXG5cbiAgICAgIGlmKHN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG4gICAgICB9XG4gICAgICBlbHNlIHsgLy8gRGVmYXVsdFxuICAgICAgICAgIHRoaXMuc3R5bGUgPSBuZXcgZm9vZ3JhcGguVmVydGV4U3R5bGUoJ2VsbGlwc2UnLCA4MCwgNDAsICcjZmZmZmZmJywgJyMwMDAwMDAnLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9LFxuXG5cbiAgIC8qKlxuICAgKiBWZXJ0ZXhTdHlsZSBvYmplY3QgdHlwZSBmb3IgZGVmaW5pbmcgdmVydGV4IHN0eWxlIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFwZSBTaGFwZSBvZiB0aGUgdmVydGV4ICgnZWxsaXBzZScgb3IgJ3JlY3QnKVxuICAgKiBAcGFyYW0gd2lkdGggV2lkdGggaW4gcHhcbiAgICogQHBhcmFtIGhlaWdodCBIZWlnaHQgaW4gcHhcbiAgICogQHBhcmFtIGZpbGxDb2xvciBUaGUgY29sb3Igd2l0aCB3aGljaCB0aGUgdmVydGV4IGlzIGRyYXduIChSR0IgSEVYIHN0cmluZylcbiAgICogQHBhcmFtIGJvcmRlckNvbG9yIFRoZSBjb2xvciB3aXRoIHdoaWNoIHRoZSBib3JkZXIgb2YgdGhlIHZlcnRleCBpcyBkcmF3biAoUkdCIEhFWCBzdHJpbmcpXG4gICAqIEBwYXJhbSBzaG93TGFiZWwgU2hvdyB0aGUgdmVydGV4IGxhYmVsIG9yIG5vdFxuICAgKi9cbiAgVmVydGV4U3R5bGU6IGZ1bmN0aW9uKHNoYXBlLCB3aWR0aCwgaGVpZ2h0LCBmaWxsQ29sb3IsIGJvcmRlckNvbG9yLCBzaG93TGFiZWwpIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBzaGFwZTtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5maWxsQ29sb3IgPSBmaWxsQ29sb3I7XG4gICAgICB0aGlzLmJvcmRlckNvbG9yID0gYm9yZGVyQ29sb3I7XG4gICAgICB0aGlzLnNob3dMYWJlbCA9IHNob3dMYWJlbDtcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBFZGdlIG9iamVjdCBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGxhYmVsIExhYmVsIG9mIHRoaXMgZWRnZVxuICAgKiBAcGFyYW0gbmV4dCBOZXh0IGVkZ2UgcmVmZXJlbmNlXG4gICAqIEBwYXJhbSB3ZWlnaHQgRWRnZSB3ZWlnaHRcbiAgICogQHBhcmFtIGVuZFZlcnRleCBEZXN0aW5hdGlvbiBWZXJ0ZXggaW5zdGFuY2VcbiAgICovXG4gIEVkZ2U6IGZ1bmN0aW9uIChsYWJlbCwgd2VpZ2h0LCBlbmRWZXJ0ZXgsIHN0eWxlKSB7XG4gICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICB0aGlzLndlaWdodCA9IHdlaWdodDtcbiAgICAgIHRoaXMuZW5kVmVydGV4ID0gZW5kVmVydGV4O1xuICAgICAgdGhpcy5zdHlsZSA9IG51bGw7XG4gICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlO1xuXG4gICAgICAvLyBDdXJ2aW5nIGluZm9ybWF0aW9uXG4gICAgICB0aGlzLmN1cnZlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jb250cm9sWCA9IC0xOyAgIC8vIENvbnRyb2wgY29vcmRpbmF0ZXMgZm9yIEJlemllciBjdXJ2ZSBkcmF3aW5nXG4gICAgICB0aGlzLmNvbnRyb2xZID0gLTE7XG4gICAgICB0aGlzLm9yaWdpbmFsID0gbnVsbDsgLy8gSWYgdGhpcyBpcyBhIHRlbXBvcmFyeSBlZGdlIGl0IGhvbGRzIHRoZSBvcmlnaW5hbCBlZGdlXG5cbiAgICAgIGlmKHN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuICAgICAgfVxuICAgICAgZWxzZSB7ICAvLyBTZXQgdG8gZGVmYXVsdFxuICAgICAgICB0aGlzLnN0eWxlID0gbmV3IGZvb2dyYXBoLkVkZ2VTdHlsZSgyLCAnIzAwMDAwMCcsIHRydWUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9LFxuXG5cblxuICAvKipcbiAgICogRWRnZVN0eWxlIG9iamVjdCB0eXBlIGZvciBkZWZpbmluZyB2ZXJ0ZXggc3R5bGUgb3B0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHdpZHRoIEVkZ2UgbGluZSB3aWR0aFxuICAgKiBAcGFyYW0gY29sb3IgVGhlIGNvbG9yIHdpdGggd2hpY2ggdGhlIGVkZ2UgaXMgZHJhd25cbiAgICogQHBhcmFtIHNob3dBcnJvdyBEcmF3IHRoZSBlZGdlIGFycm93IChvbmx5IGlmIGRpcmVjdGVkKVxuICAgKiBAcGFyYW0gc2hvd0xhYmVsIFNob3cgdGhlIGVkZ2UgbGFiZWwgb3Igbm90XG4gICAqL1xuICBFZGdlU3R5bGU6IGZ1bmN0aW9uKHdpZHRoLCBjb2xvciwgc2hvd0Fycm93LCBzaG93TGFiZWwpIHtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgIHRoaXMuc2hvd0Fycm93ID0gc2hvd0Fycm93O1xuICAgICAgdGhpcy5zaG93TGFiZWwgPSBzaG93TGFiZWw7XG4gICAgfSxcblxuICAvKipcbiAgICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZm9vZ3JhcGggSmF2YXNjcmlwdCBncmFwaCBsaWJyYXJ5LlxuICAgKlxuICAgKiBEZXNjcmlwdGlvbjogUmFuZG9tIHZlcnRleCBsYXlvdXQgbWFuYWdlclxuICAgKi9cblxuICAvKipcbiAgICogQ2xhc3MgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB3aWR0aCBMYXlvdXQgd2lkdGhcbiAgICogQHBhcmFtIGhlaWdodCBMYXlvdXQgaGVpZ2h0XG4gICAqL1xuICBSYW5kb21WZXJ0ZXhMYXlvdXQ6IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9LFxuXG5cbiAgLyoqXG4gICAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGZvb2dyYXBoIEphdmFzY3JpcHQgZ3JhcGggbGlicmFyeS5cbiAgICpcbiAgICogRGVzY3JpcHRpb246IEZydWNodGVybWFuLVJlaW5nb2xkIGZvcmNlLWRpcmVjdGVkIHZlcnRleFxuICAgKiAgICAgICAgICAgICAgbGF5b3V0IG1hbmFnZXJcbiAgICovXG5cbiAgLyoqXG4gICAqIENsYXNzIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gd2lkdGggTGF5b3V0IHdpZHRoXG4gICAqIEBwYXJhbSBoZWlnaHQgTGF5b3V0IGhlaWdodFxuICAgKiBAcGFyYW0gaXRlcmF0aW9ucyBOdW1iZXIgb2YgaXRlcmF0aW9ucyAtXG4gICAqIHdpdGggbW9yZSBpdGVyYXRpb25zIGl0IGlzIG1vcmUgbGlrZWx5IHRoZSBsYXlvdXQgaGFzIGNvbnZlcmdlZCBpbnRvIGEgc3RhdGljIGVxdWlsaWJyaXVtLlxuICAgKi9cbiAgRm9yY2VEaXJlY3RlZFZlcnRleExheW91dDogZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGl0ZXJhdGlvbnMsIHJhbmRvbWl6ZSwgZXBzKSB7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuaXRlcmF0aW9ucyA9IGl0ZXJhdGlvbnM7XG4gICAgICB0aGlzLnJhbmRvbWl6ZSA9IHJhbmRvbWl6ZTtcbiAgICAgIHRoaXMuZXBzID0gZXBzO1xuICAgICAgdGhpcy5jYWxsYmFjayA9IGZ1bmN0aW9uKCkge307XG4gICAgfSxcblxuICBBOiAxLjUsIC8vIEZpbmUgdHVuZSBhdHRyYWN0aW9uXG5cbiAgUjogMC41ICAvLyBGaW5lIHR1bmUgcmVwdWxzaW9uXG59O1xuXG4vKipcbiAqIHRvU3RyaW5nIG92ZXJsb2FkIGZvciBlYXNpZXIgZGVidWdnaW5nXG4gKi9cbmZvb2dyYXBoLlZlcnRleC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFwiW3Y6XCIgKyB0aGlzLmxhYmVsICsgXCJdIFwiO1xufTtcblxuLyoqXG4gKiB0b1N0cmluZyBvdmVybG9hZCBmb3IgZWFzaWVyIGRlYnVnZ2luZ1xuICovXG5mb29ncmFwaC5FZGdlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJbZTpcIiArIHRoaXMuZW5kVmVydGV4LmxhYmVsICsgXCJdIFwiO1xufTtcblxuLyoqXG4gKiBEcmF3IHZlcnRleCBtZXRob2QuXG4gKlxuICogQHBhcmFtIGNhbnZhcyBqc0dyYXBoaWNzIGluc3RhbmNlXG4gKi9cbmZvb2dyYXBoLlZlcnRleC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICB2YXIgeCA9IHRoaXMueDtcbiAgdmFyIHkgPSB0aGlzLnk7XG4gIHZhciB3aWR0aCA9IHRoaXMuc3R5bGUud2lkdGg7XG4gIHZhciBoZWlnaHQgPSB0aGlzLnN0eWxlLmhlaWdodDtcbiAgdmFyIHNoYXBlID0gdGhpcy5zdHlsZS5zaGFwZTtcblxuICBjYW52YXMuc2V0U3Ryb2tlKDIpO1xuICBjYW52YXMuc2V0Q29sb3IodGhpcy5zdHlsZS5maWxsQ29sb3IpO1xuXG4gIGlmKHNoYXBlID09ICdyZWN0Jykge1xuICAgIGNhbnZhcy5maWxsUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjYW52YXMuc2V0Q29sb3IodGhpcy5zdHlsZS5ib3JkZXJDb2xvcik7XG4gICAgY2FudmFzLmRyYXdSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICB9XG4gIGVsc2UgeyAvLyBEZWZhdWx0IHRvIGVsbGlwc2VcbiAgICBjYW52YXMuZmlsbEVsbGlwc2UoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgY2FudmFzLnNldENvbG9yKHRoaXMuc3R5bGUuYm9yZGVyQ29sb3IpO1xuICAgIGNhbnZhcy5kcmF3RWxsaXBzZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIGlmKHRoaXMuc3R5bGUuc2hvd0xhYmVsKSB7XG4gICAgY2FudmFzLmRyYXdTdHJpbmdSZWN0KHRoaXMubGFiZWwsIHgsIHkgKyBoZWlnaHQvMiAtIDcsIHdpZHRoLCAnY2VudGVyJyk7XG4gIH1cbn07XG5cbi8qKlxuICogRml0cyB0aGUgZ3JhcGggaW50byB0aGUgYm91bmRpbmcgYm94XG4gKlxuICogQHBhcmFtIHdpZHRoXG4gKiBAcGFyYW0gaGVpZ2h0XG4gKiBAcGFyYW0gcHJlc2VydmVBc3BlY3RcbiAqL1xuZm9vZ3JhcGguR3JhcGgucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHByZXNlcnZlQXNwZWN0KSB7XG4gIGZvciAodmFyIGk4IGluIHRoaXMudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IHRoaXMudmVydGljZXNbaThdO1xuICAgIHYub2xkWCA9IHYueDtcbiAgICB2Lm9sZFkgPSB2Lnk7XG4gIH1cbiAgdmFyIG1ueCA9IHdpZHRoICAqIDAuMTtcbiAgdmFyIG14eCA9IHdpZHRoICAqIDAuOTtcbiAgdmFyIG1ueSA9IGhlaWdodCAqIDAuMTtcbiAgdmFyIG14eSA9IGhlaWdodCAqIDAuOTtcbiAgaWYgKHByZXNlcnZlQXNwZWN0ID09IG51bGwpXG4gICAgcHJlc2VydmVBc3BlY3QgPSB0cnVlO1xuXG4gIHZhciBtaW54ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgdmFyIG1pbnkgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICB2YXIgbWF4eCA9IE51bWJlci5NSU5fVkFMVUU7XG4gIHZhciBtYXh5ID0gTnVtYmVyLk1JTl9WQUxVRTtcblxuICBmb3IgKHZhciBpNyBpbiB0aGlzLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2k3XTtcbiAgICBpZiAodi54IDwgbWlueCkgbWlueCA9IHYueDtcbiAgICBpZiAodi55IDwgbWlueSkgbWlueSA9IHYueTtcbiAgICBpZiAodi54ID4gbWF4eCkgbWF4eCA9IHYueDtcbiAgICBpZiAodi55ID4gbWF4eSkgbWF4eSA9IHYueTtcbiAgfVxuICB2YXIga3ggPSAobXh4LW1ueCkgLyAobWF4eCAtIG1pbngpO1xuICB2YXIga3kgPSAobXh5LW1ueSkgLyAobWF4eSAtIG1pbnkpO1xuXG4gIGlmIChwcmVzZXJ2ZUFzcGVjdCkge1xuICAgIGt4ID0gTWF0aC5taW4oa3gsIGt5KTtcbiAgICBreSA9IE1hdGgubWluKGt4LCBreSk7XG4gIH1cblxuICB2YXIgbmV3TWF4eCA9IE51bWJlci5NSU5fVkFMVUU7XG4gIHZhciBuZXdNYXh5ID0gTnVtYmVyLk1JTl9WQUxVRTtcbiAgZm9yICh2YXIgaTggaW4gdGhpcy52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlc1tpOF07XG4gICAgdi54ID0gKHYueCAtIG1pbngpICoga3g7XG4gICAgdi55ID0gKHYueSAtIG1pbnkpICoga3k7XG4gICAgaWYgKHYueCA+IG5ld01heHgpIG5ld01heHggPSB2Lng7XG4gICAgaWYgKHYueSA+IG5ld01heHkpIG5ld01heHkgPSB2Lnk7XG4gIH1cblxuICB2YXIgZHggPSAoIHdpZHRoICAtIG5ld01heHggKSAvIDIuMDtcbiAgdmFyIGR5ID0gKCBoZWlnaHQgLSBuZXdNYXh5ICkgLyAyLjA7XG4gIGZvciAodmFyIGk4IGluIHRoaXMudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IHRoaXMudmVydGljZXNbaThdO1xuICAgIHYueCArPSBkeDtcbiAgICB2LnkgKz0gZHk7XG4gIH1cbn07XG5cbi8qKlxuICogRHJhdyBlZGdlIG1ldGhvZC4gRHJhd3MgZWRnZSBcInZcIiAtLT4gXCJ0aGlzXCIuXG4gKlxuICogQHBhcmFtIGNhbnZhcyBqc0dyYXBoaWNzIGluc3RhbmNlXG4gKiBAcGFyYW0gdiBTdGFydCB2ZXJ0ZXhcbiAqL1xuZm9vZ3JhcGguRWRnZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgdikge1xuICB2YXIgeDEgPSBNYXRoLnJvdW5kKHYueCArIHYuc3R5bGUud2lkdGgvMik7XG4gIHZhciB5MSA9IE1hdGgucm91bmQodi55ICsgdi5zdHlsZS5oZWlnaHQvMik7XG4gIHZhciB4MiA9IE1hdGgucm91bmQodGhpcy5lbmRWZXJ0ZXgueCArIHRoaXMuZW5kVmVydGV4LnN0eWxlLndpZHRoLzIpO1xuICB2YXIgeTIgPSBNYXRoLnJvdW5kKHRoaXMuZW5kVmVydGV4LnkgKyB0aGlzLmVuZFZlcnRleC5zdHlsZS5oZWlnaHQvMik7XG5cbiAgLy8gQ29udHJvbCBwb2ludCAobmVlZGVkIG9ubHkgZm9yIGN1cnZlZCBlZGdlcylcbiAgdmFyIHgzID0gdGhpcy5jb250cm9sWDtcbiAgdmFyIHkzID0gdGhpcy5jb250cm9sWTtcblxuICAvLyBBcnJvdyB0aXAgYW5kIGFuZ2xlXG4gIHZhciBYX1RJUCwgWV9USVAsIEFOR0xFO1xuXG4gIC8qIFF1YWRyaWMgQmV6aWVyIGN1cnZlIGRlZmluaXRpb24uICovXG4gIGZ1bmN0aW9uIEJ4KHQpIHsgcmV0dXJuICgxLXQpKigxLXQpKngxICsgMiooMS10KSp0KngzICsgdCp0KngyOyB9XG4gIGZ1bmN0aW9uIEJ5KHQpIHsgcmV0dXJuICgxLXQpKigxLXQpKnkxICsgMiooMS10KSp0KnkzICsgdCp0KnkyOyB9XG5cbiAgY2FudmFzLnNldFN0cm9rZSh0aGlzLnN0eWxlLndpZHRoKTtcbiAgY2FudmFzLnNldENvbG9yKHRoaXMuc3R5bGUuY29sb3IpO1xuXG4gIGlmKHRoaXMuY3VydmVkKSB7IC8vIERyYXcgYSBxdWFkcmljIEJlemllciBjdXJ2ZVxuICAgIHRoaXMuY3VydmVkID0gZmFsc2U7IC8vIFJlc2V0XG4gICAgdmFyIHQgPSAwLCBkdCA9IDEvMTA7XG4gICAgdmFyIHhzID0geDEsIHlzID0geTEsIHhuLCB5bjtcblxuICAgIHdoaWxlICh0IDwgMS1kdCkge1xuICAgICAgdCArPSBkdDtcbiAgICAgIHhuID0gQngodCk7XG4gICAgICB5biA9IEJ5KHQpO1xuICAgICAgY2FudmFzLmRyYXdMaW5lKHhzLCB5cywgeG4sIHluKTtcbiAgICAgIHhzID0geG47XG4gICAgICB5cyA9IHluO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgYXJyb3cgdGlwIGNvb3JkaW5hdGVzXG4gICAgWF9USVAgPSB4cztcbiAgICBZX1RJUCA9IHlzO1xuXG4gICAgLy8gTW92ZSB0aGUgdGlwIHRvICgwLDApIGFuZCBjYWxjdWxhdGUgdGhlIGFuZ2xlXG4gICAgLy8gb2YgdGhlIGFycm93IGhlYWRcbiAgICBBTkdMRSA9IGFuZ3VsYXJDb29yZChCeCgxLTIqZHQpIC0gWF9USVAsIEJ5KDEtMipkdCkgLSBZX1RJUCk7XG5cbiAgfSBlbHNlIHtcbiAgICBjYW52YXMuZHJhd0xpbmUoeDEsIHkxLCB4MiwgeTIpO1xuXG4gICAgLy8gU2V0IHRoZSBhcnJvdyB0aXAgY29vcmRpbmF0ZXNcbiAgICBYX1RJUCA9IHgyO1xuICAgIFlfVElQID0geTI7XG5cbiAgICAvLyBNb3ZlIHRoZSB0aXAgdG8gKDAsMCkgYW5kIGNhbGN1bGF0ZSB0aGUgYW5nbGVcbiAgICAvLyBvZiB0aGUgYXJyb3cgaGVhZFxuICAgIEFOR0xFID0gYW5ndWxhckNvb3JkKHgxIC0gWF9USVAsIHkxIC0gWV9USVApO1xuICB9XG5cbiAgaWYodGhpcy5zdHlsZS5zaG93QXJyb3cpIHtcbiAgICBkcmF3QXJyb3coQU5HTEUsIFhfVElQLCBZX1RJUCk7XG4gIH1cblxuICAvLyBUT0RPXG4gIGlmKHRoaXMuc3R5bGUuc2hvd0xhYmVsKSB7XG4gIH1cblxuICAvKipcbiAgICogRHJhd3MgYW4gZWRnZSBhcnJvdy5cbiAgICogQHBhcmFtIHBoaSBUaGUgYW5nbGUgKGluIHJhZGlhbnMpIG9mIHRoZSBhcnJvdyBpbiBwb2xhciBjb29yZGluYXRlcy5cbiAgICogQHBhcmFtIHggWCBjb29yZGluYXRlIG9mIHRoZSBhcnJvdyB0aXAuXG4gICAqIEBwYXJhbSB5IFkgY29vcmRpbmF0ZSBvZiB0aGUgYXJyb3cgdGlwLlxuICAgKi9cbiAgZnVuY3Rpb24gZHJhd0Fycm93KHBoaSwgeCwgeSlcbiAge1xuICAgIC8vIEFycm93IGJvdW5kaW5nIGJveCAoaW4gcHgpXG4gICAgdmFyIEggPSA1MDtcbiAgICB2YXIgVyA9IDEwO1xuXG4gICAgLy8gU2V0IGNhcnRlc2lhbiBjb29yZGluYXRlcyBvZiB0aGUgYXJyb3dcbiAgICB2YXIgcDExID0gMCwgcDEyID0gMDtcbiAgICB2YXIgcDIxID0gSCwgcDIyID0gVy8yO1xuICAgIHZhciBwMzEgPSBILCBwMzIgPSAtVy8yO1xuXG4gICAgLy8gQ29udmVydCB0byBwb2xhciBjb29yZGluYXRlc1xuICAgIHZhciByMiA9IHJhZGlhbENvb3JkKHAyMSwgcDIyKTtcbiAgICB2YXIgcjMgPSByYWRpYWxDb29yZChwMzEsIHAzMik7XG4gICAgdmFyIHBoaTIgPSBhbmd1bGFyQ29vcmQocDIxLCBwMjIpO1xuICAgIHZhciBwaGkzID0gYW5ndWxhckNvb3JkKHAzMSwgcDMyKTtcblxuICAgIC8vIFJvdGF0ZSB0aGUgYXJyb3dcbiAgICBwaGkyICs9IHBoaTtcbiAgICBwaGkzICs9IHBoaTtcblxuICAgIC8vIFVwZGF0ZSBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXNcbiAgICBwMjEgPSByMiAqIE1hdGguY29zKHBoaTIpO1xuICAgIHAyMiA9IHIyICogTWF0aC5zaW4ocGhpMik7XG4gICAgcDMxID0gcjMgKiBNYXRoLmNvcyhwaGkzKTtcbiAgICBwMzIgPSByMyAqIE1hdGguc2luKHBoaTMpO1xuXG4gICAgLy8gVHJhbnNsYXRlXG4gICAgcDExICs9IHg7XG4gICAgcDEyICs9IHk7XG4gICAgcDIxICs9IHg7XG4gICAgcDIyICs9IHk7XG4gICAgcDMxICs9IHg7XG4gICAgcDMyICs9IHk7XG5cbiAgICAvLyBEcmF3XG4gICAgY2FudmFzLmZpbGxQb2x5Z29uKG5ldyBBcnJheShwMTEsIHAyMSwgcDMxKSwgbmV3IEFycmF5KHAxMiwgcDIyLCBwMzIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFuZ3VsYXIgY29vcmRpbmF0ZS5cbiAgICogQHBhcmFtIHggWCBjb29yZGluYXRlXG4gICAqIEBwYXJhbSB5IFkgY29vcmRpbmF0ZVxuICAgKi9cbiAgIGZ1bmN0aW9uIGFuZ3VsYXJDb29yZCh4LCB5KVxuICAge1xuICAgICB2YXIgcGhpID0gMC4wO1xuXG4gICAgIGlmICh4ID4gMCAmJiB5ID49IDApIHtcbiAgICAgIHBoaSA9IE1hdGguYXRhbih5L3gpO1xuICAgICB9XG4gICAgIGlmICh4ID4gMCAmJiB5IDwgMCkge1xuICAgICAgIHBoaSA9IE1hdGguYXRhbih5L3gpICsgMipNYXRoLlBJO1xuICAgICB9XG4gICAgIGlmICh4IDwgMCkge1xuICAgICAgIHBoaSA9IE1hdGguYXRhbih5L3gpICsgTWF0aC5QSTtcbiAgICAgfVxuICAgICBpZiAoeCA9IDAgJiYgeSA+IDApIHtcbiAgICAgICBwaGkgPSBNYXRoLlBJLzI7XG4gICAgIH1cbiAgICAgaWYgKHggPSAwICYmIHkgPCAwKSB7XG4gICAgICAgcGhpID0gMypNYXRoLlBJLzI7XG4gICAgIH1cblxuICAgICByZXR1cm4gcGhpO1xuICAgfVxuXG4gICAvKipcbiAgICAqIEdldCB0aGUgcmFkaWFuIGNvb3JkaWFudGUuXG4gICAgKiBAcGFyYW0geDFcbiAgICAqIEBwYXJhbSB5MVxuICAgICogQHBhcmFtIHgyXG4gICAgKiBAcGFyYW0geTJcbiAgICAqL1xuICAgZnVuY3Rpb24gcmFkaWFsQ29vcmQoeCwgeSlcbiAgIHtcbiAgICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkpO1xuICAgfVxufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBjb29yZGluYXRlcyBiYXNlZCBvbiBwdXJlIGNoYW5jZS5cbiAqXG4gKiBAcGFyYW0gZ3JhcGggQSB2YWxpZCBncmFwaCBpbnN0YW5jZVxuICovXG5mb29ncmFwaC5SYW5kb21WZXJ0ZXhMYXlvdXQucHJvdG90eXBlLmxheW91dCA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpPGdyYXBoLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1tpXTtcbiAgICB2LnggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLndpZHRoKTtcbiAgICB2LnkgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmhlaWdodCk7XG4gIH1cbn07XG5cbi8qKlxuICogSWRlbnRpZmllcyBjb25uZWN0ZWQgY29tcG9uZW50cyBvZiBhIGdyYXBoIGFuZCBjcmVhdGVzIFwiY2VudHJhbFwiXG4gKiB2ZXJ0aWNlcyBmb3IgZWFjaCBjb21wb25lbnQuIElmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgY29tcG9uZW50LFxuICogYWxsIGNlbnRyYWwgdmVydGljZXMgb2YgaW5kaXZpZHVhbCBjb21wb25lbnRzIGFyZSBjb25uZWN0ZWQgdG9cbiAqIGVhY2ggb3RoZXIgdG8gcHJldmVudCBjb21wb25lbnQgZHJpZnQuXG4gKlxuICogQHBhcmFtIGdyYXBoIEEgdmFsaWQgZ3JhcGggaW5zdGFuY2VcbiAqIEByZXR1cm4gQSBsaXN0IG9mIGNvbXBvbmVudCBjZW50ZXIgdmVydGljZXMgb3IgbnVsbCB3aGVuIHRoZXJlXG4gKiAgICAgICAgIGlzIG9ubHkgb25lIGNvbXBvbmVudC5cbiAqL1xuZm9vZ3JhcGguRm9yY2VEaXJlY3RlZFZlcnRleExheW91dC5wcm90b3R5cGUuX19pZGVudGlmeUNvbXBvbmVudHMgPSBmdW5jdGlvbihncmFwaCkge1xuICB2YXIgY29tcG9uZW50Q2VudGVycyA9IG5ldyBBcnJheSgpO1xuICB2YXIgY29tcG9uZW50cyA9IG5ldyBBcnJheSgpO1xuXG4gIC8vIERlcHRoIGZpcnN0IHNlYXJjaFxuICBmdW5jdGlvbiBkZnModmVydGV4KVxuICB7XG4gICAgdmFyIHN0YWNrID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIGNvbXBvbmVudCA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBjZW50ZXJWZXJ0ZXggPSBuZXcgZm9vZ3JhcGguVmVydGV4KFwiY29tcG9uZW50X2NlbnRlclwiLCAtMSwgLTEpO1xuICAgIGNlbnRlclZlcnRleC5oaWRkZW4gPSB0cnVlO1xuICAgIGNvbXBvbmVudENlbnRlcnMucHVzaChjZW50ZXJWZXJ0ZXgpO1xuICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuXG4gICAgZnVuY3Rpb24gdmlzaXRWZXJ0ZXgodilcbiAgICB7XG4gICAgICBjb21wb25lbnQucHVzaCh2KTtcbiAgICAgIHYuX19kZnNWaXNpdGVkID0gdHJ1ZTtcblxuICAgICAgZm9yICh2YXIgaSBpbiB2LmVkZ2VzKSB7XG4gICAgICAgIHZhciBlID0gdi5lZGdlc1tpXTtcbiAgICAgICAgaWYgKCFlLmhpZGRlbilcbiAgICAgICAgICBzdGFjay5wdXNoKGUuZW5kVmVydGV4KTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSBpbiB2LnJldmVyc2VFZGdlcykge1xuICAgICAgICBpZiAoIXYucmV2ZXJzZUVkZ2VzW2ldLmhpZGRlbilcbiAgICAgICAgICBzdGFjay5wdXNoKHYucmV2ZXJzZUVkZ2VzW2ldLmVuZFZlcnRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRWZXJ0ZXgodmVydGV4KTtcbiAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHUgPSBzdGFjay5wb3AoKTtcblxuICAgICAgaWYgKCF1Ll9fZGZzVmlzaXRlZCAmJiAhdS5oaWRkZW4pIHtcbiAgICAgICAgdmlzaXRWZXJ0ZXgodSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2xlYXIgREZTIHZpc2l0ZWQgZmxhZ1xuICBmb3IgKHZhciBpIGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1tpXTtcbiAgICB2Ll9fZGZzVmlzaXRlZCA9IGZhbHNlO1xuICB9XG5cbiAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCB2ZXJ0aWNlcyBzdGFydGluZyBERlMgZnJvbSBlYWNoIHZlcnRleFxuICAvLyB0aGF0IGhhc24ndCBiZWVuIHZpc2l0ZWQgeWV0LlxuICBmb3IgKHZhciBrIGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1trXTtcbiAgICBpZiAoIXYuX19kZnNWaXNpdGVkICYmICF2LmhpZGRlbilcbiAgICAgIGRmcyh2KTtcbiAgfVxuXG4gIC8vIEludGVyY29ubmVjdCBhbGwgY2VudGVyIHZlcnRpY2VzXG4gIGlmIChjb21wb25lbnRDZW50ZXJzLmxlbmd0aCA+IDEpIHtcbiAgICBmb3IgKHZhciBpIGluIGNvbXBvbmVudENlbnRlcnMpIHtcbiAgICAgIGdyYXBoLmluc2VydFZlcnRleChjb21wb25lbnRDZW50ZXJzW2ldKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSBpbiBjb21wb25lbnRzKSB7XG4gICAgICBmb3IgKHZhciBqIGluIGNvbXBvbmVudHNbaV0pIHtcbiAgICAgICAgLy8gQ29ubmVjdCB2aXNpdGVkIHZlcnRleCB0byBcImNlbnRyYWxcIiBjb21wb25lbnQgdmVydGV4XG4gICAgICAgIGVkZ2UgPSBncmFwaC5pbnNlcnRFZGdlKFwiXCIsIDEsIGNvbXBvbmVudHNbaV1bal0sIGNvbXBvbmVudENlbnRlcnNbaV0pO1xuICAgICAgICBlZGdlLmhpZGRlbiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSBpbiBjb21wb25lbnRDZW50ZXJzKSB7XG4gICAgICBmb3IgKHZhciBqIGluIGNvbXBvbmVudENlbnRlcnMpIHtcbiAgICAgICAgaWYgKGkgIT0gaikge1xuICAgICAgICAgIGUgPSBncmFwaC5pbnNlcnRFZGdlKFwiXCIsIDMsIGNvbXBvbmVudENlbnRlcnNbaV0sIGNvbXBvbmVudENlbnRlcnNbal0pO1xuICAgICAgICAgIGUuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb21wb25lbnRDZW50ZXJzO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGNvb3JkaW5hdGVzIGJhc2VkIG9uIGZvcmNlLWRpcmVjdGVkIHBsYWNlbWVudFxuICogYWxnb3JpdGhtLlxuICpcbiAqIEBwYXJhbSBncmFwaCBBIHZhbGlkIGdyYXBoIGluc3RhbmNlXG4gKi9cbmZvb2dyYXBoLkZvcmNlRGlyZWN0ZWRWZXJ0ZXhMYXlvdXQucHJvdG90eXBlLmxheW91dCA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIHRoaXMuZ3JhcGggPSBncmFwaDtcbiAgdmFyIGFyZWEgPSB0aGlzLndpZHRoICogdGhpcy5oZWlnaHQ7XG4gIHZhciBrID0gTWF0aC5zcXJ0KGFyZWEgLyBncmFwaC52ZXJ0ZXhDb3VudCk7XG5cbiAgdmFyIHQgPSB0aGlzLndpZHRoIC8gMTA7IC8vIFRlbXBlcmF0dXJlLlxuICB2YXIgZHQgPSB0IC8gKHRoaXMuaXRlcmF0aW9ucyArIDEpO1xuXG4gIHZhciBlcHMgPSB0aGlzLmVwczsgLy8gTWluaW11bSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSB2ZXJ0aWNlc1xuXG4gIC8vIEF0dHJhY3RpdmUgYW5kIHJlcHVsc2l2ZSBmb3JjZXNcbiAgZnVuY3Rpb24gRmEoeikgeyByZXR1cm4gZm9vZ3JhcGguQSp6KnovazsgfVxuICBmdW5jdGlvbiBGcih6KSB7IHJldHVybiBmb29ncmFwaC5SKmsqay96OyB9XG4gIGZ1bmN0aW9uIEZ3KHopIHsgcmV0dXJuIDEveip6OyB9ICAvLyBGb3JjZSBlbWl0ZWQgYnkgdGhlIHdhbGxzXG5cbiAgLy8gSW5pdGlhdGUgY29tcG9uZW50IGlkZW50aWZpY2F0aW9uIGFuZCB2aXJ0dWFsIHZlcnRleCBjcmVhdGlvblxuICAvLyB0byBwcmV2ZW50IGRpc2Nvbm5lY3RlZCBncmFwaCBjb21wb25lbnRzIGZyb20gZHJpZnRpbmcgdG9vIGZhciBhcGFydFxuICBjZW50ZXJzID0gdGhpcy5fX2lkZW50aWZ5Q29tcG9uZW50cyhncmFwaCk7XG5cbiAgLy8gQXNzaWduIGluaXRpYWwgcmFuZG9tIHBvc2l0aW9uc1xuICBpZih0aGlzLnJhbmRvbWl6ZSkge1xuICAgIHJhbmRvbUxheW91dCA9IG5ldyBmb29ncmFwaC5SYW5kb21WZXJ0ZXhMYXlvdXQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHJhbmRvbUxheW91dC5sYXlvdXQoZ3JhcGgpO1xuICB9XG5cbiAgLy8gUnVuIHRocm91Z2ggc29tZSBpdGVyYXRpb25zXG4gIGZvciAodmFyIHEgPSAwOyBxIDwgdGhpcy5pdGVyYXRpb25zOyBxKyspIHtcblxuICAgIC8qIENhbGN1bGF0ZSByZXB1bHNpdmUgZm9yY2VzLiAqL1xuICAgIGZvciAodmFyIGkxIGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2kxXTtcblxuICAgICAgdi5keCA9IDA7XG4gICAgICB2LmR5ID0gMDtcbiAgICAgIC8vIERvIG5vdCBtb3ZlIGZpeGVkIHZlcnRpY2VzXG4gICAgICBpZighdi5maXhlZCkge1xuICAgICAgICBmb3IgKHZhciBpMiBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgICAgICAgIHZhciB1ID0gZ3JhcGgudmVydGljZXNbaTJdO1xuICAgICAgICAgIGlmICh2ICE9IHUgJiYgIXUuZml4ZWQpIHtcbiAgICAgICAgICAgIC8qIERpZmZlcmVuY2UgdmVjdG9yIGJldHdlZW4gdGhlIHR3byB2ZXJ0aWNlcy4gKi9cbiAgICAgICAgICAgIHZhciBkaWZ4ID0gdi54IC0gdS54O1xuICAgICAgICAgICAgdmFyIGRpZnkgPSB2LnkgLSB1Lnk7XG5cbiAgICAgICAgICAgIC8qIExlbmd0aCBvZiB0aGUgZGlmIHZlY3Rvci4gKi9cbiAgICAgICAgICAgIHZhciBkID0gTWF0aC5tYXgoZXBzLCBNYXRoLnNxcnQoZGlmeCpkaWZ4ICsgZGlmeSpkaWZ5KSk7XG4gICAgICAgICAgICB2YXIgZm9yY2UgPSBGcihkKTtcbiAgICAgICAgICAgIHYuZHggPSB2LmR4ICsgKGRpZngvZCkgKiBmb3JjZTtcbiAgICAgICAgICAgIHYuZHkgPSB2LmR5ICsgKGRpZnkvZCkgKiBmb3JjZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLyogVHJlYXQgdGhlIHdhbGxzIGFzIHN0YXRpYyBvYmplY3RzIGVtaXRpbmcgZm9yY2UgRncuICovXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgc3VtIG9mIFwid2FsbFwiIGZvcmNlcyBpbiAodi54LCB2LnkpXG4gICAgICAgIC8qXG4gICAgICAgIHZhciB4ID0gTWF0aC5tYXgoZXBzLCB2LngpO1xuICAgICAgICB2YXIgeSA9IE1hdGgubWF4KGVwcywgdi55KTtcbiAgICAgICAgdmFyIHd4ID0gTWF0aC5tYXgoZXBzLCB0aGlzLndpZHRoIC0gdi54KTtcbiAgICAgICAgdmFyIHd5ID0gTWF0aC5tYXgoZXBzLCB0aGlzLmhlaWdodCAtIHYueSk7ICAgLy8gR290dGEgbG92ZSBhbGwgdGhvc2UgTmFOJ3MgOilcbiAgICAgICAgdmFyIFJ4ID0gRncoeCkgLSBGdyh3eCk7XG4gICAgICAgIHZhciBSeSA9IEZ3KHkpIC0gRncod3kpO1xuXG4gICAgICAgIHYuZHggPSB2LmR4ICsgUng7XG4gICAgICAgIHYuZHkgPSB2LmR5ICsgUnk7XG4gICAgICAgICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogQ2FsY3VsYXRlIGF0dHJhY3RpdmUgZm9yY2VzLiAqL1xuICAgIGZvciAodmFyIGkzIGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2kzXTtcblxuICAgICAgLy8gRG8gbm90IG1vdmUgZml4ZWQgdmVydGljZXNcbiAgICAgIGlmKCF2LmZpeGVkKSB7XG4gICAgICAgIGZvciAodmFyIGk0IGluIHYuZWRnZXMpIHtcbiAgICAgICAgICB2YXIgZSA9IHYuZWRnZXNbaTRdO1xuICAgICAgICAgIHZhciB1ID0gZS5lbmRWZXJ0ZXg7XG4gICAgICAgICAgdmFyIGRpZnggPSB2LnggLSB1Lng7XG4gICAgICAgICAgdmFyIGRpZnkgPSB2LnkgLSB1Lnk7XG4gICAgICAgICAgdmFyIGQgPSBNYXRoLm1heChlcHMsIE1hdGguc3FydChkaWZ4KmRpZnggKyBkaWZ5KmRpZnkpKTtcbiAgICAgICAgICB2YXIgZm9yY2UgPSBGYShkKTtcblxuICAgICAgICAgIC8qIExlbmd0aCBvZiB0aGUgZGlmIHZlY3Rvci4gKi9cbiAgICAgICAgICB2YXIgZCA9IE1hdGgubWF4KGVwcywgTWF0aC5zcXJ0KGRpZngqZGlmeCArIGRpZnkqZGlmeSkpO1xuICAgICAgICAgIHYuZHggPSB2LmR4IC0gKGRpZngvZCkgKiBmb3JjZTtcbiAgICAgICAgICB2LmR5ID0gdi5keSAtIChkaWZ5L2QpICogZm9yY2U7XG5cbiAgICAgICAgICB1LmR4ID0gdS5keCArIChkaWZ4L2QpICogZm9yY2U7XG4gICAgICAgICAgdS5keSA9IHUuZHkgKyAoZGlmeS9kKSAqIGZvcmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogTGltaXQgdGhlIG1heGltdW0gZGlzcGxhY2VtZW50IHRvIHRoZSB0ZW1wZXJhdHVyZSB0XG4gICAgICAgIGFuZCBwcmV2ZW50IGZyb20gYmVpbmcgZGlzcGxhY2VkIG91dHNpZGUgZnJhbWUuICAgICAqL1xuICAgIGZvciAodmFyIGk1IGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2k1XTtcbiAgICAgIGlmKCF2LmZpeGVkKSB7XG4gICAgICAgIC8qIExlbmd0aCBvZiB0aGUgZGlzcGxhY2VtZW50IHZlY3Rvci4gKi9cbiAgICAgICAgdmFyIGQgPSBNYXRoLm1heChlcHMsIE1hdGguc3FydCh2LmR4KnYuZHggKyB2LmR5KnYuZHkpKTtcblxuICAgICAgICAvKiBMaW1pdCB0byB0aGUgdGVtcGVyYXR1cmUgdC4gKi9cbiAgICAgICAgdi54ID0gdi54ICsgKHYuZHgvZCkgKiBNYXRoLm1pbihkLCB0KTtcbiAgICAgICAgdi55ID0gdi55ICsgKHYuZHkvZCkgKiBNYXRoLm1pbihkLCB0KTtcblxuICAgICAgICAvKiBTdGF5IGluc2lkZSB0aGUgZnJhbWUuICovXG4gICAgICAgIC8qXG4gICAgICAgIGJvcmRlcldpZHRoID0gdGhpcy53aWR0aCAvIDUwO1xuICAgICAgICBpZiAodi54IDwgYm9yZGVyV2lkdGgpIHtcbiAgICAgICAgICB2LnggPSBib3JkZXJXaWR0aDtcbiAgICAgICAgfSBlbHNlIGlmICh2LnggPiB0aGlzLndpZHRoIC0gYm9yZGVyV2lkdGgpIHtcbiAgICAgICAgICB2LnggPSB0aGlzLndpZHRoIC0gYm9yZGVyV2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodi55IDwgYm9yZGVyV2lkdGgpIHtcbiAgICAgICAgICB2LnkgPSBib3JkZXJXaWR0aDtcbiAgICAgICAgfSBlbHNlIGlmICh2LnkgPiB0aGlzLmhlaWdodCAtIGJvcmRlcldpZHRoKSB7XG4gICAgICAgICAgdi55ID0gdGhpcy5oZWlnaHQgLSBib3JkZXJXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICB2LnggPSBNYXRoLnJvdW5kKHYueCk7XG4gICAgICAgIHYueSA9IE1hdGgucm91bmQodi55KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBDb29sLiAqL1xuICAgIHQgLT0gZHQ7XG5cbiAgICBpZiAocSAlIDEwID09IDApIHtcbiAgICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgdmlydHVhbCBjZW50ZXIgdmVydGljZXNcbiAgaWYgKGNlbnRlcnMpIHtcbiAgICBmb3IgKHZhciBpIGluIGNlbnRlcnMpIHtcbiAgICAgIGdyYXBoLnJlbW92ZVZlcnRleChjZW50ZXJzW2ldKTtcbiAgICB9XG4gIH1cblxuICBncmFwaC5ub3JtYWxpemUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRydWUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb29ncmFwaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxudmFyIGdldExheW91dCA9IHJlcXVpcmUoJy4vbGF5b3V0Jyk7XG5cbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKCBjeXRvc2NhcGUsIHdlYXZlciApe1xuICB2YXIgbGF5b3V0ID0gZ2V0TGF5b3V0KCBjeXRvc2NhcGUsIHdlYXZlciB8fCByZXF1aXJlKCd3ZWF2ZXJqcycpICk7XG5cbiAgY3l0b3NjYXBlKCdsYXlvdXQnLCAnc3ByZWFkJywgbGF5b3V0KTtcbn07XG5cbmlmKCB0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiAoIHR5cGVvZiB3ZWF2ZXIgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBjeXRvc2NhcGUuVGhyZWFkICE9PSAndW5kZWZpbmVkJyApICl7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXG4gIHJlZ2lzdGVyKCBjeXRvc2NhcGUsIHdlYXZlciB8fCBjeXRvc2NhcGUgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcbiIsInZhciBUaHJlYWQ7XG5cbnZhciBmb29ncmFwaCA9IHJlcXVpcmUoJy4vZm9vZ3JhcGgnKTtcbnZhciBWb3Jvbm9pID0gcmVxdWlyZSgnLi9yaGlsbC12b3Jvbm9pLWNvcmUnKTtcblxuLypcbiAqIFRoaXMgbGF5b3V0IGNvbWJpbmVzIHNldmVyYWwgYWxnb3JpdGhtczpcbiAqXG4gKiAtIEl0IGdlbmVyYXRlcyBhbiBpbml0aWFsIHBvc2l0aW9uIG9mIHRoZSBub2RlcyBieSB1c2luZyB0aGVcbiAqICAgRnJ1Y2h0ZXJtYW4tUmVpbmdvbGQgYWxnb3JpdGhtIChkb2k6MTAuMTAwMi9zcGUuNDM4MDIxMTEwMilcbiAqXG4gKiAtIEZpbmFsbHkgaXQgZWxpbWluYXRlcyBvdmVybGFwcyBieSB1c2luZyB0aGUgbWV0aG9kIGRlc2NyaWJlZCBieVxuICogICBHYW5zbmVyIGFuZCBOb3J0aCAoZG9pOjEwLjEwMDcvMy01NDAtMzc2MjMtMl8yOClcbiAqL1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gIGFuaW1hdGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2hvdyB0aGUgbGF5b3V0IGFzIGl0J3MgcnVubmluZ1xuICByZWFkeTogdW5kZWZpbmVkLCAvLyBDYWxsYmFjayBvbiBsYXlvdXRyZWFkeVxuICBzdG9wOiB1bmRlZmluZWQsIC8vIENhbGxiYWNrIG9uIGxheW91dHN0b3BcbiAgZml0OiB0cnVlLCAvLyBSZXNldCB2aWV3cG9ydCB0byBmaXQgZGVmYXVsdCBzaW11bGF0aW9uQm91bmRzXG4gIG1pbkRpc3Q6IDIwLCAvLyBNaW5pbXVtIGRpc3RhbmNlIGJldHdlZW4gbm9kZXNcbiAgcGFkZGluZzogMjAsIC8vIFBhZGRpbmdcbiAgZXhwYW5kaW5nRmFjdG9yOiAtMS4wLCAvLyBJZiB0aGUgbmV0d29yayBkb2VzIG5vdCBzYXRpc2Z5IHRoZSBtaW5EaXN0XG4gIC8vIGNyaXRlcml1bSB0aGVuIGl0IGV4cGFuZHMgdGhlIG5ldHdvcmsgb2YgdGhpcyBhbW91bnRcbiAgLy8gSWYgaXQgaXMgc2V0IHRvIC0xLjAgdGhlIGFtb3VudCBvZiBleHBhbnNpb24gaXMgYXV0b21hdGljYWxseVxuICAvLyBjYWxjdWxhdGVkIGJhc2VkIG9uIHRoZSBtaW5EaXN0LCB0aGUgYXNwZWN0IHJhdGlvIGFuZCB0aGVcbiAgLy8gbnVtYmVyIG9mIG5vZGVzXG4gIG1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zOiA1MCwgLy8gTWF4aW11bSBudW1iZXIgb2YgaW5pdGlhbCBmb3JjZS1kaXJlY3RlZCBpdGVyYXRpb25zXG4gIG1heEV4cGFuZEl0ZXJhdGlvbnM6IDQsIC8vIE1heGltdW0gbnVtYmVyIG9mIGV4cGFuZGluZyBpdGVyYXRpb25zXG4gIGJvdW5kaW5nQm94OiB1bmRlZmluZWQsIC8vIENvbnN0cmFpbiBsYXlvdXQgYm91bmRzOyB7IHgxLCB5MSwgeDIsIHkyIH0gb3IgeyB4MSwgeTEsIHcsIGggfVxuICByYW5kb21pemU6IGZhbHNlIC8vIHVzZXMgcmFuZG9tIGluaXRpYWwgbm9kZSBwb3NpdGlvbnMgb24gdHJ1ZVxufTtcblxuZnVuY3Rpb24gU3ByZWFkTGF5b3V0KCBvcHRpb25zICkge1xuICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucyA9IHt9O1xuICBmb3IoIHZhciBpIGluIGRlZmF1bHRzICl7IG9wdHNbaV0gPSBkZWZhdWx0c1tpXTsgfVxuICBmb3IoIHZhciBpIGluIG9wdGlvbnMgKXsgb3B0c1tpXSA9IG9wdGlvbnNbaV07IH1cbn1cblxuU3ByZWFkTGF5b3V0LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcblxuICB2YXIgbGF5b3V0ID0gdGhpcztcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gIHZhciBjeSA9IG9wdGlvbnMuY3k7XG5cbiAgdmFyIGJiID0gb3B0aW9ucy5ib3VuZGluZ0JveCB8fCB7IHgxOiAwLCB5MTogMCwgdzogY3kud2lkdGgoKSwgaDogY3kuaGVpZ2h0KCkgfTtcbiAgaWYoIGJiLngyID09PSB1bmRlZmluZWQgKXsgYmIueDIgPSBiYi54MSArIGJiLnc7IH1cbiAgaWYoIGJiLncgPT09IHVuZGVmaW5lZCApeyBiYi53ID0gYmIueDIgLSBiYi54MTsgfVxuICBpZiggYmIueTIgPT09IHVuZGVmaW5lZCApeyBiYi55MiA9IGJiLnkxICsgYmIuaDsgfVxuICBpZiggYmIuaCA9PT0gdW5kZWZpbmVkICl7IGJiLmggPSBiYi55MiAtIGJiLnkxOyB9XG5cbiAgdmFyIG5vZGVzID0gY3kubm9kZXMoKTtcbiAgdmFyIGVkZ2VzID0gY3kuZWRnZXMoKTtcbiAgdmFyIGNXaWR0aCA9IGN5LndpZHRoKCk7XG4gIHZhciBjSGVpZ2h0ID0gY3kuaGVpZ2h0KCk7XG4gIHZhciBzaW11bGF0aW9uQm91bmRzID0gYmI7XG4gIHZhciBwYWRkaW5nID0gb3B0aW9ucy5wYWRkaW5nO1xuICB2YXIgc2ltQkJGYWN0b3IgPSBNYXRoLm1heCggMSwgTWF0aC5sb2cobm9kZXMubGVuZ3RoKSAqIDAuOCApO1xuXG4gIGlmKCBub2Rlcy5sZW5ndGggPCAxMDAgKXtcbiAgICBzaW1CQkZhY3RvciAvPSAyO1xuICB9XG5cbiAgbGF5b3V0LnRyaWdnZXIoIHtcbiAgICB0eXBlOiAnbGF5b3V0c3RhcnQnLFxuICAgIGxheW91dDogbGF5b3V0XG4gIH0gKTtcblxuICB2YXIgc2ltQkIgPSB7XG4gICAgeDE6IDAsXG4gICAgeTE6IDAsXG4gICAgeDI6IGNXaWR0aCAqIHNpbUJCRmFjdG9yLFxuICAgIHkyOiBjSGVpZ2h0ICogc2ltQkJGYWN0b3JcbiAgfTtcblxuICBpZiggc2ltdWxhdGlvbkJvdW5kcyApIHtcbiAgICBzaW1CQi54MSA9IHNpbXVsYXRpb25Cb3VuZHMueDE7XG4gICAgc2ltQkIueTEgPSBzaW11bGF0aW9uQm91bmRzLnkxO1xuICAgIHNpbUJCLngyID0gc2ltdWxhdGlvbkJvdW5kcy54MjtcbiAgICBzaW1CQi55MiA9IHNpbXVsYXRpb25Cb3VuZHMueTI7XG4gIH1cblxuICBzaW1CQi54MSArPSBwYWRkaW5nO1xuICBzaW1CQi55MSArPSBwYWRkaW5nO1xuICBzaW1CQi54MiAtPSBwYWRkaW5nO1xuICBzaW1CQi55MiAtPSBwYWRkaW5nO1xuXG4gIHZhciB3aWR0aCA9IHNpbUJCLngyIC0gc2ltQkIueDE7XG4gIHZhciBoZWlnaHQgPSBzaW1CQi55MiAtIHNpbUJCLnkxO1xuXG4gIC8vIEdldCBzdGFydCB0aW1lXG4gIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gIC8vIGxheW91dCBkb2Vzbid0IHdvcmsgd2l0aCBqdXN0IDEgbm9kZVxuICBpZiggbm9kZXMuc2l6ZSgpIDw9IDEgKSB7XG4gICAgbm9kZXMucG9zaXRpb25zKCB7XG4gICAgICB4OiBNYXRoLnJvdW5kKCAoIHNpbUJCLngxICsgc2ltQkIueDIgKSAvIDIgKSxcbiAgICAgIHk6IE1hdGgucm91bmQoICggc2ltQkIueTEgKyBzaW1CQi55MiApIC8gMiApXG4gICAgfSApO1xuXG4gICAgaWYoIG9wdGlvbnMuZml0ICkge1xuICAgICAgY3kuZml0KCBvcHRpb25zLnBhZGRpbmcgKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgZW5kIHRpbWVcbiAgICB2YXIgZW5kVGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc29sZS5pbmZvKCBcIkxheW91dCBvbiBcIiArIG5vZGVzLnNpemUoKSArIFwiIG5vZGVzIHRvb2sgXCIgKyAoIGVuZFRpbWUgLSBzdGFydFRpbWUgKSArIFwiIG1zXCIgKTtcblxuICAgIGxheW91dC5vbmUoIFwibGF5b3V0cmVhZHlcIiwgb3B0aW9ucy5yZWFkeSApO1xuICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHJlYWR5XCIgKTtcblxuICAgIGxheW91dC5vbmUoIFwibGF5b3V0c3RvcFwiLCBvcHRpb25zLnN0b3AgKTtcbiAgICBsYXlvdXQudHJpZ2dlciggXCJsYXlvdXRzdG9wXCIgKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEZpcnN0IEkgbmVlZCB0byBjcmVhdGUgdGhlIGRhdGEgc3RydWN0dXJlIHRvIHBhc3MgdG8gdGhlIHdvcmtlclxuICB2YXIgcERhdGEgPSB7XG4gICAgJ3dpZHRoJzogd2lkdGgsXG4gICAgJ2hlaWdodCc6IGhlaWdodCxcbiAgICAnbWluRGlzdCc6IG9wdGlvbnMubWluRGlzdCxcbiAgICAnZXhwRmFjdCc6IG9wdGlvbnMuZXhwYW5kaW5nRmFjdG9yLFxuICAgICdleHBJdCc6IDAsXG4gICAgJ21heEV4cEl0Jzogb3B0aW9ucy5tYXhFeHBhbmRJdGVyYXRpb25zLFxuICAgICd2ZXJ0aWNlcyc6IFtdLFxuICAgICdlZGdlcyc6IFtdLFxuICAgICdzdGFydFRpbWUnOiBzdGFydFRpbWUsXG4gICAgJ21heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zJzogb3B0aW9ucy5tYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9uc1xuICB9O1xuXG4gIGZvcih2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMCA7IGktLSkge1xuICAgIHZhciBub2RlSWQgPSBub2Rlc1tpXS5pZCgpO1xuICAgIHZhciBwb3MgPSBub2Rlc1tpXS5wb3NpdGlvbigpO1xuXG4gICAgaWYoIG9wdGlvbnMucmFuZG9taXplICl7XG4gICAgICBwb3MgPSB7XG4gICAgICAgIHg6IE1hdGgucm91bmQoIHNpbUJCLngxICsgKHNpbUJCLngyIC0gc2ltQkIueDEpICogTWF0aC5yYW5kb20oKSApLFxuICAgICAgICB5OiBNYXRoLnJvdW5kKCBzaW1CQi55MSArIChzaW1CQi55MiAtIHNpbUJCLnkxKSAqIE1hdGgucmFuZG9tKCkgKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBwRGF0YVsgJ3ZlcnRpY2VzJyBdLnB1c2goIHtcbiAgICAgIGlkOiBub2RlSWQsXG4gICAgICB4OiBwb3MueCxcbiAgICAgIHk6IHBvcy55XG4gICAgfSApO1xuICB9O1xuXG4gIGZvcih2YXIgaSA9IGVkZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIHNyY05vZGVJZCA9IGVkZ2VzW2ldLnNvdXJjZSgpLmlkKCk7XG4gICAgdmFyIHRndE5vZGVJZCA9IGVkZ2VzW2ldLnRhcmdldCgpLmlkKCk7XG4gICAgcERhdGFbICdlZGdlcycgXS5wdXNoKCB7XG4gICAgICBzcmM6IHNyY05vZGVJZCxcbiAgICAgIHRndDogdGd0Tm9kZUlkXG4gICAgfSApO1xuICB9O1xuXG4gIC8vRGVjbGVyYXRpb25cbiAgdmFyIHQxID0gbGF5b3V0LnRocmVhZDtcblxuICAvLyByZXVzZSBvbGQgdGhyZWFkIGlmIHBvc3NpYmxlXG4gIGlmKCAhdDEgfHwgdDEuc3RvcHBlZCgpICl7XG4gICAgdDEgPSBsYXlvdXQudGhyZWFkID0gVGhyZWFkKCk7XG5cbiAgICAvLyBBbmQgdG8gYWRkIHRoZSByZXF1aXJlZCBzY3JpcHRzXG4gICAgLy9FWFRFUk5BTCAxXG4gICAgdDEucmVxdWlyZSggZm9vZ3JhcGgsICdmb29ncmFwaCcgKTtcbiAgICAvL0VYVEVSTkFMIDJcbiAgICB0MS5yZXF1aXJlKCBWb3Jvbm9pLCAnVm9yb25vaScgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9ucyggcERhdGEgKXsgLy9jb25zb2xlLmxvZygnc2V0IHBvc25zJylcbiAgICAvLyBGaXJzdCB3ZSByZXRyaWV2ZSB0aGUgaW1wb3J0YW50IGRhdGFcbiAgICAvLyB2YXIgZXhwYW5kSXRlcmF0aW9uID0gcERhdGFbICdleHBJdCcgXTtcbiAgICB2YXIgZGF0YVZlcnRpY2VzID0gcERhdGFbICd2ZXJ0aWNlcycgXTtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IGRhdGFWZXJ0aWNlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgIHZhciBkdiA9IGRhdGFWZXJ0aWNlc1sgaSBdO1xuICAgICAgdmVydGljZXNbIGR2LmlkIF0gPSB7XG4gICAgICAgIHg6IGR2LngsXG4gICAgICAgIHk6IGR2LnlcbiAgICAgIH07XG4gICAgfVxuICAgIC8qXG4gICAgICogRklOQUxMWTpcbiAgICAgKlxuICAgICAqIFdlIHBvc2l0aW9uIHRoZSBub2RlcyBiYXNlZCBvbiB0aGUgY2FsY3VsYXRpb25cbiAgICAgKi9cbiAgICBub2Rlcy5wb3NpdGlvbnMoXG4gICAgICBmdW5jdGlvbiggbm9kZSwgaSApIHtcbiAgICAgICAgLy8gUGVyZm9ybSAyLnggYW5kIDEueCBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBjaGVja1xuICAgICAgICBpZiggdHlwZW9mIG5vZGUgPT09IFwibnVtYmVyXCIgKXtcbiAgICAgICAgICBub2RlID0gaTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWQgPSBub2RlLmlkKClcbiAgICAgICAgdmFyIHZlcnRleCA9IHZlcnRpY2VzWyBpZCBdO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgeDogTWF0aC5yb3VuZCggc2ltQkIueDEgKyB2ZXJ0ZXgueCApLFxuICAgICAgICAgIHk6IE1hdGgucm91bmQoIHNpbUJCLnkxICsgdmVydGV4LnkgKVxuICAgICAgICB9O1xuICAgICAgfSApO1xuXG4gICAgaWYoIG9wdGlvbnMuZml0ICkge1xuICAgICAgY3kuZml0KCBvcHRpb25zLnBhZGRpbmcgKTtcbiAgICB9XG5cbiAgICBjeS5ub2RlcygpLnJ0cmlnZ2VyKCBcInBvc2l0aW9uXCIgKTtcbiAgfVxuXG4gIHZhciBkaWRMYXlvdXRSZWFkeSA9IGZhbHNlO1xuICB0MS5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwRGF0YSA9IGUubWVzc2FnZTsgLy9jb25zb2xlLmxvZygnbWVzc2FnZScsIGUpXG5cbiAgICBpZiggIW9wdGlvbnMuYW5pbWF0ZSApe1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFBvc2l0aW9ucyggcERhdGEgKTtcblxuICAgIGlmKCAhZGlkTGF5b3V0UmVhZHkgKXtcbiAgICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHJlYWR5XCIgKTtcblxuICAgICAgZGlkTGF5b3V0UmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgbGF5b3V0Lm9uZSggXCJsYXlvdXRyZWFkeVwiLCBvcHRpb25zLnJlYWR5ICk7XG5cbiAgdDEucGFzcyggcERhdGEgKS5ydW4oIGZ1bmN0aW9uKCBwRGF0YSApIHtcblxuICAgIGZ1bmN0aW9uIGNlbGxDZW50cm9pZCggY2VsbCApIHtcbiAgICAgIHZhciBoZXMgPSBjZWxsLmhhbGZlZGdlcztcbiAgICAgIHZhciBhcmVhID0gMCxcbiAgICAgICAgeCA9IDAsXG4gICAgICAgIHkgPSAwO1xuICAgICAgdmFyIHAxLCBwMiwgZjtcblxuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBoZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIHAxID0gaGVzWyBpIF0uZ2V0RW5kcG9pbnQoKTtcbiAgICAgICAgcDIgPSBoZXNbIGkgXS5nZXRTdGFydHBvaW50KCk7XG5cbiAgICAgICAgYXJlYSArPSBwMS54ICogcDIueTtcbiAgICAgICAgYXJlYSAtPSBwMS55ICogcDIueDtcblxuICAgICAgICBmID0gcDEueCAqIHAyLnkgLSBwMi54ICogcDEueTtcbiAgICAgICAgeCArPSAoIHAxLnggKyBwMi54ICkgKiBmO1xuICAgICAgICB5ICs9ICggcDEueSArIHAyLnkgKSAqIGY7XG4gICAgICB9XG5cbiAgICAgIGFyZWEgLz0gMjtcbiAgICAgIGYgPSBhcmVhICogNjtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBmLFxuICAgICAgICB5OiB5IC8gZlxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaXRlc0Rpc3RhbmNlKCBscywgcnMgKSB7XG4gICAgICB2YXIgZHggPSBscy54IC0gcnMueDtcbiAgICAgIHZhciBkeSA9IGxzLnkgLSBycy55O1xuICAgICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcbiAgICB9XG5cbiAgICBmb29ncmFwaCA9IF9yZWZfKCdmb29ncmFwaCcpO1xuICAgIFZvcm9ub2kgPSBfcmVmXygnVm9yb25vaScpO1xuXG4gICAgLy8gSSBuZWVkIHRvIHJldHJpZXZlIHRoZSBpbXBvcnRhbnQgZGF0YVxuICAgIHZhciBsV2lkdGggPSBwRGF0YVsgJ3dpZHRoJyBdO1xuICAgIHZhciBsSGVpZ2h0ID0gcERhdGFbICdoZWlnaHQnIF07XG4gICAgdmFyIGxNaW5EaXN0ID0gcERhdGFbICdtaW5EaXN0JyBdO1xuICAgIHZhciBsRXhwRmFjdCA9IHBEYXRhWyAnZXhwRmFjdCcgXTtcbiAgICB2YXIgbE1heEV4cEl0ID0gcERhdGFbICdtYXhFeHBJdCcgXTtcbiAgICB2YXIgbE1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zID0gcERhdGFbICdtYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9ucycgXTtcblxuICAgIC8vIFByZXBhcmUgdGhlIGRhdGEgdG8gb3V0cHV0XG4gICAgdmFyIHNhdmVQb3NpdGlvbnMgPSBmdW5jdGlvbigpe1xuICAgICAgcERhdGFbICd3aWR0aCcgXSA9IGxXaWR0aDtcbiAgICAgIHBEYXRhWyAnaGVpZ2h0JyBdID0gbEhlaWdodDtcbiAgICAgIHBEYXRhWyAnZXhwSXQnIF0gPSBleHBhbmRJdGVyYXRpb247XG4gICAgICBwRGF0YVsgJ2V4cEZhY3QnIF0gPSBsRXhwRmFjdDtcblxuICAgICAgcERhdGFbICd2ZXJ0aWNlcycgXSA9IFtdO1xuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBmdi5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgcERhdGFbICd2ZXJ0aWNlcycgXS5wdXNoKCB7XG4gICAgICAgICAgaWQ6IGZ2WyBpIF0ubGFiZWwsXG4gICAgICAgICAgeDogZnZbIGkgXS54LFxuICAgICAgICAgIHk6IGZ2WyBpIF0ueVxuICAgICAgICB9ICk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBtZXNzYWdlUG9zaXRpb25zID0gZnVuY3Rpb24oKXtcbiAgICAgIGJyb2FkY2FzdCggcERhdGEgKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBGSVJTVCBTVEVQOiBBcHBsaWNhdGlvbiBvZiB0aGUgRnJ1Y2h0ZXJtYW4tUmVpbmdvbGQgYWxnb3JpdGhtXG4gICAgICpcbiAgICAgKiBXZSB1c2UgdGhlIHZlcnNpb24gaW1wbGVtZW50ZWQgYnkgdGhlIGZvb2dyYXBoIGxpYnJhcnlcbiAgICAgKlxuICAgICAqIFJlZi46IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvZm9vZ3JhcGgvXG4gICAgICovXG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhIGdyYXBoIGNvbXBhdGlibGUgd2l0aCB0aGUgbGlicmFyeVxuICAgIHZhciBmcmcgPSBuZXcgZm9vZ3JhcGguR3JhcGgoIFwiRlJncmFwaFwiLCBmYWxzZSApO1xuXG4gICAgdmFyIGZyZ05vZGVzID0ge307XG5cbiAgICAvLyBUaGVuIHdlIGhhdmUgdG8gYWRkIHRoZSB2ZXJ0aWNlc1xuICAgIHZhciBkYXRhVmVydGljZXMgPSBwRGF0YVsgJ3ZlcnRpY2VzJyBdO1xuICAgIGZvciggdmFyIG5pID0gMDsgbmkgPCBkYXRhVmVydGljZXMubGVuZ3RoOyArK25pICkge1xuICAgICAgdmFyIGlkID0gZGF0YVZlcnRpY2VzWyBuaSBdWyAnaWQnIF07XG4gICAgICB2YXIgdiA9IG5ldyBmb29ncmFwaC5WZXJ0ZXgoIGlkLCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogbEhlaWdodCApLCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogbEhlaWdodCApICk7XG4gICAgICBmcmdOb2Rlc1sgaWQgXSA9IHY7XG4gICAgICBmcmcuaW5zZXJ0VmVydGV4KCB2ICk7XG4gICAgfVxuXG4gICAgdmFyIGRhdGFFZGdlcyA9IHBEYXRhWyAnZWRnZXMnIF07XG4gICAgZm9yKCB2YXIgZWkgPSAwOyBlaSA8IGRhdGFFZGdlcy5sZW5ndGg7ICsrZWkgKSB7XG4gICAgICB2YXIgc3JjTm9kZUlkID0gZGF0YUVkZ2VzWyBlaSBdWyAnc3JjJyBdO1xuICAgICAgdmFyIHRndE5vZGVJZCA9IGRhdGFFZGdlc1sgZWkgXVsgJ3RndCcgXTtcbiAgICAgIGZyZy5pbnNlcnRFZGdlKCBcIlwiLCAxLCBmcmdOb2Rlc1sgc3JjTm9kZUlkIF0sIGZyZ05vZGVzWyB0Z3ROb2RlSWQgXSApO1xuICAgIH1cblxuICAgIHZhciBmdiA9IGZyZy52ZXJ0aWNlcztcblxuICAgIC8vIFRoZW4gd2UgYXBwbHkgdGhlIGxheW91dFxuICAgIHZhciBpdGVyYXRpb25zID0gbE1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zO1xuICAgIHZhciBmckxheW91dE1hbmFnZXIgPSBuZXcgZm9vZ3JhcGguRm9yY2VEaXJlY3RlZFZlcnRleExheW91dCggbFdpZHRoLCBsSGVpZ2h0LCBpdGVyYXRpb25zLCBmYWxzZSwgbE1pbkRpc3QgKTtcblxuICAgIGZyTGF5b3V0TWFuYWdlci5jYWxsYmFjayA9IGZ1bmN0aW9uKCl7XG4gICAgICBzYXZlUG9zaXRpb25zKCk7XG4gICAgICBtZXNzYWdlUG9zaXRpb25zKCk7XG4gICAgfTtcblxuICAgIGZyTGF5b3V0TWFuYWdlci5sYXlvdXQoIGZyZyApO1xuXG4gICAgc2F2ZVBvc2l0aW9ucygpO1xuICAgIG1lc3NhZ2VQb3NpdGlvbnMoKTtcblxuICAgIGlmKCBsTWF4RXhwSXQgPD0gMCApe1xuICAgICAgcmV0dXJuIHBEYXRhO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogU0VDT05EIFNURVA6IFRpZGluZyB1cCBvZiB0aGUgZ3JhcGguXG4gICAgICpcbiAgICAgKiBXZSB1c2UgdGhlIG1ldGhvZCBkZXNjcmliZWQgYnkgR2Fuc25lciBhbmQgTm9ydGgsIGJhc2VkIG9uIFZvcm9ub2lcbiAgICAgKiBkaWFncmFtcy5cbiAgICAgKlxuICAgICAqIFJlZjogZG9pOjEwLjEwMDcvMy01NDAtMzc2MjMtMl8yOFxuICAgICAqL1xuXG4gICAgLy8gV2UgY2FsY3VsYXRlIHRoZSBWb3Jvbm9pIGRpYWdyYW0gZG9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgbm9kZXNcbiAgICB2YXIgdm9yb25vaSA9IG5ldyBWb3Jvbm9pKCk7XG4gICAgdmFyIGJib3ggPSB7XG4gICAgICB4bDogMCxcbiAgICAgIHhyOiBsV2lkdGgsXG4gICAgICB5dDogMCxcbiAgICAgIHliOiBsSGVpZ2h0XG4gICAgfTtcbiAgICB2YXIgdlNpdGVzID0gW107XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBmdi5sZW5ndGg7ICsraSApIHtcbiAgICAgIHZTaXRlc1sgZnZbIGkgXS5sYWJlbCBdID0gZnZbIGkgXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja01pbkRpc3QoIGVlICkge1xuICAgICAgdmFyIGluZnJhY3Rpb25zID0gMDtcbiAgICAgIC8vIFRoZW4gd2UgY2hlY2sgaWYgdGhlIG1pbmltdW0gZGlzdGFuY2UgaXMgc2F0aXNmaWVkXG4gICAgICBmb3IoIHZhciBlZWkgPSAwOyBlZWkgPCBlZS5sZW5ndGg7ICsrZWVpICkge1xuICAgICAgICB2YXIgZSA9IGVlWyBlZWkgXTtcbiAgICAgICAgaWYoICggZS5sU2l0ZSAhPSBudWxsICkgJiYgKCBlLnJTaXRlICE9IG51bGwgKSAmJiBzaXRlc0Rpc3RhbmNlKCBlLmxTaXRlLCBlLnJTaXRlICkgPCBsTWluRGlzdCApIHtcbiAgICAgICAgICArK2luZnJhY3Rpb25zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5mcmFjdGlvbnM7XG4gICAgfVxuXG4gICAgdmFyIGRpYWdyYW0gPSB2b3Jvbm9pLmNvbXB1dGUoIGZ2LCBiYm94ICk7XG5cbiAgICAvLyBUaGVuIHdlIHJlcG9zaXRpb24gdGhlIG5vZGVzIGF0IHRoZSBjZW50cm9pZCBvZiB0aGVpciBWb3Jvbm9pIGNlbGxzXG4gICAgdmFyIGNlbGxzID0gZGlhZ3JhbS5jZWxscztcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgKytpICkge1xuICAgICAgdmFyIGNlbGwgPSBjZWxsc1sgaSBdO1xuICAgICAgdmFyIHNpdGUgPSBjZWxsLnNpdGU7XG4gICAgICB2YXIgY2VudHJvaWQgPSBjZWxsQ2VudHJvaWQoIGNlbGwgKTtcbiAgICAgIHZhciBjdXJydiA9IHZTaXRlc1sgc2l0ZS5sYWJlbCBdO1xuICAgICAgY3VycnYueCA9IGNlbnRyb2lkLng7XG4gICAgICBjdXJydi55ID0gY2VudHJvaWQueTtcbiAgICB9XG5cbiAgICBpZiggbEV4cEZhY3QgPCAwLjAgKSB7XG4gICAgICAvLyBDYWxjdWxhdGVzIHRoZSBleHBhbmRpbmcgZmFjdG9yXG4gICAgICBsRXhwRmFjdCA9IE1hdGgubWF4KCAwLjA1LCBNYXRoLm1pbiggMC4xMCwgbE1pbkRpc3QgLyBNYXRoLnNxcnQoICggbFdpZHRoICogbEhlaWdodCApIC8gZnYubGVuZ3RoICkgKiAwLjUgKSApO1xuICAgICAgLy9jb25zb2xlLmluZm8oXCJFeHBhbmRpbmcgZmFjdG9yIGlzIFwiICsgKG9wdGlvbnMuZXhwYW5kaW5nRmFjdG9yICogMTAwLjApICsgXCIlXCIpO1xuICAgIH1cblxuICAgIHZhciBwcmV2SW5mcmFjdGlvbnMgPSBjaGVja01pbkRpc3QoIGRpYWdyYW0uZWRnZXMgKTtcbiAgICAvL2NvbnNvbGUuaW5mbyhcIkluaXRpYWwgaW5mcmFjdGlvbnMgXCIgKyBwcmV2SW5mcmFjdGlvbnMpO1xuXG4gICAgdmFyIGJTdG9wID0gKCBwcmV2SW5mcmFjdGlvbnMgPD0gMCApIHx8IGxNYXhFeHBJdCA8PSAwO1xuXG4gICAgdmFyIHZvcm9ub2lJdGVyYXRpb24gPSAwO1xuICAgIHZhciBleHBhbmRJdGVyYXRpb24gPSAwO1xuXG4gICAgLy8gdmFyIGluaXRXaWR0aCA9IGxXaWR0aDtcblxuICAgIHdoaWxlKCAhYlN0b3AgKSB7XG4gICAgICArK3Zvcm9ub2lJdGVyYXRpb247XG4gICAgICBmb3IoIHZhciBpdCA9IDA7IGl0IDw9IDQ7ICsraXQgKSB7XG4gICAgICAgIHZvcm9ub2kucmVjeWNsZSggZGlhZ3JhbSApO1xuICAgICAgICBkaWFncmFtID0gdm9yb25vaS5jb21wdXRlKCBmdiwgYmJveCApO1xuXG4gICAgICAgIC8vIFRoZW4gd2UgcmVwb3NpdGlvbiB0aGUgbm9kZXMgYXQgdGhlIGNlbnRyb2lkIG9mIHRoZWlyIFZvcm9ub2kgY2VsbHNcbiAgICAgICAgLy8gY2VsbHMgPSBkaWFncmFtLmNlbGxzO1xuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgIHZhciBjZWxsID0gY2VsbHNbIGkgXTtcbiAgICAgICAgICB2YXIgc2l0ZSA9IGNlbGwuc2l0ZTtcbiAgICAgICAgICB2YXIgY2VudHJvaWQgPSBjZWxsQ2VudHJvaWQoIGNlbGwgKTtcbiAgICAgICAgICB2YXIgY3VycnYgPSB2U2l0ZXNbIHNpdGUubGFiZWwgXTtcbiAgICAgICAgICBjdXJydi54ID0gY2VudHJvaWQueDtcbiAgICAgICAgICBjdXJydi55ID0gY2VudHJvaWQueTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY3VyckluZnJhY3Rpb25zID0gY2hlY2tNaW5EaXN0KCBkaWFncmFtLmVkZ2VzICk7XG4gICAgICAvL2NvbnNvbGUuaW5mbyhcIkN1cnJlbnQgaW5mcmFjdGlvbnMgXCIgKyBjdXJySW5mcmFjdGlvbnMpO1xuXG4gICAgICBpZiggY3VyckluZnJhY3Rpb25zIDw9IDAgKSB7XG4gICAgICAgIGJTdG9wID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKCBjdXJySW5mcmFjdGlvbnMgPj0gcHJldkluZnJhY3Rpb25zIHx8IHZvcm9ub2lJdGVyYXRpb24gPj0gNCApIHtcbiAgICAgICAgICBpZiggZXhwYW5kSXRlcmF0aW9uID49IGxNYXhFeHBJdCApIHtcbiAgICAgICAgICAgIGJTdG9wID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbFdpZHRoICs9IGxXaWR0aCAqIGxFeHBGYWN0O1xuICAgICAgICAgICAgbEhlaWdodCArPSBsSGVpZ2h0ICogbEV4cEZhY3Q7XG4gICAgICAgICAgICBiYm94ID0ge1xuICAgICAgICAgICAgICB4bDogMCxcbiAgICAgICAgICAgICAgeHI6IGxXaWR0aCxcbiAgICAgICAgICAgICAgeXQ6IDAsXG4gICAgICAgICAgICAgIHliOiBsSGVpZ2h0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgKytleHBhbmRJdGVyYXRpb247XG4gICAgICAgICAgICB2b3Jvbm9pSXRlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiRXhwYW5kZWQgdG8gKFwiK3dpZHRoK1wiLFwiK2hlaWdodCtcIilcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmV2SW5mcmFjdGlvbnMgPSBjdXJySW5mcmFjdGlvbnM7XG5cbiAgICAgIHNhdmVQb3NpdGlvbnMoKTtcbiAgICAgIG1lc3NhZ2VQb3NpdGlvbnMoKTtcbiAgICB9XG5cbiAgICBzYXZlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIHBEYXRhO1xuXG4gIH0gKS50aGVuKCBmdW5jdGlvbiggcERhdGEgKSB7XG4gICAgLy8gdmFyIGV4cGFuZEl0ZXJhdGlvbiA9IHBEYXRhWyAnZXhwSXQnIF07XG4gICAgdmFyIGRhdGFWZXJ0aWNlcyA9IHBEYXRhWyAndmVydGljZXMnIF07XG5cbiAgICBzZXRQb3NpdGlvbnMoIHBEYXRhICk7XG5cbiAgICAvLyBHZXQgZW5kIHRpbWVcbiAgICB2YXIgc3RhcnRUaW1lID0gcERhdGFbICdzdGFydFRpbWUnIF07XG4gICAgdmFyIGVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnNvbGUuaW5mbyggXCJMYXlvdXQgb24gXCIgKyBkYXRhVmVydGljZXMubGVuZ3RoICsgXCIgbm9kZXMgdG9vayBcIiArICggZW5kVGltZSAtIHN0YXJ0VGltZSApICsgXCIgbXNcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRzdG9wXCIsIG9wdGlvbnMuc3RvcCApO1xuXG4gICAgaWYoICFvcHRpb25zLmFuaW1hdGUgKXtcbiAgICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHJlYWR5XCIgKTtcbiAgICB9XG5cbiAgICBsYXlvdXQudHJpZ2dlciggXCJsYXlvdXRzdG9wXCIgKTtcblxuICAgIHQxLnN0b3AoKTtcbiAgfSApO1xuXG5cbiAgcmV0dXJuIHRoaXM7XG59OyAvLyBydW5cblxuU3ByZWFkTGF5b3V0LnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKXtcbiAgaWYoIHRoaXMudGhyZWFkICl7XG4gICAgdGhpcy50aHJlYWQuc3RvcCgpO1xuICB9XG5cbiAgdGhpcy50cmlnZ2VyKCdsYXlvdXRzdG9wJyk7XG59O1xuXG5TcHJlYWRMYXlvdXQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICBpZiggdGhpcy50aHJlYWQgKXtcbiAgICB0aGlzLnRocmVhZC5zdG9wKCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0KCBjeXRvc2NhcGUsIHdlYXZlciApe1xuICBUaHJlYWQgPSB3ZWF2ZXIuVGhyZWFkO1xuXG4gIHJldHVybiBTcHJlYWRMYXlvdXQ7XG59O1xuIiwiLyohXG5Db3B5cmlnaHQgKEMpIDIwMTAtMjAxMyBSYXltb25kIEhpbGw6IGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaVxuTUlUIExpY2Vuc2U6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvTElDRU5TRS5tZFxuKi9cbi8qXG5BdXRob3I6IFJheW1vbmQgSGlsbCAocmhpbGxAcmF5bW9uZGhpbGwubmV0KVxuQ29udHJpYnV0b3I6IEplc3NlIE1vcmdhbiAobW9yZ2FqZWxAZ21haWwuY29tKVxuRmlsZTogcmhpbGwtdm9yb25vaS1jb3JlLmpzXG5WZXJzaW9uOiAwLjk4XG5EYXRlOiBKYW51YXJ5IDIxLCAyMDEzXG5EZXNjcmlwdGlvbjogVGhpcyBpcyBteSBwZXJzb25hbCBKYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mXG5TdGV2ZW4gRm9ydHVuZSdzIGFsZ29yaXRobSB0byBjb21wdXRlIFZvcm9ub2kgZGlhZ3JhbXMuXG5cbkxpY2Vuc2U6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvTElDRU5TRS5tZFxuQ3JlZGl0czogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9DUkVESVRTLm1kXG5IaXN0b3J5OiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL0NIQU5HRUxPRy5tZFxuXG4jIyBVc2FnZTpcblxuICB2YXIgc2l0ZXMgPSBbe3g6MzAwLHk6MzAwfSwge3g6MTAwLHk6MTAwfSwge3g6MjAwLHk6NTAwfSwge3g6MjUwLHk6NDUwfSwge3g6NjAwLHk6MTUwfV07XG4gIC8vIHhsLCB4ciBtZWFucyB4IGxlZnQsIHggcmlnaHRcbiAgLy8geXQsIHliIG1lYW5zIHkgdG9wLCB5IGJvdHRvbVxuICB2YXIgYmJveCA9IHt4bDowLCB4cjo4MDAsIHl0OjAsIHliOjYwMH07XG4gIHZhciB2b3Jvbm9pID0gbmV3IFZvcm9ub2koKTtcbiAgLy8gcGFzcyBhbiBvYmplY3Qgd2hpY2ggZXhoaWJpdHMgeGwsIHhyLCB5dCwgeWIgcHJvcGVydGllcy4gVGhlIGJvdW5kaW5nXG4gIC8vIGJveCB3aWxsIGJlIHVzZWQgdG8gY29ubmVjdCB1bmJvdW5kIGVkZ2VzLCBhbmQgdG8gY2xvc2Ugb3BlbiBjZWxsc1xuICByZXN1bHQgPSB2b3Jvbm9pLmNvbXB1dGUoc2l0ZXMsIGJib3gpO1xuICAvLyByZW5kZXIsIGZ1cnRoZXIgYW5hbHl6ZSwgZXRjLlxuXG5SZXR1cm4gdmFsdWU6XG4gIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblxuICByZXN1bHQudmVydGljZXMgPSBhbiBhcnJheSBvZiB1bm9yZGVyZWQsIHVuaXF1ZSBWb3Jvbm9pLlZlcnRleCBvYmplY3RzIG1ha2luZ1xuICAgIHVwIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gIHJlc3VsdC5lZGdlcyA9IGFuIGFycmF5IG9mIHVub3JkZXJlZCwgdW5pcXVlIFZvcm9ub2kuRWRnZSBvYmplY3RzIG1ha2luZyB1cFxuICAgIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gIHJlc3VsdC5jZWxscyA9IGFuIGFycmF5IG9mIFZvcm9ub2kuQ2VsbCBvYmplY3QgbWFraW5nIHVwIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gICAgQSBDZWxsIG9iamVjdCBtaWdodCBoYXZlIGFuIGVtcHR5IGFycmF5IG9mIGhhbGZlZGdlcywgbWVhbmluZyBubyBWb3Jvbm9pXG4gICAgY2VsbCBjb3VsZCBiZSBjb21wdXRlZCBmb3IgYSBwYXJ0aWN1bGFyIGNlbGwuXG4gIHJlc3VsdC5leGVjVGltZSA9IHRoZSB0aW1lIGl0IHRvb2sgdG8gY29tcHV0ZSB0aGUgVm9yb25vaSBkaWFncmFtLCBpblxuICAgIG1pbGxpc2Vjb25kcy5cblxuVm9yb25vaS5WZXJ0ZXggb2JqZWN0OlxuICB4OiBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgdmVydGV4LlxuICB5OiBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgdmVydGV4LlxuXG5Wb3Jvbm9pLkVkZ2Ugb2JqZWN0OlxuICBsU2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3QgYXQgdGhlIGxlZnQgb2YgdGhpcyBWb3Jvbm9pLkVkZ2Ugb2JqZWN0LlxuICByU2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3QgYXQgdGhlIHJpZ2h0IG9mIHRoaXMgVm9yb25vaS5FZGdlIG9iamVjdCAoY2FuXG4gICAgYmUgbnVsbCkuXG4gIHZhOiBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5IGRlZmluaW5nIHRoZSBzdGFydCBwb2ludFxuICAgIChyZWxhdGl2ZSB0byB0aGUgVm9yb25vaSBzaXRlIG9uIHRoZSBsZWZ0KSBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QuXG4gIHZiOiBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5IGRlZmluaW5nIHRoZSBlbmQgcG9pbnRcbiAgICAocmVsYXRpdmUgdG8gVm9yb25vaSBzaXRlIG9uIHRoZSBsZWZ0KSBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QuXG5cbiAgRm9yIGVkZ2VzIHdoaWNoIGFyZSB1c2VkIHRvIGNsb3NlIG9wZW4gY2VsbHMgKHVzaW5nIHRoZSBzdXBwbGllZCBib3VuZGluZ1xuICBib3gpLCB0aGUgclNpdGUgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuXG5Wb3Jvbm9pLkNlbGwgb2JqZWN0OlxuICBzaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggdGhlIFZvcm9ub2kgY2VsbC5cbiAgaGFsZmVkZ2VzOiBhbiBhcnJheSBvZiBWb3Jvbm9pLkhhbGZlZGdlIG9iamVjdHMsIG9yZGVyZWQgY291bnRlcmNsb2Nrd2lzZSxcbiAgICBkZWZpbmluZyB0aGUgcG9seWdvbiBmb3IgdGhpcyBWb3Jvbm9pIGNlbGwuXG5cblZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0OlxuICBzaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBvd25pbmcgdGhpcyBWb3Jvbm9pLkhhbGZlZGdlIG9iamVjdC5cbiAgZWRnZTogYSByZWZlcmVuY2UgdG8gdGhlIHVuaXF1ZSBWb3Jvbm9pLkVkZ2Ugb2JqZWN0IHVuZGVybHlpbmcgdGhpc1xuICAgIFZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0LlxuICBnZXRTdGFydHBvaW50KCk6IGEgbWV0aG9kIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5XG4gICAgZm9yIHRoZSBzdGFydCBwb2ludCBvZiB0aGlzIGhhbGZlZGdlLiBLZWVwIGluIG1pbmQgaGFsZmVkZ2VzIGFyZSBhbHdheXNcbiAgICBjb3VudGVyY29ja3dpc2UuXG4gIGdldEVuZHBvaW50KCk6IGEgbWV0aG9kIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5XG4gICAgZm9yIHRoZSBlbmQgcG9pbnQgb2YgdGhpcyBoYWxmZWRnZS4gS2VlcCBpbiBtaW5kIGhhbGZlZGdlcyBhcmUgYWx3YXlzXG4gICAgY291bnRlcmNvY2t3aXNlLlxuXG5UT0RPOiBJZGVudGlmeSBvcHBvcnR1bml0aWVzIGZvciBwZXJmb3JtYW5jZSBpbXByb3ZlbWVudC5cblxuVE9ETzogTGV0IHRoZSB1c2VyIGNsb3NlIHRoZSBWb3Jvbm9pIGNlbGxzLCBkbyBub3QgZG8gaXQgYXV0b21hdGljYWxseS4gTm90IG9ubHkgbGV0XG4gICAgICBoaW0gY2xvc2UgdGhlIGNlbGxzLCBidXQgYWxzbyBhbGxvdyBoaW0gdG8gY2xvc2UgbW9yZSB0aGFuIG9uY2UgdXNpbmcgYSBkaWZmZXJlbnRcbiAgICAgIGJvdW5kaW5nIGJveCBmb3IgdGhlIHNhbWUgVm9yb25vaSBkaWFncmFtLlxuKi9cblxuLypnbG9iYWwgTWF0aCAqL1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gVm9yb25vaSgpIHtcbiAgICB0aGlzLnZlcnRpY2VzID0gbnVsbDtcbiAgICB0aGlzLmVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLmNlbGxzID0gbnVsbDtcbiAgICB0aGlzLnRvUmVjeWNsZSA9IG51bGw7XG4gICAgdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZCA9IFtdO1xuICAgIHRoaXMuY2lyY2xlRXZlbnRKdW5reWFyZCA9IFtdO1xuICAgIHRoaXMudmVydGV4SnVua3lhcmQgPSBbXTtcbiAgICB0aGlzLmVkZ2VKdW5reWFyZCA9IFtdO1xuICAgIHRoaXMuY2VsbEp1bmt5YXJkID0gW107XG4gICAgfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVm9yb25vaS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuYmVhY2hsaW5lKSB7XG4gICAgICAgIHRoaXMuYmVhY2hsaW5lID0gbmV3IHRoaXMuUkJUcmVlKCk7XG4gICAgICAgIH1cbiAgICAvLyBNb3ZlIGxlZnRvdmVyIGJlYWNoc2VjdGlvbnMgdG8gdGhlIGJlYWNoc2VjdGlvbiBqdW5reWFyZC5cbiAgICBpZiAodGhpcy5iZWFjaGxpbmUucm9vdCkge1xuICAgICAgICB2YXIgYmVhY2hzZWN0aW9uID0gdGhpcy5iZWFjaGxpbmUuZ2V0Rmlyc3QodGhpcy5iZWFjaGxpbmUucm9vdCk7XG4gICAgICAgIHdoaWxlIChiZWFjaHNlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYmVhY2hzZWN0aW9uSnVua3lhcmQucHVzaChiZWFjaHNlY3Rpb24pOyAvLyBtYXJrIGZvciByZXVzZVxuICAgICAgICAgICAgYmVhY2hzZWN0aW9uID0gYmVhY2hzZWN0aW9uLnJiTmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHRoaXMuYmVhY2hsaW5lLnJvb3QgPSBudWxsO1xuICAgIGlmICghdGhpcy5jaXJjbGVFdmVudHMpIHtcbiAgICAgICAgdGhpcy5jaXJjbGVFdmVudHMgPSBuZXcgdGhpcy5SQlRyZWUoKTtcbiAgICAgICAgfVxuICAgIHRoaXMuY2lyY2xlRXZlbnRzLnJvb3QgPSB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQgPSBudWxsO1xuICAgIHRoaXMudmVydGljZXMgPSBbXTtcbiAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgdGhpcy5jZWxscyA9IFtdO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnNxcnQgPSBmdW5jdGlvbihuKXsgcmV0dXJuIE1hdGguc3FydChuKTsgfTtcblZvcm9ub2kucHJvdG90eXBlLmFicyA9IGZ1bmN0aW9uKG4peyByZXR1cm4gTWF0aC5hYnMobik7IH07XG5Wb3Jvbm9pLnByb3RvdHlwZS7OtSA9IFZvcm9ub2kuzrUgPSAxZS05O1xuVm9yb25vaS5wcm90b3R5cGUuaW52zrUgPSBWb3Jvbm9pLmluds61ID0gMS4wIC8gVm9yb25vaS7OtTtcblZvcm9ub2kucHJvdG90eXBlLmVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLmFicyhhLWIpPDFlLTk7fTtcblZvcm9ub2kucHJvdG90eXBlLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBhLWI+MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUuZ3JlYXRlclRoYW5PckVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBiLWE8MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUubGVzc1RoYW5XaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYT4xZS05O307XG5Wb3Jvbm9pLnByb3RvdHlwZS5sZXNzVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEtYjwxZS05O307XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmVkLUJsYWNrIHRyZWUgY29kZSAoYmFzZWQgb24gQyB2ZXJzaW9uIG9mIFwicmJ0cmVlXCIgYnkgRnJhbmNrIEJ1aS1IdXVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYnVpaHV1L2xpYnRyZWUvYmxvYi9tYXN0ZXIvcmIuY1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5SQlRyZWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJJbnNlcnRTdWNjZXNzb3IgPSBmdW5jdGlvbihub2RlLCBzdWNjZXNzb3IpIHtcbiAgICB2YXIgcGFyZW50O1xuICAgIGlmIChub2RlKSB7XG4gICAgICAgIC8vID4+PiByaGlsbCAyMDExLTA1LTI3OiBQZXJmb3JtYW5jZTogY2FjaGUgcHJldmlvdXMvbmV4dCBub2Rlc1xuICAgICAgICBzdWNjZXNzb3IucmJQcmV2aW91cyA9IG5vZGU7XG4gICAgICAgIHN1Y2Nlc3Nvci5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgICAgICBub2RlLnJiTmV4dC5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBub2RlLnJiTmV4dCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgLy8gPDw8XG4gICAgICAgIGlmIChub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgIC8vIGluLXBsYWNlIGV4cGFuc2lvbiBvZiBub2RlLnJiUmlnaHQuZ2V0Rmlyc3QoKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZS5yYkxlZnQpIHtub2RlID0gbm9kZS5yYkxlZnQ7fVxuICAgICAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yYlJpZ2h0ID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlO1xuICAgICAgICB9XG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wNzogaWYgbm9kZSBpcyBudWxsLCBzdWNjZXNzb3IgbXVzdCBiZSBpbnNlcnRlZFxuICAgIC8vIHRvIHRoZSBsZWZ0LW1vc3QgcGFydCBvZiB0aGUgdHJlZVxuICAgIGVsc2UgaWYgKHRoaXMucm9vdCkge1xuICAgICAgICBub2RlID0gdGhpcy5nZXRGaXJzdCh0aGlzLnJvb3QpO1xuICAgICAgICAvLyA+Pj4gUGVyZm9ybWFuY2U6IGNhY2hlIHByZXZpb3VzL25leHQgbm9kZXNcbiAgICAgICAgc3VjY2Vzc29yLnJiUHJldmlvdXMgPSBudWxsO1xuICAgICAgICBzdWNjZXNzb3IucmJOZXh0ID0gbm9kZTtcbiAgICAgICAgbm9kZS5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAvLyA8PDxcbiAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gPj4+IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgICAgIHN1Y2Nlc3Nvci5yYlByZXZpb3VzID0gc3VjY2Vzc29yLnJiTmV4dCA9IG51bGw7XG4gICAgICAgIC8vIDw8PFxuICAgICAgICB0aGlzLnJvb3QgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICBzdWNjZXNzb3IucmJMZWZ0ID0gc3VjY2Vzc29yLnJiUmlnaHQgPSBudWxsO1xuICAgIHN1Y2Nlc3Nvci5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBzdWNjZXNzb3IucmJSZWQgPSB0cnVlO1xuICAgIC8vIEZpeHVwIHRoZSBtb2RpZmllZCB0cmVlIGJ5IHJlY29sb3Jpbmcgbm9kZXMgYW5kIHBlcmZvcm1pbmdcbiAgICAvLyByb3RhdGlvbnMgKDIgYXQgbW9zdCkgaGVuY2UgdGhlIHJlZC1ibGFjayB0cmVlIHByb3BlcnRpZXMgYXJlXG4gICAgLy8gcHJlc2VydmVkLlxuICAgIHZhciBncmFuZHBhLCB1bmNsZTtcbiAgICBub2RlID0gc3VjY2Vzc29yO1xuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50LnJiUmVkKSB7XG4gICAgICAgIGdyYW5kcGEgPSBwYXJlbnQucmJQYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgPT09IGdyYW5kcGEucmJMZWZ0KSB7XG4gICAgICAgICAgICB1bmNsZSA9IGdyYW5kcGEucmJSaWdodDtcbiAgICAgICAgICAgIGlmICh1bmNsZSAmJiB1bmNsZS5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHVuY2xlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGdyYW5kcGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudC5yYlJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBncmFuZHBhLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHVuY2xlID0gZ3JhbmRwYS5yYkxlZnQ7XG4gICAgICAgICAgICBpZiAodW5jbGUgJiYgdW5jbGUucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB1bmNsZS5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyYW5kcGEucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBncmFuZHBhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gcGFyZW50O1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICB9XG4gICAgdGhpcy5yb290LnJiUmVkID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJlbW92ZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgLy8gPj4+IHJoaWxsIDIwMTEtMDUtMjc6IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgIG5vZGUucmJOZXh0LnJiUHJldmlvdXMgPSBub2RlLnJiUHJldmlvdXM7XG4gICAgICAgIH1cbiAgICBpZiAobm9kZS5yYlByZXZpb3VzKSB7XG4gICAgICAgIG5vZGUucmJQcmV2aW91cy5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgfVxuICAgIG5vZGUucmJOZXh0ID0gbm9kZS5yYlByZXZpb3VzID0gbnVsbDtcbiAgICAvLyA8PDxcbiAgICB2YXIgcGFyZW50ID0gbm9kZS5yYlBhcmVudCxcbiAgICAgICAgbGVmdCA9IG5vZGUucmJMZWZ0LFxuICAgICAgICByaWdodCA9IG5vZGUucmJSaWdodCxcbiAgICAgICAgbmV4dDtcbiAgICBpZiAoIWxlZnQpIHtcbiAgICAgICAgbmV4dCA9IHJpZ2h0O1xuICAgICAgICB9XG4gICAgZWxzZSBpZiAoIXJpZ2h0KSB7XG4gICAgICAgIG5leHQgPSBsZWZ0O1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldEZpcnN0KHJpZ2h0KTtcbiAgICAgICAgfVxuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gZW5mb3JjZSByZWQtYmxhY2sgcnVsZXNcbiAgICB2YXIgaXNSZWQ7XG4gICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgaXNSZWQgPSBuZXh0LnJiUmVkO1xuICAgICAgICBuZXh0LnJiUmVkID0gbm9kZS5yYlJlZDtcbiAgICAgICAgbmV4dC5yYkxlZnQgPSBsZWZ0O1xuICAgICAgICBsZWZ0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgaWYgKG5leHQgIT09IHJpZ2h0KSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBuZXh0LnJiUGFyZW50O1xuICAgICAgICAgICAgbmV4dC5yYlBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICBub2RlID0gbmV4dC5yYlJpZ2h0O1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IG5vZGU7XG4gICAgICAgICAgICBuZXh0LnJiUmlnaHQgPSByaWdodDtcbiAgICAgICAgICAgIHJpZ2h0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXh0LnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgcGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIG5vZGUgPSBuZXh0LnJiUmlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaXNSZWQgPSBub2RlLnJiUmVkO1xuICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgICAgfVxuICAgIC8vICdub2RlJyBpcyBub3cgdGhlIHNvbGUgc3VjY2Vzc29yJ3MgY2hpbGQgYW5kICdwYXJlbnQnIGl0c1xuICAgIC8vIG5ldyBwYXJlbnQgKHNpbmNlIHRoZSBzdWNjZXNzb3IgY2FuIGhhdmUgYmVlbiBtb3ZlZClcbiAgICBpZiAobm9kZSkge1xuICAgICAgICBub2RlLnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgLy8gdGhlICdlYXN5JyBjYXNlc1xuICAgIGlmIChpc1JlZCkge3JldHVybjt9XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5yYlJlZCkge1xuICAgICAgICBub2RlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIC8vIHRoZSBvdGhlciBjYXNlc1xuICAgIHZhciBzaWJsaW5nO1xuICAgIGRvIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiUmlnaHQ7XG4gICAgICAgICAgICBpZiAoc2libGluZy5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoc2libGluZy5yYkxlZnQgJiYgc2libGluZy5yYkxlZnQucmJSZWQpIHx8IChzaWJsaW5nLnJiUmlnaHQgJiYgc2libGluZy5yYlJpZ2h0LnJiUmVkKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2libGluZy5yYlJpZ2h0IHx8ICFzaWJsaW5nLnJiUmlnaHQucmJSZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChzaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHBhcmVudC5yYlJlZDtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlTGVmdChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJMZWZ0O1xuICAgICAgICAgICAgaWYgKHNpYmxpbmcucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKHNpYmxpbmcucmJMZWZ0ICYmIHNpYmxpbmcucmJMZWZ0LnJiUmVkKSB8fCAoc2libGluZy5yYlJpZ2h0ICYmIHNpYmxpbmcucmJSaWdodC5yYlJlZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmcucmJMZWZ0IHx8ICFzaWJsaW5nLnJiTGVmdC5yYlJlZCkge1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHNpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBwYXJlbnQucmJSZWQ7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5yYlBhcmVudDtcbiAgICB9IHdoaWxlICghbm9kZS5yYlJlZCk7XG4gICAgaWYgKG5vZGUpIHtub2RlLnJiUmVkID0gZmFsc2U7fVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJSb3RhdGVMZWZ0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJSaWdodCwgLy8gY2FuJ3QgYmUgbnVsbFxuICAgICAgICBwYXJlbnQgPSBwLnJiUGFyZW50O1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IHApIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gcTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBxO1xuICAgICAgICB9XG4gICAgcS5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBwLnJiUGFyZW50ID0gcTtcbiAgICBwLnJiUmlnaHQgPSBxLnJiTGVmdDtcbiAgICBpZiAocC5yYlJpZ2h0KSB7XG4gICAgICAgIHAucmJSaWdodC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiTGVmdCA9IHA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJvdGF0ZVJpZ2h0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJMZWZ0LCAvLyBjYW4ndCBiZSBudWxsXG4gICAgICAgIHBhcmVudCA9IHAucmJQYXJlbnQ7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnJiTGVmdCA9PT0gcCkge1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IHE7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJiUmlnaHQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHE7XG4gICAgICAgIH1cbiAgICBxLnJiUGFyZW50ID0gcGFyZW50O1xuICAgIHAucmJQYXJlbnQgPSBxO1xuICAgIHAucmJMZWZ0ID0gcS5yYlJpZ2h0O1xuICAgIGlmIChwLnJiTGVmdCkge1xuICAgICAgICBwLnJiTGVmdC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiUmlnaHQgPSBwO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0Rmlyc3QgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgd2hpbGUgKG5vZGUucmJMZWZ0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgfVxuICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0TGFzdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB3aGlsZSAobm9kZS5yYlJpZ2h0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gbWV0aG9kc1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5EaWFncmFtID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IHNpdGU7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDZWxsIG1ldGhvZHNcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggY2VsbCApIHtcbiAgICAgICAgcmV0dXJuIGNlbGwuaW5pdChzaXRlKTtcbiAgICAgICAgfVxuICAgIHJldHVybiBuZXcgdGhpcy5DZWxsKHNpdGUpO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLnByZXBhcmVIYWxmZWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgLy8gZ2V0IHJpZCBvZiB1bnVzZWQgaGFsZmVkZ2VzXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNzogS2VlcCBpdCBzaW1wbGUsIG5vIHBvaW50IGhlcmUgaW4gdHJ5aW5nXG4gICAgLy8gdG8gYmUgZmFuY3k6IGRhbmdsaW5nIGVkZ2VzIGFyZSBhIHR5cGljYWxseSBhIG1pbm9yaXR5LlxuICAgIHdoaWxlIChpSGFsZmVkZ2UtLSkge1xuICAgICAgICBlZGdlID0gaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKCFlZGdlLnZiIHx8ICFlZGdlLnZhKSB7XG4gICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlIYWxmZWRnZSwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNjogSSB0cmllZCB0byB1c2UgYSBiaW5hcnkgc2VhcmNoIGF0IGluc2VydGlvblxuICAgIC8vIHRpbWUgdG8ga2VlcCB0aGUgYXJyYXkgc29ydGVkIG9uLXRoZS1mbHkgKGluIENlbGwuYWRkSGFsZmVkZ2UoKSkuXG4gICAgLy8gVGhlcmUgd2FzIG5vIHJlYWwgYmVuZWZpdHMgaW4gZG9pbmcgc28sIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gRmlyZWZveCAzLjYgd2FzIGltcHJvdmVkIG1hcmdpbmFsbHksIHdoaWxlIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gT3BlcmEgMTEgd2FzIHBlbmFsaXplZCBtYXJnaW5hbGx5LlxuICAgIGhhbGZlZGdlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGIuYW5nbGUtYS5hbmdsZTt9KTtcbiAgICByZXR1cm4gaGFsZmVkZ2VzLmxlbmd0aDtcbiAgICB9O1xuXG4vLyBSZXR1cm4gYSBsaXN0IG9mIHRoZSBuZWlnaGJvciBJZHNcblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldE5laWdoYm9ySWRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5laWdoYm9ycyA9IFtdLFxuICAgICAgICBpSGFsZmVkZ2UgPSB0aGlzLmhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKXtcbiAgICAgICAgZWRnZSA9IHRoaXMuaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKGVkZ2UubFNpdGUgIT09IG51bGwgJiYgZWRnZS5sU2l0ZS52b3Jvbm9pSWQgIT0gdGhpcy5zaXRlLnZvcm9ub2lJZCkge1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5sU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlZGdlLnJTaXRlICE9PSBudWxsICYmIGVkZ2UuclNpdGUudm9yb25vaUlkICE9IHRoaXMuc2l0ZS52b3Jvbm9pSWQpe1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5yU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgcmV0dXJuIG5laWdoYm9ycztcbiAgICB9O1xuXG4vLyBDb21wdXRlIGJvdW5kaW5nIGJveFxuLy9cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldEJib3ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIHhtaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeW1pbiA9IEluZmluaXR5LFxuICAgICAgICB4bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB5bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB2LCB2eCwgdnk7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKSB7XG4gICAgICAgIHYgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHZ4ID0gdi54O1xuICAgICAgICB2eSA9IHYueTtcbiAgICAgICAgaWYgKHZ4IDwgeG1pbikge3htaW4gPSB2eDt9XG4gICAgICAgIGlmICh2eSA8IHltaW4pIHt5bWluID0gdnk7fVxuICAgICAgICBpZiAodnggPiB4bWF4KSB7eG1heCA9IHZ4O31cbiAgICAgICAgaWYgKHZ5ID4geW1heCkge3ltYXggPSB2eTt9XG4gICAgICAgIC8vIHdlIGRvbnQgbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBlbmQgcG9pbnQsXG4gICAgICAgIC8vIHNpbmNlIGVhY2ggZW5kIHBvaW50IG1hdGNoZXMgYSBzdGFydCBwb2ludFxuICAgICAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeG1pbixcbiAgICAgICAgeTogeW1pbixcbiAgICAgICAgd2lkdGg6IHhtYXgteG1pbixcbiAgICAgICAgaGVpZ2h0OiB5bWF4LXltaW5cbiAgICAgICAgfTtcbiAgICB9O1xuXG4vLyBSZXR1cm4gd2hldGhlciBhIHBvaW50IGlzIGluc2lkZSwgb24sIG9yIG91dHNpZGUgdGhlIGNlbGw6XG4vLyAgIC0xOiBwb2ludCBpcyBvdXRzaWRlIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDA6IHBvaW50IGlzIG9uIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDE6IHBvaW50IGlzIGluc2lkZSB0aGUgcGVyaW1ldGVyIG9mIHRoZSBjZWxsXG4vL1xuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUucG9pbnRJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgLy8gQ2hlY2sgaWYgcG9pbnQgaW4gcG9seWdvbi4gU2luY2UgYWxsIHBvbHlnb25zIG9mIGEgVm9yb25vaVxuICAgIC8vIGRpYWdyYW0gYXJlIGNvbnZleCwgdGhlbjpcbiAgICAvLyBodHRwOi8vcGF1bGJvdXJrZS5uZXQvZ2VvbWV0cnkvcG9seWdvbm1lc2gvXG4gICAgLy8gU29sdXRpb24gMyAoMkQpOlxuICAgIC8vICAgXCJJZiB0aGUgcG9seWdvbiBpcyBjb252ZXggdGhlbiBvbmUgY2FuIGNvbnNpZGVyIHRoZSBwb2x5Z29uXG4gICAgLy8gICBcImFzIGEgJ3BhdGgnIGZyb20gdGhlIGZpcnN0IHZlcnRleC4gQSBwb2ludCBpcyBvbiB0aGUgaW50ZXJpb3JcbiAgICAvLyAgIFwib2YgdGhpcyBwb2x5Z29ucyBpZiBpdCBpcyBhbHdheXMgb24gdGhlIHNhbWUgc2lkZSBvZiBhbGwgdGhlXG4gICAgLy8gICBcImxpbmUgc2VnbWVudHMgbWFraW5nIHVwIHRoZSBwYXRoLiAuLi5cbiAgICAvLyAgIFwiKHkgLSB5MCkgKHgxIC0geDApIC0gKHggLSB4MCkgKHkxIC0geTApXG4gICAgLy8gICBcImlmIGl0IGlzIGxlc3MgdGhhbiAwIHRoZW4gUCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIGxpbmUgc2VnbWVudCxcbiAgICAvLyAgIFwiaWYgZ3JlYXRlciB0aGFuIDAgaXQgaXMgdG8gdGhlIGxlZnQsIGlmIGVxdWFsIHRvIDAgdGhlbiBpdCBsaWVzXG4gICAgLy8gICBcIm9uIHRoZSBsaW5lIHNlZ21lbnRcIlxuICAgIHZhciBoYWxmZWRnZXMgPSB0aGlzLmhhbGZlZGdlcyxcbiAgICAgICAgaUhhbGZlZGdlID0gaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgaGFsZmVkZ2UsXG4gICAgICAgIHAwLCBwMSwgcjtcbiAgICB3aGlsZSAoaUhhbGZlZGdlLS0pIHtcbiAgICAgICAgaGFsZmVkZ2UgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXTtcbiAgICAgICAgcDAgPSBoYWxmZWRnZS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHAxID0gaGFsZmVkZ2UuZ2V0RW5kcG9pbnQoKTtcbiAgICAgICAgciA9ICh5LXAwLnkpKihwMS54LXAwLngpLSh4LXAwLngpKihwMS55LXAwLnkpO1xuICAgICAgICBpZiAoIXIpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAociA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHJldHVybiAxO1xuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRWRnZSBtZXRob2RzXG4vL1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5WZXJ0ZXggPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkVkZ2UgPSBmdW5jdGlvbihsU2l0ZSwgclNpdGUpIHtcbiAgICB0aGlzLmxTaXRlID0gbFNpdGU7XG4gICAgdGhpcy5yU2l0ZSA9IHJTaXRlO1xuICAgIHRoaXMudmEgPSB0aGlzLnZiID0gbnVsbDtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZSA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IGxTaXRlO1xuICAgIHRoaXMuZWRnZSA9IGVkZ2U7XG4gICAgLy8gJ2FuZ2xlJyBpcyBhIHZhbHVlIHRvIGJlIHVzZWQgZm9yIHByb3Blcmx5IHNvcnRpbmcgdGhlXG4gICAgLy8gaGFsZnNlZ21lbnRzIGNvdW50ZXJjbG9ja3dpc2UuIEJ5IGNvbnZlbnRpb24sIHdlIHdpbGxcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIHRoZSBsaW5lIGRlZmluZWQgYnkgdGhlICdzaXRlIHRvIHRoZSBsZWZ0J1xuICAgIC8vIHRvIHRoZSAnc2l0ZSB0byB0aGUgcmlnaHQnLlxuICAgIC8vIEhvd2V2ZXIsIGJvcmRlciBlZGdlcyBoYXZlIG5vICdzaXRlIHRvIHRoZSByaWdodCc6IHRodXMgd2VcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIGxpbmUgcGVycGVuZGljdWxhciB0byB0aGUgaGFsZnNlZ21lbnQgKHRoZVxuICAgIC8vIGVkZ2Ugc2hvdWxkIGhhdmUgYm90aCBlbmQgcG9pbnRzIGRlZmluZWQgaW4gc3VjaCBjYXNlLilcbiAgICBpZiAoclNpdGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IE1hdGguYXRhbjIoclNpdGUueS1sU2l0ZS55LCByU2l0ZS54LWxTaXRlLngpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgICAgICB2YiA9IGVkZ2UudmI7XG4gICAgICAgIC8vIHJoaWxsIDIwMTEtMDUtMzE6IHVzZWQgdG8gY2FsbCBnZXRTdGFydHBvaW50KCkvZ2V0RW5kcG9pbnQoKSxcbiAgICAgICAgLy8gYnV0IGZvciBwZXJmb3JtYW5jZSBwdXJwb3NlLCB0aGVzZSBhcmUgZXhwYW5kZWQgaW4gcGxhY2UgaGVyZS5cbiAgICAgICAgdGhpcy5hbmdsZSA9IGVkZ2UubFNpdGUgPT09IGxTaXRlID9cbiAgICAgICAgICAgIE1hdGguYXRhbjIodmIueC12YS54LCB2YS55LXZiLnkpIDpcbiAgICAgICAgICAgIE1hdGguYXRhbjIodmEueC12Yi54LCB2Yi55LXZhLnkpO1xuICAgICAgICB9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlSGFsZmVkZ2UgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0U3RhcnRwb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVkZ2UubFNpdGUgPT09IHRoaXMuc2l0ZSA/IHRoaXMuZWRnZS52YSA6IHRoaXMuZWRnZS52YjtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0RW5kcG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lZGdlLmxTaXRlID09PSB0aGlzLnNpdGUgPyB0aGlzLmVkZ2UudmIgOiB0aGlzLmVkZ2UudmE7XG4gICAgfTtcblxuXG5cbi8vIHRoaXMgY3JlYXRlIGFuZCBhZGQgYSB2ZXJ0ZXggdG8gdGhlIGludGVybmFsIGNvbGxlY3Rpb25cblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlVmVydGV4ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0ZXhKdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoICF2ICkge1xuICAgICAgICB2ID0gbmV3IHRoaXMuVmVydGV4KHgsIHkpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHYueCA9IHg7XG4gICAgICAgIHYueSA9IHk7XG4gICAgICAgIH1cbiAgICB0aGlzLnZlcnRpY2VzLnB1c2godik7XG4gICAgcmV0dXJuIHY7XG4gICAgfTtcblxuLy8gdGhpcyBjcmVhdGUgYW5kIGFkZCBhbiBlZGdlIHRvIGludGVybmFsIGNvbGxlY3Rpb24sIGFuZCBhbHNvIGNyZWF0ZVxuLy8gdHdvIGhhbGZlZGdlcyB3aGljaCBhcmUgYWRkZWQgdG8gZWFjaCBzaXRlJ3MgY291bnRlcmNsb2Nrd2lzZSBhcnJheVxuLy8gb2YgaGFsZmVkZ2VzLlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVFZGdlID0gZnVuY3Rpb24obFNpdGUsIHJTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCByU2l0ZSk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS5sU2l0ZSA9IGxTaXRlO1xuICAgICAgICBlZGdlLnJTaXRlID0gclNpdGU7XG4gICAgICAgIGVkZ2UudmEgPSBlZGdlLnZiID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgdGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xuICAgIGlmICh2YSkge1xuICAgICAgICB0aGlzLnNldEVkZ2VTdGFydHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmEpO1xuICAgICAgICB9XG4gICAgaWYgKHZiKSB7XG4gICAgICAgIHRoaXMuc2V0RWRnZUVuZHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmIpO1xuICAgICAgICB9XG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKSk7XG4gICAgdGhpcy5jZWxsc1tyU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgclNpdGUsIGxTaXRlKSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQm9yZGVyRWRnZSA9IGZ1bmN0aW9uKGxTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCBudWxsKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgZWRnZS52YSA9IHZhO1xuICAgIGVkZ2UudmIgPSB2YjtcbiAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuc2V0RWRnZVN0YXJ0cG9pbnQgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUsIHZlcnRleCkge1xuICAgIGlmICghZWRnZS52YSAmJiAhZWRnZS52Yikge1xuICAgICAgICBlZGdlLnZhID0gdmVydGV4O1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSByU2l0ZTtcbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UubFNpdGUgPT09IHJTaXRlKSB7XG4gICAgICAgIGVkZ2UudmIgPSB2ZXJ0ZXg7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS52YSA9IHZlcnRleDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnNldEVkZ2VFbmRwb2ludCA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KSB7XG4gICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChlZGdlLCByU2l0ZSwgbFNpdGUsIHZlcnRleCk7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBCZWFjaGxpbmUgbWV0aG9kc1xuXG4vLyByaGlsbCAyMDExLTA2LTA3OiBGb3Igc29tZSByZWFzb25zLCBwZXJmb3JtYW5jZSBzdWZmZXJzIHNpZ25pZmljYW50bHlcbi8vIHdoZW4gaW5zdGFuY2lhdGluZyBhIGxpdGVyYWwgb2JqZWN0IGluc3RlYWQgb2YgYW4gZW1wdHkgY3RvclxuVm9yb25vaS5wcm90b3R5cGUuQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgfTtcblxuLy8gcmhpbGwgMjAxMS0wNi0wMjogQSBsb3Qgb2YgQmVhY2hzZWN0aW9uIGluc3RhbmNpYXRpb25zXG4vLyBvY2N1ciBkdXJpbmcgdGhlIGNvbXB1dGF0aW9uIG9mIHRoZSBWb3Jvbm9pIGRpYWdyYW0sXG4vLyBzb21ld2hlcmUgYmV0d2VlbiB0aGUgbnVtYmVyIG9mIHNpdGVzIGFuZCB0d2ljZSB0aGVcbi8vIG51bWJlciBvZiBzaXRlcywgd2hpbGUgdGhlIG51bWJlciBvZiBCZWFjaHNlY3Rpb25zIG9uIHRoZVxuLy8gYmVhY2hsaW5lIGF0IGFueSBnaXZlbiB0aW1lIGlzIGNvbXBhcmF0aXZlbHkgbG93LiBGb3IgdGhpc1xuLy8gcmVhc29uLCB3ZSByZXVzZSBhbHJlYWR5IGNyZWF0ZWQgQmVhY2hzZWN0aW9ucywgaW4gb3JkZXJcbi8vIHRvIGF2b2lkIG5ldyBtZW1vcnkgYWxsb2NhdGlvbi4gVGhpcyByZXN1bHRlZCBpbiBhIG1lYXN1cmFibGVcbi8vIHBlcmZvcm1hbmNlIGdhaW4uXG5cblZvcm9ub2kucHJvdG90eXBlLmNyZWF0ZUJlYWNoc2VjdGlvbiA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgYmVhY2hzZWN0aW9uID0gdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoIWJlYWNoc2VjdGlvbikge1xuICAgICAgICBiZWFjaHNlY3Rpb24gPSBuZXcgdGhpcy5CZWFjaHNlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIGJlYWNoc2VjdGlvbi5zaXRlID0gc2l0ZTtcbiAgICByZXR1cm4gYmVhY2hzZWN0aW9uO1xuICAgIH07XG5cbi8vIGNhbGN1bGF0ZSB0aGUgbGVmdCBicmVhayBwb2ludCBvZiBhIHBhcnRpY3VsYXIgYmVhY2ggc2VjdGlvbixcbi8vIGdpdmVuIGEgcGFydGljdWxhciBzd2VlcCBsaW5lXG5Wb3Jvbm9pLnByb3RvdHlwZS5sZWZ0QnJlYWtQb2ludCA9IGZ1bmN0aW9uKGFyYywgZGlyZWN0cml4KSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9QYXJhYm9sYVxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUXVhZHJhdGljX2VxdWF0aW9uXG4gICAgLy8gaDEgPSB4MSxcbiAgICAvLyBrMSA9ICh5MStkaXJlY3RyaXgpLzIsXG4gICAgLy8gaDIgPSB4MixcbiAgICAvLyBrMiA9ICh5MitkaXJlY3RyaXgpLzIsXG4gICAgLy8gcDEgPSBrMS1kaXJlY3RyaXgsXG4gICAgLy8gYTEgPSAxLyg0KnAxKSxcbiAgICAvLyBiMSA9IC1oMS8oMipwMSksXG4gICAgLy8gYzEgPSBoMSpoMS8oNCpwMSkrazEsXG4gICAgLy8gcDIgPSBrMi1kaXJlY3RyaXgsXG4gICAgLy8gYTIgPSAxLyg0KnAyKSxcbiAgICAvLyBiMiA9IC1oMi8oMipwMiksXG4gICAgLy8gYzIgPSBoMipoMi8oNCpwMikrazIsXG4gICAgLy8geCA9ICgtKGIyLWIxKSArIE1hdGguc3FydCgoYjItYjEpKihiMi1iMSkgLSA0KihhMi1hMSkqKGMyLWMxKSkpIC8gKDIqKGEyLWExKSlcbiAgICAvLyBXaGVuIHgxIGJlY29tZSB0aGUgeC1vcmlnaW46XG4gICAgLy8gaDEgPSAwLFxuICAgIC8vIGsxID0gKHkxK2RpcmVjdHJpeCkvMixcbiAgICAvLyBoMiA9IHgyLXgxLFxuICAgIC8vIGsyID0gKHkyK2RpcmVjdHJpeCkvMixcbiAgICAvLyBwMSA9IGsxLWRpcmVjdHJpeCxcbiAgICAvLyBhMSA9IDEvKDQqcDEpLFxuICAgIC8vIGIxID0gMCxcbiAgICAvLyBjMSA9IGsxLFxuICAgIC8vIHAyID0gazItZGlyZWN0cml4LFxuICAgIC8vIGEyID0gMS8oNCpwMiksXG4gICAgLy8gYjIgPSAtaDIvKDIqcDIpLFxuICAgIC8vIGMyID0gaDIqaDIvKDQqcDIpK2syLFxuICAgIC8vIHggPSAoLWIyICsgTWF0aC5zcXJ0KGIyKmIyIC0gNCooYTItYTEpKihjMi1rMSkpKSAvICgyKihhMi1hMSkpICsgeDFcblxuICAgIC8vIGNoYW5nZSBjb2RlIGJlbG93IGF0IHlvdXIgb3duIHJpc2s6IGNhcmUgaGFzIGJlZW4gdGFrZW4gdG9cbiAgICAvLyByZWR1Y2UgZXJyb3JzIGR1ZSB0byBjb21wdXRlcnMnIGZpbml0ZSBhcml0aG1ldGljIHByZWNpc2lvbi5cbiAgICAvLyBNYXliZSBjYW4gc3RpbGwgYmUgaW1wcm92ZWQsIHdpbGwgc2VlIGlmIGFueSBtb3JlIG9mIHRoaXNcbiAgICAvLyBraW5kIG9mIGVycm9ycyBwb3AgdXAgYWdhaW4uXG4gICAgdmFyIHNpdGUgPSBhcmMuc2l0ZSxcbiAgICAgICAgcmZvY3ggPSBzaXRlLngsXG4gICAgICAgIHJmb2N5ID0gc2l0ZS55LFxuICAgICAgICBwYnkyID0gcmZvY3ktZGlyZWN0cml4O1xuICAgIC8vIHBhcmFib2xhIGluIGRlZ2VuZXJhdGUgY2FzZSB3aGVyZSBmb2N1cyBpcyBvbiBkaXJlY3RyaXhcbiAgICBpZiAoIXBieTIpIHtcbiAgICAgICAgcmV0dXJuIHJmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGxBcmMgPSBhcmMucmJQcmV2aW91cztcbiAgICBpZiAoIWxBcmMpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgICAgfVxuICAgIHNpdGUgPSBsQXJjLnNpdGU7XG4gICAgdmFyIGxmb2N4ID0gc2l0ZS54LFxuICAgICAgICBsZm9jeSA9IHNpdGUueSxcbiAgICAgICAgcGxieTIgPSBsZm9jeS1kaXJlY3RyaXg7XG4gICAgLy8gcGFyYWJvbGEgaW4gZGVnZW5lcmF0ZSBjYXNlIHdoZXJlIGZvY3VzIGlzIG9uIGRpcmVjdHJpeFxuICAgIGlmICghcGxieTIpIHtcbiAgICAgICAgcmV0dXJuIGxmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGhsID0gbGZvY3gtcmZvY3gsXG4gICAgICAgIGFieTIgPSAxL3BieTItMS9wbGJ5MixcbiAgICAgICAgYiA9IGhsL3BsYnkyO1xuICAgIGlmIChhYnkyKSB7XG4gICAgICAgIHJldHVybiAoLWIrdGhpcy5zcXJ0KGIqYi0yKmFieTIqKGhsKmhsLygtMipwbGJ5MiktbGZvY3krcGxieTIvMityZm9jeS1wYnkyLzIpKSkvYWJ5MityZm9jeDtcbiAgICAgICAgfVxuICAgIC8vIGJvdGggcGFyYWJvbGFzIGhhdmUgc2FtZSBkaXN0YW5jZSB0byBkaXJlY3RyaXgsIHRodXMgYnJlYWsgcG9pbnQgaXMgbWlkd2F5XG4gICAgcmV0dXJuIChyZm9jeCtsZm9jeCkvMjtcbiAgICB9O1xuXG4vLyBjYWxjdWxhdGUgdGhlIHJpZ2h0IGJyZWFrIHBvaW50IG9mIGEgcGFydGljdWxhciBiZWFjaCBzZWN0aW9uLFxuLy8gZ2l2ZW4gYSBwYXJ0aWN1bGFyIGRpcmVjdHJpeFxuVm9yb25vaS5wcm90b3R5cGUucmlnaHRCcmVha1BvaW50ID0gZnVuY3Rpb24oYXJjLCBkaXJlY3RyaXgpIHtcbiAgICB2YXIgckFyYyA9IGFyYy5yYk5leHQ7XG4gICAgaWYgKHJBcmMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdEJyZWFrUG9pbnQockFyYywgZGlyZWN0cml4KTtcbiAgICAgICAgfVxuICAgIHZhciBzaXRlID0gYXJjLnNpdGU7XG4gICAgcmV0dXJuIHNpdGUueSA9PT0gZGlyZWN0cml4ID8gc2l0ZS54IDogSW5maW5pdHk7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuZGV0YWNoQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oYmVhY2hzZWN0aW9uKSB7XG4gICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChiZWFjaHNlY3Rpb24pOyAvLyBkZXRhY2ggcG90ZW50aWFsbHkgYXR0YWNoZWQgY2lyY2xlIGV2ZW50XG4gICAgdGhpcy5iZWFjaGxpbmUucmJSZW1vdmVOb2RlKGJlYWNoc2VjdGlvbik7IC8vIHJlbW92ZSBmcm9tIFJCLXRyZWVcbiAgICB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkLnB1c2goYmVhY2hzZWN0aW9uKTsgLy8gbWFyayBmb3IgcmV1c2VcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5yZW1vdmVCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihiZWFjaHNlY3Rpb24pIHtcbiAgICB2YXIgY2lyY2xlID0gYmVhY2hzZWN0aW9uLmNpcmNsZUV2ZW50LFxuICAgICAgICB4ID0gY2lyY2xlLngsXG4gICAgICAgIHkgPSBjaXJjbGUueWNlbnRlcixcbiAgICAgICAgdmVydGV4ID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeCwgeSksXG4gICAgICAgIHByZXZpb3VzID0gYmVhY2hzZWN0aW9uLnJiUHJldmlvdXMsXG4gICAgICAgIG5leHQgPSBiZWFjaHNlY3Rpb24ucmJOZXh0LFxuICAgICAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucyA9IFtiZWFjaHNlY3Rpb25dLFxuICAgICAgICBhYnNfZm4gPSBNYXRoLmFicztcblxuICAgIC8vIHJlbW92ZSBjb2xsYXBzZWQgYmVhY2hzZWN0aW9uIGZyb20gYmVhY2hsaW5lXG4gICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24oYmVhY2hzZWN0aW9uKTtcblxuICAgIC8vIHRoZXJlIGNvdWxkIGJlIG1vcmUgdGhhbiBvbmUgZW1wdHkgYXJjIGF0IHRoZSBkZWxldGlvbiBwb2ludCwgdGhpc1xuICAgIC8vIGhhcHBlbnMgd2hlbiBtb3JlIHRoYW4gdHdvIGVkZ2VzIGFyZSBsaW5rZWQgYnkgdGhlIHNhbWUgdmVydGV4LFxuICAgIC8vIHNvIHdlIHdpbGwgY29sbGVjdCBhbGwgdGhvc2UgZWRnZXMgYnkgbG9va2luZyB1cCBib3RoIHNpZGVzIG9mXG4gICAgLy8gdGhlIGRlbGV0aW9uIHBvaW50LlxuICAgIC8vIGJ5IHRoZSB3YXksIHRoZXJlIGlzICphbHdheXMqIGEgcHJlZGVjZXNzb3Ivc3VjY2Vzc29yIHRvIGFueSBjb2xsYXBzZWRcbiAgICAvLyBiZWFjaCBzZWN0aW9uLCBpdCdzIGp1c3QgaW1wb3NzaWJsZSB0byBoYXZlIGEgY29sbGFwc2luZyBmaXJzdC9sYXN0XG4gICAgLy8gYmVhY2ggc2VjdGlvbnMgb24gdGhlIGJlYWNobGluZSwgc2luY2UgdGhleSBvYnZpb3VzbHkgYXJlIHVuY29uc3RyYWluZWRcbiAgICAvLyBvbiB0aGVpciBsZWZ0L3JpZ2h0IHNpZGUuXG5cbiAgICAvLyBsb29rIGxlZnRcbiAgICB2YXIgbEFyYyA9IHByZXZpb3VzO1xuICAgIHdoaWxlIChsQXJjLmNpcmNsZUV2ZW50ICYmIGFic19mbih4LWxBcmMuY2lyY2xlRXZlbnQueCk8MWUtOSAmJiBhYnNfZm4oeS1sQXJjLmNpcmNsZUV2ZW50LnljZW50ZXIpPDFlLTkpIHtcbiAgICAgICAgcHJldmlvdXMgPSBsQXJjLnJiUHJldmlvdXM7XG4gICAgICAgIGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLnVuc2hpZnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQmVhY2hzZWN0aW9uKGxBcmMpOyAvLyBtYXJrIGZvciByZXVzZVxuICAgICAgICBsQXJjID0gcHJldmlvdXM7XG4gICAgICAgIH1cbiAgICAvLyBldmVuIHRob3VnaCBpdCBpcyBub3QgZGlzYXBwZWFyaW5nLCBJIHdpbGwgYWxzbyBhZGQgdGhlIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpbW1lZGlhdGVseSB0byB0aGUgbGVmdCBvZiB0aGUgbGVmdC1tb3N0IGNvbGxhcHNlZCBiZWFjaCBzZWN0aW9uLCBmb3JcbiAgICAvLyBjb252ZW5pZW5jZSwgc2luY2Ugd2UgbmVlZCB0byByZWZlciB0byBpdCBsYXRlciBhcyB0aGlzIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpcyB0aGUgJ2xlZnQnIHNpdGUgb2YgYW4gZWRnZSBmb3Igd2hpY2ggYSBzdGFydCBwb2ludCBpcyBzZXQuXG4gICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMudW5zaGlmdChsQXJjKTtcbiAgICB0aGlzLmRldGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuXG4gICAgLy8gbG9vayByaWdodFxuICAgIHZhciByQXJjID0gbmV4dDtcbiAgICB3aGlsZSAockFyYy5jaXJjbGVFdmVudCAmJiBhYnNfZm4oeC1yQXJjLmNpcmNsZUV2ZW50LngpPDFlLTkgJiYgYWJzX2ZuKHktckFyYy5jaXJjbGVFdmVudC55Y2VudGVyKTwxZS05KSB7XG4gICAgICAgIG5leHQgPSByQXJjLnJiTmV4dDtcbiAgICAgICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMucHVzaChyQXJjKTtcbiAgICAgICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24ockFyYyk7IC8vIG1hcmsgZm9yIHJldXNlXG4gICAgICAgIHJBcmMgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gd2UgYWxzbyBoYXZlIHRvIGFkZCB0aGUgYmVhY2ggc2VjdGlvbiBpbW1lZGlhdGVseSB0byB0aGUgcmlnaHQgb2YgdGhlXG4gICAgLy8gcmlnaHQtbW9zdCBjb2xsYXBzZWQgYmVhY2ggc2VjdGlvbiwgc2luY2UgdGhlcmUgaXMgYWxzbyBhIGRpc2FwcGVhcmluZ1xuICAgIC8vIHRyYW5zaXRpb24gcmVwcmVzZW50aW5nIGFuIGVkZ2UncyBzdGFydCBwb2ludCBvbiBpdHMgbGVmdC5cbiAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucy5wdXNoKHJBcmMpO1xuICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAvLyB3YWxrIHRocm91Z2ggYWxsIHRoZSBkaXNhcHBlYXJpbmcgdHJhbnNpdGlvbnMgYmV0d2VlbiBiZWFjaCBzZWN0aW9ucyBhbmRcbiAgICAvLyBzZXQgdGhlIHN0YXJ0IHBvaW50IG9mIHRoZWlyIChpbXBsaWVkKSBlZGdlLlxuICAgIHZhciBuQXJjcyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLmxlbmd0aCxcbiAgICAgICAgaUFyYztcbiAgICBmb3IgKGlBcmM9MTsgaUFyYzxuQXJjczsgaUFyYysrKSB7XG4gICAgICAgIHJBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1tpQXJjXTtcbiAgICAgICAgbEFyYyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zW2lBcmMtMV07XG4gICAgICAgIHRoaXMuc2V0RWRnZVN0YXJ0cG9pbnQockFyYy5lZGdlLCBsQXJjLnNpdGUsIHJBcmMuc2l0ZSwgdmVydGV4KTtcbiAgICAgICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgbmV3IGVkZ2UgYXMgd2UgaGF2ZSBub3cgYSBuZXcgdHJhbnNpdGlvbiBiZXR3ZWVuXG4gICAgLy8gdHdvIGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdlcmUgcHJldmlvdXNseSBub3QgYWRqYWNlbnQuXG4gICAgLy8gc2luY2UgdGhpcyBlZGdlIGFwcGVhcnMgYXMgYSBuZXcgdmVydGV4IGlzIGRlZmluZWQsIHRoZSB2ZXJ0ZXhcbiAgICAvLyBhY3R1YWxseSBkZWZpbmUgYW4gZW5kIHBvaW50IG9mIHRoZSBlZGdlIChyZWxhdGl2ZSB0byB0aGUgc2l0ZVxuICAgIC8vIG9uIHRoZSBsZWZ0KVxuICAgIGxBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1swXTtcbiAgICByQXJjID0gZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnNbbkFyY3MtMV07XG4gICAgckFyYy5lZGdlID0gdGhpcy5jcmVhdGVFZGdlKGxBcmMuc2l0ZSwgckFyYy5zaXRlLCB1bmRlZmluZWQsIHZlcnRleCk7XG5cbiAgICAvLyBjcmVhdGUgY2lyY2xlIGV2ZW50cyBpZiBhbnkgZm9yIGJlYWNoIHNlY3Rpb25zIGxlZnQgaW4gdGhlIGJlYWNobGluZVxuICAgIC8vIGFkamFjZW50IHRvIGNvbGxhcHNlZCBzZWN0aW9uc1xuICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChyQXJjKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5hZGRCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgdmFyIHggPSBzaXRlLngsXG4gICAgICAgIGRpcmVjdHJpeCA9IHNpdGUueTtcblxuICAgIC8vIGZpbmQgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdpbGwgc3Vycm91bmQgdGhlIG5ld2x5XG4gICAgLy8gY3JlYXRlZCBiZWFjaCBzZWN0aW9uLlxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDE6IFRoaXMgbG9vcCBpcyBvbmUgb2YgdGhlIG1vc3Qgb2Z0ZW4gZXhlY3V0ZWQsXG4gICAgLy8gaGVuY2Ugd2UgZXhwYW5kIGluLXBsYWNlIHRoZSBjb21wYXJpc29uLWFnYWluc3QtZXBzaWxvbiBjYWxscy5cbiAgICB2YXIgbEFyYywgckFyYyxcbiAgICAgICAgZHhsLCBkeHIsXG4gICAgICAgIG5vZGUgPSB0aGlzLmJlYWNobGluZS5yb290O1xuXG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgZHhsID0gdGhpcy5sZWZ0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCkteDtcbiAgICAgICAgLy8geCBsZXNzVGhhbldpdGhFcHNpbG9uIHhsID0+IGZhbGxzIHNvbWV3aGVyZSBiZWZvcmUgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgIGlmIChkeGwgPiAxZS05KSB7XG4gICAgICAgICAgICAvLyB0aGlzIGNhc2Ugc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgICAgICAgLy8gaWYgKCFub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgLy8gICAgckFyYyA9IG5vZGUucmJMZWZ0O1xuICAgICAgICAgICAgLy8gICAgYnJlYWs7XG4gICAgICAgICAgICAvLyAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5yYkxlZnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZHhyID0geC10aGlzLnJpZ2h0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCk7XG4gICAgICAgICAgICAvLyB4IGdyZWF0ZXJUaGFuV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgc29tZXdoZXJlIGFmdGVyIHRoZSByaWdodCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgIGlmIChkeHIgPiAxZS05KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geGwgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgbGVmdCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAoZHhsID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICAgICAgckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZHhyID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHJBcmMgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGZhbGxzIGV4YWN0bHkgc29tZXdoZXJlIGluIHRoZSBtaWRkbGUgb2YgdGhlIGJlYWNoc2VjdGlvblxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBrZWVwIGluIG1pbmQgdGhhdCBsQXJjIGFuZC9vciByQXJjIGNvdWxkIGJlXG4gICAgLy8gdW5kZWZpbmVkIG9yIG51bGwuXG5cbiAgICAvLyBjcmVhdGUgYSBuZXcgYmVhY2ggc2VjdGlvbiBvYmplY3QgZm9yIHRoZSBzaXRlIGFuZCBhZGQgaXQgdG8gUkItdHJlZVxuICAgIHZhciBuZXdBcmMgPSB0aGlzLmNyZWF0ZUJlYWNoc2VjdGlvbihzaXRlKTtcbiAgICB0aGlzLmJlYWNobGluZS5yYkluc2VydFN1Y2Nlc3NvcihsQXJjLCBuZXdBcmMpO1xuXG4gICAgLy8gY2FzZXM6XG4gICAgLy9cblxuICAgIC8vIFtudWxsLG51bGxdXG4gICAgLy8gbGVhc3QgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGlzIHRoZSBmaXJzdCBiZWFjaCBzZWN0aW9uIG9uIHRoZVxuICAgIC8vIGJlYWNobGluZS5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBubyBuZXcgdHJhbnNpdGlvbiBhcHBlYXJzXG4gICAgLy8gICBubyBjb2xsYXBzaW5nIGJlYWNoIHNlY3Rpb25cbiAgICAvLyAgIG5ldyBiZWFjaHNlY3Rpb24gYmVjb21lIHJvb3Qgb2YgdGhlIFJCLXRyZWVcbiAgICBpZiAoIWxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbEFyYyxyQXJjXSB3aGVyZSBsQXJjID09IHJBcmNcbiAgICAvLyBtb3N0IGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBzcGxpdCBhbiBleGlzdGluZyBiZWFjaFxuICAgIC8vIHNlY3Rpb24uXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIG5ldyB0cmFuc2l0aW9uIGFwcGVhcnNcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIHR3byBuZXcgbm9kZXMgYWRkZWQgdG8gdGhlIFJCLXRyZWVcbiAgICBpZiAobEFyYyA9PT0gckFyYykge1xuICAgICAgICAvLyBpbnZhbGlkYXRlIGNpcmNsZSBldmVudCBvZiBzcGxpdCBiZWFjaCBzZWN0aW9uXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG5cbiAgICAgICAgLy8gc3BsaXQgdGhlIGJlYWNoIHNlY3Rpb24gaW50byB0d28gc2VwYXJhdGUgYmVhY2ggc2VjdGlvbnNcbiAgICAgICAgckFyYyA9IHRoaXMuY3JlYXRlQmVhY2hzZWN0aW9uKGxBcmMuc2l0ZSk7XG4gICAgICAgIHRoaXMuYmVhY2hsaW5lLnJiSW5zZXJ0U3VjY2Vzc29yKG5ld0FyYywgckFyYyk7XG5cbiAgICAgICAgLy8gc2luY2Ugd2UgaGF2ZSBhIG5ldyB0cmFuc2l0aW9uIGJldHdlZW4gdHdvIGJlYWNoIHNlY3Rpb25zLFxuICAgICAgICAvLyBhIG5ldyBlZGdlIGlzIGJvcm5cbiAgICAgICAgbmV3QXJjLmVkZ2UgPSByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLCBuZXdBcmMuc2l0ZSk7XG5cbiAgICAgICAgLy8gY2hlY2sgd2hldGhlciB0aGUgbGVmdCBhbmQgcmlnaHQgYmVhY2ggc2VjdGlvbnMgYXJlIGNvbGxhcHNpbmdcbiAgICAgICAgLy8gYW5kIGlmIHNvIGNyZWF0ZSBjaXJjbGUgZXZlbnRzLCB0byBiZSBub3RpZmllZCB3aGVuIHRoZSBwb2ludCBvZlxuICAgICAgICAvLyBjb2xsYXBzZSBpcyByZWFjaGVkLlxuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KHJBcmMpO1xuICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIC8vIFtsQXJjLG51bGxdXG4gICAgLy8gZXZlbiBsZXNzIGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBpcyB0aGUgKmxhc3QqIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBvbiB0aGUgYmVhY2hsaW5lIC0tIHRoaXMgY2FuIGhhcHBlbiAqb25seSogaWYgKmFsbCogdGhlIHByZXZpb3VzIGJlYWNoXG4gICAgLy8gc2VjdGlvbnMgY3VycmVudGx5IG9uIHRoZSBiZWFjaGxpbmUgc2hhcmUgdGhlIHNhbWUgeSB2YWx1ZSBhc1xuICAgIC8vIHRoZSBuZXcgYmVhY2ggc2VjdGlvbi5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBvbmUgbmV3IHRyYW5zaXRpb24gYXBwZWFyc1xuICAgIC8vICAgbm8gY29sbGFwc2luZyBiZWFjaCBzZWN0aW9uIGFzIGEgcmVzdWx0XG4gICAgLy8gICBuZXcgYmVhY2ggc2VjdGlvbiBiZWNvbWUgcmlnaHQtbW9zdCBub2RlIG9mIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgbmV3QXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLG5ld0FyYy5zaXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbnVsbCxyQXJjXVxuICAgIC8vIGltcG9zc2libGUgY2FzZTogYmVjYXVzZSBzaXRlcyBhcmUgc3RyaWN0bHkgcHJvY2Vzc2VkIGZyb20gdG9wIHRvIGJvdHRvbSxcbiAgICAvLyBhbmQgbGVmdCB0byByaWdodCwgd2hpY2ggZ3VhcmFudGVlcyB0aGF0IHRoZXJlIHdpbGwgYWx3YXlzIGJlIGEgYmVhY2ggc2VjdGlvblxuICAgIC8vIG9uIHRoZSBsZWZ0IC0tIGV4Y2VwdCBvZiBjb3Vyc2Ugd2hlbiB0aGVyZSBhcmUgbm8gYmVhY2ggc2VjdGlvbiBhdCBhbGwgb25cbiAgICAvLyB0aGUgYmVhY2ggbGluZSwgd2hpY2ggY2FzZSB3YXMgaGFuZGxlZCBhYm92ZS5cbiAgICAvLyByaGlsbCAyMDExLTA2LTAyOiBObyBwb2ludCB0ZXN0aW5nIGluIG5vbi1kZWJ1ZyB2ZXJzaW9uXG4gICAgLy9pZiAoIWxBcmMgJiYgckFyYykge1xuICAgIC8vICAgIHRocm93IFwiVm9yb25vaS5hZGRCZWFjaHNlY3Rpb24oKTogV2hhdCBpcyB0aGlzIEkgZG9uJ3QgZXZlblwiO1xuICAgIC8vICAgIH1cblxuICAgIC8vIFtsQXJjLHJBcmNdIHdoZXJlIGxBcmMgIT0gckFyY1xuICAgIC8vIHNvbWV3aGF0IGxlc3MgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGZhbGxzICpleGFjdGx5KiBpbiBiZXR3ZWVuIHR3b1xuICAgIC8vIGV4aXN0aW5nIGJlYWNoIHNlY3Rpb25zXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIHRyYW5zaXRpb24gZGlzYXBwZWFyc1xuICAgIC8vICAgdHdvIG5ldyB0cmFuc2l0aW9ucyBhcHBlYXJcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIG9ubHkgb25lIG5ldyBub2RlIGFkZGVkIHRvIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgIT09IHJBcmMpIHtcbiAgICAgICAgLy8gaW52YWxpZGF0ZSBjaXJjbGUgZXZlbnRzIG9mIGxlZnQgYW5kIHJpZ2h0IHNpdGVzXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAgICAgLy8gYW4gZXhpc3RpbmcgdHJhbnNpdGlvbiBkaXNhcHBlYXJzLCBtZWFuaW5nIGEgdmVydGV4IGlzIGRlZmluZWQgYXRcbiAgICAgICAgLy8gdGhlIGRpc2FwcGVhcmFuY2UgcG9pbnQuXG4gICAgICAgIC8vIHNpbmNlIHRoZSBkaXNhcHBlYXJhbmNlIGlzIGNhdXNlZCBieSB0aGUgbmV3IGJlYWNoc2VjdGlvbiwgdGhlXG4gICAgICAgIC8vIHZlcnRleCBpcyBhdCB0aGUgY2VudGVyIG9mIHRoZSBjaXJjdW1zY3JpYmVkIGNpcmNsZSBvZiB0aGUgbGVmdCxcbiAgICAgICAgLy8gbmV3IGFuZCByaWdodCBiZWFjaHNlY3Rpb25zLlxuICAgICAgICAvLyBodHRwOi8vbWF0aGZvcnVtLm9yZy9saWJyYXJ5L2RybWF0aC92aWV3LzU1MDAyLmh0bWxcbiAgICAgICAgLy8gRXhjZXB0IHRoYXQgSSBicmluZyB0aGUgb3JpZ2luIGF0IEEgdG8gc2ltcGxpZnlcbiAgICAgICAgLy8gY2FsY3VsYXRpb25cbiAgICAgICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICAgICAgYXggPSBsU2l0ZS54LFxuICAgICAgICAgICAgYXkgPSBsU2l0ZS55LFxuICAgICAgICAgICAgYng9c2l0ZS54LWF4LFxuICAgICAgICAgICAgYnk9c2l0ZS55LWF5LFxuICAgICAgICAgICAgclNpdGUgPSByQXJjLnNpdGUsXG4gICAgICAgICAgICBjeD1yU2l0ZS54LWF4LFxuICAgICAgICAgICAgY3k9clNpdGUueS1heSxcbiAgICAgICAgICAgIGQ9MiooYngqY3ktYnkqY3gpLFxuICAgICAgICAgICAgaGI9YngqYngrYnkqYnksXG4gICAgICAgICAgICBoYz1jeCpjeCtjeSpjeSxcbiAgICAgICAgICAgIHZlcnRleCA9IHRoaXMuY3JlYXRlVmVydGV4KChjeSpoYi1ieSpoYykvZCtheCwgKGJ4KmhjLWN4KmhiKS9kK2F5KTtcblxuICAgICAgICAvLyBvbmUgdHJhbnNpdGlvbiBkaXNhcHBlYXJcbiAgICAgICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChyQXJjLmVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KTtcblxuICAgICAgICAvLyB0d28gbmV3IHRyYW5zaXRpb25zIGFwcGVhciBhdCB0aGUgbmV3IHZlcnRleCBsb2NhdGlvblxuICAgICAgICBuZXdBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShsU2l0ZSwgc2l0ZSwgdW5kZWZpbmVkLCB2ZXJ0ZXgpO1xuICAgICAgICByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2Uoc2l0ZSwgclNpdGUsIHVuZGVmaW5lZCwgdmVydGV4KTtcblxuICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9ucyBhcmUgY29sbGFwc2luZ1xuICAgICAgICAvLyBhbmQgaWYgc28gY3JlYXRlIGNpcmNsZSBldmVudHMsIHRvIGhhbmRsZSB0aGUgcG9pbnQgb2YgY29sbGFwc2UuXG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ2lyY2xlIGV2ZW50IG1ldGhvZHNcblxuLy8gcmhpbGwgMjAxMS0wNi0wNzogRm9yIHNvbWUgcmVhc29ucywgcGVyZm9ybWFuY2Ugc3VmZmVycyBzaWduaWZpY2FudGx5XG4vLyB3aGVuIGluc3RhbmNpYXRpbmcgYSBsaXRlcmFsIG9iamVjdCBpbnN0ZWFkIG9mIGFuIGVtcHR5IGN0b3JcblZvcm9ub2kucHJvdG90eXBlLkNpcmNsZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmhpbGwgMjAxMy0xMC0xMjogaXQgaGVscHMgdG8gc3RhdGUgZXhhY3RseSB3aGF0IHdlIGFyZSBhdCBjdG9yIHRpbWUuXG4gICAgdGhpcy5hcmMgPSBudWxsO1xuICAgIHRoaXMucmJMZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJiTmV4dCA9IG51bGw7XG4gICAgdGhpcy5yYlBhcmVudCA9IG51bGw7XG4gICAgdGhpcy5yYlByZXZpb3VzID0gbnVsbDtcbiAgICB0aGlzLnJiUmVkID0gZmFsc2U7XG4gICAgdGhpcy5yYlJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnNpdGUgPSBudWxsO1xuICAgIHRoaXMueCA9IHRoaXMueSA9IHRoaXMueWNlbnRlciA9IDA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuYXR0YWNoQ2lyY2xlRXZlbnQgPSBmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgbEFyYyA9IGFyYy5yYlByZXZpb3VzLFxuICAgICAgICByQXJjID0gYXJjLnJiTmV4dDtcbiAgICBpZiAoIWxBcmMgfHwgIXJBcmMpIHtyZXR1cm47fSAvLyBkb2VzIHRoYXQgZXZlciBoYXBwZW4/XG4gICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICBjU2l0ZSA9IGFyYy5zaXRlLFxuICAgICAgICByU2l0ZSA9IHJBcmMuc2l0ZTtcblxuICAgIC8vIElmIHNpdGUgb2YgbGVmdCBiZWFjaHNlY3Rpb24gaXMgc2FtZSBhcyBzaXRlIG9mXG4gICAgLy8gcmlnaHQgYmVhY2hzZWN0aW9uLCB0aGVyZSBjYW4ndCBiZSBjb252ZXJnZW5jZVxuICAgIGlmIChsU2l0ZT09PXJTaXRlKSB7cmV0dXJuO31cblxuICAgIC8vIEZpbmQgdGhlIGNpcmN1bXNjcmliZWQgY2lyY2xlIGZvciB0aGUgdGhyZWUgc2l0ZXMgYXNzb2NpYXRlZFxuICAgIC8vIHdpdGggdGhlIGJlYWNoc2VjdGlvbiB0cmlwbGV0LlxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjY6IEl0IGlzIG1vcmUgZWZmaWNpZW50IHRvIGNhbGN1bGF0ZSBpbi1wbGFjZVxuICAgIC8vIHJhdGhlciB0aGFuIGdldHRpbmcgdGhlIHJlc3VsdGluZyBjaXJjdW1zY3JpYmVkIGNpcmNsZSBmcm9tIGFuXG4gICAgLy8gb2JqZWN0IHJldHVybmVkIGJ5IGNhbGxpbmcgVm9yb25vaS5jaXJjdW1jaXJjbGUoKVxuICAgIC8vIGh0dHA6Ly9tYXRoZm9ydW0ub3JnL2xpYnJhcnkvZHJtYXRoL3ZpZXcvNTUwMDIuaHRtbFxuICAgIC8vIEV4Y2VwdCB0aGF0IEkgYnJpbmcgdGhlIG9yaWdpbiBhdCBjU2l0ZSB0byBzaW1wbGlmeSBjYWxjdWxhdGlvbnMuXG4gICAgLy8gVGhlIGJvdHRvbS1tb3N0IHBhcnQgb2YgdGhlIGNpcmN1bWNpcmNsZSBpcyBvdXIgRm9ydHVuZSAnY2lyY2xlXG4gICAgLy8gZXZlbnQnLCBhbmQgaXRzIGNlbnRlciBpcyBhIHZlcnRleCBwb3RlbnRpYWxseSBwYXJ0IG9mIHRoZSBmaW5hbFxuICAgIC8vIFZvcm9ub2kgZGlhZ3JhbS5cbiAgICB2YXIgYnggPSBjU2l0ZS54LFxuICAgICAgICBieSA9IGNTaXRlLnksXG4gICAgICAgIGF4ID0gbFNpdGUueC1ieCxcbiAgICAgICAgYXkgPSBsU2l0ZS55LWJ5LFxuICAgICAgICBjeCA9IHJTaXRlLngtYngsXG4gICAgICAgIGN5ID0gclNpdGUueS1ieTtcblxuICAgIC8vIElmIHBvaW50cyBsLT5jLT5yIGFyZSBjbG9ja3dpc2UsIHRoZW4gY2VudGVyIGJlYWNoIHNlY3Rpb24gZG9lcyBub3RcbiAgICAvLyBjb2xsYXBzZSwgaGVuY2UgaXQgY2FuJ3QgZW5kIHVwIGFzIGEgdmVydGV4ICh3ZSByZXVzZSAnZCcgaGVyZSwgd2hpY2hcbiAgICAvLyBzaWduIGlzIHJldmVyc2Ugb2YgdGhlIG9yaWVudGF0aW9uLCBoZW5jZSB3ZSByZXZlcnNlIHRoZSB0ZXN0LlxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ3VydmVfb3JpZW50YXRpb24jT3JpZW50YXRpb25fb2ZfYV9zaW1wbGVfcG9seWdvblxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjE6IE5hc3R5IGZpbml0ZSBwcmVjaXNpb24gZXJyb3Igd2hpY2ggY2F1c2VkIGNpcmN1bWNpcmNsZSgpIHRvXG4gICAgLy8gcmV0dXJuIGluZmluaXRlczogMWUtMTIgc2VlbXMgdG8gZml4IHRoZSBwcm9ibGVtLlxuICAgIHZhciBkID0gMiooYXgqY3ktYXkqY3gpO1xuICAgIGlmIChkID49IC0yZS0xMil7cmV0dXJuO31cblxuICAgIHZhciBoYSA9IGF4KmF4K2F5KmF5LFxuICAgICAgICBoYyA9IGN4KmN4K2N5KmN5LFxuICAgICAgICB4ID0gKGN5KmhhLWF5KmhjKS9kLFxuICAgICAgICB5ID0gKGF4KmhjLWN4KmhhKS9kLFxuICAgICAgICB5Y2VudGVyID0geStieTtcblxuICAgIC8vIEltcG9ydGFudDogeWJvdHRvbSBzaG91bGQgYWx3YXlzIGJlIHVuZGVyIG9yIGF0IHN3ZWVwLCBzbyBubyBuZWVkXG4gICAgLy8gdG8gd2FzdGUgQ1BVIGN5Y2xlcyBieSBjaGVja2luZ1xuXG4gICAgLy8gcmVjeWNsZSBjaXJjbGUgZXZlbnQgb2JqZWN0IGlmIHBvc3NpYmxlXG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gdGhpcy5jaXJjbGVFdmVudEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICghY2lyY2xlRXZlbnQpIHtcbiAgICAgICAgY2lyY2xlRXZlbnQgPSBuZXcgdGhpcy5DaXJjbGVFdmVudCgpO1xuICAgICAgICB9XG4gICAgY2lyY2xlRXZlbnQuYXJjID0gYXJjO1xuICAgIGNpcmNsZUV2ZW50LnNpdGUgPSBjU2l0ZTtcbiAgICBjaXJjbGVFdmVudC54ID0geCtieDtcbiAgICBjaXJjbGVFdmVudC55ID0geWNlbnRlcit0aGlzLnNxcnQoeCp4K3kqeSk7IC8vIHkgYm90dG9tXG4gICAgY2lyY2xlRXZlbnQueWNlbnRlciA9IHljZW50ZXI7XG4gICAgYXJjLmNpcmNsZUV2ZW50ID0gY2lyY2xlRXZlbnQ7XG5cbiAgICAvLyBmaW5kIGluc2VydGlvbiBwb2ludCBpbiBSQi10cmVlOiBjaXJjbGUgZXZlbnRzIGFyZSBvcmRlcmVkIGZyb21cbiAgICAvLyBzbWFsbGVzdCB0byBsYXJnZXN0XG4gICAgdmFyIHByZWRlY2Vzc29yID0gbnVsbCxcbiAgICAgICAgbm9kZSA9IHRoaXMuY2lyY2xlRXZlbnRzLnJvb3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKGNpcmNsZUV2ZW50LnkgPCBub2RlLnkgfHwgKGNpcmNsZUV2ZW50LnkgPT09IG5vZGUueSAmJiBjaXJjbGVFdmVudC54IDw9IG5vZGUueCkpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVkZWNlc3NvciA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vZGUucmJSaWdodCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJlZGVjZXNzb3IgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHRoaXMuY2lyY2xlRXZlbnRzLnJiSW5zZXJ0U3VjY2Vzc29yKHByZWRlY2Vzc29yLCBjaXJjbGVFdmVudCk7XG4gICAgaWYgKCFwcmVkZWNlc3Nvcikge1xuICAgICAgICB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQgPSBjaXJjbGVFdmVudDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLmRldGFjaENpcmNsZUV2ZW50ID0gZnVuY3Rpb24oYXJjKSB7XG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gYXJjLmNpcmNsZUV2ZW50O1xuICAgIGlmIChjaXJjbGVFdmVudCkge1xuICAgICAgICBpZiAoIWNpcmNsZUV2ZW50LnJiUHJldmlvdXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RDaXJjbGVFdmVudCA9IGNpcmNsZUV2ZW50LnJiTmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgdGhpcy5jaXJjbGVFdmVudHMucmJSZW1vdmVOb2RlKGNpcmNsZUV2ZW50KTsgLy8gcmVtb3ZlIGZyb20gUkItdHJlZVxuICAgICAgICB0aGlzLmNpcmNsZUV2ZW50SnVua3lhcmQucHVzaChjaXJjbGVFdmVudCk7XG4gICAgICAgIGFyYy5jaXJjbGVFdmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gY29tcGxldGlvbiBtZXRob2RzXG5cbi8vIGNvbm5lY3QgZGFuZ2xpbmcgZWRnZXMgKG5vdCBpZiBhIGN1cnNvcnkgdGVzdCB0ZWxscyB1c1xuLy8gaXQgaXMgbm90IGdvaW5nIHRvIGJlIHZpc2libGUuXG4vLyByZXR1cm4gdmFsdWU6XG4vLyAgIGZhbHNlOiB0aGUgZGFuZ2xpbmcgZW5kcG9pbnQgY291bGRuJ3QgYmUgY29ubmVjdGVkXG4vLyAgIHRydWU6IHRoZSBkYW5nbGluZyBlbmRwb2ludCBjb3VsZCBiZSBjb25uZWN0ZWRcblZvcm9ub2kucHJvdG90eXBlLmNvbm5lY3RFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIC8vIHNraXAgaWYgZW5kIHBvaW50IGFscmVhZHkgY29ubmVjdGVkXG4gICAgdmFyIHZiID0gZWRnZS52YjtcbiAgICBpZiAoISF2Yikge3JldHVybiB0cnVlO31cblxuICAgIC8vIG1ha2UgbG9jYWwgY29weSBmb3IgcGVyZm9ybWFuY2UgcHVycG9zZVxuICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgIHhsID0gYmJveC54bCxcbiAgICAgICAgeHIgPSBiYm94LnhyLFxuICAgICAgICB5dCA9IGJib3gueXQsXG4gICAgICAgIHliID0gYmJveC55YixcbiAgICAgICAgbFNpdGUgPSBlZGdlLmxTaXRlLFxuICAgICAgICByU2l0ZSA9IGVkZ2UuclNpdGUsXG4gICAgICAgIGx4ID0gbFNpdGUueCxcbiAgICAgICAgbHkgPSBsU2l0ZS55LFxuICAgICAgICByeCA9IHJTaXRlLngsXG4gICAgICAgIHJ5ID0gclNpdGUueSxcbiAgICAgICAgZnggPSAobHgrcngpLzIsXG4gICAgICAgIGZ5ID0gKGx5K3J5KS8yLFxuICAgICAgICBmbSwgZmI7XG5cbiAgICAvLyBpZiB3ZSByZWFjaCBoZXJlLCB0aGlzIG1lYW5zIGNlbGxzIHdoaWNoIHVzZSB0aGlzIGVkZ2Ugd2lsbCBuZWVkXG4gICAgLy8gdG8gYmUgY2xvc2VkLCB3aGV0aGVyIGJlY2F1c2UgdGhlIGVkZ2Ugd2FzIHJlbW92ZWQsIG9yIGJlY2F1c2UgaXRcbiAgICAvLyB3YXMgY29ubmVjdGVkIHRvIHRoZSBib3VuZGluZyBib3guXG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuICAgIHRoaXMuY2VsbHNbclNpdGUudm9yb25vaUlkXS5jbG9zZU1lID0gdHJ1ZTtcblxuICAgIC8vIGdldCB0aGUgbGluZSBlcXVhdGlvbiBvZiB0aGUgYmlzZWN0b3IgaWYgbGluZSBpcyBub3QgdmVydGljYWxcbiAgICBpZiAocnkgIT09IGx5KSB7XG4gICAgICAgIGZtID0gKGx4LXJ4KS8ocnktbHkpO1xuICAgICAgICBmYiA9IGZ5LWZtKmZ4O1xuICAgICAgICB9XG5cbiAgICAvLyByZW1lbWJlciwgZGlyZWN0aW9uIG9mIGxpbmUgKHJlbGF0aXZlIHRvIGxlZnQgc2l0ZSk6XG4gICAgLy8gdXB3YXJkOiBsZWZ0LnggPCByaWdodC54XG4gICAgLy8gZG93bndhcmQ6IGxlZnQueCA+IHJpZ2h0LnhcbiAgICAvLyBob3Jpem9udGFsOiBsZWZ0LnggPT0gcmlnaHQueFxuICAgIC8vIHVwd2FyZDogbGVmdC54IDwgcmlnaHQueFxuICAgIC8vIHJpZ2h0d2FyZDogbGVmdC55IDwgcmlnaHQueVxuICAgIC8vIGxlZnR3YXJkOiBsZWZ0LnkgPiByaWdodC55XG4gICAgLy8gdmVydGljYWw6IGxlZnQueSA9PSByaWdodC55XG5cbiAgICAvLyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiwgZmluZCB0aGUgYmVzdCBzaWRlIG9mIHRoZVxuICAgIC8vIGJvdW5kaW5nIGJveCB0byB1c2UgdG8gZGV0ZXJtaW5lIGEgcmVhc29uYWJsZSBzdGFydCBwb2ludFxuXG4gICAgLy8gcmhpbGwgMjAxMy0xMi0wMjpcbiAgICAvLyBXaGlsZSBhdCBpdCwgc2luY2Ugd2UgaGF2ZSB0aGUgdmFsdWVzIHdoaWNoIGRlZmluZSB0aGUgbGluZSxcbiAgICAvLyBjbGlwIHRoZSBlbmQgb2YgdmEgaWYgaXQgaXMgb3V0c2lkZSB0aGUgYmJveC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE1XG4gICAgLy8gVE9ETzogRG8gYWxsIHRoZSBjbGlwcGluZyBoZXJlIHJhdGhlciB0aGFuIHJlbHkgb24gTGlhbmctQmFyc2t5XG4gICAgLy8gd2hpY2ggZG9lcyBub3QgZG8gd2VsbCBzb21ldGltZXMgZHVlIHRvIGxvc3Mgb2YgYXJpdGhtZXRpY1xuICAgIC8vIHByZWNpc2lvbi4gVGhlIGNvZGUgaGVyZSBkb2Vzbid0IGRlZ3JhZGUgaWYgb25lIG9mIHRoZSB2ZXJ0ZXggaXNcbiAgICAvLyBhdCBhIGh1Z2UgZGlzdGFuY2UuXG5cbiAgICAvLyBzcGVjaWFsIGNhc2U6IHZlcnRpY2FsIGxpbmVcbiAgICBpZiAoZm0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBkb2Vzbid0IGludGVyc2VjdCB3aXRoIHZpZXdwb3J0XG4gICAgICAgIGlmIChmeCA8IHhsIHx8IGZ4ID49IHhyKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgLy8gZG93bndhcmRcbiAgICAgICAgaWYgKGx4ID4gcngpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeWIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyB1cHdhcmRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPiB5Yikge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoZngsIHliKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YS55IDwgeXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIHZlcnRpY2FsIHRoYW4gaG9yaXpvbnRhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyB0b3Agb3IgYm90dG9tIHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2UgaWYgKGZtIDwgLTEgfHwgZm0gPiAxKSB7XG4gICAgICAgIC8vIGRvd253YXJkXG4gICAgICAgIGlmIChseCA+IHJ4KSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPCB5dCkge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIHVwd2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA+IHliKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIGhvcml6b250YWwgdGhhbiB2ZXJ0aWNhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyBsZWZ0IG9yIHJpZ2h0IHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2Uge1xuICAgICAgICAvLyByaWdodHdhcmRcbiAgICAgICAgaWYgKGx5IDwgcnkpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA8IHhsKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgZm0qeGwrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPj0geHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyBsZWZ0d2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA+IHhyKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPCB4bCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBmbSp4bCtmYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlZGdlLnZhID0gdmE7XG4gICAgZWRnZS52YiA9IHZiO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gbGluZS1jbGlwcGluZyBjb2RlIHRha2VuIGZyb206XG4vLyAgIExpYW5nLUJhcnNreSBmdW5jdGlvbiBieSBEYW5pZWwgV2hpdGVcbi8vICAgaHR0cDovL3d3dy5za3l0b3BpYS5jb20vcHJvamVjdC9hcnRpY2xlcy9jb21wc2NpL2NsaXBwaW5nLmh0bWxcbi8vIFRoYW5rcyFcbi8vIEEgYml0IG1vZGlmaWVkIHRvIG1pbmltaXplIGNvZGUgcGF0aHNcblZvcm9ub2kucHJvdG90eXBlLmNsaXBFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIHZhciBheCA9IGVkZ2UudmEueCxcbiAgICAgICAgYXkgPSBlZGdlLnZhLnksXG4gICAgICAgIGJ4ID0gZWRnZS52Yi54LFxuICAgICAgICBieSA9IGVkZ2UudmIueSxcbiAgICAgICAgdDAgPSAwLFxuICAgICAgICB0MSA9IDEsXG4gICAgICAgIGR4ID0gYngtYXgsXG4gICAgICAgIGR5ID0gYnktYXk7XG4gICAgLy8gbGVmdFxuICAgIHZhciBxID0gYXgtYmJveC54bDtcbiAgICBpZiAoZHg9PT0wICYmIHE8MCkge3JldHVybiBmYWxzZTt9XG4gICAgdmFyIHIgPSAtcS9keDtcbiAgICBpZiAoZHg8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeD4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIHJpZ2h0XG4gICAgcSA9IGJib3gueHItYXg7XG4gICAgaWYgKGR4PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSBxL2R4O1xuICAgIGlmIChkeDwwKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR4PjApIHtcbiAgICAgICAgaWYgKHI8dDApIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocjx0MSkge3QxPXI7fVxuICAgICAgICB9XG4gICAgLy8gdG9wXG4gICAgcSA9IGF5LWJib3gueXQ7XG4gICAgaWYgKGR5PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSAtcS9keTtcbiAgICBpZiAoZHk8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeT4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIGJvdHRvbVxuICAgIHEgPSBiYm94LnliLWF5O1xuICAgIGlmIChkeT09PTAgJiYgcTwwKSB7cmV0dXJuIGZhbHNlO31cbiAgICByID0gcS9keTtcbiAgICBpZiAoZHk8MCkge1xuICAgICAgICBpZiAocj50MSkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPnQwKSB7dDA9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeT4wKSB7XG4gICAgICAgIGlmIChyPHQwKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI8dDEpIHt0MT1yO31cbiAgICAgICAgfVxuXG4gICAgLy8gaWYgd2UgcmVhY2ggdGhpcyBwb2ludCwgVm9yb25vaSBlZGdlIGlzIHdpdGhpbiBiYm94XG5cbiAgICAvLyBpZiB0MCA+IDAsIHZhIG5lZWRzIHRvIGNoYW5nZVxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDM6IHdlIG5lZWQgdG8gY3JlYXRlIGEgbmV3IHZlcnRleCByYXRoZXJcbiAgICAvLyB0aGFuIG1vZGlmeWluZyB0aGUgZXhpc3Rpbmcgb25lLCBzaW5jZSB0aGUgZXhpc3RpbmdcbiAgICAvLyBvbmUgaXMgbGlrZWx5IHNoYXJlZCB3aXRoIGF0IGxlYXN0IGFub3RoZXIgZWRnZVxuICAgIGlmICh0MCA+IDApIHtcbiAgICAgICAgZWRnZS52YSA9IHRoaXMuY3JlYXRlVmVydGV4KGF4K3QwKmR4LCBheSt0MCpkeSk7XG4gICAgICAgIH1cblxuICAgIC8vIGlmIHQxIDwgMSwgdmIgbmVlZHMgdG8gY2hhbmdlXG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wMzogd2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgdmVydGV4IHJhdGhlclxuICAgIC8vIHRoYW4gbW9kaWZ5aW5nIHRoZSBleGlzdGluZyBvbmUsIHNpbmNlIHRoZSBleGlzdGluZ1xuICAgIC8vIG9uZSBpcyBsaWtlbHkgc2hhcmVkIHdpdGggYXQgbGVhc3QgYW5vdGhlciBlZGdlXG4gICAgaWYgKHQxIDwgMSkge1xuICAgICAgICBlZGdlLnZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoYXgrdDEqZHgsIGF5K3QxKmR5KTtcbiAgICAgICAgfVxuXG4gICAgLy8gdmEgYW5kL29yIHZiIHdlcmUgY2xpcHBlZCwgdGh1cyB3ZSB3aWxsIG5lZWQgdG8gY2xvc2VcbiAgICAvLyBjZWxscyB3aGljaCB1c2UgdGhpcyBlZGdlLlxuICAgIGlmICggdDAgPiAwIHx8IHQxIDwgMSApIHtcbiAgICAgICAgdGhpcy5jZWxsc1tlZGdlLmxTaXRlLnZvcm9ub2lJZF0uY2xvc2VNZSA9IHRydWU7XG4gICAgICAgIHRoaXMuY2VsbHNbZWRnZS5yU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbi8vIENvbm5lY3QvY3V0IGVkZ2VzIGF0IGJvdW5kaW5nIGJveFxuVm9yb25vaS5wcm90b3R5cGUuY2xpcEVkZ2VzID0gZnVuY3Rpb24oYmJveCkge1xuICAgIC8vIGNvbm5lY3QgYWxsIGRhbmdsaW5nIGVkZ2VzIHRvIGJvdW5kaW5nIGJveFxuICAgIC8vIG9yIGdldCByaWQgb2YgdGhlbSBpZiBpdCBjYW4ndCBiZSBkb25lXG4gICAgdmFyIGVkZ2VzID0gdGhpcy5lZGdlcyxcbiAgICAgICAgaUVkZ2UgPSBlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2UsXG4gICAgICAgIGFic19mbiA9IE1hdGguYWJzO1xuXG4gICAgLy8gaXRlcmF0ZSBiYWNrd2FyZCBzbyB3ZSBjYW4gc3BsaWNlIHNhZmVseVxuICAgIHdoaWxlIChpRWRnZS0tKSB7XG4gICAgICAgIGVkZ2UgPSBlZGdlc1tpRWRnZV07XG4gICAgICAgIC8vIGVkZ2UgaXMgcmVtb3ZlZCBpZjpcbiAgICAgICAgLy8gICBpdCBpcyB3aG9sbHkgb3V0c2lkZSB0aGUgYm91bmRpbmcgYm94XG4gICAgICAgIC8vICAgaXQgaXMgbG9va2luZyBtb3JlIGxpa2UgYSBwb2ludCB0aGFuIGEgbGluZVxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdEVkZ2UoZWRnZSwgYmJveCkgfHxcbiAgICAgICAgICAgICF0aGlzLmNsaXBFZGdlKGVkZ2UsIGJib3gpIHx8XG4gICAgICAgICAgICAoYWJzX2ZuKGVkZ2UudmEueC1lZGdlLnZiLngpPDFlLTkgJiYgYWJzX2ZuKGVkZ2UudmEueS1lZGdlLnZiLnkpPDFlLTkpKSB7XG4gICAgICAgICAgICBlZGdlLnZhID0gZWRnZS52YiA9IG51bGw7XG4gICAgICAgICAgICBlZGdlcy5zcGxpY2UoaUVkZ2UsMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyBDbG9zZSB0aGUgY2VsbHMuXG4vLyBUaGUgY2VsbHMgYXJlIGJvdW5kIGJ5IHRoZSBzdXBwbGllZCBib3VuZGluZyBib3guXG4vLyBFYWNoIGNlbGwgcmVmZXJzIHRvIGl0cyBhc3NvY2lhdGVkIHNpdGUsIGFuZCBhIGxpc3Rcbi8vIG9mIGhhbGZlZGdlcyBvcmRlcmVkIGNvdW50ZXJjbG9ja3dpc2UuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jbG9zZUNlbGxzID0gZnVuY3Rpb24oYmJveCkge1xuICAgIHZhciB4bCA9IGJib3gueGwsXG4gICAgICAgIHhyID0gYmJveC54cixcbiAgICAgICAgeXQgPSBiYm94Lnl0LFxuICAgICAgICB5YiA9IGJib3gueWIsXG4gICAgICAgIGNlbGxzID0gdGhpcy5jZWxscyxcbiAgICAgICAgaUNlbGwgPSBjZWxscy5sZW5ndGgsXG4gICAgICAgIGNlbGwsXG4gICAgICAgIGlMZWZ0LFxuICAgICAgICBoYWxmZWRnZXMsIG5IYWxmZWRnZXMsXG4gICAgICAgIGVkZ2UsXG4gICAgICAgIHZhLCB2YiwgdnosXG4gICAgICAgIGxhc3RCb3JkZXJTZWdtZW50LFxuICAgICAgICBhYnNfZm4gPSBNYXRoLmFicztcblxuICAgIHdoaWxlIChpQ2VsbC0tKSB7XG4gICAgICAgIGNlbGwgPSBjZWxsc1tpQ2VsbF07XG4gICAgICAgIC8vIHBydW5lLCBvcmRlciBoYWxmZWRnZXMgY291bnRlcmNsb2Nrd2lzZSwgdGhlbiBhZGQgbWlzc2luZyBvbmVzXG4gICAgICAgIC8vIHJlcXVpcmVkIHRvIGNsb3NlIGNlbGxzXG4gICAgICAgIGlmICghY2VsbC5wcmVwYXJlSGFsZmVkZ2VzKCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAoIWNlbGwuY2xvc2VNZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIGZpbmQgZmlyc3QgJ3VuY2xvc2VkJyBwb2ludC5cbiAgICAgICAgLy8gYW4gJ3VuY2xvc2VkJyBwb2ludCB3aWxsIGJlIHRoZSBlbmQgcG9pbnQgb2YgYSBoYWxmZWRnZSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBtYXRjaCB0aGUgc3RhcnQgcG9pbnQgb2YgdGhlIGZvbGxvd2luZyBoYWxmZWRnZVxuICAgICAgICBoYWxmZWRnZXMgPSBjZWxsLmhhbGZlZGdlcztcbiAgICAgICAgbkhhbGZlZGdlcyA9IGhhbGZlZGdlcy5sZW5ndGg7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZTogb25seSBvbmUgc2l0ZSwgaW4gd2hpY2ggY2FzZSwgdGhlIHZpZXdwb3J0IGlzIHRoZSBjZWxsXG4gICAgICAgIC8vIC4uLlxuXG4gICAgICAgIC8vIGFsbCBvdGhlciBjYXNlc1xuICAgICAgICBpTGVmdCA9IDA7XG4gICAgICAgIHdoaWxlIChpTGVmdCA8IG5IYWxmZWRnZXMpIHtcbiAgICAgICAgICAgIHZhID0gaGFsZmVkZ2VzW2lMZWZ0XS5nZXRFbmRwb2ludCgpO1xuICAgICAgICAgICAgdnogPSBoYWxmZWRnZXNbKGlMZWZ0KzEpICUgbkhhbGZlZGdlc10uZ2V0U3RhcnRwb2ludCgpO1xuICAgICAgICAgICAgLy8gaWYgZW5kIHBvaW50IGlzIG5vdCBlcXVhbCB0byBzdGFydCBwb2ludCwgd2UgbmVlZCB0byBhZGQgdGhlIG1pc3NpbmdcbiAgICAgICAgICAgIC8vIGhhbGZlZGdlKHMpIHVwIHRvIHZ6XG4gICAgICAgICAgICBpZiAoYWJzX2ZuKHZhLngtdnoueCk+PTFlLTkgfHwgYWJzX2ZuKHZhLnktdnoueSk+PTFlLTkpIHtcblxuICAgICAgICAgICAgICAgIC8vIHJoaWxsIDIwMTMtMTItMDI6XG4gICAgICAgICAgICAgICAgLy8gXCJIb2xlc1wiIGluIHRoZSBoYWxmZWRnZXMgYXJlIG5vdCBuZWNlc3NhcmlseSBhbHdheXMgYWRqYWNlbnQuXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL2lzc3Vlcy8xNlxuXG4gICAgICAgICAgICAgICAgLy8gZmluZCBlbnRyeSBwb2ludDpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRydWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIGRvd253YXJkIGFsb25nIGxlZnQgc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS54LHhsKSAmJiB0aGlzLmxlc3NUaGFuV2l0aEVwc2lsb24odmEueSx5Yik6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeGwsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgcmlnaHR3YXJkIGFsb25nIGJvdHRvbSBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLnkseWIpICYmIHRoaXMubGVzc1RoYW5XaXRoRXBzaWxvbih2YS54LHhyKTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LnkseWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnggOiB4ciwgeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayB1cHdhcmQgYWxvbmcgcmlnaHQgc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS54LHhyKSAmJiB0aGlzLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24odmEueSx5dCk6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeHIsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgbGVmdHdhcmQgYWxvbmcgdG9wIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odmEueSx5dCkgJiYgdGhpcy5ncmVhdGVyVGhhbldpdGhFcHNpbG9uKHZhLngseGwpOlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueSx5dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueCA6IHhsLCB5dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FsayBkb3dud2FyZCBhbG9uZyBsZWZ0IHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgcmlnaHR3YXJkIGFsb25nIGJvdHRvbSBzaWRlXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei55LHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgobGFzdEJvcmRlclNlZ21lbnQgPyB2ei54IDogeHIsIHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIHVwd2FyZCBhbG9uZyByaWdodCBzaWRlXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeHIsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFwiVm9yb25vaS5jbG9zZUNlbGxzKCkgPiB0aGlzIG1ha2VzIG5vIHNlbnNlIVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgY2VsbC5jbG9zZU1lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERlYnVnZ2luZyBoZWxwZXJcbi8qXG5Wb3Jvbm9pLnByb3RvdHlwZS5kdW1wQmVhY2hsaW5lID0gZnVuY3Rpb24oeSkge1xuICAgIGNvbnNvbGUubG9nKCdWb3Jvbm9pLmR1bXBCZWFjaGxpbmUoJWYpID4gQmVhY2hzZWN0aW9ucywgZnJvbSBsZWZ0IHRvIHJpZ2h0OicsIHkpO1xuICAgIGlmICggIXRoaXMuYmVhY2hsaW5lICkge1xuICAgICAgICBjb25zb2xlLmxvZygnICBOb25lJyk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGJzID0gdGhpcy5iZWFjaGxpbmUuZ2V0Rmlyc3QodGhpcy5iZWFjaGxpbmUucm9vdCk7XG4gICAgICAgIHdoaWxlICggYnMgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnICBzaXRlICVkOiB4bDogJWYsIHhyOiAlZicsIGJzLnNpdGUudm9yb25vaUlkLCB0aGlzLmxlZnRCcmVha1BvaW50KGJzLCB5KSwgdGhpcy5yaWdodEJyZWFrUG9pbnQoYnMsIHkpKTtcbiAgICAgICAgICAgIGJzID0gYnMucmJOZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiovXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSGVscGVyOiBRdWFudGl6ZSBzaXRlc1xuXG4vLyByaGlsbCAyMDEzLTEwLTEyOlxuLy8gVGhpcyBpcyB0byBzb2x2ZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE1XG4vLyBTaW5jZSBub3QgYWxsIHVzZXJzIHdpbGwgZW5kIHVwIHVzaW5nIHRoZSBraW5kIG9mIGNvb3JkIHZhbHVlcyB3aGljaCB3b3VsZFxuLy8gY2F1c2UgdGhlIGlzc3VlIHRvIGFyaXNlLCBJIGNob3NlIHRvIGxldCB0aGUgdXNlciBkZWNpZGUgd2hldGhlciBvciBub3Rcbi8vIGhlIHNob3VsZCBzYW5pdGl6ZSBoaXMgY29vcmQgdmFsdWVzIHRocm91Z2ggdGhpcyBoZWxwZXIuIFRoaXMgd2F5LCBmb3Jcbi8vIHRob3NlIHVzZXJzIHdobyB1c2VzIGNvb3JkIHZhbHVlcyB3aGljaCBhcmUga25vd24gdG8gYmUgZmluZSwgbm8gb3ZlcmhlYWQgaXNcbi8vIGFkZGVkLlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5xdWFudGl6ZVNpdGVzID0gZnVuY3Rpb24oc2l0ZXMpIHtcbiAgICB2YXIgzrUgPSB0aGlzLs61LFxuICAgICAgICBuID0gc2l0ZXMubGVuZ3RoLFxuICAgICAgICBzaXRlO1xuICAgIHdoaWxlICggbi0tICkge1xuICAgICAgICBzaXRlID0gc2l0ZXNbbl07XG4gICAgICAgIHNpdGUueCA9IE1hdGguZmxvb3Ioc2l0ZS54IC8gzrUpICogzrU7XG4gICAgICAgIHNpdGUueSA9IE1hdGguZmxvb3Ioc2l0ZS55IC8gzrUpICogzrU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEhlbHBlcjogUmVjeWNsZSBkaWFncmFtOiBhbGwgdmVydGV4LCBlZGdlIGFuZCBjZWxsIG9iamVjdHMgYXJlXG4vLyBcInN1cnJlbmRlcmVkXCIgdG8gdGhlIFZvcm9ub2kgb2JqZWN0IGZvciByZXVzZS5cbi8vIFRPRE86IHJoaWxsLXZvcm9ub2ktY29yZSB2MjogbW9yZSBwZXJmb3JtYW5jZSB0byBiZSBnYWluZWRcbi8vIHdoZW4gSSBjaGFuZ2UgdGhlIHNlbWFudGljIG9mIHdoYXQgaXMgcmV0dXJuZWQuXG5cblZvcm9ub2kucHJvdG90eXBlLnJlY3ljbGUgPSBmdW5jdGlvbihkaWFncmFtKSB7XG4gICAgaWYgKCBkaWFncmFtICkge1xuICAgICAgICBpZiAoIGRpYWdyYW0gaW5zdGFuY2VvZiB0aGlzLkRpYWdyYW0gKSB7XG4gICAgICAgICAgICB0aGlzLnRvUmVjeWNsZSA9IGRpYWdyYW07XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgJ1Zvcm9ub2kucmVjeWNsZURpYWdyYW0oKSA+IE5lZWQgYSBEaWFncmFtIG9iamVjdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUb3AtbGV2ZWwgRm9ydHVuZSBsb29wXG5cbi8vIHJoaWxsIDIwMTEtMDUtMTk6XG4vLyAgIFZvcm9ub2kgc2l0ZXMgYXJlIGtlcHQgY2xpZW50LXNpZGUgbm93LCB0byBhbGxvd1xuLy8gICB1c2VyIHRvIGZyZWVseSBtb2RpZnkgY29udGVudC4gQXQgY29tcHV0ZSB0aW1lLFxuLy8gICAqcmVmZXJlbmNlcyogdG8gc2l0ZXMgYXJlIGNvcGllZCBsb2NhbGx5LlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24oc2l0ZXMsIGJib3gpIHtcbiAgICAvLyB0byBtZWFzdXJlIGV4ZWN1dGlvbiB0aW1lXG4gICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBpbml0IGludGVybmFsIHN0YXRlXG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgLy8gYW55IGRpYWdyYW0gZGF0YSBhdmFpbGFibGUgZm9yIHJlY3ljbGluZz9cbiAgICAvLyBJIGRvIHRoYXQgaGVyZSBzbyB0aGF0IHRoaXMgaXMgaW5jbHVkZWQgaW4gZXhlY3V0aW9uIHRpbWVcbiAgICBpZiAoIHRoaXMudG9SZWN5Y2xlICkge1xuICAgICAgICB0aGlzLnZlcnRleEp1bmt5YXJkID0gdGhpcy52ZXJ0ZXhKdW5reWFyZC5jb25jYXQodGhpcy50b1JlY3ljbGUudmVydGljZXMpO1xuICAgICAgICB0aGlzLmVkZ2VKdW5reWFyZCA9IHRoaXMuZWRnZUp1bmt5YXJkLmNvbmNhdCh0aGlzLnRvUmVjeWNsZS5lZGdlcyk7XG4gICAgICAgIHRoaXMuY2VsbEp1bmt5YXJkID0gdGhpcy5jZWxsSnVua3lhcmQuY29uY2F0KHRoaXMudG9SZWN5Y2xlLmNlbGxzKTtcbiAgICAgICAgdGhpcy50b1JlY3ljbGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHNpdGUgZXZlbnQgcXVldWVcbiAgICB2YXIgc2l0ZUV2ZW50cyA9IHNpdGVzLnNsaWNlKDApO1xuICAgIHNpdGVFdmVudHMuc29ydChmdW5jdGlvbihhLGIpe1xuICAgICAgICB2YXIgciA9IGIueSAtIGEueTtcbiAgICAgICAgaWYgKHIpIHtyZXR1cm4gcjt9XG4gICAgICAgIHJldHVybiBiLnggLSBhLng7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gcHJvY2VzcyBxdWV1ZVxuICAgIHZhciBzaXRlID0gc2l0ZUV2ZW50cy5wb3AoKSxcbiAgICAgICAgc2l0ZWlkID0gMCxcbiAgICAgICAgeHNpdGV4LCAvLyB0byBhdm9pZCBkdXBsaWNhdGUgc2l0ZXNcbiAgICAgICAgeHNpdGV5LFxuICAgICAgICBjZWxscyA9IHRoaXMuY2VsbHMsXG4gICAgICAgIGNpcmNsZTtcblxuICAgIC8vIG1haW4gbG9vcFxuICAgIGZvciAoOzspIHtcbiAgICAgICAgLy8gd2UgbmVlZCB0byBmaWd1cmUgd2hldGhlciB3ZSBoYW5kbGUgYSBzaXRlIG9yIGNpcmNsZSBldmVudFxuICAgICAgICAvLyBmb3IgdGhpcyB3ZSBmaW5kIG91dCBpZiB0aGVyZSBpcyBhIHNpdGUgZXZlbnQgYW5kIGl0IGlzXG4gICAgICAgIC8vICdlYXJsaWVyJyB0aGFuIHRoZSBjaXJjbGUgZXZlbnRcbiAgICAgICAgY2lyY2xlID0gdGhpcy5maXJzdENpcmNsZUV2ZW50O1xuXG4gICAgICAgIC8vIGFkZCBiZWFjaCBzZWN0aW9uXG4gICAgICAgIGlmIChzaXRlICYmICghY2lyY2xlIHx8IHNpdGUueSA8IGNpcmNsZS55IHx8IChzaXRlLnkgPT09IGNpcmNsZS55ICYmIHNpdGUueCA8IGNpcmNsZS54KSkpIHtcbiAgICAgICAgICAgIC8vIG9ubHkgaWYgc2l0ZSBpcyBub3QgYSBkdXBsaWNhdGVcbiAgICAgICAgICAgIGlmIChzaXRlLnggIT09IHhzaXRleCB8fCBzaXRlLnkgIT09IHhzaXRleSkge1xuICAgICAgICAgICAgICAgIC8vIGZpcnN0IGNyZWF0ZSBjZWxsIGZvciBuZXcgc2l0ZVxuICAgICAgICAgICAgICAgIGNlbGxzW3NpdGVpZF0gPSB0aGlzLmNyZWF0ZUNlbGwoc2l0ZSk7XG4gICAgICAgICAgICAgICAgc2l0ZS52b3Jvbm9pSWQgPSBzaXRlaWQrKztcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGNyZWF0ZSBhIGJlYWNoc2VjdGlvbiBmb3IgdGhhdCBzaXRlXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWFjaHNlY3Rpb24oc2l0ZSk7XG4gICAgICAgICAgICAgICAgLy8gcmVtZW1iZXIgbGFzdCBzaXRlIGNvb3JkcyB0byBkZXRlY3QgZHVwbGljYXRlXG4gICAgICAgICAgICAgICAgeHNpdGV5ID0gc2l0ZS55O1xuICAgICAgICAgICAgICAgIHhzaXRleCA9IHNpdGUueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXRlID0gc2l0ZUV2ZW50cy5wb3AoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgYmVhY2ggc2VjdGlvblxuICAgICAgICBlbHNlIGlmIChjaXJjbGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQmVhY2hzZWN0aW9uKGNpcmNsZS5hcmMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIC8vIGFsbCBkb25lLCBxdWl0XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIC8vIHdyYXBwaW5nLXVwOlxuICAgIC8vICAgY29ubmVjdCBkYW5nbGluZyBlZGdlcyB0byBib3VuZGluZyBib3hcbiAgICAvLyAgIGN1dCBlZGdlcyBhcyBwZXIgYm91bmRpbmcgYm94XG4gICAgLy8gICBkaXNjYXJkIGVkZ2VzIGNvbXBsZXRlbHkgb3V0c2lkZSBib3VuZGluZyBib3hcbiAgICAvLyAgIGRpc2NhcmQgZWRnZXMgd2hpY2ggYXJlIHBvaW50LWxpa2VcbiAgICB0aGlzLmNsaXBFZGdlcyhiYm94KTtcblxuICAgIC8vICAgYWRkIG1pc3NpbmcgZWRnZXMgaW4gb3JkZXIgdG8gY2xvc2Ugb3BlbmVkIGNlbGxzXG4gICAgdGhpcy5jbG9zZUNlbGxzKGJib3gpO1xuXG4gICAgLy8gdG8gbWVhc3VyZSBleGVjdXRpb24gdGltZVxuICAgIHZhciBzdG9wVGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBwcmVwYXJlIHJldHVybiB2YWx1ZXNcbiAgICB2YXIgZGlhZ3JhbSA9IG5ldyB0aGlzLkRpYWdyYW0oKTtcbiAgICBkaWFncmFtLmNlbGxzID0gdGhpcy5jZWxscztcbiAgICBkaWFncmFtLmVkZ2VzID0gdGhpcy5lZGdlcztcbiAgICBkaWFncmFtLnZlcnRpY2VzID0gdGhpcy52ZXJ0aWNlcztcbiAgICBkaWFncmFtLmV4ZWNUaW1lID0gc3RvcFRpbWUuZ2V0VGltZSgpLXN0YXJ0VGltZS5nZXRUaW1lKCk7XG5cbiAgICAvLyBjbGVhbiB1cFxuICAgIHRoaXMucmVzZXQoKTtcblxuICAgIHJldHVybiBkaWFncmFtO1xuICAgIH07XG5cbm1vZHVsZS5leHBvcnRzID0gVm9yb25vaTtcbiJdfQ==

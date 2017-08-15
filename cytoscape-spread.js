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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvd2VhdmVyanMvZGlzdC93ZWF2ZXIuanMiLCJzcmMvZm9vZ3JhcGguanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbGF5b3V0LmpzIiwic3JjL3JoaWxsLXZvcm9ub2ktY29yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzluREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG5Db3B5cmlnaHQgwqkgMjAxNiBNYXggRnJhbnpcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxudGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUg4oCcU29mdHdhcmXigJ0pLCB0byBkZWFsIGluXG50aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG51c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllc1xub2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5zbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIOKAnEFTIElT4oCdLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG5TT0ZUV0FSRS5cbiovXG5cbihmdW5jdGlvbihmKXtpZih0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCImJnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiKXttb2R1bGUuZXhwb3J0cz1mKCl9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZil9ZWxzZXt2YXIgZztpZih0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIil7Zz13aW5kb3d9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWx9ZWxzZSBpZih0eXBlb2Ygc2VsZiE9PVwidW5kZWZpbmVkXCIpe2c9c2VsZn1lbHNle2c9dGhpc31nLndlYXZlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzID0gX2RlcmVxXygnLi9pcycpO1xudmFyIHV0aWwgPSBfZGVyZXFfKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gX2RlcmVxXygnLi9wcm9taXNlJyk7XG52YXIgRXZlbnQgPSBfZGVyZXFfKCcuL2V2ZW50Jyk7XG5cbnZhciBkZWZpbmUgPSB7XG5cbiAgLy8gZXZlbnQgZnVuY3Rpb24gcmV1c2FibGUgc3R1ZmZcbiAgZXZlbnQ6IHtcbiAgICByZWdleDogLyhcXHcrKShcXC5cXHcrKT8vLCAvLyByZWdleCBmb3IgbWF0Y2hpbmcgZXZlbnQgc3RyaW5ncyAoZS5nLiBcImNsaWNrLm5hbWVzcGFjZVwiKVxuICAgIG9wdGlvbmFsVHlwZVJlZ2V4OiAvKFxcdyspPyhcXC5cXHcrKT8vLFxuICAgIGZhbHNlQ2FsbGJhY2s6IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZTsgfVxuICB9LFxuXG4gIC8vIGV2ZW50IGJpbmRpbmdcbiAgb246IGZ1bmN0aW9uKCBwYXJhbXMgKXtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICB1bmJpbmRTZWxmT25UcmlnZ2VyOiBmYWxzZSxcbiAgICAgIHVuYmluZEFsbEJpbmRlcnNPblRyaWdnZXI6IGZhbHNlXG4gICAgfTtcbiAgICBwYXJhbXMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gb25JbXBsKGV2ZW50cywgZGF0YSwgY2FsbGJhY2spe1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHNlbGZJc0FycmF5TGlrZSA9IHNlbGYubGVuZ3RoICE9PSB1bmRlZmluZWQ7XG4gICAgICB2YXIgYWxsID0gc2VsZklzQXJyYXlMaWtlID8gc2VsZiA6IFtzZWxmXTsgLy8gcHV0IGluIGFycmF5IGlmIG5vdCBhcnJheS1saWtlXG4gICAgICB2YXIgZXZlbnRzSXNTdHJpbmcgPSBpcy5zdHJpbmcoZXZlbnRzKTtcbiAgICAgIHZhciBwID0gcGFyYW1zO1xuXG4gICAgICBpZiggaXMuZm4oZGF0YSkgfHwgZGF0YSA9PT0gZmFsc2UgKXsgLy8gZGF0YSBpcyBhY3R1YWxseSBjYWxsYmFja1xuICAgICAgICBjYWxsYmFjayA9IGRhdGE7XG4gICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzbid0IGEgY2FsbGJhY2ssIHdlIGNhbid0IHJlYWxseSBkbyBhbnl0aGluZ1xuICAgICAgLy8gKGNhbid0IHNwZWFrIGZvciBtYXBwZWQgZXZlbnRzIGFyZyB2ZXJzaW9uKVxuICAgICAgaWYoICEoaXMuZm4oY2FsbGJhY2spIHx8IGNhbGxiYWNrID09PSBmYWxzZSkgJiYgZXZlbnRzSXNTdHJpbmcgKXtcbiAgICAgICAgcmV0dXJuIHNlbGY7IC8vIG1haW50YWluIGNoYWluaW5nXG4gICAgICB9XG5cbiAgICAgIGlmKCBldmVudHNJc1N0cmluZyApeyAvLyB0aGVuIGNvbnZlcnQgdG8gbWFwXG4gICAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgICAgbWFwWyBldmVudHMgXSA9IGNhbGxiYWNrO1xuICAgICAgICBldmVudHMgPSBtYXA7XG4gICAgICB9XG5cbiAgICAgIGZvciggdmFyIGV2dHMgaW4gZXZlbnRzICl7XG4gICAgICAgIGNhbGxiYWNrID0gZXZlbnRzW2V2dHNdO1xuICAgICAgICBpZiggY2FsbGJhY2sgPT09IGZhbHNlICl7XG4gICAgICAgICAgY2FsbGJhY2sgPSBkZWZpbmUuZXZlbnQuZmFsc2VDYWxsYmFjaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCAhaXMuZm4oY2FsbGJhY2spICl7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgZXZ0cyA9IGV2dHMuc3BsaXQoL1xccysvKTtcbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSsrICl7XG4gICAgICAgICAgdmFyIGV2dCA9IGV2dHNbaV07XG4gICAgICAgICAgaWYoIGlzLmVtcHR5U3RyaW5nKGV2dCkgKXsgY29udGludWU7IH1cblxuICAgICAgICAgIHZhciBtYXRjaCA9IGV2dC5tYXRjaCggZGVmaW5lLmV2ZW50LnJlZ2V4ICk7IC8vIHR5cGVbLm5hbWVzcGFjZV1cblxuICAgICAgICAgIGlmKCBtYXRjaCApe1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBtYXRjaFsyXSA/IG1hdGNoWzJdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjaywgLy8gY2FsbGJhY2sgdG8gcnVuXG4gICAgICAgICAgICAgIGRhdGE6IGRhdGEsIC8vIGV4dHJhIGRhdGEgaW4gZXZlbnRPYmouZGF0YVxuICAgICAgICAgICAgICB0eXBlOiB0eXBlLCAvLyB0aGUgZXZlbnQgdHlwZSAoZS5nLiAnY2xpY2snKVxuICAgICAgICAgICAgICBuYW1lc3BhY2U6IG5hbWVzcGFjZSwgLy8gdGhlIGV2ZW50IG5hbWVzcGFjZSAoZS5nLiBcIi5mb29cIilcbiAgICAgICAgICAgICAgdW5iaW5kU2VsZk9uVHJpZ2dlcjogcC51bmJpbmRTZWxmT25UcmlnZ2VyLFxuICAgICAgICAgICAgICB1bmJpbmRBbGxCaW5kZXJzT25UcmlnZ2VyOiBwLnVuYmluZEFsbEJpbmRlcnNPblRyaWdnZXIsXG4gICAgICAgICAgICAgIGJpbmRlcnM6IGFsbCAvLyB3aG8gYm91bmQgdG9nZXRoZXJcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciggdmFyIGogPSAwOyBqIDwgYWxsLmxlbmd0aDsgaisrICl7XG4gICAgICAgICAgICAgIHZhciBfcCA9IGFsbFtqXS5fcHJpdmF0ZTtcblxuICAgICAgICAgICAgICBfcC5saXN0ZW5lcnMgPSBfcC5saXN0ZW5lcnMgfHwgW107XG4gICAgICAgICAgICAgIF9wLmxpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBmb3IgZXZlbnRzIGFycmF5XG4gICAgICB9IC8vIGZvciBldmVudHMgbWFwXG5cbiAgICAgIHJldHVybiBzZWxmOyAvLyBtYWludGFpbiBjaGFpbmluZ1xuICAgIH07IC8vIGZ1bmN0aW9uXG4gIH0sIC8vIG9uXG5cbiAgZXZlbnRBbGlhc2VzT246IGZ1bmN0aW9uKCBwcm90byApe1xuICAgIHZhciBwID0gcHJvdG87XG5cbiAgICBwLmFkZExpc3RlbmVyID0gcC5saXN0ZW4gPSBwLmJpbmQgPSBwLm9uO1xuICAgIHAucmVtb3ZlTGlzdGVuZXIgPSBwLnVubGlzdGVuID0gcC51bmJpbmQgPSBwLm9mZjtcbiAgICBwLmVtaXQgPSBwLnRyaWdnZXI7XG5cbiAgICAvLyB0aGlzIGlzIGp1c3QgYSB3cmFwcGVyIGFsaWFzIG9mIC5vbigpXG4gICAgcC5wb24gPSBwLnByb21pc2VPbiA9IGZ1bmN0aW9uKCBldmVudHMsIHNlbGVjdG9yICl7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDAgKTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKCByZXNvbHZlLCByZWplY3QgKXtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oIGUgKXtcbiAgICAgICAgICBzZWxmLm9mZi5hcHBseSggc2VsZiwgb2ZmQXJncyApO1xuXG4gICAgICAgICAgcmVzb2x2ZSggZSApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBvbkFyZ3MgPSBhcmdzLmNvbmNhdChbIGNhbGxiYWNrIF0pO1xuICAgICAgICB2YXIgb2ZmQXJncyA9IG9uQXJncy5jb25jYXQoW10pO1xuXG4gICAgICAgIHNlbGYub24uYXBwbHkoIHNlbGYsIG9uQXJncyApO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBvZmY6IGZ1bmN0aW9uIG9mZkltcGwoIHBhcmFtcyApe1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICB9O1xuICAgIHBhcmFtcyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihldmVudHMsIGNhbGxiYWNrKXtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBzZWxmSXNBcnJheUxpa2UgPSBzZWxmLmxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgdmFyIGFsbCA9IHNlbGZJc0FycmF5TGlrZSA/IHNlbGYgOiBbc2VsZl07IC8vIHB1dCBpbiBhcnJheSBpZiBub3QgYXJyYXktbGlrZVxuICAgICAgdmFyIGV2ZW50c0lzU3RyaW5nID0gaXMuc3RyaW5nKGV2ZW50cyk7XG5cbiAgICAgIGlmKCBhcmd1bWVudHMubGVuZ3RoID09PSAwICl7IC8vIHRoZW4gdW5iaW5kIGFsbFxuXG4gICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrICl7XG4gICAgICAgICAgYWxsW2ldLl9wcml2YXRlLmxpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7IC8vIG1haW50YWluIGNoYWluaW5nXG4gICAgICB9XG5cbiAgICAgIGlmKCBldmVudHNJc1N0cmluZyApeyAvLyB0aGVuIGNvbnZlcnQgdG8gbWFwXG4gICAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgICAgbWFwWyBldmVudHMgXSA9IGNhbGxiYWNrO1xuICAgICAgICBldmVudHMgPSBtYXA7XG4gICAgICB9XG5cbiAgICAgIGZvciggdmFyIGV2dHMgaW4gZXZlbnRzICl7XG4gICAgICAgIGNhbGxiYWNrID0gZXZlbnRzW2V2dHNdO1xuXG4gICAgICAgIGlmKCBjYWxsYmFjayA9PT0gZmFsc2UgKXtcbiAgICAgICAgICBjYWxsYmFjayA9IGRlZmluZS5ldmVudC5mYWxzZUNhbGxiYWNrO1xuICAgICAgICB9XG5cbiAgICAgICAgZXZ0cyA9IGV2dHMuc3BsaXQoL1xccysvKTtcbiAgICAgICAgZm9yKCB2YXIgaCA9IDA7IGggPCBldnRzLmxlbmd0aDsgaCsrICl7XG4gICAgICAgICAgdmFyIGV2dCA9IGV2dHNbaF07XG4gICAgICAgICAgaWYoIGlzLmVtcHR5U3RyaW5nKGV2dCkgKXsgY29udGludWU7IH1cblxuICAgICAgICAgIHZhciBtYXRjaCA9IGV2dC5tYXRjaCggZGVmaW5lLmV2ZW50Lm9wdGlvbmFsVHlwZVJlZ2V4ICk7IC8vIFt0eXBlXVsubmFtZXNwYWNlXVxuICAgICAgICAgIGlmKCBtYXRjaCApe1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBtYXRjaFsxXSA/IG1hdGNoWzFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IG1hdGNoWzJdID8gbWF0Y2hbMl0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrICl7IC8vXG4gICAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSBhbGxbaV0uX3ByaXZhdGUubGlzdGVuZXJzID0gYWxsW2ldLl9wcml2YXRlLmxpc3RlbmVycyB8fCBbXTtcblxuICAgICAgICAgICAgICBmb3IoIHZhciBqID0gMDsgaiA8IGxpc3RlbmVycy5sZW5ndGg7IGorKyApe1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tqXTtcbiAgICAgICAgICAgICAgICB2YXIgbnNNYXRjaGVzID0gIW5hbWVzcGFjZSB8fCBuYW1lc3BhY2UgPT09IGxpc3RlbmVyLm5hbWVzcGFjZTtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZU1hdGNoZXMgPSAhdHlwZSB8fCBsaXN0ZW5lci50eXBlID09PSB0eXBlO1xuICAgICAgICAgICAgICAgIHZhciBjYk1hdGNoZXMgPSAhY2FsbGJhY2sgfHwgY2FsbGJhY2sgPT09IGxpc3RlbmVyLmNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ZW5lck1hdGNoZXMgPSBuc01hdGNoZXMgJiYgdHlwZU1hdGNoZXMgJiYgY2JNYXRjaGVzO1xuXG4gICAgICAgICAgICAgICAgLy8gZGVsZXRlIGxpc3RlbmVyIGlmIGl0IG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiggbGlzdGVuZXJNYXRjaGVzICl7XG4gICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSAvLyBmb3IgbGlzdGVuZXJzXG4gICAgICAgICAgICB9IC8vIGZvciBhbGxcbiAgICAgICAgICB9IC8vIGlmIG1hdGNoXG4gICAgICAgIH0gLy8gZm9yIGV2ZW50cyBhcnJheVxuXG4gICAgICB9IC8vIGZvciBldmVudHMgbWFwXG5cbiAgICAgIHJldHVybiBzZWxmOyAvLyBtYWludGFpbiBjaGFpbmluZ1xuICAgIH07IC8vIGZ1bmN0aW9uXG4gIH0sIC8vIG9mZlxuXG4gIHRyaWdnZXI6IGZ1bmN0aW9uKCBwYXJhbXMgKXtcbiAgICB2YXIgZGVmYXVsdHMgPSB7fTtcbiAgICBwYXJhbXMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gdHJpZ2dlckltcGwoZXZlbnRzLCBleHRyYVBhcmFtcywgZm5Ub1RyaWdnZXIpe1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHNlbGZJc0FycmF5TGlrZSA9IHNlbGYubGVuZ3RoICE9PSB1bmRlZmluZWQ7XG4gICAgICB2YXIgYWxsID0gc2VsZklzQXJyYXlMaWtlID8gc2VsZiA6IFtzZWxmXTsgLy8gcHV0IGluIGFycmF5IGlmIG5vdCBhcnJheS1saWtlXG4gICAgICB2YXIgZXZlbnRzSXNTdHJpbmcgPSBpcy5zdHJpbmcoZXZlbnRzKTtcbiAgICAgIHZhciBldmVudHNJc09iamVjdCA9IGlzLnBsYWluT2JqZWN0KGV2ZW50cyk7XG4gICAgICB2YXIgZXZlbnRzSXNFdmVudCA9IGlzLmV2ZW50KGV2ZW50cyk7XG5cbiAgICAgIGlmKCBldmVudHNJc1N0cmluZyApeyAvLyB0aGVuIG1ha2UgYSBwbGFpbiBldmVudCBvYmplY3QgZm9yIGVhY2ggZXZlbnQgbmFtZVxuICAgICAgICB2YXIgZXZ0cyA9IGV2ZW50cy5zcGxpdCgvXFxzKy8pO1xuICAgICAgICBldmVudHMgPSBbXTtcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpKysgKXtcbiAgICAgICAgICB2YXIgZXZ0ID0gZXZ0c1tpXTtcbiAgICAgICAgICBpZiggaXMuZW1wdHlTdHJpbmcoZXZ0KSApeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgdmFyIG1hdGNoID0gZXZ0Lm1hdGNoKCBkZWZpbmUuZXZlbnQucmVnZXggKTsgLy8gdHlwZVsubmFtZXNwYWNlXVxuICAgICAgICAgIHZhciB0eXBlID0gbWF0Y2hbMV07XG4gICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IG1hdGNoWzJdID8gbWF0Y2hbMl0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICBldmVudHMucHVzaCgge1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXG4gICAgICAgICAgfSApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoIGV2ZW50c0lzT2JqZWN0ICl7IC8vIHB1dCBpbiBsZW5ndGggMSBhcnJheVxuICAgICAgICB2YXIgZXZlbnRBcmdPYmogPSBldmVudHM7XG5cbiAgICAgICAgZXZlbnRzID0gWyBldmVudEFyZ09iaiBdO1xuICAgICAgfVxuXG4gICAgICBpZiggZXh0cmFQYXJhbXMgKXtcbiAgICAgICAgaWYoICFpcy5hcnJheShleHRyYVBhcmFtcykgKXsgLy8gbWFrZSBzdXJlIGV4dHJhIHBhcmFtcyBhcmUgaW4gYW4gYXJyYXkgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgZXh0cmFQYXJhbXMgPSBbIGV4dHJhUGFyYW1zIF07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG90aGVyd2lzZSwgd2UndmUgZ290IG5vdGhpbmdcbiAgICAgICAgZXh0cmFQYXJhbXMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBldmVudHMubGVuZ3RoOyBpKysgKXsgLy8gdHJpZ2dlciBlYWNoIGV2ZW50IGluIG9yZGVyXG4gICAgICAgIHZhciBldnRPYmogPSBldmVudHNbaV07XG5cbiAgICAgICAgZm9yKCB2YXIgaiA9IDA7IGogPCBhbGwubGVuZ3RoOyBqKysgKXsgLy8gZm9yIGVhY2hcbiAgICAgICAgICB2YXIgdHJpZ2dlcmVyID0gYWxsW2pdO1xuICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0cmlnZ2VyZXIuX3ByaXZhdGUubGlzdGVuZXJzID0gdHJpZ2dlcmVyLl9wcml2YXRlLmxpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgICB2YXIgYnViYmxlVXAgPSBmYWxzZTtcblxuICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgZXZlbnQgZm9yIHRoaXMgZWxlbWVudCBmcm9tIHRoZSBldmVudCBvYmplY3RcbiAgICAgICAgICB2YXIgZXZ0O1xuXG4gICAgICAgICAgaWYoIGV2ZW50c0lzRXZlbnQgKXsgLy8gdGhlbiBqdXN0IGdldCB0aGUgb2JqZWN0XG4gICAgICAgICAgICBldnQgPSBldnRPYmo7XG5cbiAgICAgICAgICB9IGVsc2UgeyAvLyB0aGVuIHdlIGhhdmUgdG8gbWFrZSBvbmVcbiAgICAgICAgICAgIGV2dCA9IG5ldyBFdmVudCggZXZ0T2JqLCB7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogZXZ0T2JqLm5hbWVzcGFjZVxuICAgICAgICAgICAgfSApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmKCBmblRvVHJpZ2dlciApeyAvLyB0aGVuIG92ZXJyaWRlIHRoZSBsaXN0ZW5lcnMgbGlzdCB3aXRoIGp1c3QgdGhlIG9uZSB3ZSBzcGVjaWZpZWRcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IFt7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogZXZ0Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgdHlwZTogZXZ0LnR5cGUsXG4gICAgICAgICAgICAgIGNhbGxiYWNrOiBmblRvVHJpZ2dlclxuICAgICAgICAgICAgfV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yKCB2YXIgayA9IDA7IGsgPCBsaXN0ZW5lcnMubGVuZ3RoOyBrKysgKXsgLy8gY2hlY2sgZWFjaCBsaXN0ZW5lclxuICAgICAgICAgICAgdmFyIGxpcyA9IGxpc3RlbmVyc1trXTtcbiAgICAgICAgICAgIHZhciBuc01hdGNoZXMgPSAhbGlzLm5hbWVzcGFjZSB8fCBsaXMubmFtZXNwYWNlID09PSBldnQubmFtZXNwYWNlO1xuICAgICAgICAgICAgdmFyIHR5cGVNYXRjaGVzID0gbGlzLnR5cGUgPT09IGV2dC50eXBlO1xuICAgICAgICAgICAgdmFyIHRhcmdldE1hdGNoZXMgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIGxpc3RlbmVyTWF0Y2hlcyA9IG5zTWF0Y2hlcyAmJiB0eXBlTWF0Y2hlcyAmJiB0YXJnZXRNYXRjaGVzO1xuXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJNYXRjaGVzICl7IC8vIHRoZW4gdHJpZ2dlciBpdFxuICAgICAgICAgICAgICB2YXIgYXJncyA9IFsgZXZ0IF07XG4gICAgICAgICAgICAgIGFyZ3MgPSBhcmdzLmNvbmNhdCggZXh0cmFQYXJhbXMgKTsgLy8gYWRkIGV4dHJhIHBhcmFtcyB0byBhcmdzIGxpc3RcblxuICAgICAgICAgICAgICBpZiggbGlzLmRhdGEgKXsgLy8gYWRkIG9uIGRhdGEgcGx1Z2dlZCBpbnRvIGJpbmRpbmdcbiAgICAgICAgICAgICAgICBldnQuZGF0YSA9IGxpcy5kYXRhO1xuICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBvciBjbGVhciBpdCBpbiBjYXNlIHRoZSBldmVudCBvYmogaXMgcmV1c2VkXG4gICAgICAgICAgICAgICAgZXZ0LmRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiggbGlzLnVuYmluZFNlbGZPblRyaWdnZXIgfHwgbGlzLnVuYmluZEFsbEJpbmRlcnNPblRyaWdnZXIgKXsgLy8gdGhlbiByZW1vdmUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGssIDEpO1xuICAgICAgICAgICAgICAgIGstLTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmKCBsaXMudW5iaW5kQWxsQmluZGVyc09uVHJpZ2dlciApeyAvLyB0aGVuIGRlbGV0ZSB0aGUgbGlzdGVuZXIgZm9yIGFsbCBiaW5kZXJzXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRlcnMgPSBsaXMuYmluZGVycztcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBsID0gMDsgbCA8IGJpbmRlcnMubGVuZ3RoOyBsKysgKXtcbiAgICAgICAgICAgICAgICAgIHZhciBiaW5kZXIgPSBiaW5kZXJzW2xdO1xuICAgICAgICAgICAgICAgICAgaWYoICFiaW5kZXIgfHwgYmluZGVyID09PSB0cmlnZ2VyZXIgKXsgY29udGludWU7IH0gLy8gYWxyZWFkeSBoYW5kbGVkIHRyaWdnZXJlciBvciB3ZSBjYW4ndCBoYW5kbGUgaXRcblxuICAgICAgICAgICAgICAgICAgdmFyIGJpbmRlckxpc3RlbmVycyA9IGJpbmRlci5fcHJpdmF0ZS5saXN0ZW5lcnM7XG4gICAgICAgICAgICAgICAgICBmb3IoIHZhciBtID0gMDsgbSA8IGJpbmRlckxpc3RlbmVycy5sZW5ndGg7IG0rKyApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmluZGVyTGlzdGVuZXIgPSBiaW5kZXJMaXN0ZW5lcnNbbV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIGJpbmRlckxpc3RlbmVyID09PSBsaXMgKXsgLy8gZGVsZXRlIGxpc3RlbmVyIGZyb20gbGlzdFxuICAgICAgICAgICAgICAgICAgICAgIGJpbmRlckxpc3RlbmVycy5zcGxpY2UobSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgbS0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gcnVuIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHRyaWdnZXJlcjtcbiAgICAgICAgICAgICAgdmFyIHJldCA9IGxpcy5jYWxsYmFjay5hcHBseSggY29udGV4dCwgYXJncyApO1xuXG4gICAgICAgICAgICAgIGlmKCByZXQgPT09IGZhbHNlIHx8IGV2dC5pc1Byb3BhZ2F0aW9uU3RvcHBlZCgpICl7XG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkb24ndCBidWJibGVcbiAgICAgICAgICAgICAgICBidWJibGVVcCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYoIHJldCA9PT0gZmFsc2UgKXtcbiAgICAgICAgICAgICAgICAgIC8vIHJldHVybmluZyBmYWxzZSBpcyBhIHNob3J0aGFuZCBmb3Igc3RvcHBpbmcgcHJvcGFnYXRpb24gYW5kIHByZXZlbnRpbmcgdGhlIGRlZi4gYWN0aW9uXG4gICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gLy8gaWYgbGlzdGVuZXIgbWF0Y2hlc1xuICAgICAgICAgIH0gLy8gZm9yIGVhY2ggbGlzdGVuZXJcblxuICAgICAgICAgIGlmKCBidWJibGVVcCApe1xuICAgICAgICAgICAgLy8gVE9ETyBpZiBidWJibGluZyBpcyBzdXBwb3J0ZWQuLi5cbiAgICAgICAgICB9XG5cbiAgICAgICAgfSAvLyBmb3IgZWFjaCBvZiBhbGxcbiAgICAgIH0gLy8gZm9yIGVhY2ggZXZlbnRcblxuICAgICAgcmV0dXJuIHNlbGY7IC8vIG1haW50YWluIGNoYWluaW5nXG4gICAgfTsgLy8gZnVuY3Rpb25cbiAgfSAvLyB0cmlnZ2VyXG5cbn07IC8vIGRlZmluZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZTtcblxufSx7XCIuL2V2ZW50XCI6MixcIi4vaXNcIjo1LFwiLi9wcm9taXNlXCI6NixcIi4vdXRpbFwiOjh9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvYmxvYi9tYXN0ZXIvc3JjL2V2ZW50LmpzXG5cbnZhciBFdmVudCA9IGZ1bmN0aW9uKCBzcmMsIHByb3BzICkge1xuICAvLyBBbGxvdyBpbnN0YW50aWF0aW9uIHdpdGhvdXQgdGhlICduZXcnIGtleXdvcmRcbiAgaWYgKCAhKHRoaXMgaW5zdGFuY2VvZiBFdmVudCkgKSB7XG4gICAgcmV0dXJuIG5ldyBFdmVudCggc3JjLCBwcm9wcyApO1xuICB9XG5cbiAgLy8gRXZlbnQgb2JqZWN0XG4gIGlmICggc3JjICYmIHNyYy50eXBlICkge1xuICAgIHRoaXMub3JpZ2luYWxFdmVudCA9IHNyYztcbiAgICB0aGlzLnR5cGUgPSBzcmMudHlwZTtcblxuICAgIC8vIEV2ZW50cyBidWJibGluZyB1cCB0aGUgZG9jdW1lbnQgbWF5IGhhdmUgYmVlbiBtYXJrZWQgYXMgcHJldmVudGVkXG4gICAgLy8gYnkgYSBoYW5kbGVyIGxvd2VyIGRvd24gdGhlIHRyZWU7IHJlZmxlY3QgdGhlIGNvcnJlY3QgdmFsdWUuXG4gICAgdGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSAoIHNyYy5kZWZhdWx0UHJldmVudGVkICkgPyByZXR1cm5UcnVlIDogcmV0dXJuRmFsc2U7XG5cbiAgLy8gRXZlbnQgdHlwZVxuICB9IGVsc2Uge1xuICAgIHRoaXMudHlwZSA9IHNyYztcbiAgfVxuXG4gIC8vIFB1dCBleHBsaWNpdGx5IHByb3ZpZGVkIHByb3BlcnRpZXMgb250byB0aGUgZXZlbnQgb2JqZWN0XG4gIGlmICggcHJvcHMgKSB7XG5cbiAgICAvLyBtb3JlIGVmZmljaWVudCB0byBtYW51YWxseSBjb3B5IGZpZWxkcyB3ZSB1c2VcbiAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlICE9PSB1bmRlZmluZWQgPyBwcm9wcy50eXBlIDogdGhpcy50eXBlO1xuICAgIHRoaXMubmFtZXNwYWNlID0gcHJvcHMubmFtZXNwYWNlO1xuICAgIHRoaXMubGF5b3V0ID0gcHJvcHMubGF5b3V0O1xuICAgIHRoaXMuZGF0YSA9IHByb3BzLmRhdGE7XG4gICAgdGhpcy5tZXNzYWdlID0gcHJvcHMubWVzc2FnZTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHRpbWVzdGFtcCBpZiBpbmNvbWluZyBldmVudCBkb2Vzbid0IGhhdmUgb25lXG4gIHRoaXMudGltZVN0YW1wID0gc3JjICYmIHNyYy50aW1lU3RhbXAgfHwgK25ldyBEYXRlKCk7XG59O1xuXG5mdW5jdGlvbiByZXR1cm5GYWxzZSgpIHtcbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gcmV0dXJuVHJ1ZSgpIHtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIGpRdWVyeS5FdmVudCBpcyBiYXNlZCBvbiBET00zIEV2ZW50cyBhcyBzcGVjaWZpZWQgYnkgdGhlIEVDTUFTY3JpcHQgTGFuZ3VhZ2UgQmluZGluZ1xuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvMjAwMy9XRC1ET00tTGV2ZWwtMy1FdmVudHMtMjAwMzAzMzEvZWNtYS1zY3JpcHQtYmluZGluZy5odG1sXG5FdmVudC5wcm90b3R5cGUgPSB7XG4gIGluc3RhbmNlU3RyaW5nOiBmdW5jdGlvbigpeyByZXR1cm4gJ2V2ZW50JzsgfSxcblxuICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSByZXR1cm5UcnVlO1xuXG4gICAgdmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG4gICAgaWYgKCAhZSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZiBwcmV2ZW50RGVmYXVsdCBleGlzdHMgcnVuIGl0IG9uIHRoZSBvcmlnaW5hbCBldmVudFxuICAgIGlmICggZS5wcmV2ZW50RGVmYXVsdCApIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuICAgIHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuICAgIGlmICggIWUgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIHN0b3BQcm9wYWdhdGlvbiBleGlzdHMgcnVuIGl0IG9uIHRoZSBvcmlnaW5hbCBldmVudFxuICAgIGlmICggZS5zdG9wUHJvcGFnYXRpb24gKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0sXG5cbiAgaXNEZWZhdWx0UHJldmVudGVkOiByZXR1cm5GYWxzZSxcbiAgaXNQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlLFxuICBpc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2Vcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudDtcblxufSx7fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKiEgV2VhdmVyIGxpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly90bGRybGVnYWwuY29tL2xpY2Vuc2UvbWl0LWxpY2Vuc2UpLCBjb3B5cmlnaHQgTWF4IEZyYW56ICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzID0gX2RlcmVxXygnLi9pcycpO1xudmFyIHV0aWwgPSBfZGVyZXFfKCcuL3V0aWwnKTtcbnZhciBUaHJlYWQgPSBfZGVyZXFfKCcuL3RocmVhZCcpO1xudmFyIFByb21pc2UgPSBfZGVyZXFfKCcuL3Byb21pc2UnKTtcbnZhciBkZWZpbmUgPSBfZGVyZXFfKCcuL2RlZmluZScpO1xuXG52YXIgRmFicmljID0gZnVuY3Rpb24oIE4gKXtcbiAgaWYoICEodGhpcyBpbnN0YW5jZW9mIEZhYnJpYykgKXtcbiAgICByZXR1cm4gbmV3IEZhYnJpYyggTiApO1xuICB9XG5cbiAgdGhpcy5fcHJpdmF0ZSA9IHtcbiAgICBwYXNzOiBbXVxuICB9O1xuXG4gIHZhciBkZWZOID0gNDtcblxuICBpZiggaXMubnVtYmVyKE4pICl7XG4gICAgLy8gdGhlbiB1c2UgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgdGhyZWFkc1xuICB9IGlmKCB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeSAhPSBudWxsICl7XG4gICAgTiA9IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5O1xuICB9IGVsc2Uge1xuICAgIHRyeXtcbiAgICAgIE4gPSBfZGVyZXFfKCdvcycpLmNwdXMoKS5sZW5ndGg7XG4gICAgfSBjYXRjaCggZXJyICl7XG4gICAgICBOID0gZGVmTjtcbiAgICB9XG4gIH0gLy8gVE9ETyBjb3VsZCB1c2UgYW4gZXN0aW1hdGlvbiBoZXJlIGJ1dCB3b3VsZCB0aGUgYWRkaXRpb25hbCBleHBlbnNlIGJlIHdvcnRoIGl0P1xuXG4gIGZvciggdmFyIGkgPSAwOyBpIDwgTjsgaSsrICl7XG4gICAgdGhpc1tpXSA9IG5ldyBUaHJlYWQoKTtcbiAgfVxuXG4gIHRoaXMubGVuZ3RoID0gTjtcbn07XG5cbnZhciBmYWJmbiA9IEZhYnJpYy5wcm90b3R5cGU7IC8vIHNob3J0IGFsaWFzXG5cbnV0aWwuZXh0ZW5kKGZhYmZuLCB7XG5cbiAgaW5zdGFuY2VTdHJpbmc6IGZ1bmN0aW9uKCl7IHJldHVybiAnZmFicmljJzsgfSxcblxuICAvLyByZXF1aXJlIGZuIGluIGFsbCB0aHJlYWRzXG4gIHJlcXVpcmU6IGZ1bmN0aW9uKCBmbiwgYXMgKXtcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKysgKXtcbiAgICAgIHZhciB0aHJlYWQgPSB0aGlzW2ldO1xuXG4gICAgICB0aHJlYWQucmVxdWlyZSggZm4sIGFzICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gZ2V0IGEgcmFuZG9tIHRocmVhZFxuICByYW5kb206IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGkgPSBNYXRoLnJvdW5kKCAodGhpcy5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkgKTtcbiAgICB2YXIgdGhyZWFkID0gdGhpc1tpXTtcblxuICAgIHJldHVybiB0aHJlYWQ7XG4gIH0sXG5cbiAgLy8gcnVuIG9uIHJhbmRvbSB0aHJlYWRcbiAgcnVuOiBmdW5jdGlvbiggZm4gKXtcbiAgICB2YXIgcGFzcyA9IHRoaXMuX3ByaXZhdGUucGFzcy5zaGlmdCgpO1xuXG4gICAgcmV0dXJuIHRoaXMucmFuZG9tKCkucGFzcyggcGFzcyApLnJ1biggZm4gKTtcbiAgfSxcblxuICAvLyBzZW5kcyBhIHJhbmRvbSB0aHJlYWQgYSBtZXNzYWdlXG4gIG1lc3NhZ2U6IGZ1bmN0aW9uKCBtICl7XG4gICAgcmV0dXJuIHRoaXMucmFuZG9tKCkubWVzc2FnZSggbSApO1xuICB9LFxuXG4gIC8vIHNlbmQgYWxsIHRocmVhZHMgYSBtZXNzYWdlXG4gIGJyb2FkY2FzdDogZnVuY3Rpb24oIG0gKXtcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKysgKXtcbiAgICAgIHZhciB0aHJlYWQgPSB0aGlzW2ldO1xuXG4gICAgICB0aHJlYWQubWVzc2FnZSggbSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIC8vIHN0b3AgYWxsIHRocmVhZHNcbiAgc3RvcDogZnVuY3Rpb24oKXtcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKysgKXtcbiAgICAgIHZhciB0aHJlYWQgPSB0aGlzW2ldO1xuXG4gICAgICB0aHJlYWQuc3RvcCgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIC8vIHBhc3MgZGF0YSB0byBiZSB1c2VkIHdpdGggLnNwcmVhZCgpIGV0Yy5cbiAgcGFzczogZnVuY3Rpb24oIGRhdGEgKXtcbiAgICB2YXIgcGFzcyA9IHRoaXMuX3ByaXZhdGUucGFzcztcblxuICAgIGlmKCBpcy5hcnJheShkYXRhKSApe1xuICAgICAgcGFzcy5wdXNoKCBkYXRhICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93ICdPbmx5IGFycmF5cyBtYXkgYmUgdXNlZCB3aXRoIGZhYnJpYy5wYXNzKCknO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIHNwcmVhZFNpemU6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHN1YnNpemUgPSAgTWF0aC5jZWlsKCB0aGlzLl9wcml2YXRlLnBhc3NbMF0ubGVuZ3RoIC8gdGhpcy5sZW5ndGggKTtcblxuICAgIHN1YnNpemUgPSBNYXRoLm1heCggMSwgc3Vic2l6ZSApOyAvLyBkb24ndCBwYXNzIGxlc3MgdGhhbiBvbmUgZWxlIHRvIGVhY2ggdGhyZWFkXG5cbiAgICByZXR1cm4gc3Vic2l6ZTtcbiAgfSxcblxuICAvLyBzcGxpdCB0aGUgZGF0YSBpbnRvIHNsaWNlcyB0byBzcHJlYWQgdGhlIGRhdGEgZXF1YWxseSBhbW9uZyB0aHJlYWRzXG4gIHNwcmVhZDogZnVuY3Rpb24oIGZuICl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBfcCA9IHNlbGYuX3ByaXZhdGU7XG4gICAgdmFyIHN1YnNpemUgPSBzZWxmLnNwcmVhZFNpemUoKTsgLy8gbnVtYmVyIG9mIHBhc3MgZWxlcyB0byBoYW5kbGUgaW4gZWFjaCB0aHJlYWRcbiAgICB2YXIgcGFzcyA9IF9wLnBhc3Muc2hpZnQoKS5jb25jYXQoW10pOyAvLyBrZWVwIGEgY29weVxuICAgIHZhciBydW5QcyA9IFtdO1xuXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrICl7XG4gICAgICB2YXIgdGhyZWFkID0gdGhpc1tpXTtcbiAgICAgIHZhciBzbGljZSA9IHBhc3Muc3BsaWNlKCAwLCBzdWJzaXplICk7XG5cbiAgICAgIHZhciBydW5QID0gdGhyZWFkLnBhc3MoIHNsaWNlICkucnVuKCBmbiApO1xuXG4gICAgICBydW5Qcy5wdXNoKCBydW5QICk7XG5cbiAgICAgIHZhciBkb25lRWFybHkgPSBwYXNzLmxlbmd0aCA9PT0gMDtcbiAgICAgIGlmKCBkb25lRWFybHkgKXsgYnJlYWs7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoIHJ1blBzICkudGhlbihmdW5jdGlvbiggdGhlbnMgKXtcbiAgICAgIHZhciBwb3N0cGFzcyA9IFtdO1xuICAgICAgdmFyIHAgPSAwO1xuXG4gICAgICAvLyBmaWxsIHBvc3RwYXNzIHdpdGggdGhlIHRvdGFsIHJlc3VsdCBqb2luZWQgZnJvbSBhbGwgdGhyZWFkc1xuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGVucy5sZW5ndGg7IGkrKyApe1xuICAgICAgICB2YXIgdGhlbiA9IHRoZW5zW2ldOyAvLyBhcnJheSByZXN1bHQgZnJvbSB0aHJlYWQgaVxuXG4gICAgICAgIGZvciggdmFyIGogPSAwOyBqIDwgdGhlbi5sZW5ndGg7IGorKyApe1xuICAgICAgICAgIHZhciB0ID0gdGhlbltqXTsgLy8gYXJyYXkgZWxlbWVudFxuXG4gICAgICAgICAgcG9zdHBhc3NbIHArKyBdID0gdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9zdHBhc3M7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gcGFyYWxsZWwgdmVyc2lvbiBvZiBhcnJheS5tYXAoKVxuICBtYXA6IGZ1bmN0aW9uKCBmbiApe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYucmVxdWlyZSggZm4sICdfJF8kX2ZhYm1hcCcgKTtcblxuICAgIHJldHVybiBzZWxmLnNwcmVhZChmdW5jdGlvbiggc3BsaXQgKXtcbiAgICAgIHZhciBtYXBwZWQgPSBbXTtcbiAgICAgIHZhciBvcmlnUmVzb2x2ZSA9IHJlc29sdmU7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgICByZXNvbHZlID0gZnVuY3Rpb24oIHZhbCApeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgbWFwcGVkLnB1c2goIHZhbCApO1xuICAgICAgfTtcblxuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBzcGxpdC5sZW5ndGg7IGkrKyApe1xuICAgICAgICB2YXIgb2xkTGVuID0gbWFwcGVkLmxlbmd0aDtcbiAgICAgICAgdmFyIHJldCA9IF8kXyRfZmFibWFwKCBzcGxpdFtpXSApOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgdmFyIG5vdGhpbmdJbnNkQnlSZXNvbHZlID0gb2xkTGVuID09PSBtYXBwZWQubGVuZ3RoO1xuXG4gICAgICAgIGlmKCBub3RoaW5nSW5zZEJ5UmVzb2x2ZSApe1xuICAgICAgICAgIG1hcHBlZC5wdXNoKCByZXQgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXNvbHZlID0gb3JpZ1Jlc29sdmU7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gcGFyYWxsZWwgdmVyc2lvbiBvZiBhcnJheS5maWx0ZXIoKVxuICBmaWx0ZXI6IGZ1bmN0aW9uKCBmbiApe1xuICAgIHZhciBfcCA9IHRoaXMuX3ByaXZhdGU7XG4gICAgdmFyIHBhc3MgPSBfcC5wYXNzWzBdO1xuXG4gICAgcmV0dXJuIHRoaXMubWFwKCBmbiApLnRoZW4oZnVuY3Rpb24oIGluY2x1ZGUgKXtcbiAgICAgIHZhciByZXQgPSBbXTtcblxuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBwYXNzLmxlbmd0aDsgaSsrICl7XG4gICAgICAgIHZhciBkYXR1bSA9IHBhc3NbaV07XG4gICAgICAgIHZhciBpbmNEYXR1bSA9IGluY2x1ZGVbaV07XG5cbiAgICAgICAgaWYoIGluY0RhdHVtICl7XG4gICAgICAgICAgcmV0LnB1c2goIGRhdHVtICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBzb3J0cyB0aGUgcGFzc2VkIGFycmF5IHVzaW5nIGEgZGl2aWRlIGFuZCBjb25xdWVyIHN0cmF0ZWd5XG4gIHNvcnQ6IGZ1bmN0aW9uKCBjbXAgKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFAgPSB0aGlzLl9wcml2YXRlLnBhc3NbMF0ubGVuZ3RoO1xuICAgIHZhciBzdWJzaXplID0gdGhpcy5zcHJlYWRTaXplKCk7XG5cbiAgICBjbXAgPSBjbXAgfHwgZnVuY3Rpb24oIGEsIGIgKXsgLy8gZGVmYXVsdCBjb21wYXJpc29uIGZ1bmN0aW9uXG4gICAgICBpZiggYSA8IGIgKXtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfSBlbHNlIGlmKCBhID4gYiApe1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfTtcblxuICAgIHNlbGYucmVxdWlyZSggY21wLCAnXyRfJF9jbXAnICk7XG5cbiAgICByZXR1cm4gc2VsZi5zcHJlYWQoZnVuY3Rpb24oIHNwbGl0ICl7IC8vIHNvcnQgZWFjaCBzcGxpdCBub3JtYWxseVxuICAgICAgdmFyIHNvcnRlZFNwbGl0ID0gc3BsaXQuc29ydCggXyRfJF9jbXAgKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICByZXNvbHZlKCBzb3J0ZWRTcGxpdCApOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIGpvaW5lZCApe1xuICAgICAgLy8gZG8gYWxsIHRoZSBtZXJnaW5nIGluIHRoZSBtYWluIHRocmVhZCB0byBtaW5pbWlzZSBkYXRhIHRyYW5zZmVyXG5cbiAgICAgIC8vIFRPRE8gY291bGQgZG8gbWVyZ2luZyBpbiBzZXBhcmF0ZSB0aHJlYWRzIGJ1dCB3b3VsZCBpbmN1ciBhZGQnbCBjb3N0IG9mIGRhdGEgdHJhbnNmZXJcbiAgICAgIC8vIGZvciBlYWNoIGxldmVsIG9mIHRoZSBtZXJnZVxuXG4gICAgICB2YXIgbWVyZ2UgPSBmdW5jdGlvbiggaSwgaiwgbWF4ICl7XG4gICAgICAgIC8vIGRvbid0IG92ZXJmbG93IGFycmF5XG4gICAgICAgIGogPSBNYXRoLm1pbiggaiwgUCApO1xuICAgICAgICBtYXggPSBNYXRoLm1pbiggbWF4LCBQICk7XG5cbiAgICAgICAgLy8gbGVmdCBhbmQgcmlnaHQgc2lkZXMgb2YgbWVyZ2VcbiAgICAgICAgdmFyIGwgPSBpO1xuICAgICAgICB2YXIgciA9IGo7XG5cbiAgICAgICAgdmFyIHNvcnRlZCA9IFtdO1xuXG4gICAgICAgIGZvciggdmFyIGsgPSBsOyBrIDwgbWF4OyBrKysgKXtcblxuICAgICAgICAgIHZhciBlbGVJID0gam9pbmVkW2ldO1xuICAgICAgICAgIHZhciBlbGVKID0gam9pbmVkW2pdO1xuXG4gICAgICAgICAgaWYoIGkgPCByICYmICggaiA+PSBtYXggfHwgY21wKGVsZUksIGVsZUopIDw9IDAgKSApe1xuICAgICAgICAgICAgc29ydGVkLnB1c2goIGVsZUkgKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ydGVkLnB1c2goIGVsZUogKTtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluIHRoZSBhcnJheSBwcm9wZXIsIHB1dCB0aGUgc29ydGVkIHZhbHVlc1xuICAgICAgICBmb3IoIHZhciBrID0gMDsgayA8IHNvcnRlZC5sZW5ndGg7IGsrKyApeyAvLyBrdGggc29ydGVkIGl0ZW1cbiAgICAgICAgICB2YXIgaW5kZXggPSBsICsgaztcblxuICAgICAgICAgIGpvaW5lZFsgaW5kZXggXSA9IHNvcnRlZFtrXTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZm9yKCB2YXIgc3BsaXRMID0gc3Vic2l6ZTsgc3BsaXRMIDwgUDsgc3BsaXRMICo9IDIgKXsgLy8gbWVyZ2UgdW50aWwgYXJyYXkgaXMgXCJzcGxpdFwiIGFzIDFcblxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IFA7IGkgKz0gMipzcGxpdEwgKXtcbiAgICAgICAgICBtZXJnZSggaSwgaSArIHNwbGl0TCwgaSArIDIqc3BsaXRMICk7XG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICByZXR1cm4gam9pbmVkO1xuICAgIH0pO1xuICB9XG5cblxufSk7XG5cbnZhciBkZWZpbmVSYW5kb21QYXNzZXIgPSBmdW5jdGlvbiggb3B0cyApe1xuICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICByZXR1cm4gZnVuY3Rpb24oIGZuLCBhcmcxICl7XG4gICAgdmFyIHBhc3MgPSB0aGlzLl9wcml2YXRlLnBhc3Muc2hpZnQoKTtcblxuICAgIHJldHVybiB0aGlzLnJhbmRvbSgpLnBhc3MoIHBhc3MgKVsgb3B0cy50aHJlYWRGbiBdKCBmbiwgYXJnMSApO1xuICB9O1xufTtcblxudXRpbC5leHRlbmQoZmFiZm4sIHtcbiAgcmFuZG9tTWFwOiBkZWZpbmVSYW5kb21QYXNzZXIoeyB0aHJlYWRGbjogJ21hcCcgfSksXG5cbiAgcmVkdWNlOiBkZWZpbmVSYW5kb21QYXNzZXIoeyB0aHJlYWRGbjogJ3JlZHVjZScgfSksXG5cbiAgcmVkdWNlUmlnaHQ6IGRlZmluZVJhbmRvbVBhc3Nlcih7IHRocmVhZEZuOiAncmVkdWNlUmlnaHQnIH0pXG59KTtcblxuLy8gYWxpYXNlc1xudmFyIGZuID0gZmFiZm47XG5mbi5wcm9taXNlID0gZm4ucnVuO1xuZm4udGVybWluYXRlID0gZm4uaGFsdCA9IGZuLnN0b3A7XG5mbi5pbmNsdWRlID0gZm4ucmVxdWlyZTtcblxuLy8gcHVsbCBpbiBldmVudCBhcGlzXG51dGlsLmV4dGVuZChmYWJmbiwge1xuICBvbjogZGVmaW5lLm9uKCksXG4gIG9uZTogZGVmaW5lLm9uKHsgdW5iaW5kU2VsZk9uVHJpZ2dlcjogdHJ1ZSB9KSxcbiAgb2ZmOiBkZWZpbmUub2ZmKCksXG4gIHRyaWdnZXI6IGRlZmluZS50cmlnZ2VyKClcbn0pO1xuXG5kZWZpbmUuZXZlbnRBbGlhc2VzT24oIGZhYmZuICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmFicmljO1xuXG59LHtcIi4vZGVmaW5lXCI6MSxcIi4vaXNcIjo1LFwiLi9wcm9taXNlXCI6NixcIi4vdGhyZWFkXCI6NyxcIi4vdXRpbFwiOjgsXCJvc1wiOnVuZGVmaW5lZH1dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVGhyZWFkID0gX2RlcmVxXygnLi90aHJlYWQnKTtcbnZhciBGYWJyaWMgPSBfZGVyZXFfKCcuL2ZhYnJpYycpO1xuXG52YXIgd2VhdmVyID0gZnVuY3Rpb24oKXsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gIHJldHVybjtcbn07XG5cbndlYXZlci52ZXJzaW9uID0gJzEuMi4wJztcblxud2VhdmVyLnRocmVhZCA9IHdlYXZlci5UaHJlYWQgPSB3ZWF2ZXIud29ya2VyID0gd2VhdmVyLldvcmtlciA9IFRocmVhZDtcbndlYXZlci5mYWJyaWMgPSB3ZWF2ZXIuRmFicmljID0gRmFicmljO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHdlYXZlcjtcblxufSx7XCIuL2ZhYnJpY1wiOjMsXCIuL3RocmVhZFwiOjd9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8vIHR5cGUgdGVzdGluZyB1dGlsaXR5IGZ1bmN0aW9uc1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB0eXBlb2ZzdHIgPSB0eXBlb2YgJyc7XG52YXIgdHlwZW9mb2JqID0gdHlwZW9mIHt9O1xudmFyIHR5cGVvZmZuID0gdHlwZW9mIGZ1bmN0aW9uKCl7fTtcblxudmFyIGluc3RhbmNlU3RyID0gZnVuY3Rpb24oIG9iaiApe1xuICByZXR1cm4gb2JqICYmIG9iai5pbnN0YW5jZVN0cmluZyAmJiBpcy5mbiggb2JqLmluc3RhbmNlU3RyaW5nICkgPyBvYmouaW5zdGFuY2VTdHJpbmcoKSA6IG51bGw7XG59O1xuXG52YXIgaXMgPSB7XG4gIGRlZmluZWQ6IGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsOyAvLyBub3QgdW5kZWZpbmVkIG9yIG51bGxcbiAgfSxcblxuICBzdHJpbmc6IGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIHR5cGVvZiBvYmogPT0gdHlwZW9mc3RyO1xuICB9LFxuXG4gIGZuOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSB0eXBlb2ZmbjtcbiAgfSxcblxuICBhcnJheTogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkob2JqKSA6IG9iaiAhPSBudWxsICYmIG9iaiBpbnN0YW5jZW9mIEFycmF5O1xuICB9LFxuXG4gIHBsYWluT2JqZWN0OiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSB0eXBlb2ZvYmogJiYgIWlzLmFycmF5KG9iaikgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3Q7XG4gIH0sXG5cbiAgb2JqZWN0OiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSB0eXBlb2ZvYmo7XG4gIH0sXG5cbiAgbnVtYmVyOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSB0eXBlb2YgMSAmJiAhaXNOYU4ob2JqKTtcbiAgfSxcblxuICBpbnRlZ2VyOiBmdW5jdGlvbiggb2JqICl7XG4gICAgcmV0dXJuIGlzLm51bWJlcihvYmopICYmIE1hdGguZmxvb3Iob2JqKSA9PT0gb2JqO1xuICB9LFxuXG4gIGJvb2w6IGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIHR5cGVvZiBvYmogPT09IHR5cGVvZiB0cnVlO1xuICB9LFxuXG4gIGV2ZW50OiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBpbnN0YW5jZVN0cihvYmopID09PSAnZXZlbnQnO1xuICB9LFxuXG4gIHRocmVhZDogZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gaW5zdGFuY2VTdHIob2JqKSA9PT0gJ3RocmVhZCc7XG4gIH0sXG5cbiAgZmFicmljOiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiBpbnN0YW5jZVN0cihvYmopID09PSAnZmFicmljJztcbiAgfSxcblxuICBlbXB0eVN0cmluZzogZnVuY3Rpb24ob2JqKXtcbiAgICBpZiggIW9iaiApeyAvLyBudWxsIGlzIGVtcHR5XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYoIGlzLnN0cmluZyhvYmopICl7XG4gICAgICBpZiggb2JqID09PSAnJyB8fCBvYmoubWF0Y2goL15cXHMrJC8pICl7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBlbXB0eSBzdHJpbmcgaXMgZW1wdHlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7IC8vIG90aGVyd2lzZSwgd2UgZG9uJ3Qga25vdyB3aGF0IHdlJ3ZlIGdvdFxuICB9LFxuXG4gIG5vbmVtcHR5U3RyaW5nOiBmdW5jdGlvbihvYmope1xuICAgIGlmKCBvYmogJiYgaXMuc3RyaW5nKG9iaikgJiYgb2JqICE9PSAnJyAmJiAhb2JqLm1hdGNoKC9eXFxzKyQvKSApe1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzO1xuXG59LHt9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8vIGludGVybmFsLCBtaW5pbWFsIFByb21pc2UgaW1wbCBzLnQuIGFwaXMgY2FuIHJldHVybiBwcm9taXNlcyBpbiBvbGQgZW52c1xuLy8gYmFzZWQgb24gdGhlbmFibGUgKGh0dHA6Ly9naXRodWIuY29tL3JzZS90aGVuYWJsZSlcblxuJ3VzZSBzdHJpY3QnO1xuXG4vKiAgcHJvbWlzZSBzdGF0ZXMgW1Byb21pc2VzL0ErIDIuMV0gICovXG52YXIgU1RBVEVfUEVORElORyAgID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4xLjFdICAqL1xudmFyIFNUQVRFX0ZVTEZJTExFRCA9IDE7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMS4yXSAgKi9cbnZhciBTVEFURV9SRUpFQ1RFRCAgPSAyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjEuM10gICovXG5cbi8qICBwcm9taXNlIG9iamVjdCBjb25zdHJ1Y3RvciAgKi9cbnZhciBhcGkgPSBmdW5jdGlvbiAoZXhlY3V0b3IpIHtcbiAgLyogIG9wdGlvbmFsbHkgc3VwcG9ydCBub24tY29uc3RydWN0b3IvcGxhaW4tZnVuY3Rpb24gY2FsbCAgKi9cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGFwaSkpXG4gICAgcmV0dXJuIG5ldyBhcGkoZXhlY3V0b3IpO1xuXG4gIC8qICBpbml0aWFsaXplIG9iamVjdCAgKi9cbiAgdGhpcy5pZCAgICAgICAgICAgPSBcIlRoZW5hYmxlLzEuMC43XCI7XG4gIHRoaXMuc3RhdGUgICAgICAgID0gU1RBVEVfUEVORElORzsgLyogIGluaXRpYWwgc3RhdGUgICovXG4gIHRoaXMuZnVsZmlsbFZhbHVlID0gdW5kZWZpbmVkOyAgICAgLyogIGluaXRpYWwgdmFsdWUgICovICAgICAvKiAgW1Byb21pc2VzL0ErIDEuMywgMi4xLjIuMl0gICovXG4gIHRoaXMucmVqZWN0UmVhc29uID0gdW5kZWZpbmVkOyAgICAgLyogIGluaXRpYWwgcmVhc29uICovICAgICAvKiAgW1Byb21pc2VzL0ErIDEuNSwgMi4xLjMuMl0gICovXG4gIHRoaXMub25GdWxmaWxsZWQgID0gW107ICAgICAgICAgICAgLyogIGluaXRpYWwgaGFuZGxlcnMgICovXG4gIHRoaXMub25SZWplY3RlZCAgID0gW107ICAgICAgICAgICAgLyogIGluaXRpYWwgaGFuZGxlcnMgICovXG5cbiAgLyogIHByb3ZpZGUgb3B0aW9uYWwgaW5mb3JtYXRpb24taGlkaW5nIHByb3h5ICAqL1xuICB0aGlzLnByb3h5ID0ge1xuICAgIHRoZW46IHRoaXMudGhlbi5iaW5kKHRoaXMpXG4gIH07XG5cbiAgLyogIHN1cHBvcnQgb3B0aW9uYWwgZXhlY3V0b3IgZnVuY3Rpb24gICovXG4gIGlmICh0eXBlb2YgZXhlY3V0b3IgPT09IFwiZnVuY3Rpb25cIilcbiAgICBleGVjdXRvci5jYWxsKHRoaXMsIHRoaXMuZnVsZmlsbC5iaW5kKHRoaXMpLCB0aGlzLnJlamVjdC5iaW5kKHRoaXMpKTtcbn07XG5cbi8qICBwcm9taXNlIEFQSSBtZXRob2RzICAqL1xuYXBpLnByb3RvdHlwZSA9IHtcbiAgLyogIHByb21pc2UgcmVzb2x2aW5nIG1ldGhvZHMgICovXG4gIGZ1bGZpbGw6IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gZGVsaXZlcih0aGlzLCBTVEFURV9GVUxGSUxMRUQsIFwiZnVsZmlsbFZhbHVlXCIsIHZhbHVlKTsgfSxcbiAgcmVqZWN0OiAgZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBkZWxpdmVyKHRoaXMsIFNUQVRFX1JFSkVDVEVELCAgXCJyZWplY3RSZWFzb25cIiwgdmFsdWUpOyB9LFxuXG4gIC8qICBcIlRoZSB0aGVuIE1ldGhvZFwiIFtQcm9taXNlcy9BKyAxLjEsIDEuMiwgMi4yXSAgKi9cbiAgdGhlbjogZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgdmFyIGN1cnIgPSB0aGlzO1xuICAgIHZhciBuZXh0ID0gbmV3IGFwaSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjddICAqL1xuICAgIGN1cnIub25GdWxmaWxsZWQucHVzaChcbiAgICAgIHJlc29sdmVyKG9uRnVsZmlsbGVkLCBuZXh0LCBcImZ1bGZpbGxcIikpOyAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi4yLzIuMi42XSAgKi9cbiAgICBjdXJyLm9uUmVqZWN0ZWQucHVzaChcbiAgICAgIHJlc29sdmVyKG9uUmVqZWN0ZWQsICBuZXh0LCBcInJlamVjdFwiICkpOyAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi4zLzIuMi42XSAgKi9cbiAgICBleGVjdXRlKGN1cnIpO1xuICAgIHJldHVybiBuZXh0LnByb3h5OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjcsIDMuM10gICovXG4gIH1cbn07XG5cbi8qICBkZWxpdmVyIGFuIGFjdGlvbiAgKi9cbnZhciBkZWxpdmVyID0gZnVuY3Rpb24gKGN1cnIsIHN0YXRlLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAoY3Vyci5zdGF0ZSA9PT0gU1RBVEVfUEVORElORykge1xuICAgIGN1cnIuc3RhdGUgPSBzdGF0ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4xLjIuMSwgMi4xLjMuMV0gICovXG4gICAgY3VycltuYW1lXSA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjEuMi4yLCAyLjEuMy4yXSAgKi9cbiAgICBleGVjdXRlKGN1cnIpO1xuICB9XG4gIHJldHVybiBjdXJyO1xufTtcblxuLyogIGV4ZWN1dGUgYWxsIGhhbmRsZXJzICAqL1xudmFyIGV4ZWN1dGUgPSBmdW5jdGlvbiAoY3Vycikge1xuICBpZiAoY3Vyci5zdGF0ZSA9PT0gU1RBVEVfRlVMRklMTEVEKVxuICAgIGV4ZWN1dGVfaGFuZGxlcnMoY3VyciwgXCJvbkZ1bGZpbGxlZFwiLCBjdXJyLmZ1bGZpbGxWYWx1ZSk7XG4gIGVsc2UgaWYgKGN1cnIuc3RhdGUgPT09IFNUQVRFX1JFSkVDVEVEKVxuICAgIGV4ZWN1dGVfaGFuZGxlcnMoY3VyciwgXCJvblJlamVjdGVkXCIsICBjdXJyLnJlamVjdFJlYXNvbik7XG59O1xuXG4vKiAgZXhlY3V0ZSBwYXJ0aWN1bGFyIHNldCBvZiBoYW5kbGVycyAgKi9cbnZhciBleGVjdXRlX2hhbmRsZXJzID0gZnVuY3Rpb24gKGN1cnIsIG5hbWUsIHZhbHVlKSB7XG4gIC8qIGdsb2JhbCBzZXRJbW1lZGlhdGU6IHRydWUgKi9cbiAgLyogZ2xvYmFsIHNldFRpbWVvdXQ6IHRydWUgKi9cblxuICAvKiAgc2hvcnQtY2lyY3VpdCBwcm9jZXNzaW5nICAqL1xuICBpZiAoY3VycltuYW1lXS5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuO1xuXG4gIC8qICBpdGVyYXRlIG92ZXIgYWxsIGhhbmRsZXJzLCBleGFjdGx5IG9uY2UgICovXG4gIHZhciBoYW5kbGVycyA9IGN1cnJbbmFtZV07XG4gIGN1cnJbbmFtZV0gPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi4yLjMsIDIuMi4zLjNdICAqL1xuICB2YXIgZnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKVxuICAgICAgaGFuZGxlcnNbaV0odmFsdWUpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi41XSAgKi9cbiAgfTtcblxuICAvKiAgZXhlY3V0ZSBwcm9jZWR1cmUgYXN5bmNocm9ub3VzbHkgICovICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuNCwgMy4xXSAgKi9cbiAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIilcbiAgICBzZXRJbW1lZGlhdGUoZnVuYyk7XG4gIGVsc2VcbiAgICBzZXRUaW1lb3V0KGZ1bmMsIDApO1xufTtcblxuLyogIGdlbmVyYXRlIGEgcmVzb2x2ZXIgZnVuY3Rpb24gICovXG52YXIgcmVzb2x2ZXIgPSBmdW5jdGlvbiAoY2IsIG5leHQsIG1ldGhvZCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBjYiAhPT0gXCJmdW5jdGlvblwiKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi4xLCAyLjIuNy4zLCAyLjIuNy40XSAgKi9cbiAgICAgIG5leHRbbWV0aG9kXS5jYWxsKG5leHQsIHZhbHVlKTsgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuNy4zLCAyLjIuNy40XSAgKi9cbiAgICBlbHNlIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICB0cnkgeyByZXN1bHQgPSBjYih2YWx1ZSk7IH0gICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4yLjIuMSwgMi4yLjMuMSwgMi4yLjUsIDMuMl0gICovXG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBuZXh0LnJlamVjdChlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjIuNy4yXSAgKi9cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShuZXh0LCByZXN1bHQpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMi43LjFdICAqL1xuICAgIH1cbiAgfTtcbn07XG5cbi8qICBcIlByb21pc2UgUmVzb2x1dGlvbiBQcm9jZWR1cmVcIiAgKi8gICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuM10gICovXG52YXIgcmVzb2x2ZSA9IGZ1bmN0aW9uIChwcm9taXNlLCB4KSB7XG4gIC8qICBzYW5pdHkgY2hlY2sgYXJndW1lbnRzICAqLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy4xXSAgKi9cbiAgaWYgKHByb21pc2UgPT09IHggfHwgcHJvbWlzZS5wcm94eSA9PT0geCkge1xuICAgIHByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgcmVzb2x2ZSBwcm9taXNlIHdpdGggaXRzZWxmXCIpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKiAgc3VyZ2ljYWxseSBjaGVjayBmb3IgYSBcInRoZW5cIiBtZXRob2RcbiAgICAobWFpbmx5IHRvIGp1c3QgY2FsbCB0aGUgXCJnZXR0ZXJcIiBvZiBcInRoZW5cIiBvbmx5IG9uY2UpICAqL1xuICB2YXIgdGhlbjtcbiAgaWYgKCh0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsKSB8fCB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdHJ5IHsgdGhlbiA9IHgudGhlbjsgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4xLCAzLjVdICAqL1xuICAgIGNhdGNoIChlKSB7XG4gICAgICBwcm9taXNlLnJlamVjdChlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMl0gICovXG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLyogIGhhbmRsZSBvd24gVGhlbmFibGVzICAgIFtQcm9taXNlcy9BKyAyLjMuMl1cbiAgICBhbmQgc2ltaWxhciBcInRoZW5hYmxlc1wiIFtQcm9taXNlcy9BKyAyLjMuM10gICovXG4gIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIHJlc29sdmVkID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgIC8qICBjYWxsIHJldHJpZXZlZCBcInRoZW5cIiBtZXRob2QgKi8gICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy4zLjNdICAqL1xuICAgICAgdGhlbi5jYWxsKHgsXG4gICAgICAgIC8qICByZXNvbHZlUHJvbWlzZSAgKi8gICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgW1Byb21pc2VzL0ErIDIuMy4zLjMuMV0gICovXG4gICAgICAgIGZ1bmN0aW9uICh5KSB7XG4gICAgICAgICAgaWYgKHJlc29sdmVkKSByZXR1cm47IHJlc29sdmVkID0gdHJ1ZTsgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zLjNdICAqL1xuICAgICAgICAgIGlmICh5ID09PSB4KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMy42XSAgKi9cbiAgICAgICAgICAgIHByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJjaXJjdWxhciB0aGVuYWJsZSBjaGFpblwiKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB5KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiAgcmVqZWN0UHJvbWlzZSAgKi8gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zLjJdICAqL1xuICAgICAgICBmdW5jdGlvbiAocikge1xuICAgICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuOyByZXNvbHZlZCA9IHRydWU7ICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjMuMy4zXSAgKi9cbiAgICAgICAgICBwcm9taXNlLnJlamVjdChyKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghcmVzb2x2ZWQpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zLjNdICAqL1xuICAgICAgICBwcm9taXNlLnJlamVjdChlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIFtQcm9taXNlcy9BKyAyLjMuMy4zLjRdICAqL1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICAvKiAgaGFuZGxlIG90aGVyIHZhbHVlcyAgKi9cbiAgcHJvbWlzZS5mdWxmaWxsKHgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBbUHJvbWlzZXMvQSsgMi4zLjQsIDIuMy4zLjRdICAqL1xufTtcblxuLy8gdXNlIG5hdGl2ZSBwcm9taXNlcyB3aGVyZSBwb3NzaWJsZVxudmFyIFByb21pc2UgPSB0eXBlb2YgUHJvbWlzZSA9PT0gJ3VuZGVmaW5lZCcgPyBhcGkgOiBQcm9taXNlO1xuXG4vLyBzbyB3ZSBhbHdheXMgaGF2ZSBQcm9taXNlLmFsbCgpXG5Qcm9taXNlLmFsbCA9IFByb21pc2UuYWxsIHx8IGZ1bmN0aW9uKCBwcyApe1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24oIHJlc29sdmVBbGwsIHJlamVjdEFsbCApe1xuICAgIHZhciB2YWxzID0gbmV3IEFycmF5KCBwcy5sZW5ndGggKTtcbiAgICB2YXIgZG9uZUNvdW50ID0gMDtcblxuICAgIHZhciBmdWxmaWxsID0gZnVuY3Rpb24oIGksIHZhbCApe1xuICAgICAgdmFsc1tpXSA9IHZhbDtcbiAgICAgIGRvbmVDb3VudCsrO1xuXG4gICAgICBpZiggZG9uZUNvdW50ID09PSBwcy5sZW5ndGggKXtcbiAgICAgICAgcmVzb2x2ZUFsbCggdmFscyApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aDsgaSsrICl7XG4gICAgICAoZnVuY3Rpb24oIGkgKXtcbiAgICAgICAgdmFyIHAgPSBwc1tpXTtcbiAgICAgICAgdmFyIGlzUHJvbWlzZSA9IHAudGhlbiAhPSBudWxsO1xuXG4gICAgICAgIGlmKCBpc1Byb21pc2UgKXtcbiAgICAgICAgICBwLnRoZW4oZnVuY3Rpb24oIHZhbCApe1xuICAgICAgICAgICAgZnVsZmlsbCggaSwgdmFsICk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApe1xuICAgICAgICAgICAgcmVqZWN0QWxsKCBlcnIgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgdmFsID0gcDtcbiAgICAgICAgICBmdWxmaWxsKCBpLCB2YWwgKTtcbiAgICAgICAgfVxuICAgICAgfSkoIGkgKTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbn0se31dLDc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLyohIFdlYXZlciBsaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vdGxkcmxlZ2FsLmNvbS9saWNlbnNlL21pdC1saWNlbnNlKSwgY29weXJpZ2h0IE1heCBGcmFueiAqL1xuXG4vLyBjcm9zcy1lbnYgdGhyZWFkL3dvcmtlclxuLy8gTkIgOiB1c2VzIChoZWF2eXdlaWdodCkgcHJvY2Vzc2VzIG9uIG5vZGVqcyBzbyBiZXN0IG5vdCB0byBjcmVhdGUgdG9vIG1hbnkgdGhyZWFkc1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB3aW5kb3cgPSBfZGVyZXFfKCcuL3dpbmRvdycpO1xudmFyIHV0aWwgPSBfZGVyZXFfKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gX2RlcmVxXygnLi9wcm9taXNlJyk7XG52YXIgRXZlbnQgPSBfZGVyZXFfKCcuL2V2ZW50Jyk7XG52YXIgZGVmaW5lID0gX2RlcmVxXygnLi9kZWZpbmUnKTtcbnZhciBpcyA9IF9kZXJlcV8oJy4vaXMnKTtcblxudmFyIFRocmVhZCA9IGZ1bmN0aW9uKCBvcHRzICl7XG4gIGlmKCAhKHRoaXMgaW5zdGFuY2VvZiBUaHJlYWQpICl7XG4gICAgcmV0dXJuIG5ldyBUaHJlYWQoIG9wdHMgKTtcbiAgfVxuXG4gIHZhciBfcCA9IHRoaXMuX3ByaXZhdGUgPSB7XG4gICAgcmVxdWlyZXM6IFtdLFxuICAgIGZpbGVzOiBbXSxcbiAgICBxdWV1ZTogbnVsbCxcbiAgICBwYXNzOiBbXSxcbiAgICBkaXNhYmxlZDogZmFsc2VcbiAgfTtcblxuICBpZiggaXMucGxhaW5PYmplY3Qob3B0cykgKXtcbiAgICBpZiggb3B0cy5kaXNhYmxlZCAhPSBudWxsICl7XG4gICAgICBfcC5kaXNhYmxlZCA9ICEhb3B0cy5kaXNhYmxlZDtcbiAgICB9XG4gIH1cblxufTtcblxudmFyIHRoZGZuID0gVGhyZWFkLnByb3RvdHlwZTsgLy8gc2hvcnQgYWxpYXNcblxudmFyIHN0cmluZ2lmeUZpZWxkVmFsID0gZnVuY3Rpb24oIHZhbCApe1xuICB2YXIgdmFsU3RyID0gaXMuZm4oIHZhbCApID8gdmFsLnRvU3RyaW5nKCkgOiBcIkpTT04ucGFyc2UoJ1wiICsgSlNPTi5zdHJpbmdpZnkodmFsKSArIFwiJylcIjtcblxuICByZXR1cm4gdmFsU3RyO1xufTtcblxuLy8gYWxsb3dzIGZvciByZXF1aXJlcyB3aXRoIHByb3RvdHlwZXMgYW5kIHN1Ym9ianMgZXRjXG52YXIgZm5Bc1JlcXVpcmUgPSBmdW5jdGlvbiggZm4gKXtcbiAgdmFyIHJlcTtcbiAgdmFyIGZuTmFtZTtcblxuICBpZiggaXMub2JqZWN0KGZuKSAmJiBmbi5mbiApeyAvLyBtYW51YWwgZm5cbiAgICByZXEgPSBmbkFzKCBmbi5mbiwgZm4ubmFtZSApO1xuICAgIGZuTmFtZSA9IGZuLm5hbWU7XG4gICAgZm4gPSBmbi5mbjtcbiAgfSBlbHNlIGlmKCBpcy5mbihmbikgKXsgLy8gYXV0byBmblxuICAgIHJlcSA9IGZuLnRvU3RyaW5nKCk7XG4gICAgZm5OYW1lID0gZm4ubmFtZTtcbiAgfSBlbHNlIGlmKCBpcy5zdHJpbmcoZm4pICl7IC8vIHN0cmluZ2lmaWVkIGZuXG4gICAgcmVxID0gZm47XG4gIH0gZWxzZSBpZiggaXMub2JqZWN0KGZuKSApeyAvLyBwbGFpbiBvYmplY3RcbiAgICBpZiggZm4ucHJvdG8gKXtcbiAgICAgIHJlcSA9ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXEgPSBmbi5uYW1lICsgJyA9IHt9Oyc7XG4gICAgfVxuXG4gICAgZm5OYW1lID0gZm4ubmFtZTtcbiAgICBmbiA9IGZuLm9iajtcbiAgfVxuXG4gIHJlcSArPSAnXFxuJztcblxuICB2YXIgcHJvdG9yZXEgPSBmdW5jdGlvbiggdmFsLCBzdWJuYW1lICl7XG4gICAgaWYoIHZhbC5wcm90b3R5cGUgKXtcbiAgICAgIHZhciBwcm90b05vbmVtcHR5ID0gZmFsc2U7XG4gICAgICBmb3IoIHZhciBwcm9wIGluIHZhbC5wcm90b3R5cGUgKXsgcHJvdG9Ob25lbXB0eSA9IHRydWU7IGJyZWFrOyB9IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgICBpZiggcHJvdG9Ob25lbXB0eSApe1xuICAgICAgICByZXEgKz0gZm5Bc1JlcXVpcmUoIHtcbiAgICAgICAgICBuYW1lOiBzdWJuYW1lLFxuICAgICAgICAgIG9iajogdmFsLFxuICAgICAgICAgIHByb3RvOiB0cnVlXG4gICAgICAgIH0sIHZhbCApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBwdWxsIGluIHByb3RvdHlwZVxuICBpZiggZm4ucHJvdG90eXBlICYmIGZuTmFtZSAhPSBudWxsICl7XG5cbiAgICBmb3IoIHZhciBuYW1lIGluIGZuLnByb3RvdHlwZSApe1xuICAgICAgdmFyIHByb3RvU3RyID0gJyc7XG5cbiAgICAgIHZhciB2YWwgPSBmbi5wcm90b3R5cGVbIG5hbWUgXTtcbiAgICAgIHZhciB2YWxTdHIgPSBzdHJpbmdpZnlGaWVsZFZhbCggdmFsICk7XG4gICAgICB2YXIgc3VibmFtZSA9IGZuTmFtZSArICcucHJvdG90eXBlLicgKyBuYW1lO1xuXG4gICAgICBwcm90b1N0ciArPSBzdWJuYW1lICsgJyA9ICcgKyB2YWxTdHIgKyAnO1xcbic7XG5cbiAgICAgIGlmKCBwcm90b1N0ciApe1xuICAgICAgICByZXEgKz0gcHJvdG9TdHI7XG4gICAgICB9XG5cbiAgICAgIHByb3RvcmVxKCB2YWwsIHN1Ym5hbWUgKTsgLy8gc3Vib2JqZWN0IHdpdGggcHJvdG90eXBlXG4gICAgfVxuXG4gIH1cblxuICAvLyBwdWxsIGluIHByb3BlcnRpZXMgZm9yIG9iai9mbnNcbiAgaWYoICFpcy5zdHJpbmcoZm4pICl7IGZvciggdmFyIG5hbWUgaW4gZm4gKXtcbiAgICB2YXIgcHJvcHNTdHIgPSAnJztcblxuICAgIGlmKCBmbi5oYXNPd25Qcm9wZXJ0eShuYW1lKSApe1xuICAgICAgdmFyIHZhbCA9IGZuWyBuYW1lIF07XG4gICAgICB2YXIgdmFsU3RyID0gc3RyaW5naWZ5RmllbGRWYWwoIHZhbCApO1xuICAgICAgdmFyIHN1Ym5hbWUgPSBmbk5hbWUgKyAnW1wiJyArIG5hbWUgKyAnXCJdJztcblxuICAgICAgcHJvcHNTdHIgKz0gc3VibmFtZSArICcgPSAnICsgdmFsU3RyICsgJztcXG4nO1xuICAgIH1cblxuICAgIGlmKCBwcm9wc1N0ciApe1xuICAgICAgcmVxICs9IHByb3BzU3RyO1xuICAgIH1cblxuICAgIHByb3RvcmVxKCB2YWwsIHN1Ym5hbWUgKTsgLy8gc3Vib2JqZWN0IHdpdGggcHJvdG90eXBlXG4gIH0gfVxuXG4gIHJldHVybiByZXE7XG59O1xuXG52YXIgaXNQYXRoU3RyID0gZnVuY3Rpb24oIHN0ciApe1xuICByZXR1cm4gaXMuc3RyaW5nKHN0cikgJiYgc3RyLm1hdGNoKC9cXC5qcyQvKTtcbn07XG5cbnV0aWwuZXh0ZW5kKHRoZGZuLCB7XG5cbiAgaW5zdGFuY2VTdHJpbmc6IGZ1bmN0aW9uKCl7IHJldHVybiAndGhyZWFkJzsgfSxcblxuICByZXF1aXJlOiBmdW5jdGlvbiggZm4sIGFzICl7XG4gICAgdmFyIHJlcXVpcmVzID0gdGhpcy5fcHJpdmF0ZS5yZXF1aXJlcztcblxuICAgIGlmKCBpc1BhdGhTdHIoZm4pICl7XG4gICAgICB0aGlzLl9wcml2YXRlLmZpbGVzLnB1c2goIGZuICk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmKCBhcyApe1xuICAgICAgaWYoIGlzLmZuKGZuKSApe1xuICAgICAgICBmbiA9IHsgbmFtZTogYXMsIGZuOiBmbiB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4gPSB7IG5hbWU6IGFzLCBvYmo6IGZuIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKCBpcy5mbihmbikgKXtcbiAgICAgICAgaWYoICFmbi5uYW1lICl7XG4gICAgICAgICAgdGhyb3cgJ1RoZSBmdW5jdGlvbiBuYW1lIGNvdWxkIG5vdCBiZSBhdXRvbWF0aWNhbGx5IGRldGVybWluZWQuICBVc2UgdGhyZWFkLnJlcXVpcmUoIHNvbWVGdW5jdGlvbiwgXCJzb21lRnVuY3Rpb25cIiApJztcbiAgICAgICAgfVxuXG4gICAgICAgIGZuID0geyBuYW1lOiBmbi5uYW1lLCBmbjogZm4gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXF1aXJlcy5wdXNoKCBmbiApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH0sXG5cbiAgcGFzczogZnVuY3Rpb24oIGRhdGEgKXtcbiAgICB0aGlzLl9wcml2YXRlLnBhc3MucHVzaCggZGF0YSApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH0sXG5cbiAgcnVuOiBmdW5jdGlvbiggZm4sIHBhc3MgKXsgLy8gZm4gdXNlZCBsaWtlIG1haW4oKVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgX3AgPSB0aGlzLl9wcml2YXRlO1xuICAgIHBhc3MgPSBwYXNzIHx8IF9wLnBhc3Muc2hpZnQoKTtcblxuICAgIGlmKCBfcC5zdG9wcGVkICl7XG4gICAgICB0aHJvdyAnQXR0ZW1wdGVkIHRvIHJ1biBhIHN0b3BwZWQgdGhyZWFkISAgU3RhcnQgYSBuZXcgdGhyZWFkIG9yIGRvIG5vdCBzdG9wIHRoZSBleGlzdGluZyB0aHJlYWQgYW5kIHJldXNlIGl0Lic7XG4gICAgfVxuXG4gICAgaWYoIF9wLnJ1bm5pbmcgKXtcbiAgICAgIHJldHVybiAoIF9wLnF1ZXVlID0gX3AucXVldWUudGhlbihmdW5jdGlvbigpeyAvLyBpbmR1Y3RpdmUgc3RlcFxuICAgICAgICByZXR1cm4gc2VsZi5ydW4oIGZuLCBwYXNzICk7XG4gICAgICB9KSApO1xuICAgIH1cblxuICAgIHZhciB1c2VXVyA9IHdpbmRvdyAhPSBudWxsICYmICFfcC5kaXNhYmxlZDtcbiAgICB2YXIgdXNlTm9kZSA9ICF3aW5kb3cgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIV9wLmRpc2FibGVkO1xuXG4gICAgc2VsZi50cmlnZ2VyKCdydW4nKTtcblxuICAgIHZhciBydW5QID0gbmV3IFByb21pc2UoZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApe1xuXG4gICAgICBfcC5ydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgdmFyIHRocmVhZFRlY2hBbHJlYWR5RXhpc3RzID0gX3AucmFuO1xuXG4gICAgICB2YXIgZm5JbXBsU3RyID0gaXMuc3RyaW5nKCBmbiApID8gZm4gOiBmbi50b1N0cmluZygpO1xuXG4gICAgICAvLyB3b3JrZXIgY29kZSB0byBleGVjXG4gICAgICB2YXIgZm5TdHIgPSAnXFxuJyArICggX3AucmVxdWlyZXMubWFwKGZ1bmN0aW9uKCByICl7XG4gICAgICAgIHJldHVybiBmbkFzUmVxdWlyZSggciApO1xuICAgICAgfSkgKS5jb25jYXQoIF9wLmZpbGVzLm1hcChmdW5jdGlvbiggZiApe1xuICAgICAgICBpZiggdXNlV1cgKXtcbiAgICAgICAgICB2YXIgd3dpZnlGaWxlID0gZnVuY3Rpb24oIGZpbGUgKXtcbiAgICAgICAgICAgIGlmKCBmaWxlLm1hdGNoKC9eXFwuXFwvLykgfHwgZmlsZS5tYXRjaCgvXlxcLlxcLi8pICl7XG4gICAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgZmlsZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiggZmlsZS5tYXRjaCgvXlxcLy8pICl7XG4gICAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgJy8nICsgZmlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICByZXR1cm4gJ2ltcG9ydFNjcmlwdHMoXCInICsgd3dpZnlGaWxlKGYpICsgJ1wiKTsnO1xuICAgICAgICB9IGVsc2UgaWYoIHVzZU5vZGUgKSB7XG4gICAgICAgICAgcmV0dXJuICdldmFsKCByZXF1aXJlKFwiZnNcIikucmVhZEZpbGVTeW5jKFwiJyArIGYgKyAnXCIsIHsgZW5jb2Rpbmc6IFwidXRmOFwiIH0pICk7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyAnRXh0ZXJuYWwgZmlsZSBgJyArIGYgKyAnYCBjYW4gbm90IGJlIHJlcXVpcmVkIHdpdGhvdXQgYW55IHRocmVhZGluZyB0ZWNobm9sb2d5Lic7XG4gICAgICAgIH1cbiAgICAgIH0pICkuY29uY2F0KFtcbiAgICAgICAgJyggZnVuY3Rpb24oKXsnLFxuICAgICAgICAgICd2YXIgcmV0ID0gKCcgKyBmbkltcGxTdHIgKyAnKSgnICsgSlNPTi5zdHJpbmdpZnkocGFzcykgKyAnKTsnLFxuICAgICAgICAgICdpZiggcmV0ICE9PSB1bmRlZmluZWQgKXsgcmVzb2x2ZShyZXQpOyB9JywgLy8gYXNzdW1lIGlmIHJhbiBmbiByZXR1cm5zIGRlZmluZWQgdmFsdWUgKGluY2wuIG51bGwpLCB0aGF0IHdlIHdhbnQgdG8gcmVzb2x2ZSB0byBpdFxuICAgICAgICAnfSApKClcXG4nXG4gICAgICBdKS5qb2luKCdcXG4nKTtcblxuICAgICAgLy8gYmVjYXVzZSB3ZSd2ZSBub3cgY29uc3VtZWQgdGhlIHJlcXVpcmVzLCBlbXB0eSB0aGUgbGlzdCBzbyB3ZSBkb24ndCBkdXBlIG9uIG5leHQgcnVuKClcbiAgICAgIF9wLnJlcXVpcmVzID0gW107XG4gICAgICBfcC5maWxlcyA9IFtdO1xuXG4gICAgICBpZiggdXNlV1cgKXtcbiAgICAgICAgdmFyIGZuQmxvYiwgZm5Vcmw7XG5cbiAgICAgICAgLy8gYWRkIG5vcm1hbGlzZWQgdGhyZWFkIGFwaSBmdW5jdGlvbnNcbiAgICAgICAgaWYoICF0aHJlYWRUZWNoQWxyZWFkeUV4aXN0cyApe1xuICAgICAgICAgIHZhciBmblByZSA9IGZuU3RyICsgJyc7XG5cbiAgICAgICAgICBmblN0ciA9IFtcbiAgICAgICAgICAgICdmdW5jdGlvbiBfcmVmXyhvKXsgcmV0dXJuIGV2YWwobyk7IH07JyxcbiAgICAgICAgICAgICdmdW5jdGlvbiBicm9hZGNhc3QobSl7IHJldHVybiBtZXNzYWdlKG0pOyB9OycsIC8vIGFsaWFzXG4gICAgICAgICAgICAnZnVuY3Rpb24gbWVzc2FnZShtKXsgcG9zdE1lc3NhZ2UobSk7IH07JyxcbiAgICAgICAgICAgICdmdW5jdGlvbiBsaXN0ZW4oZm4peycsXG4gICAgICAgICAgICAnICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKG0peyAnLFxuICAgICAgICAgICAgJyAgICBpZiggdHlwZW9mIG0gPT09IFwib2JqZWN0XCIgJiYgKG0uZGF0YS4kJGV2YWwgfHwgbS5kYXRhID09PSBcIiQkc3RhcnRcIikgKXsnLFxuICAgICAgICAgICAgJyAgICB9IGVsc2UgeyAnLFxuICAgICAgICAgICAgJyAgICAgIGZuKCBtLmRhdGEgKTsnLFxuICAgICAgICAgICAgJyAgICB9JyxcbiAgICAgICAgICAgICcgIH0pOycsXG4gICAgICAgICAgICAnfTsnLFxuICAgICAgICAgICAgJ3NlbGYuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24obSl7ICBpZiggbS5kYXRhLiQkZXZhbCApeyBldmFsKCBtLmRhdGEuJCRldmFsICk7IH0gIH0pOycsXG4gICAgICAgICAgICAnZnVuY3Rpb24gcmVzb2x2ZSh2KXsgcG9zdE1lc3NhZ2UoeyAkJHJlc29sdmU6IHYgfSk7IH07JyxcbiAgICAgICAgICAgICdmdW5jdGlvbiByZWplY3Qodil7IHBvc3RNZXNzYWdlKHsgJCRyZWplY3Q6IHYgfSk7IH07J1xuICAgICAgICAgIF0uam9pbignXFxuJyk7XG5cbiAgICAgICAgICBmblN0ciArPSBmblByZTtcblxuICAgICAgICAgIGZuQmxvYiA9IG5ldyBCbG9iKFsgZm5TdHIgXSwge1xuICAgICAgICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZm5VcmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTCggZm5CbG9iICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY3JlYXRlIHdlYndvcmtlciBhbmQgbGV0IGl0IGV4ZWMgdGhlIHNlcmlhbGlzZWQgY29kZVxuICAgICAgICB2YXIgd3cgPSBfcC53ZWJ3b3JrZXIgPSBfcC53ZWJ3b3JrZXIgfHwgbmV3IFdvcmtlciggZm5VcmwgKTtcblxuICAgICAgICBpZiggdGhyZWFkVGVjaEFscmVhZHlFeGlzdHMgKXsgLy8gdGhlbiBqdXN0IGV4ZWMgbmV3IHJ1bigpIGNvZGVcbiAgICAgICAgICB3dy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAkJGV2YWw6IGZuU3RyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3b3JrZXIgbWVzc2FnZXMgPT4gZXZlbnRzXG4gICAgICAgIHZhciBjYjtcbiAgICAgICAgd3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGNiID0gZnVuY3Rpb24oIG0gKXtcbiAgICAgICAgICB2YXIgaXNPYmplY3QgPSBpcy5vYmplY3QobSkgJiYgaXMub2JqZWN0KCBtLmRhdGEgKTtcblxuICAgICAgICAgIGlmKCBpc09iamVjdCAmJiAoJyQkcmVzb2x2ZScgaW4gbS5kYXRhKSApe1xuICAgICAgICAgICAgd3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGNiKTsgLy8gZG9uZSBsaXN0ZW5pbmcgYi9jIHJlc29sdmUoKVxuXG4gICAgICAgICAgICByZXNvbHZlKCBtLmRhdGEuJCRyZXNvbHZlICk7XG4gICAgICAgICAgfSBlbHNlIGlmKCBpc09iamVjdCAmJiAoJyQkcmVqZWN0JyBpbiBtLmRhdGEpICl7XG4gICAgICAgICAgICB3dy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgY2IpOyAvLyBkb25lIGxpc3RlbmluZyBiL2MgcmVqZWN0KClcblxuICAgICAgICAgICAgcmVqZWN0KCBtLmRhdGEuJCRyZWplY3QgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi50cmlnZ2VyKCBuZXcgRXZlbnQobSwgeyB0eXBlOiAnbWVzc2FnZScsIG1lc3NhZ2U6IG0uZGF0YSB9KSApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIGlmKCAhdGhyZWFkVGVjaEFscmVhZHlFeGlzdHMgKXtcbiAgICAgICAgICB3dy5wb3N0TWVzc2FnZSgnJCRzdGFydCcpOyAvLyBzdGFydCB1cCB0aGUgd29ya2VyXG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIGlmKCB1c2VOb2RlICl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBwcm9jZXNzXG5cbiAgICAgICAgaWYoICFfcC5jaGlsZCApe1xuICAgICAgICAgIF9wLmNoaWxkID0gKCBfZGVyZXFfKCdjaGlsZF9wcm9jZXNzJykuZm9yayggX2RlcmVxXygncGF0aCcpLmpvaW4oX19kaXJuYW1lLCAndGhyZWFkLW5vZGUtZm9yaycpICkgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IF9wLmNoaWxkO1xuXG4gICAgICAgIC8vIGNoaWxkIHByb2Nlc3MgbWVzc2FnZXMgPT4gZXZlbnRzXG4gICAgICAgIHZhciBjYjtcbiAgICAgICAgY2hpbGQub24oJ21lc3NhZ2UnLCBjYiA9IGZ1bmN0aW9uKCBtICl7XG4gICAgICAgICAgaWYoIGlzLm9iamVjdChtKSAmJiAoJyQkcmVzb2x2ZScgaW4gbSkgKXtcbiAgICAgICAgICAgIGNoaWxkLnJlbW92ZUxpc3RlbmVyKCdtZXNzYWdlJywgY2IpOyAvLyBkb25lIGxpc3RlbmluZyBiL2MgcmVzb2x2ZSgpXG5cbiAgICAgICAgICAgIHJlc29sdmUoIG0uJCRyZXNvbHZlICk7XG4gICAgICAgICAgfSBlbHNlIGlmKCBpcy5vYmplY3QobSkgJiYgKCckJHJlamVjdCcgaW4gbSkgKXtcbiAgICAgICAgICAgIGNoaWxkLnJlbW92ZUxpc3RlbmVyKCdtZXNzYWdlJywgY2IpOyAvLyBkb25lIGxpc3RlbmluZyBiL2MgcmVqZWN0KClcblxuICAgICAgICAgICAgcmVqZWN0KCBtLiQkcmVqZWN0ICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYudHJpZ2dlciggbmV3IEV2ZW50KHt9LCB7IHR5cGU6ICdtZXNzYWdlJywgbWVzc2FnZTogbSB9KSApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gYXNrIHRoZSBjaGlsZCBwcm9jZXNzIHRvIGV2YWwgdGhlIHdvcmtlciBjb2RlXG4gICAgICAgIGNoaWxkLnNlbmQoe1xuICAgICAgICAgICQkZXZhbDogZm5TdHJcbiAgICAgICAgfSk7XG5cbiAgICAgIH0gZWxzZSB7IC8vIHVzZSBhIGZhbGxiYWNrIG1lY2hhbmlzbSB1c2luZyBhIHRpbWVvdXRcblxuICAgICAgICB2YXIgcHJvbWlzZVJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICB2YXIgcHJvbWlzZVJlamVjdCA9IHJlamVjdDtcblxuICAgICAgICB2YXIgdGltZXIgPSBfcC50aW1lciA9IF9wLnRpbWVyIHx8IHtcblxuICAgICAgICAgIGxpc3RlbmVyczogW10sXG5cbiAgICAgICAgICBleGVjOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gYXMgYSBzdHJpbmcgc28gaXQgY2FuJ3QgYmUgbWFuZ2xlZCBieSBtaW5pZmllcnMgYW5kIHByb2Nlc3NvcnNcbiAgICAgICAgICAgIGZuU3RyID0gW1xuICAgICAgICAgICAgICAnZnVuY3Rpb24gX3JlZl8obyl7IHJldHVybiBldmFsKG8pOyB9OycsXG4gICAgICAgICAgICAgICdmdW5jdGlvbiBicm9hZGNhc3QobSl7IHJldHVybiBtZXNzYWdlKG0pOyB9OycsXG4gICAgICAgICAgICAgICdmdW5jdGlvbiBtZXNzYWdlKG0peyBzZWxmLnRyaWdnZXIoIG5ldyBFdmVudCh7fSwgeyB0eXBlOiBcIm1lc3NhZ2VcIiwgbWVzc2FnZTogbSB9KSApOyB9OycsXG4gICAgICAgICAgICAgICdmdW5jdGlvbiBsaXN0ZW4oZm4peyB0aW1lci5saXN0ZW5lcnMucHVzaCggZm4gKTsgfTsnLFxuICAgICAgICAgICAgICAnZnVuY3Rpb24gcmVzb2x2ZSh2KXsgcHJvbWlzZVJlc29sdmUodik7IH07JyxcbiAgICAgICAgICAgICAgJ2Z1bmN0aW9uIHJlamVjdCh2KXsgcHJvbWlzZVJlamVjdCh2KTsgfTsnXG4gICAgICAgICAgICBdLmpvaW4oJ1xcbicpICsgZm5TdHI7XG5cbiAgICAgICAgICAgIC8vIHRoZSAucnVuKCkgY29kZVxuICAgICAgICAgICAgZXZhbCggZm5TdHIgKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uKCBtICl7XG4gICAgICAgICAgICB2YXIgbHMgPSB0aW1lci5saXN0ZW5lcnM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgbHMubGVuZ3RoOyBpKysgKXtcbiAgICAgICAgICAgICAgdmFyIGZuID0gbHNbaV07XG5cbiAgICAgICAgICAgICAgZm4oIG0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aW1lci5leGVjKCk7XG4gICAgICB9XG5cbiAgICB9KS50aGVuKGZ1bmN0aW9uKCB2ICl7XG4gICAgICBfcC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICBfcC5yYW4gPSB0cnVlO1xuXG4gICAgICBzZWxmLnRyaWdnZXIoJ3JhbicpO1xuXG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcblxuICAgIGlmKCBfcC5xdWV1ZSA9PSBudWxsICl7XG4gICAgICBfcC5xdWV1ZSA9IHJ1blA7IC8vIGkuZS4gZmlyc3Qgc3RlcCBvZiBpbmR1Y3RpdmUgcHJvbWlzZSBjaGFpbiAoZm9yIHF1ZXVlKVxuICAgIH1cblxuICAgIHJldHVybiBydW5QO1xuICB9LFxuXG4gIC8vIHNlbmQgdGhlIHRocmVhZCBhIG1lc3NhZ2VcbiAgbWVzc2FnZTogZnVuY3Rpb24oIG0gKXtcbiAgICB2YXIgX3AgPSB0aGlzLl9wcml2YXRlO1xuXG4gICAgaWYoIF9wLndlYndvcmtlciApe1xuICAgICAgX3Aud2Vid29ya2VyLnBvc3RNZXNzYWdlKCBtICk7XG4gICAgfVxuXG4gICAgaWYoIF9wLmNoaWxkICl7XG4gICAgICBfcC5jaGlsZC5zZW5kKCBtICk7XG4gICAgfVxuXG4gICAgaWYoIF9wLnRpbWVyICl7XG4gICAgICBfcC50aW1lci5tZXNzYWdlKCBtICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH0sXG5cbiAgc3RvcDogZnVuY3Rpb24oKXtcbiAgICB2YXIgX3AgPSB0aGlzLl9wcml2YXRlO1xuXG4gICAgaWYoIF9wLndlYndvcmtlciApe1xuICAgICAgX3Aud2Vid29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cblxuICAgIGlmKCBfcC5jaGlsZCApe1xuICAgICAgX3AuY2hpbGQua2lsbCgpO1xuICAgIH1cblxuICAgIGlmKCBfcC50aW1lciApe1xuICAgICAgLy8gbm90aGluZyB3ZSBjYW4gZG8gaWYgd2UndmUgcnVuIGEgdGltZW91dFxuICAgIH1cblxuICAgIF9wLnN0b3BwZWQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJpZ2dlcignc3RvcCcpOyAvLyBjaGFpbmluZ1xuICB9LFxuXG4gIHN0b3BwZWQ6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMuX3ByaXZhdGUuc3RvcHBlZDtcbiAgfVxuXG59KTtcblxuLy8gdHVybnMgYSBzdHJpbmdpZmllZCBmdW5jdGlvbiBpbnRvIGEgKHJlKW5hbWVkIGZ1bmN0aW9uXG52YXIgZm5BcyA9IGZ1bmN0aW9uKCBmbiwgbmFtZSApe1xuICB2YXIgZm5TdHIgPSBmbi50b1N0cmluZygpO1xuICBmblN0ciA9IGZuU3RyLnJlcGxhY2UoL2Z1bmN0aW9uXFxzKj9cXFMqP1xccyo/XFwoLywgJ2Z1bmN0aW9uICcgKyBuYW1lICsgJygnKTtcblxuICByZXR1cm4gZm5TdHI7XG59O1xuXG52YXIgZGVmaW5lRm5hbCA9IGZ1bmN0aW9uKCBvcHRzICl7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBmbmFsSW1wbCggZm4sIGFyZzEgKXtcbiAgICB2YXIgZm5TdHIgPSBmbkFzKCBmbiwgJ18kXyRfJyArIG9wdHMubmFtZSApO1xuXG4gICAgdGhpcy5yZXF1aXJlKCBmblN0ciApO1xuXG4gICAgcmV0dXJuIHRoaXMucnVuKCBbXG4gICAgICAnZnVuY3Rpb24oIGRhdGEgKXsnLFxuICAgICAgJyAgdmFyIG9yaWdSZXNvbHZlID0gcmVzb2x2ZTsnLFxuICAgICAgJyAgdmFyIHJlcyA9IFtdOycsXG4gICAgICAnICAnLFxuICAgICAgJyAgcmVzb2x2ZSA9IGZ1bmN0aW9uKCB2YWwgKXsnLFxuICAgICAgJyAgICByZXMucHVzaCggdmFsICk7JyxcbiAgICAgICcgIH07JyxcbiAgICAgICcgICcsXG4gICAgICAnICB2YXIgcmV0ID0gZGF0YS4nICsgb3B0cy5uYW1lICsgJyggXyRfJF8nICsgb3B0cy5uYW1lICsgKCBhcmd1bWVudHMubGVuZ3RoID4gMSA/ICcsICcgKyBKU09OLnN0cmluZ2lmeShhcmcxKSA6ICcnICkgKyAnICk7JyxcbiAgICAgICcgICcsXG4gICAgICAnICByZXNvbHZlID0gb3JpZ1Jlc29sdmU7JyxcbiAgICAgICcgIHJlc29sdmUoIHJlcy5sZW5ndGggPiAwID8gcmVzIDogcmV0ICk7JyxcbiAgICAgICd9J1xuICAgIF0uam9pbignXFxuJykgKTtcbiAgfTtcbn07XG5cbnV0aWwuZXh0ZW5kKHRoZGZuLCB7XG4gIHJlZHVjZTogZGVmaW5lRm5hbCh7IG5hbWU6ICdyZWR1Y2UnIH0pLFxuXG4gIHJlZHVjZVJpZ2h0OiBkZWZpbmVGbmFsKHsgbmFtZTogJ3JlZHVjZVJpZ2h0JyB9KSxcblxuICBtYXA6IGRlZmluZUZuYWwoeyBuYW1lOiAnbWFwJyB9KVxufSk7XG5cbi8vIGFsaWFzZXNcbnZhciBmbiA9IHRoZGZuO1xuZm4ucHJvbWlzZSA9IGZuLnJ1bjtcbmZuLnRlcm1pbmF0ZSA9IGZuLmhhbHQgPSBmbi5zdG9wO1xuZm4uaW5jbHVkZSA9IGZuLnJlcXVpcmU7XG5cbi8vIHB1bGwgaW4gZXZlbnQgYXBpc1xudXRpbC5leHRlbmQodGhkZm4sIHtcbiAgb246IGRlZmluZS5vbigpLFxuICBvbmU6IGRlZmluZS5vbih7IHVuYmluZFNlbGZPblRyaWdnZXI6IHRydWUgfSksXG4gIG9mZjogZGVmaW5lLm9mZigpLFxuICB0cmlnZ2VyOiBkZWZpbmUudHJpZ2dlcigpXG59KTtcblxuZGVmaW5lLmV2ZW50QWxpYXNlc09uKCB0aGRmbiApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRocmVhZDtcblxufSx7XCIuL2RlZmluZVwiOjEsXCIuL2V2ZW50XCI6MixcIi4vaXNcIjo1LFwiLi9wcm9taXNlXCI6NixcIi4vdXRpbFwiOjgsXCIuL3dpbmRvd1wiOjksXCJjaGlsZF9wcm9jZXNzXCI6dW5kZWZpbmVkLFwicGF0aFwiOnVuZGVmaW5lZH1dLDg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXMgPSBfZGVyZXFfKCcuL2lzJyk7XG52YXIgdXRpbDtcblxuLy8gdXRpbGl0eSBmdW5jdGlvbnMgb25seSBmb3IgaW50ZXJuYWwgdXNlXG51dGlsID0ge1xuXG4gIC8vIHRoZSBqcXVlcnkgZXh0ZW5kKCkgZnVuY3Rpb25cbiAgLy8gTkI6IG1vZGlmaWVkIHRvIHVzZSBpcyBldGMgc2luY2Ugd2UgY2FuJ3QgdXNlIGpxdWVyeSBmdW5jdGlvbnNcbiAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmUsXG4gICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICBpID0gMSxcbiAgICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgICBkZWVwID0gZmFsc2U7XG5cbiAgICAvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG4gICAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSAnYm9vbGVhbicgKSB7XG4gICAgICBkZWVwID0gdGFyZ2V0O1xuICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuICAgICAgLy8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgICAgaSA9IDI7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGNhc2Ugd2hlbiB0YXJnZXQgaXMgYSBzdHJpbmcgb3Igc29tZXRoaW5nIChwb3NzaWJsZSBpbiBkZWVwIGNvcHkpXG4gICAgaWYgKCB0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiAhaXMuZm4odGFyZ2V0KSApIHtcbiAgICAgIHRhcmdldCA9IHt9O1xuICAgIH1cblxuICAgIC8vIGV4dGVuZCBqUXVlcnkgaXRzZWxmIGlmIG9ubHkgb25lIGFyZ3VtZW50IGlzIHBhc3NlZFxuICAgIGlmICggbGVuZ3RoID09PSBpICkge1xuICAgICAgdGFyZ2V0ID0gdGhpcztcbiAgICAgIC0taTtcbiAgICB9XG5cbiAgICBmb3IgKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgIC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcbiAgICAgIGlmICggKG9wdGlvbnMgPSBhcmd1bWVudHNbIGkgXSkgIT0gbnVsbCApIHtcbiAgICAgICAgLy8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuICAgICAgICBmb3IgKCBuYW1lIGluIG9wdGlvbnMgKSB7XG4gICAgICAgICAgc3JjID0gdGFyZ2V0WyBuYW1lIF07XG4gICAgICAgICAgY29weSA9IG9wdGlvbnNbIG5hbWUgXTtcblxuICAgICAgICAgIC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3BcbiAgICAgICAgICBpZiAoIHRhcmdldCA9PT0gY29weSApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlY3Vyc2UgaWYgd2UncmUgbWVyZ2luZyBwbGFpbiBvYmplY3RzIG9yIGFycmF5c1xuICAgICAgICAgIGlmICggZGVlcCAmJiBjb3B5ICYmICggaXMucGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXMuYXJyYXkoY29weSkpICkgKSB7XG4gICAgICAgICAgICBpZiAoIGNvcHlJc0FycmF5ICkge1xuICAgICAgICAgICAgICBjb3B5SXNBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiBpcy5hcnJheShzcmMpID8gc3JjIDogW107XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzLnBsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG4gICAgICAgICAgICB0YXJnZXRbIG5hbWUgXSA9IHV0aWwuZXh0ZW5kKCBkZWVwLCBjbG9uZSwgY29weSApO1xuXG4gICAgICAgICAgLy8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuICAgICAgICAgIH0gZWxzZSBpZiAoIGNvcHkgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHRhcmdldFsgbmFtZSBdID0gY29weTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH0sXG5cbiAgZXJyb3I6IGZ1bmN0aW9uKCBtc2cgKXtcbiAgICBpZiggY29uc29sZSApe1xuICAgICAgaWYoIGNvbnNvbGUuZXJyb3IgKXtcbiAgICAgICAgY29uc29sZS5lcnJvci5hcHBseSggY29uc29sZSwgYXJndW1lbnRzICk7XG4gICAgICB9IGVsc2UgaWYoIGNvbnNvbGUubG9nICl7XG4gICAgICAgIGNvbnNvbGUubG9nLmFwcGx5KCBjb25zb2xlLCBhcmd1bWVudHMgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG1zZztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbXNnO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuXG59LHtcIi4vaXNcIjo1fV0sOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9ICggdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogd2luZG93ICk7XG5cbn0se31dfSx7fSxbNF0pKDQpXG59KTtcblxuXG4vLyMgc291cmNlTWFwcGluZ1VSTD13ZWF2ZXIuanMubWFwIiwid2luZG93LmZvb2dyYXBoID0ge1xuICAvKipcbiAgICogSW5zZXJ0IGEgdmVydGV4IGludG8gdGhpcyBncmFwaC5cbiAgICpcbiAgICogQHBhcmFtIHZlcnRleCBBIHZhbGlkIFZlcnRleCBpbnN0YW5jZVxuICAgKi9cbiAgaW5zZXJ0VmVydGV4OiBmdW5jdGlvbih2ZXJ0ZXgpIHtcbiAgICAgIHRoaXMudmVydGljZXMucHVzaCh2ZXJ0ZXgpO1xuICAgICAgdGhpcy52ZXJ0ZXhDb3VudCsrO1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIEluc2VydCBhbiBlZGdlIHZlcnRleDEgLS0+IHZlcnRleDIuXG4gICAqXG4gICAqIEBwYXJhbSBsYWJlbCBMYWJlbCBmb3IgdGhpcyBlZGdlXG4gICAqIEBwYXJhbSB3ZWlnaHQgV2VpZ2h0IG9mIHRoaXMgZWRnZVxuICAgKiBAcGFyYW0gdmVydGV4MSBTdGFydGluZyBWZXJ0ZXggaW5zdGFuY2VcbiAgICogQHBhcmFtIHZlcnRleDIgRW5kaW5nIFZlcnRleCBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIE5ld2x5IGNyZWF0ZWQgRWRnZSBpbnN0YW5jZVxuICAgKi9cbiAgaW5zZXJ0RWRnZTogZnVuY3Rpb24obGFiZWwsIHdlaWdodCwgdmVydGV4MSwgdmVydGV4Miwgc3R5bGUpIHtcbiAgICAgIHZhciBlMSA9IG5ldyBmb29ncmFwaC5FZGdlKGxhYmVsLCB3ZWlnaHQsIHZlcnRleDIsIHN0eWxlKTtcbiAgICAgIHZhciBlMiA9IG5ldyBmb29ncmFwaC5FZGdlKG51bGwsIHdlaWdodCwgdmVydGV4MSwgbnVsbCk7XG5cbiAgICAgIHZlcnRleDEuZWRnZXMucHVzaChlMSk7XG4gICAgICB2ZXJ0ZXgyLnJldmVyc2VFZGdlcy5wdXNoKGUyKTtcblxuICAgICAgcmV0dXJuIGUxO1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBlZGdlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVydGV4IFN0YXJ0aW5nIHZlcnRleFxuICAgKiBAcGFyYW0gZWRnZSBFZGdlIHRvIHJlbW92ZVxuICAgKi9cbiAgcmVtb3ZlRWRnZTogZnVuY3Rpb24odmVydGV4MSwgdmVydGV4Mikge1xuICAgICAgZm9yICh2YXIgaSA9IHZlcnRleDEuZWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHZlcnRleDEuZWRnZXNbaV0uZW5kVmVydGV4ID09IHZlcnRleDIpIHtcbiAgICAgICAgICB2ZXJ0ZXgxLmVkZ2VzLnNwbGljZShpLDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSB2ZXJ0ZXgyLnJldmVyc2VFZGdlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodmVydGV4Mi5yZXZlcnNlRWRnZXNbaV0uZW5kVmVydGV4ID09IHZlcnRleDEpIHtcbiAgICAgICAgICB2ZXJ0ZXgyLnJldmVyc2VFZGdlcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSB2ZXJ0ZXguXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJ0ZXggVmVydGV4IHRvIHJlbW92ZSBmcm9tIHRoZSBncmFwaFxuICAgKi9cbiAgcmVtb3ZlVmVydGV4OiBmdW5jdGlvbih2ZXJ0ZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSB2ZXJ0ZXguZWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlRWRnZSh2ZXJ0ZXgsIHZlcnRleC5lZGdlc1tpXS5lbmRWZXJ0ZXgpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gdmVydGV4LnJldmVyc2VFZGdlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFZGdlKHZlcnRleC5yZXZlcnNlRWRnZXNbaV0uZW5kVmVydGV4LCB2ZXJ0ZXgpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcbiAgICAgICAgaWYgKHRoaXMudmVydGljZXNbaV0gPT0gdmVydGV4KSB7XG4gICAgICAgICAgdGhpcy52ZXJ0aWNlcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnZlcnRleENvdW50LS07XG4gICAgfSxcblxuICAvKipcbiAgICogUGxvdHMgdGhpcyBncmFwaCB0byBhIGNhbnZhcy5cbiAgICpcbiAgICogQHBhcmFtIGNhbnZhcyBBIHByb3BlciBjYW52YXMgaW5zdGFuY2VcbiAgICovXG4gIHBsb3Q6IGZ1bmN0aW9uKGNhbnZhcykge1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgLyogRHJhdyBlZGdlcyBmaXJzdCAqL1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2ldO1xuICAgICAgICBpZiAoIXYuaGlkZGVuKSB7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2LmVkZ2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgZSA9IHYuZWRnZXNbal07XG4gICAgICAgICAgICAvKiBEcmF3IGVkZ2UgKGlmIG5vdCBoaWRkZW4pICovXG4gICAgICAgICAgICBpZiAoIWUuaGlkZGVuKVxuICAgICAgICAgICAgICBlLmRyYXcoY2FudmFzLCB2KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyogRHJhdyB0aGUgdmVydGljZXMuICovXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1tpXTtcblxuICAgICAgICAvKiBEcmF3IHZlcnRleCAoaWYgbm90IGhpZGRlbikgKi9cbiAgICAgICAgaWYgKCF2LmhpZGRlbilcbiAgICAgICAgICB2LmRyYXcoY2FudmFzKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gIC8qKlxuICAgKiBHcmFwaCBvYmplY3QgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsYWJlbCBMYWJlbCBvZiB0aGlzIGdyYXBoXG4gICAqIEBwYXJhbSBkaXJlY3RlZCB0cnVlIG9yIGZhbHNlXG4gICAqL1xuICBHcmFwaDogZnVuY3Rpb24gKGxhYmVsLCBkaXJlY3RlZCkge1xuICAgICAgLyogRmllbGRzLiAqL1xuICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBBcnJheSgpO1xuICAgICAgdGhpcy5kaXJlY3RlZCA9IGRpcmVjdGVkO1xuICAgICAgdGhpcy52ZXJ0ZXhDb3VudCA9IDA7XG5cbiAgICAgIC8qIEdyYXBoIG1ldGhvZHMuICovXG4gICAgICB0aGlzLmluc2VydFZlcnRleCA9IGZvb2dyYXBoLmluc2VydFZlcnRleDtcbiAgICAgIHRoaXMucmVtb3ZlVmVydGV4ID0gZm9vZ3JhcGgucmVtb3ZlVmVydGV4O1xuICAgICAgdGhpcy5pbnNlcnRFZGdlID0gZm9vZ3JhcGguaW5zZXJ0RWRnZTtcbiAgICAgIHRoaXMucmVtb3ZlRWRnZSA9IGZvb2dyYXBoLnJlbW92ZUVkZ2U7XG4gICAgICB0aGlzLnBsb3QgPSBmb29ncmFwaC5wbG90O1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIFZlcnRleCBvYmplY3QgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsYWJlbCBMYWJlbCBvZiB0aGlzIHZlcnRleFxuICAgKiBAcGFyYW0gbmV4dCBSZWZlcmVuY2UgdG8gdGhlIG5leHQgdmVydGV4IG9mIHRoaXMgZ3JhcGhcbiAgICogQHBhcmFtIGZpcnN0RWRnZSBGaXJzdCBlZGdlIG9mIGEgbGlua2VkIGxpc3Qgb2YgZWRnZXNcbiAgICovXG4gIFZlcnRleDogZnVuY3Rpb24obGFiZWwsIHgsIHksIHN0eWxlKSB7XG4gICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICB0aGlzLmVkZ2VzID0gbmV3IEFycmF5KCk7XG4gICAgICB0aGlzLnJldmVyc2VFZGdlcyA9IG5ldyBBcnJheSgpO1xuICAgICAgdGhpcy54ID0geDtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICB0aGlzLmR4ID0gMDtcbiAgICAgIHRoaXMuZHkgPSAwO1xuICAgICAgdGhpcy5sZXZlbCA9IC0xO1xuICAgICAgdGhpcy5udW1iZXJPZlBhcmVudHMgPSAwO1xuICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZTtcbiAgICAgIHRoaXMuZml4ZWQgPSBmYWxzZTsgICAgIC8vIEZpeGVkIHZlcnRpY2VzIGFyZSBzdGF0aWMgKHVubW92YWJsZSlcblxuICAgICAgaWYoc3R5bGUgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgeyAvLyBEZWZhdWx0XG4gICAgICAgICAgdGhpcy5zdHlsZSA9IG5ldyBmb29ncmFwaC5WZXJ0ZXhTdHlsZSgnZWxsaXBzZScsIDgwLCA0MCwgJyNmZmZmZmYnLCAnIzAwMDAwMCcsIHRydWUpO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgLyoqXG4gICAqIFZlcnRleFN0eWxlIG9iamVjdCB0eXBlIGZvciBkZWZpbmluZyB2ZXJ0ZXggc3R5bGUgb3B0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHNoYXBlIFNoYXBlIG9mIHRoZSB2ZXJ0ZXggKCdlbGxpcHNlJyBvciAncmVjdCcpXG4gICAqIEBwYXJhbSB3aWR0aCBXaWR0aCBpbiBweFxuICAgKiBAcGFyYW0gaGVpZ2h0IEhlaWdodCBpbiBweFxuICAgKiBAcGFyYW0gZmlsbENvbG9yIFRoZSBjb2xvciB3aXRoIHdoaWNoIHRoZSB2ZXJ0ZXggaXMgZHJhd24gKFJHQiBIRVggc3RyaW5nKVxuICAgKiBAcGFyYW0gYm9yZGVyQ29sb3IgVGhlIGNvbG9yIHdpdGggd2hpY2ggdGhlIGJvcmRlciBvZiB0aGUgdmVydGV4IGlzIGRyYXduIChSR0IgSEVYIHN0cmluZylcbiAgICogQHBhcmFtIHNob3dMYWJlbCBTaG93IHRoZSB2ZXJ0ZXggbGFiZWwgb3Igbm90XG4gICAqL1xuICBWZXJ0ZXhTdHlsZTogZnVuY3Rpb24oc2hhcGUsIHdpZHRoLCBoZWlnaHQsIGZpbGxDb2xvciwgYm9yZGVyQ29sb3IsIHNob3dMYWJlbCkge1xuICAgICAgdGhpcy5zaGFwZSA9IHNoYXBlO1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICB0aGlzLmZpbGxDb2xvciA9IGZpbGxDb2xvcjtcbiAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBib3JkZXJDb2xvcjtcbiAgICAgIHRoaXMuc2hvd0xhYmVsID0gc2hvd0xhYmVsO1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIEVkZ2Ugb2JqZWN0IGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbGFiZWwgTGFiZWwgb2YgdGhpcyBlZGdlXG4gICAqIEBwYXJhbSBuZXh0IE5leHQgZWRnZSByZWZlcmVuY2VcbiAgICogQHBhcmFtIHdlaWdodCBFZGdlIHdlaWdodFxuICAgKiBAcGFyYW0gZW5kVmVydGV4IERlc3RpbmF0aW9uIFZlcnRleCBpbnN0YW5jZVxuICAgKi9cbiAgRWRnZTogZnVuY3Rpb24gKGxhYmVsLCB3ZWlnaHQsIGVuZFZlcnRleCwgc3R5bGUpIHtcbiAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgIHRoaXMud2VpZ2h0ID0gd2VpZ2h0O1xuICAgICAgdGhpcy5lbmRWZXJ0ZXggPSBlbmRWZXJ0ZXg7XG4gICAgICB0aGlzLnN0eWxlID0gbnVsbDtcbiAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgIC8vIEN1cnZpbmcgaW5mb3JtYXRpb25cbiAgICAgIHRoaXMuY3VydmVkID0gZmFsc2U7XG4gICAgICB0aGlzLmNvbnRyb2xYID0gLTE7ICAgLy8gQ29udHJvbCBjb29yZGluYXRlcyBmb3IgQmV6aWVyIGN1cnZlIGRyYXdpbmdcbiAgICAgIHRoaXMuY29udHJvbFkgPSAtMTtcbiAgICAgIHRoaXMub3JpZ2luYWwgPSBudWxsOyAvLyBJZiB0aGlzIGlzIGEgdGVtcG9yYXJ5IGVkZ2UgaXQgaG9sZHMgdGhlIG9yaWdpbmFsIGVkZ2VcblxuICAgICAgaWYoc3R5bGUgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG4gICAgICB9XG4gICAgICBlbHNlIHsgIC8vIFNldCB0byBkZWZhdWx0XG4gICAgICAgIHRoaXMuc3R5bGUgPSBuZXcgZm9vZ3JhcGguRWRnZVN0eWxlKDIsICcjMDAwMDAwJywgdHJ1ZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH0sXG5cblxuXG4gIC8qKlxuICAgKiBFZGdlU3R5bGUgb2JqZWN0IHR5cGUgZm9yIGRlZmluaW5nIHZlcnRleCBzdHlsZSBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gd2lkdGggRWRnZSBsaW5lIHdpZHRoXG4gICAqIEBwYXJhbSBjb2xvciBUaGUgY29sb3Igd2l0aCB3aGljaCB0aGUgZWRnZSBpcyBkcmF3blxuICAgKiBAcGFyYW0gc2hvd0Fycm93IERyYXcgdGhlIGVkZ2UgYXJyb3cgKG9ubHkgaWYgZGlyZWN0ZWQpXG4gICAqIEBwYXJhbSBzaG93TGFiZWwgU2hvdyB0aGUgZWRnZSBsYWJlbCBvciBub3RcbiAgICovXG4gIEVkZ2VTdHlsZTogZnVuY3Rpb24od2lkdGgsIGNvbG9yLCBzaG93QXJyb3csIHNob3dMYWJlbCkge1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgdGhpcy5zaG93QXJyb3cgPSBzaG93QXJyb3c7XG4gICAgICB0aGlzLnNob3dMYWJlbCA9IHNob3dMYWJlbDtcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBmb29ncmFwaCBKYXZhc2NyaXB0IGdyYXBoIGxpYnJhcnkuXG4gICAqXG4gICAqIERlc2NyaXB0aW9uOiBSYW5kb20gdmVydGV4IGxheW91dCBtYW5hZ2VyXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHdpZHRoIExheW91dCB3aWR0aFxuICAgKiBAcGFyYW0gaGVpZ2h0IExheW91dCBoZWlnaHRcbiAgICovXG4gIFJhbmRvbVZlcnRleExheW91dDogZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sXG5cblxuICAvKipcbiAgICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZm9vZ3JhcGggSmF2YXNjcmlwdCBncmFwaCBsaWJyYXJ5LlxuICAgKlxuICAgKiBEZXNjcmlwdGlvbjogRnJ1Y2h0ZXJtYW4tUmVpbmdvbGQgZm9yY2UtZGlyZWN0ZWQgdmVydGV4XG4gICAqICAgICAgICAgICAgICBsYXlvdXQgbWFuYWdlclxuICAgKi9cblxuICAvKipcbiAgICogQ2xhc3MgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB3aWR0aCBMYXlvdXQgd2lkdGhcbiAgICogQHBhcmFtIGhlaWdodCBMYXlvdXQgaGVpZ2h0XG4gICAqIEBwYXJhbSBpdGVyYXRpb25zIE51bWJlciBvZiBpdGVyYXRpb25zIC1cbiAgICogd2l0aCBtb3JlIGl0ZXJhdGlvbnMgaXQgaXMgbW9yZSBsaWtlbHkgdGhlIGxheW91dCBoYXMgY29udmVyZ2VkIGludG8gYSBzdGF0aWMgZXF1aWxpYnJpdW0uXG4gICAqL1xuICBGb3JjZURpcmVjdGVkVmVydGV4TGF5b3V0OiBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgaXRlcmF0aW9ucywgcmFuZG9taXplLCBlcHMpIHtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5pdGVyYXRpb25zID0gaXRlcmF0aW9ucztcbiAgICAgIHRoaXMucmFuZG9taXplID0gcmFuZG9taXplO1xuICAgICAgdGhpcy5lcHMgPSBlcHM7XG4gICAgICB0aGlzLmNhbGxiYWNrID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9LFxuXG4gIEE6IDEuNSwgLy8gRmluZSB0dW5lIGF0dHJhY3Rpb25cblxuICBSOiAwLjUgIC8vIEZpbmUgdHVuZSByZXB1bHNpb25cbn07XG5cbi8qKlxuICogdG9TdHJpbmcgb3ZlcmxvYWQgZm9yIGVhc2llciBkZWJ1Z2dpbmdcbiAqL1xuZm9vZ3JhcGguVmVydGV4LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJbdjpcIiArIHRoaXMubGFiZWwgKyBcIl0gXCI7XG59O1xuXG4vKipcbiAqIHRvU3RyaW5nIG92ZXJsb2FkIGZvciBlYXNpZXIgZGVidWdnaW5nXG4gKi9cbmZvb2dyYXBoLkVkZ2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIltlOlwiICsgdGhpcy5lbmRWZXJ0ZXgubGFiZWwgKyBcIl0gXCI7XG59O1xuXG4vKipcbiAqIERyYXcgdmVydGV4IG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0gY2FudmFzIGpzR3JhcGhpY3MgaW5zdGFuY2VcbiAqL1xuZm9vZ3JhcGguVmVydGV4LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gIHZhciB4ID0gdGhpcy54O1xuICB2YXIgeSA9IHRoaXMueTtcbiAgdmFyIHdpZHRoID0gdGhpcy5zdHlsZS53aWR0aDtcbiAgdmFyIGhlaWdodCA9IHRoaXMuc3R5bGUuaGVpZ2h0O1xuICB2YXIgc2hhcGUgPSB0aGlzLnN0eWxlLnNoYXBlO1xuXG4gIGNhbnZhcy5zZXRTdHJva2UoMik7XG4gIGNhbnZhcy5zZXRDb2xvcih0aGlzLnN0eWxlLmZpbGxDb2xvcik7XG5cbiAgaWYoc2hhcGUgPT0gJ3JlY3QnKSB7XG4gICAgY2FudmFzLmZpbGxSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNhbnZhcy5zZXRDb2xvcih0aGlzLnN0eWxlLmJvcmRlckNvbG9yKTtcbiAgICBjYW52YXMuZHJhd1JlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gIH1cbiAgZWxzZSB7IC8vIERlZmF1bHQgdG8gZWxsaXBzZVxuICAgIGNhbnZhcy5maWxsRWxsaXBzZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjYW52YXMuc2V0Q29sb3IodGhpcy5zdHlsZS5ib3JkZXJDb2xvcik7XG4gICAgY2FudmFzLmRyYXdFbGxpcHNlKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICB9XG5cbiAgaWYodGhpcy5zdHlsZS5zaG93TGFiZWwpIHtcbiAgICBjYW52YXMuZHJhd1N0cmluZ1JlY3QodGhpcy5sYWJlbCwgeCwgeSArIGhlaWdodC8yIC0gNywgd2lkdGgsICdjZW50ZXInKTtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXRzIHRoZSBncmFwaCBpbnRvIHRoZSBib3VuZGluZyBib3hcbiAqXG4gKiBAcGFyYW0gd2lkdGhcbiAqIEBwYXJhbSBoZWlnaHRcbiAqIEBwYXJhbSBwcmVzZXJ2ZUFzcGVjdFxuICovXG5mb29ncmFwaC5HcmFwaC5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgcHJlc2VydmVBc3BlY3QpIHtcbiAgZm9yICh2YXIgaTggaW4gdGhpcy52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlc1tpOF07XG4gICAgdi5vbGRYID0gdi54O1xuICAgIHYub2xkWSA9IHYueTtcbiAgfVxuICB2YXIgbW54ID0gd2lkdGggICogMC4xO1xuICB2YXIgbXh4ID0gd2lkdGggICogMC45O1xuICB2YXIgbW55ID0gaGVpZ2h0ICogMC4xO1xuICB2YXIgbXh5ID0gaGVpZ2h0ICogMC45O1xuICBpZiAocHJlc2VydmVBc3BlY3QgPT0gbnVsbClcbiAgICBwcmVzZXJ2ZUFzcGVjdCA9IHRydWU7XG5cbiAgdmFyIG1pbnggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICB2YXIgbWlueSA9IE51bWJlci5NQVhfVkFMVUU7XG4gIHZhciBtYXh4ID0gTnVtYmVyLk1JTl9WQUxVRTtcbiAgdmFyIG1heHkgPSBOdW1iZXIuTUlOX1ZBTFVFO1xuXG4gIGZvciAodmFyIGk3IGluIHRoaXMudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IHRoaXMudmVydGljZXNbaTddO1xuICAgIGlmICh2LnggPCBtaW54KSBtaW54ID0gdi54O1xuICAgIGlmICh2LnkgPCBtaW55KSBtaW55ID0gdi55O1xuICAgIGlmICh2LnggPiBtYXh4KSBtYXh4ID0gdi54O1xuICAgIGlmICh2LnkgPiBtYXh5KSBtYXh5ID0gdi55O1xuICB9XG4gIHZhciBreCA9IChteHgtbW54KSAvIChtYXh4IC0gbWlueCk7XG4gIHZhciBreSA9IChteHktbW55KSAvIChtYXh5IC0gbWlueSk7XG5cbiAgaWYgKHByZXNlcnZlQXNwZWN0KSB7XG4gICAga3ggPSBNYXRoLm1pbihreCwga3kpO1xuICAgIGt5ID0gTWF0aC5taW4oa3gsIGt5KTtcbiAgfVxuXG4gIHZhciBuZXdNYXh4ID0gTnVtYmVyLk1JTl9WQUxVRTtcbiAgdmFyIG5ld01heHkgPSBOdW1iZXIuTUlOX1ZBTFVFO1xuICBmb3IgKHZhciBpOCBpbiB0aGlzLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2k4XTtcbiAgICB2LnggPSAodi54IC0gbWlueCkgKiBreDtcbiAgICB2LnkgPSAodi55IC0gbWlueSkgKiBreTtcbiAgICBpZiAodi54ID4gbmV3TWF4eCkgbmV3TWF4eCA9IHYueDtcbiAgICBpZiAodi55ID4gbmV3TWF4eSkgbmV3TWF4eSA9IHYueTtcbiAgfVxuXG4gIHZhciBkeCA9ICggd2lkdGggIC0gbmV3TWF4eCApIC8gMi4wO1xuICB2YXIgZHkgPSAoIGhlaWdodCAtIG5ld01heHkgKSAvIDIuMDtcbiAgZm9yICh2YXIgaTggaW4gdGhpcy52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlc1tpOF07XG4gICAgdi54ICs9IGR4O1xuICAgIHYueSArPSBkeTtcbiAgfVxufTtcblxuLyoqXG4gKiBEcmF3IGVkZ2UgbWV0aG9kLiBEcmF3cyBlZGdlIFwidlwiIC0tPiBcInRoaXNcIi5cbiAqXG4gKiBAcGFyYW0gY2FudmFzIGpzR3JhcGhpY3MgaW5zdGFuY2VcbiAqIEBwYXJhbSB2IFN0YXJ0IHZlcnRleFxuICovXG5mb29ncmFwaC5FZGdlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCB2KSB7XG4gIHZhciB4MSA9IE1hdGgucm91bmQodi54ICsgdi5zdHlsZS53aWR0aC8yKTtcbiAgdmFyIHkxID0gTWF0aC5yb3VuZCh2LnkgKyB2LnN0eWxlLmhlaWdodC8yKTtcbiAgdmFyIHgyID0gTWF0aC5yb3VuZCh0aGlzLmVuZFZlcnRleC54ICsgdGhpcy5lbmRWZXJ0ZXguc3R5bGUud2lkdGgvMik7XG4gIHZhciB5MiA9IE1hdGgucm91bmQodGhpcy5lbmRWZXJ0ZXgueSArIHRoaXMuZW5kVmVydGV4LnN0eWxlLmhlaWdodC8yKTtcblxuICAvLyBDb250cm9sIHBvaW50IChuZWVkZWQgb25seSBmb3IgY3VydmVkIGVkZ2VzKVxuICB2YXIgeDMgPSB0aGlzLmNvbnRyb2xYO1xuICB2YXIgeTMgPSB0aGlzLmNvbnRyb2xZO1xuXG4gIC8vIEFycm93IHRpcCBhbmQgYW5nbGVcbiAgdmFyIFhfVElQLCBZX1RJUCwgQU5HTEU7XG5cbiAgLyogUXVhZHJpYyBCZXppZXIgY3VydmUgZGVmaW5pdGlvbi4gKi9cbiAgZnVuY3Rpb24gQngodCkgeyByZXR1cm4gKDEtdCkqKDEtdCkqeDEgKyAyKigxLXQpKnQqeDMgKyB0KnQqeDI7IH1cbiAgZnVuY3Rpb24gQnkodCkgeyByZXR1cm4gKDEtdCkqKDEtdCkqeTEgKyAyKigxLXQpKnQqeTMgKyB0KnQqeTI7IH1cblxuICBjYW52YXMuc2V0U3Ryb2tlKHRoaXMuc3R5bGUud2lkdGgpO1xuICBjYW52YXMuc2V0Q29sb3IodGhpcy5zdHlsZS5jb2xvcik7XG5cbiAgaWYodGhpcy5jdXJ2ZWQpIHsgLy8gRHJhdyBhIHF1YWRyaWMgQmV6aWVyIGN1cnZlXG4gICAgdGhpcy5jdXJ2ZWQgPSBmYWxzZTsgLy8gUmVzZXRcbiAgICB2YXIgdCA9IDAsIGR0ID0gMS8xMDtcbiAgICB2YXIgeHMgPSB4MSwgeXMgPSB5MSwgeG4sIHluO1xuXG4gICAgd2hpbGUgKHQgPCAxLWR0KSB7XG4gICAgICB0ICs9IGR0O1xuICAgICAgeG4gPSBCeCh0KTtcbiAgICAgIHluID0gQnkodCk7XG4gICAgICBjYW52YXMuZHJhd0xpbmUoeHMsIHlzLCB4biwgeW4pO1xuICAgICAgeHMgPSB4bjtcbiAgICAgIHlzID0geW47XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBhcnJvdyB0aXAgY29vcmRpbmF0ZXNcbiAgICBYX1RJUCA9IHhzO1xuICAgIFlfVElQID0geXM7XG5cbiAgICAvLyBNb3ZlIHRoZSB0aXAgdG8gKDAsMCkgYW5kIGNhbGN1bGF0ZSB0aGUgYW5nbGVcbiAgICAvLyBvZiB0aGUgYXJyb3cgaGVhZFxuICAgIEFOR0xFID0gYW5ndWxhckNvb3JkKEJ4KDEtMipkdCkgLSBYX1RJUCwgQnkoMS0yKmR0KSAtIFlfVElQKTtcblxuICB9IGVsc2Uge1xuICAgIGNhbnZhcy5kcmF3TGluZSh4MSwgeTEsIHgyLCB5Mik7XG5cbiAgICAvLyBTZXQgdGhlIGFycm93IHRpcCBjb29yZGluYXRlc1xuICAgIFhfVElQID0geDI7XG4gICAgWV9USVAgPSB5MjtcblxuICAgIC8vIE1vdmUgdGhlIHRpcCB0byAoMCwwKSBhbmQgY2FsY3VsYXRlIHRoZSBhbmdsZVxuICAgIC8vIG9mIHRoZSBhcnJvdyBoZWFkXG4gICAgQU5HTEUgPSBhbmd1bGFyQ29vcmQoeDEgLSBYX1RJUCwgeTEgLSBZX1RJUCk7XG4gIH1cblxuICBpZih0aGlzLnN0eWxlLnNob3dBcnJvdykge1xuICAgIGRyYXdBcnJvdyhBTkdMRSwgWF9USVAsIFlfVElQKTtcbiAgfVxuXG4gIC8vIFRPRE9cbiAgaWYodGhpcy5zdHlsZS5zaG93TGFiZWwpIHtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3cyBhbiBlZGdlIGFycm93LlxuICAgKiBAcGFyYW0gcGhpIFRoZSBhbmdsZSAoaW4gcmFkaWFucykgb2YgdGhlIGFycm93IGluIHBvbGFyIGNvb3JkaW5hdGVzLlxuICAgKiBAcGFyYW0geCBYIGNvb3JkaW5hdGUgb2YgdGhlIGFycm93IHRpcC5cbiAgICogQHBhcmFtIHkgWSBjb29yZGluYXRlIG9mIHRoZSBhcnJvdyB0aXAuXG4gICAqL1xuICBmdW5jdGlvbiBkcmF3QXJyb3cocGhpLCB4LCB5KVxuICB7XG4gICAgLy8gQXJyb3cgYm91bmRpbmcgYm94IChpbiBweClcbiAgICB2YXIgSCA9IDUwO1xuICAgIHZhciBXID0gMTA7XG5cbiAgICAvLyBTZXQgY2FydGVzaWFuIGNvb3JkaW5hdGVzIG9mIHRoZSBhcnJvd1xuICAgIHZhciBwMTEgPSAwLCBwMTIgPSAwO1xuICAgIHZhciBwMjEgPSBILCBwMjIgPSBXLzI7XG4gICAgdmFyIHAzMSA9IEgsIHAzMiA9IC1XLzI7XG5cbiAgICAvLyBDb252ZXJ0IHRvIHBvbGFyIGNvb3JkaW5hdGVzXG4gICAgdmFyIHIyID0gcmFkaWFsQ29vcmQocDIxLCBwMjIpO1xuICAgIHZhciByMyA9IHJhZGlhbENvb3JkKHAzMSwgcDMyKTtcbiAgICB2YXIgcGhpMiA9IGFuZ3VsYXJDb29yZChwMjEsIHAyMik7XG4gICAgdmFyIHBoaTMgPSBhbmd1bGFyQ29vcmQocDMxLCBwMzIpO1xuXG4gICAgLy8gUm90YXRlIHRoZSBhcnJvd1xuICAgIHBoaTIgKz0gcGhpO1xuICAgIHBoaTMgKz0gcGhpO1xuXG4gICAgLy8gVXBkYXRlIGNhcnRlc2lhbiBjb29yZGluYXRlc1xuICAgIHAyMSA9IHIyICogTWF0aC5jb3MocGhpMik7XG4gICAgcDIyID0gcjIgKiBNYXRoLnNpbihwaGkyKTtcbiAgICBwMzEgPSByMyAqIE1hdGguY29zKHBoaTMpO1xuICAgIHAzMiA9IHIzICogTWF0aC5zaW4ocGhpMyk7XG5cbiAgICAvLyBUcmFuc2xhdGVcbiAgICBwMTEgKz0geDtcbiAgICBwMTIgKz0geTtcbiAgICBwMjEgKz0geDtcbiAgICBwMjIgKz0geTtcbiAgICBwMzEgKz0geDtcbiAgICBwMzIgKz0geTtcblxuICAgIC8vIERyYXdcbiAgICBjYW52YXMuZmlsbFBvbHlnb24obmV3IEFycmF5KHAxMSwgcDIxLCBwMzEpLCBuZXcgQXJyYXkocDEyLCBwMjIsIHAzMikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYW5ndWxhciBjb29yZGluYXRlLlxuICAgKiBAcGFyYW0geCBYIGNvb3JkaW5hdGVcbiAgICogQHBhcmFtIHkgWSBjb29yZGluYXRlXG4gICAqL1xuICAgZnVuY3Rpb24gYW5ndWxhckNvb3JkKHgsIHkpXG4gICB7XG4gICAgIHZhciBwaGkgPSAwLjA7XG5cbiAgICAgaWYgKHggPiAwICYmIHkgPj0gMCkge1xuICAgICAgcGhpID0gTWF0aC5hdGFuKHkveCk7XG4gICAgIH1cbiAgICAgaWYgKHggPiAwICYmIHkgPCAwKSB7XG4gICAgICAgcGhpID0gTWF0aC5hdGFuKHkveCkgKyAyKk1hdGguUEk7XG4gICAgIH1cbiAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgcGhpID0gTWF0aC5hdGFuKHkveCkgKyBNYXRoLlBJO1xuICAgICB9XG4gICAgIGlmICh4ID0gMCAmJiB5ID4gMCkge1xuICAgICAgIHBoaSA9IE1hdGguUEkvMjtcbiAgICAgfVxuICAgICBpZiAoeCA9IDAgJiYgeSA8IDApIHtcbiAgICAgICBwaGkgPSAzKk1hdGguUEkvMjtcbiAgICAgfVxuXG4gICAgIHJldHVybiBwaGk7XG4gICB9XG5cbiAgIC8qKlxuICAgICogR2V0IHRoZSByYWRpYW4gY29vcmRpYW50ZS5cbiAgICAqIEBwYXJhbSB4MVxuICAgICogQHBhcmFtIHkxXG4gICAgKiBAcGFyYW0geDJcbiAgICAqIEBwYXJhbSB5MlxuICAgICovXG4gICBmdW5jdGlvbiByYWRpYWxDb29yZCh4LCB5KVxuICAge1xuICAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSk7XG4gICB9XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGNvb3JkaW5hdGVzIGJhc2VkIG9uIHB1cmUgY2hhbmNlLlxuICpcbiAqIEBwYXJhbSBncmFwaCBBIHZhbGlkIGdyYXBoIGluc3RhbmNlXG4gKi9cbmZvb2dyYXBoLlJhbmRvbVZlcnRleExheW91dC5wcm90b3R5cGUubGF5b3V0ID0gZnVuY3Rpb24oZ3JhcGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGk8Z3JhcGgudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2ldO1xuICAgIHYueCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMud2lkdGgpO1xuICAgIHYueSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuaGVpZ2h0KTtcbiAgfVxufTtcblxuLyoqXG4gKiBJZGVudGlmaWVzIGNvbm5lY3RlZCBjb21wb25lbnRzIG9mIGEgZ3JhcGggYW5kIGNyZWF0ZXMgXCJjZW50cmFsXCJcbiAqIHZlcnRpY2VzIGZvciBlYWNoIGNvbXBvbmVudC4gSWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBjb21wb25lbnQsXG4gKiBhbGwgY2VudHJhbCB2ZXJ0aWNlcyBvZiBpbmRpdmlkdWFsIGNvbXBvbmVudHMgYXJlIGNvbm5lY3RlZCB0b1xuICogZWFjaCBvdGhlciB0byBwcmV2ZW50IGNvbXBvbmVudCBkcmlmdC5cbiAqXG4gKiBAcGFyYW0gZ3JhcGggQSB2YWxpZCBncmFwaCBpbnN0YW5jZVxuICogQHJldHVybiBBIGxpc3Qgb2YgY29tcG9uZW50IGNlbnRlciB2ZXJ0aWNlcyBvciBudWxsIHdoZW4gdGhlcmVcbiAqICAgICAgICAgaXMgb25seSBvbmUgY29tcG9uZW50LlxuICovXG5mb29ncmFwaC5Gb3JjZURpcmVjdGVkVmVydGV4TGF5b3V0LnByb3RvdHlwZS5fX2lkZW50aWZ5Q29tcG9uZW50cyA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIHZhciBjb21wb25lbnRDZW50ZXJzID0gbmV3IEFycmF5KCk7XG4gIHZhciBjb21wb25lbnRzID0gbmV3IEFycmF5KCk7XG5cbiAgLy8gRGVwdGggZmlyc3Qgc2VhcmNoXG4gIGZ1bmN0aW9uIGRmcyh2ZXJ0ZXgpXG4gIHtcbiAgICB2YXIgc3RhY2sgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgY29tcG9uZW50ID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIGNlbnRlclZlcnRleCA9IG5ldyBmb29ncmFwaC5WZXJ0ZXgoXCJjb21wb25lbnRfY2VudGVyXCIsIC0xLCAtMSk7XG4gICAgY2VudGVyVmVydGV4LmhpZGRlbiA9IHRydWU7XG4gICAgY29tcG9uZW50Q2VudGVycy5wdXNoKGNlbnRlclZlcnRleCk7XG4gICAgY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiB2aXNpdFZlcnRleCh2KVxuICAgIHtcbiAgICAgIGNvbXBvbmVudC5wdXNoKHYpO1xuICAgICAgdi5fX2Rmc1Zpc2l0ZWQgPSB0cnVlO1xuXG4gICAgICBmb3IgKHZhciBpIGluIHYuZWRnZXMpIHtcbiAgICAgICAgdmFyIGUgPSB2LmVkZ2VzW2ldO1xuICAgICAgICBpZiAoIWUuaGlkZGVuKVxuICAgICAgICAgIHN0YWNrLnB1c2goZS5lbmRWZXJ0ZXgpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpIGluIHYucmV2ZXJzZUVkZ2VzKSB7XG4gICAgICAgIGlmICghdi5yZXZlcnNlRWRnZXNbaV0uaGlkZGVuKVxuICAgICAgICAgIHN0YWNrLnB1c2godi5yZXZlcnNlRWRnZXNbaV0uZW5kVmVydGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2aXNpdFZlcnRleCh2ZXJ0ZXgpO1xuICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgdSA9IHN0YWNrLnBvcCgpO1xuXG4gICAgICBpZiAoIXUuX19kZnNWaXNpdGVkICYmICF1LmhpZGRlbikge1xuICAgICAgICB2aXNpdFZlcnRleCh1KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDbGVhciBERlMgdmlzaXRlZCBmbGFnXG4gIGZvciAodmFyIGkgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2ldO1xuICAgIHYuX19kZnNWaXNpdGVkID0gZmFsc2U7XG4gIH1cblxuICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIHZlcnRpY2VzIHN0YXJ0aW5nIERGUyBmcm9tIGVhY2ggdmVydGV4XG4gIC8vIHRoYXQgaGFzbid0IGJlZW4gdmlzaXRlZCB5ZXQuXG4gIGZvciAodmFyIGsgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IGdyYXBoLnZlcnRpY2VzW2tdO1xuICAgIGlmICghdi5fX2Rmc1Zpc2l0ZWQgJiYgIXYuaGlkZGVuKVxuICAgICAgZGZzKHYpO1xuICB9XG5cbiAgLy8gSW50ZXJjb25uZWN0IGFsbCBjZW50ZXIgdmVydGljZXNcbiAgaWYgKGNvbXBvbmVudENlbnRlcnMubGVuZ3RoID4gMSkge1xuICAgIGZvciAodmFyIGkgaW4gY29tcG9uZW50Q2VudGVycykge1xuICAgICAgZ3JhcGguaW5zZXJ0VmVydGV4KGNvbXBvbmVudENlbnRlcnNbaV0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpIGluIGNvbXBvbmVudHMpIHtcbiAgICAgIGZvciAodmFyIGogaW4gY29tcG9uZW50c1tpXSkge1xuICAgICAgICAvLyBDb25uZWN0IHZpc2l0ZWQgdmVydGV4IHRvIFwiY2VudHJhbFwiIGNvbXBvbmVudCB2ZXJ0ZXhcbiAgICAgICAgZWRnZSA9IGdyYXBoLmluc2VydEVkZ2UoXCJcIiwgMSwgY29tcG9uZW50c1tpXVtqXSwgY29tcG9uZW50Q2VudGVyc1tpXSk7XG4gICAgICAgIGVkZ2UuaGlkZGVuID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpIGluIGNvbXBvbmVudENlbnRlcnMpIHtcbiAgICAgIGZvciAodmFyIGogaW4gY29tcG9uZW50Q2VudGVycykge1xuICAgICAgICBpZiAoaSAhPSBqKSB7XG4gICAgICAgICAgZSA9IGdyYXBoLmluc2VydEVkZ2UoXCJcIiwgMywgY29tcG9uZW50Q2VudGVyc1tpXSwgY29tcG9uZW50Q2VudGVyc1tqXSk7XG4gICAgICAgICAgZS5oaWRkZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBvbmVudENlbnRlcnM7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgY29vcmRpbmF0ZXMgYmFzZWQgb24gZm9yY2UtZGlyZWN0ZWQgcGxhY2VtZW50XG4gKiBhbGdvcml0aG0uXG4gKlxuICogQHBhcmFtIGdyYXBoIEEgdmFsaWQgZ3JhcGggaW5zdGFuY2VcbiAqL1xuZm9vZ3JhcGguRm9yY2VEaXJlY3RlZFZlcnRleExheW91dC5wcm90b3R5cGUubGF5b3V0ID0gZnVuY3Rpb24oZ3JhcGgpIHtcbiAgdGhpcy5ncmFwaCA9IGdyYXBoO1xuICB2YXIgYXJlYSA9IHRoaXMud2lkdGggKiB0aGlzLmhlaWdodDtcbiAgdmFyIGsgPSBNYXRoLnNxcnQoYXJlYSAvIGdyYXBoLnZlcnRleENvdW50KTtcblxuICB2YXIgdCA9IHRoaXMud2lkdGggLyAxMDsgLy8gVGVtcGVyYXR1cmUuXG4gIHZhciBkdCA9IHQgLyAodGhpcy5pdGVyYXRpb25zICsgMSk7XG5cbiAgdmFyIGVwcyA9IHRoaXMuZXBzOyAvLyBNaW5pbXVtIGRpc3RhbmNlIGJldHdlZW4gdGhlIHZlcnRpY2VzXG5cbiAgLy8gQXR0cmFjdGl2ZSBhbmQgcmVwdWxzaXZlIGZvcmNlc1xuICBmdW5jdGlvbiBGYSh6KSB7IHJldHVybiBmb29ncmFwaC5BKnoqei9rOyB9XG4gIGZ1bmN0aW9uIEZyKHopIHsgcmV0dXJuIGZvb2dyYXBoLlIqayprL3o7IH1cbiAgZnVuY3Rpb24gRncoeikgeyByZXR1cm4gMS96Kno7IH0gIC8vIEZvcmNlIGVtaXRlZCBieSB0aGUgd2FsbHNcblxuICAvLyBJbml0aWF0ZSBjb21wb25lbnQgaWRlbnRpZmljYXRpb24gYW5kIHZpcnR1YWwgdmVydGV4IGNyZWF0aW9uXG4gIC8vIHRvIHByZXZlbnQgZGlzY29ubmVjdGVkIGdyYXBoIGNvbXBvbmVudHMgZnJvbSBkcmlmdGluZyB0b28gZmFyIGFwYXJ0XG4gIGNlbnRlcnMgPSB0aGlzLl9faWRlbnRpZnlDb21wb25lbnRzKGdyYXBoKTtcblxuICAvLyBBc3NpZ24gaW5pdGlhbCByYW5kb20gcG9zaXRpb25zXG4gIGlmKHRoaXMucmFuZG9taXplKSB7XG4gICAgcmFuZG9tTGF5b3V0ID0gbmV3IGZvb2dyYXBoLlJhbmRvbVZlcnRleExheW91dCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgcmFuZG9tTGF5b3V0LmxheW91dChncmFwaCk7XG4gIH1cblxuICAvLyBSdW4gdGhyb3VnaCBzb21lIGl0ZXJhdGlvbnNcbiAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLml0ZXJhdGlvbnM7IHErKykge1xuXG4gICAgLyogQ2FsY3VsYXRlIHJlcHVsc2l2ZSBmb3JjZXMuICovXG4gICAgZm9yICh2YXIgaTEgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNbaTFdO1xuXG4gICAgICB2LmR4ID0gMDtcbiAgICAgIHYuZHkgPSAwO1xuICAgICAgLy8gRG8gbm90IG1vdmUgZml4ZWQgdmVydGljZXNcbiAgICAgIGlmKCF2LmZpeGVkKSB7XG4gICAgICAgIGZvciAodmFyIGkyIGluIGdyYXBoLnZlcnRpY2VzKSB7XG4gICAgICAgICAgdmFyIHUgPSBncmFwaC52ZXJ0aWNlc1tpMl07XG4gICAgICAgICAgaWYgKHYgIT0gdSAmJiAhdS5maXhlZCkge1xuICAgICAgICAgICAgLyogRGlmZmVyZW5jZSB2ZWN0b3IgYmV0d2VlbiB0aGUgdHdvIHZlcnRpY2VzLiAqL1xuICAgICAgICAgICAgdmFyIGRpZnggPSB2LnggLSB1Lng7XG4gICAgICAgICAgICB2YXIgZGlmeSA9IHYueSAtIHUueTtcblxuICAgICAgICAgICAgLyogTGVuZ3RoIG9mIHRoZSBkaWYgdmVjdG9yLiAqL1xuICAgICAgICAgICAgdmFyIGQgPSBNYXRoLm1heChlcHMsIE1hdGguc3FydChkaWZ4KmRpZnggKyBkaWZ5KmRpZnkpKTtcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IEZyKGQpO1xuICAgICAgICAgICAgdi5keCA9IHYuZHggKyAoZGlmeC9kKSAqIGZvcmNlO1xuICAgICAgICAgICAgdi5keSA9IHYuZHkgKyAoZGlmeS9kKSAqIGZvcmNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKiBUcmVhdCB0aGUgd2FsbHMgYXMgc3RhdGljIG9iamVjdHMgZW1pdGluZyBmb3JjZSBGdy4gKi9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBzdW0gb2YgXCJ3YWxsXCIgZm9yY2VzIGluICh2LngsIHYueSlcbiAgICAgICAgLypcbiAgICAgICAgdmFyIHggPSBNYXRoLm1heChlcHMsIHYueCk7XG4gICAgICAgIHZhciB5ID0gTWF0aC5tYXgoZXBzLCB2LnkpO1xuICAgICAgICB2YXIgd3ggPSBNYXRoLm1heChlcHMsIHRoaXMud2lkdGggLSB2LngpO1xuICAgICAgICB2YXIgd3kgPSBNYXRoLm1heChlcHMsIHRoaXMuaGVpZ2h0IC0gdi55KTsgICAvLyBHb3R0YSBsb3ZlIGFsbCB0aG9zZSBOYU4ncyA6KVxuICAgICAgICB2YXIgUnggPSBGdyh4KSAtIEZ3KHd4KTtcbiAgICAgICAgdmFyIFJ5ID0gRncoeSkgLSBGdyh3eSk7XG5cbiAgICAgICAgdi5keCA9IHYuZHggKyBSeDtcbiAgICAgICAgdi5keSA9IHYuZHkgKyBSeTtcbiAgICAgICAgKi9cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBDYWxjdWxhdGUgYXR0cmFjdGl2ZSBmb3JjZXMuICovXG4gICAgZm9yICh2YXIgaTMgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNbaTNdO1xuXG4gICAgICAvLyBEbyBub3QgbW92ZSBmaXhlZCB2ZXJ0aWNlc1xuICAgICAgaWYoIXYuZml4ZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaTQgaW4gdi5lZGdlcykge1xuICAgICAgICAgIHZhciBlID0gdi5lZGdlc1tpNF07XG4gICAgICAgICAgdmFyIHUgPSBlLmVuZFZlcnRleDtcbiAgICAgICAgICB2YXIgZGlmeCA9IHYueCAtIHUueDtcbiAgICAgICAgICB2YXIgZGlmeSA9IHYueSAtIHUueTtcbiAgICAgICAgICB2YXIgZCA9IE1hdGgubWF4KGVwcywgTWF0aC5zcXJ0KGRpZngqZGlmeCArIGRpZnkqZGlmeSkpO1xuICAgICAgICAgIHZhciBmb3JjZSA9IEZhKGQpO1xuXG4gICAgICAgICAgLyogTGVuZ3RoIG9mIHRoZSBkaWYgdmVjdG9yLiAqL1xuICAgICAgICAgIHZhciBkID0gTWF0aC5tYXgoZXBzLCBNYXRoLnNxcnQoZGlmeCpkaWZ4ICsgZGlmeSpkaWZ5KSk7XG4gICAgICAgICAgdi5keCA9IHYuZHggLSAoZGlmeC9kKSAqIGZvcmNlO1xuICAgICAgICAgIHYuZHkgPSB2LmR5IC0gKGRpZnkvZCkgKiBmb3JjZTtcblxuICAgICAgICAgIHUuZHggPSB1LmR4ICsgKGRpZngvZCkgKiBmb3JjZTtcbiAgICAgICAgICB1LmR5ID0gdS5keSArIChkaWZ5L2QpICogZm9yY2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBMaW1pdCB0aGUgbWF4aW11bSBkaXNwbGFjZW1lbnQgdG8gdGhlIHRlbXBlcmF0dXJlIHRcbiAgICAgICAgYW5kIHByZXZlbnQgZnJvbSBiZWluZyBkaXNwbGFjZWQgb3V0c2lkZSBmcmFtZS4gICAgICovXG4gICAgZm9yICh2YXIgaTUgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNbaTVdO1xuICAgICAgaWYoIXYuZml4ZWQpIHtcbiAgICAgICAgLyogTGVuZ3RoIG9mIHRoZSBkaXNwbGFjZW1lbnQgdmVjdG9yLiAqL1xuICAgICAgICB2YXIgZCA9IE1hdGgubWF4KGVwcywgTWF0aC5zcXJ0KHYuZHgqdi5keCArIHYuZHkqdi5keSkpO1xuXG4gICAgICAgIC8qIExpbWl0IHRvIHRoZSB0ZW1wZXJhdHVyZSB0LiAqL1xuICAgICAgICB2LnggPSB2LnggKyAodi5keC9kKSAqIE1hdGgubWluKGQsIHQpO1xuICAgICAgICB2LnkgPSB2LnkgKyAodi5keS9kKSAqIE1hdGgubWluKGQsIHQpO1xuXG4gICAgICAgIC8qIFN0YXkgaW5zaWRlIHRoZSBmcmFtZS4gKi9cbiAgICAgICAgLypcbiAgICAgICAgYm9yZGVyV2lkdGggPSB0aGlzLndpZHRoIC8gNTA7XG4gICAgICAgIGlmICh2LnggPCBib3JkZXJXaWR0aCkge1xuICAgICAgICAgIHYueCA9IGJvcmRlcldpZHRoO1xuICAgICAgICB9IGVsc2UgaWYgKHYueCA+IHRoaXMud2lkdGggLSBib3JkZXJXaWR0aCkge1xuICAgICAgICAgIHYueCA9IHRoaXMud2lkdGggLSBib3JkZXJXaWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2LnkgPCBib3JkZXJXaWR0aCkge1xuICAgICAgICAgIHYueSA9IGJvcmRlcldpZHRoO1xuICAgICAgICB9IGVsc2UgaWYgKHYueSA+IHRoaXMuaGVpZ2h0IC0gYm9yZGVyV2lkdGgpIHtcbiAgICAgICAgICB2LnkgPSB0aGlzLmhlaWdodCAtIGJvcmRlcldpZHRoO1xuICAgICAgICB9XG4gICAgICAgICovXG4gICAgICAgIHYueCA9IE1hdGgucm91bmQodi54KTtcbiAgICAgICAgdi55ID0gTWF0aC5yb3VuZCh2LnkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qIENvb2wuICovXG4gICAgdCAtPSBkdDtcblxuICAgIGlmIChxICUgMTAgPT0gMCkge1xuICAgICAgdGhpcy5jYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSB2aXJ0dWFsIGNlbnRlciB2ZXJ0aWNlc1xuICBpZiAoY2VudGVycykge1xuICAgIGZvciAodmFyIGkgaW4gY2VudGVycykge1xuICAgICAgZ3JhcGgucmVtb3ZlVmVydGV4KGNlbnRlcnNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIGdyYXBoLm5vcm1hbGl6ZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdHJ1ZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvb2dyYXBoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXG52YXIgZ2V0TGF5b3V0ID0gcmVxdWlyZSgnLi9sYXlvdXQnKTtcblxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24oIGN5dG9zY2FwZSwgd2VhdmVyICl7XG4gIHZhciBsYXlvdXQgPSBnZXRMYXlvdXQoIGN5dG9zY2FwZSwgd2VhdmVyIHx8IHJlcXVpcmUoJ3dlYXZlcmpzJykgKTtcblxuICBjeXRvc2NhcGUoJ2xheW91dCcsICdzcHJlYWQnLCBsYXlvdXQpO1xufTtcblxuaWYoIHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnICYmICggdHlwZW9mIHdlYXZlciAhPT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIGN5dG9zY2FwZS5UaHJlYWQgIT09ICd1bmRlZmluZWQnICkgKXsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcbiAgcmVnaXN0ZXIoIGN5dG9zY2FwZSwgd2VhdmVyIHx8IGN5dG9zY2FwZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xuIiwidmFyIFRocmVhZDtcblxudmFyIGZvb2dyYXBoID0gcmVxdWlyZSgnLi9mb29ncmFwaCcpO1xudmFyIFZvcm9ub2kgPSByZXF1aXJlKCcuL3JoaWxsLXZvcm9ub2ktY29yZScpO1xuXG4vKlxuICogVGhpcyBsYXlvdXQgY29tYmluZXMgc2V2ZXJhbCBhbGdvcml0aG1zOlxuICpcbiAqIC0gSXQgZ2VuZXJhdGVzIGFuIGluaXRpYWwgcG9zaXRpb24gb2YgdGhlIG5vZGVzIGJ5IHVzaW5nIHRoZVxuICogICBGcnVjaHRlcm1hbi1SZWluZ29sZCBhbGdvcml0aG0gKGRvaToxMC4xMDAyL3NwZS40MzgwMjExMTAyKVxuICpcbiAqIC0gRmluYWxseSBpdCBlbGltaW5hdGVzIG92ZXJsYXBzIGJ5IHVzaW5nIHRoZSBtZXRob2QgZGVzY3JpYmVkIGJ5XG4gKiAgIEdhbnNuZXIgYW5kIE5vcnRoIChkb2k6MTAuMTAwNy8zLTU0MC0zNzYyMy0yXzI4KVxuICovXG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgYW5pbWF0ZTogdHJ1ZSwgLy8gd2hldGhlciB0byBzaG93IHRoZSBsYXlvdXQgYXMgaXQncyBydW5uaW5nXG4gIHJlYWR5OiB1bmRlZmluZWQsIC8vIENhbGxiYWNrIG9uIGxheW91dHJlYWR5XG4gIHN0b3A6IHVuZGVmaW5lZCwgLy8gQ2FsbGJhY2sgb24gbGF5b3V0c3RvcFxuICBmaXQ6IHRydWUsIC8vIFJlc2V0IHZpZXdwb3J0IHRvIGZpdCBkZWZhdWx0IHNpbXVsYXRpb25Cb3VuZHNcbiAgbWluRGlzdDogMjAsIC8vIE1pbmltdW0gZGlzdGFuY2UgYmV0d2VlbiBub2Rlc1xuICBwYWRkaW5nOiAyMCwgLy8gUGFkZGluZ1xuICBleHBhbmRpbmdGYWN0b3I6IC0xLjAsIC8vIElmIHRoZSBuZXR3b3JrIGRvZXMgbm90IHNhdGlzZnkgdGhlIG1pbkRpc3RcbiAgLy8gY3JpdGVyaXVtIHRoZW4gaXQgZXhwYW5kcyB0aGUgbmV0d29yayBvZiB0aGlzIGFtb3VudFxuICAvLyBJZiBpdCBpcyBzZXQgdG8gLTEuMCB0aGUgYW1vdW50IG9mIGV4cGFuc2lvbiBpcyBhdXRvbWF0aWNhbGx5XG4gIC8vIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIG1pbkRpc3QsIHRoZSBhc3BlY3QgcmF0aW8gYW5kIHRoZVxuICAvLyBudW1iZXIgb2Ygbm9kZXNcbiAgbWF4RnJ1Y2h0ZXJtYW5SZWluZ29sZEl0ZXJhdGlvbnM6IDUwLCAvLyBNYXhpbXVtIG51bWJlciBvZiBpbml0aWFsIGZvcmNlLWRpcmVjdGVkIGl0ZXJhdGlvbnNcbiAgbWF4RXhwYW5kSXRlcmF0aW9uczogNCwgLy8gTWF4aW11bSBudW1iZXIgb2YgZXhwYW5kaW5nIGl0ZXJhdGlvbnNcbiAgYm91bmRpbmdCb3g6IHVuZGVmaW5lZCwgLy8gQ29uc3RyYWluIGxheW91dCBib3VuZHM7IHsgeDEsIHkxLCB4MiwgeTIgfSBvciB7IHgxLCB5MSwgdywgaCB9XG4gIHJhbmRvbWl6ZTogZmFsc2UgLy8gdXNlcyByYW5kb20gaW5pdGlhbCBub2RlIHBvc2l0aW9ucyBvbiB0cnVlXG59O1xuXG5mdW5jdGlvbiBTcHJlYWRMYXlvdXQoIG9wdGlvbnMgKSB7XG4gIHZhciBvcHRzID0gdGhpcy5vcHRpb25zID0ge307XG4gIGZvciggdmFyIGkgaW4gZGVmYXVsdHMgKXsgb3B0c1tpXSA9IGRlZmF1bHRzW2ldOyB9XG4gIGZvciggdmFyIGkgaW4gb3B0aW9ucyApeyBvcHRzW2ldID0gb3B0aW9uc1tpXTsgfVxufVxuXG5TcHJlYWRMYXlvdXQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciBsYXlvdXQgPSB0aGlzO1xuICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgdmFyIGN5ID0gb3B0aW9ucy5jeTtcblxuICB2YXIgYmIgPSBvcHRpb25zLmJvdW5kaW5nQm94IHx8IHsgeDE6IDAsIHkxOiAwLCB3OiBjeS53aWR0aCgpLCBoOiBjeS5oZWlnaHQoKSB9O1xuICBpZiggYmIueDIgPT09IHVuZGVmaW5lZCApeyBiYi54MiA9IGJiLngxICsgYmIudzsgfVxuICBpZiggYmIudyA9PT0gdW5kZWZpbmVkICl7IGJiLncgPSBiYi54MiAtIGJiLngxOyB9XG4gIGlmKCBiYi55MiA9PT0gdW5kZWZpbmVkICl7IGJiLnkyID0gYmIueTEgKyBiYi5oOyB9XG4gIGlmKCBiYi5oID09PSB1bmRlZmluZWQgKXsgYmIuaCA9IGJiLnkyIC0gYmIueTE7IH1cblxuICB2YXIgbm9kZXMgPSBjeS5ub2RlcygpO1xuICB2YXIgZWRnZXMgPSBjeS5lZGdlcygpO1xuICB2YXIgY1dpZHRoID0gY3kud2lkdGgoKTtcbiAgdmFyIGNIZWlnaHQgPSBjeS5oZWlnaHQoKTtcbiAgdmFyIHNpbXVsYXRpb25Cb3VuZHMgPSBiYjtcbiAgdmFyIHBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmc7XG4gIHZhciBzaW1CQkZhY3RvciA9IE1hdGgubWF4KCAxLCBNYXRoLmxvZyhub2Rlcy5sZW5ndGgpICogMC44ICk7XG5cbiAgaWYoIG5vZGVzLmxlbmd0aCA8IDEwMCApe1xuICAgIHNpbUJCRmFjdG9yIC89IDI7XG4gIH1cblxuICBsYXlvdXQudHJpZ2dlcigge1xuICAgIHR5cGU6ICdsYXlvdXRzdGFydCcsXG4gICAgbGF5b3V0OiBsYXlvdXRcbiAgfSApO1xuXG4gIHZhciBzaW1CQiA9IHtcbiAgICB4MTogMCxcbiAgICB5MTogMCxcbiAgICB4MjogY1dpZHRoICogc2ltQkJGYWN0b3IsXG4gICAgeTI6IGNIZWlnaHQgKiBzaW1CQkZhY3RvclxuICB9O1xuXG4gIGlmKCBzaW11bGF0aW9uQm91bmRzICkge1xuICAgIHNpbUJCLngxID0gc2ltdWxhdGlvbkJvdW5kcy54MTtcbiAgICBzaW1CQi55MSA9IHNpbXVsYXRpb25Cb3VuZHMueTE7XG4gICAgc2ltQkIueDIgPSBzaW11bGF0aW9uQm91bmRzLngyO1xuICAgIHNpbUJCLnkyID0gc2ltdWxhdGlvbkJvdW5kcy55MjtcbiAgfVxuXG4gIHNpbUJCLngxICs9IHBhZGRpbmc7XG4gIHNpbUJCLnkxICs9IHBhZGRpbmc7XG4gIHNpbUJCLngyIC09IHBhZGRpbmc7XG4gIHNpbUJCLnkyIC09IHBhZGRpbmc7XG5cbiAgdmFyIHdpZHRoID0gc2ltQkIueDIgLSBzaW1CQi54MTtcbiAgdmFyIGhlaWdodCA9IHNpbUJCLnkyIC0gc2ltQkIueTE7XG5cbiAgLy8gR2V0IHN0YXJ0IHRpbWVcbiAgdmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgLy8gbGF5b3V0IGRvZXNuJ3Qgd29yayB3aXRoIGp1c3QgMSBub2RlXG4gIGlmKCBub2Rlcy5zaXplKCkgPD0gMSApIHtcbiAgICBub2Rlcy5wb3NpdGlvbnMoIHtcbiAgICAgIHg6IE1hdGgucm91bmQoICggc2ltQkIueDEgKyBzaW1CQi54MiApIC8gMiApLFxuICAgICAgeTogTWF0aC5yb3VuZCggKCBzaW1CQi55MSArIHNpbUJCLnkyICkgLyAyIClcbiAgICB9ICk7XG5cbiAgICBpZiggb3B0aW9ucy5maXQgKSB7XG4gICAgICBjeS5maXQoIG9wdGlvbnMucGFkZGluZyApO1xuICAgIH1cblxuICAgIC8vIEdldCBlbmQgdGltZVxuICAgIHZhciBlbmRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zb2xlLmluZm8oIFwiTGF5b3V0IG9uIFwiICsgbm9kZXMuc2l6ZSgpICsgXCIgbm9kZXMgdG9vayBcIiArICggZW5kVGltZSAtIHN0YXJ0VGltZSApICsgXCIgbXNcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRyZWFkeVwiLCBvcHRpb25zLnJlYWR5ICk7XG4gICAgbGF5b3V0LnRyaWdnZXIoIFwibGF5b3V0cmVhZHlcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRzdG9wXCIsIG9wdGlvbnMuc3RvcCApO1xuICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHN0b3BcIiApO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRmlyc3QgSSBuZWVkIHRvIGNyZWF0ZSB0aGUgZGF0YSBzdHJ1Y3R1cmUgdG8gcGFzcyB0byB0aGUgd29ya2VyXG4gIHZhciBwRGF0YSA9IHtcbiAgICAnd2lkdGgnOiB3aWR0aCxcbiAgICAnaGVpZ2h0JzogaGVpZ2h0LFxuICAgICdtaW5EaXN0Jzogb3B0aW9ucy5taW5EaXN0LFxuICAgICdleHBGYWN0Jzogb3B0aW9ucy5leHBhbmRpbmdGYWN0b3IsXG4gICAgJ2V4cEl0JzogMCxcbiAgICAnbWF4RXhwSXQnOiBvcHRpb25zLm1heEV4cGFuZEl0ZXJhdGlvbnMsXG4gICAgJ3ZlcnRpY2VzJzogW10sXG4gICAgJ2VkZ2VzJzogW10sXG4gICAgJ3N0YXJ0VGltZSc6IHN0YXJ0VGltZSxcbiAgICAnbWF4RnJ1Y2h0ZXJtYW5SZWluZ29sZEl0ZXJhdGlvbnMnOiBvcHRpb25zLm1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zXG4gIH07XG5cbiAgZm9yKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwIDsgaS0tKSB7XG4gICAgdmFyIG5vZGVJZCA9IG5vZGVzW2ldLmlkKCk7XG4gICAgdmFyIHBvcyA9IG5vZGVzW2ldLnBvc2l0aW9uKCk7XG5cbiAgICBpZiggb3B0aW9ucy5yYW5kb21pemUgKXtcbiAgICAgIHBvcyA9IHtcbiAgICAgICAgeDogTWF0aC5yb3VuZCggc2ltQkIueDEgKyAoc2ltQkIueDIgLSBzaW1CQi54MSkgKiBNYXRoLnJhbmRvbSgpICksXG4gICAgICAgIHk6IE1hdGgucm91bmQoIHNpbUJCLnkxICsgKHNpbUJCLnkyIC0gc2ltQkIueTEpICogTWF0aC5yYW5kb20oKSApXG4gICAgICB9O1xuICAgIH1cblxuICAgIHBEYXRhWyAndmVydGljZXMnIF0ucHVzaCgge1xuICAgICAgaWQ6IG5vZGVJZCxcbiAgICAgIHg6IHBvcy54LFxuICAgICAgeTogcG9zLnlcbiAgICB9ICk7XG4gIH07XG5cbiAgZm9yKHZhciBpID0gZWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgc3JjTm9kZUlkID0gZWRnZXNbaV0uc291cmNlKCkuaWQoKTtcbiAgICB2YXIgdGd0Tm9kZUlkID0gZWRnZXNbaV0udGFyZ2V0KCkuaWQoKTtcbiAgICBwRGF0YVsgJ2VkZ2VzJyBdLnB1c2goIHtcbiAgICAgIHNyYzogc3JjTm9kZUlkLFxuICAgICAgdGd0OiB0Z3ROb2RlSWRcbiAgICB9ICk7XG4gIH07XG5cbiAgLy9EZWNsZXJhdGlvblxuICB2YXIgdDEgPSBsYXlvdXQudGhyZWFkO1xuXG4gIC8vIHJldXNlIG9sZCB0aHJlYWQgaWYgcG9zc2libGVcbiAgaWYoICF0MSB8fCB0MS5zdG9wcGVkKCkgKXtcbiAgICB0MSA9IGxheW91dC50aHJlYWQgPSBUaHJlYWQoKTtcblxuICAgIC8vIEFuZCB0byBhZGQgdGhlIHJlcXVpcmVkIHNjcmlwdHNcbiAgICAvL0VYVEVSTkFMIDFcbiAgICB0MS5yZXF1aXJlKCBmb29ncmFwaCwgJ2Zvb2dyYXBoJyApO1xuICAgIC8vRVhURVJOQUwgMlxuICAgIHQxLnJlcXVpcmUoIFZvcm9ub2ksICdWb3Jvbm9pJyApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UG9zaXRpb25zKCBwRGF0YSApeyAvL2NvbnNvbGUubG9nKCdzZXQgcG9zbnMnKVxuICAgIC8vIEZpcnN0IHdlIHJldHJpZXZlIHRoZSBpbXBvcnRhbnQgZGF0YVxuICAgIC8vIHZhciBleHBhbmRJdGVyYXRpb24gPSBwRGF0YVsgJ2V4cEl0JyBdO1xuICAgIHZhciBkYXRhVmVydGljZXMgPSBwRGF0YVsgJ3ZlcnRpY2VzJyBdO1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZGF0YVZlcnRpY2VzLmxlbmd0aDsgKytpICkge1xuICAgICAgdmFyIGR2ID0gZGF0YVZlcnRpY2VzWyBpIF07XG4gICAgICB2ZXJ0aWNlc1sgZHYuaWQgXSA9IHtcbiAgICAgICAgeDogZHYueCxcbiAgICAgICAgeTogZHYueVxuICAgICAgfTtcbiAgICB9XG4gICAgLypcbiAgICAgKiBGSU5BTExZOlxuICAgICAqXG4gICAgICogV2UgcG9zaXRpb24gdGhlIG5vZGVzIGJhc2VkIG9uIHRoZSBjYWxjdWxhdGlvblxuICAgICAqL1xuICAgIG5vZGVzLnBvc2l0aW9ucyhcbiAgICAgIGZ1bmN0aW9uKCBub2RlLCBpICkge1xuICAgICAgICAvLyBQZXJmb3JtIDIueCBhbmQgMS54IGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGNoZWNrXG4gICAgICAgIGlmKCB0eXBlb2Ygbm9kZSA9PT0gXCJudW1iZXJcIiApe1xuICAgICAgICAgIG5vZGUgPSBpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZCA9IG5vZGUuaWQoKVxuICAgICAgICB2YXIgdmVydGV4ID0gdmVydGljZXNbIGlkIF07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBNYXRoLnJvdW5kKCBzaW1CQi54MSArIHZlcnRleC54ICksXG4gICAgICAgICAgeTogTWF0aC5yb3VuZCggc2ltQkIueTEgKyB2ZXJ0ZXgueSApXG4gICAgICAgIH07XG4gICAgICB9ICk7XG5cbiAgICBpZiggb3B0aW9ucy5maXQgKSB7XG4gICAgICBjeS5maXQoIG9wdGlvbnMucGFkZGluZyApO1xuICAgIH1cbiAgfVxuXG4gIHZhciBkaWRMYXlvdXRSZWFkeSA9IGZhbHNlO1xuICB0MS5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwRGF0YSA9IGUubWVzc2FnZTsgLy9jb25zb2xlLmxvZygnbWVzc2FnZScsIGUpXG5cbiAgICBpZiggIW9wdGlvbnMuYW5pbWF0ZSApe1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFBvc2l0aW9ucyggcERhdGEgKTtcblxuICAgIGlmKCAhZGlkTGF5b3V0UmVhZHkgKXtcbiAgICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHJlYWR5XCIgKTtcblxuICAgICAgZGlkTGF5b3V0UmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgbGF5b3V0Lm9uZSggXCJsYXlvdXRyZWFkeVwiLCBvcHRpb25zLnJlYWR5ICk7XG5cbiAgdDEucGFzcyggcERhdGEgKS5ydW4oIGZ1bmN0aW9uKCBwRGF0YSApIHtcblxuICAgIGZ1bmN0aW9uIGNlbGxDZW50cm9pZCggY2VsbCApIHtcbiAgICAgIHZhciBoZXMgPSBjZWxsLmhhbGZlZGdlcztcbiAgICAgIHZhciBhcmVhID0gMCxcbiAgICAgICAgeCA9IDAsXG4gICAgICAgIHkgPSAwO1xuICAgICAgdmFyIHAxLCBwMiwgZjtcblxuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBoZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIHAxID0gaGVzWyBpIF0uZ2V0RW5kcG9pbnQoKTtcbiAgICAgICAgcDIgPSBoZXNbIGkgXS5nZXRTdGFydHBvaW50KCk7XG5cbiAgICAgICAgYXJlYSArPSBwMS54ICogcDIueTtcbiAgICAgICAgYXJlYSAtPSBwMS55ICogcDIueDtcblxuICAgICAgICBmID0gcDEueCAqIHAyLnkgLSBwMi54ICogcDEueTtcbiAgICAgICAgeCArPSAoIHAxLnggKyBwMi54ICkgKiBmO1xuICAgICAgICB5ICs9ICggcDEueSArIHAyLnkgKSAqIGY7XG4gICAgICB9XG5cbiAgICAgIGFyZWEgLz0gMjtcbiAgICAgIGYgPSBhcmVhICogNjtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBmLFxuICAgICAgICB5OiB5IC8gZlxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaXRlc0Rpc3RhbmNlKCBscywgcnMgKSB7XG4gICAgICB2YXIgZHggPSBscy54IC0gcnMueDtcbiAgICAgIHZhciBkeSA9IGxzLnkgLSBycy55O1xuICAgICAgcmV0dXJuIE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcbiAgICB9XG5cbiAgICBmb29ncmFwaCA9IF9yZWZfKCdmb29ncmFwaCcpO1xuICAgIFZvcm9ub2kgPSBfcmVmXygnVm9yb25vaScpO1xuXG4gICAgLy8gSSBuZWVkIHRvIHJldHJpZXZlIHRoZSBpbXBvcnRhbnQgZGF0YVxuICAgIHZhciBsV2lkdGggPSBwRGF0YVsgJ3dpZHRoJyBdO1xuICAgIHZhciBsSGVpZ2h0ID0gcERhdGFbICdoZWlnaHQnIF07XG4gICAgdmFyIGxNaW5EaXN0ID0gcERhdGFbICdtaW5EaXN0JyBdO1xuICAgIHZhciBsRXhwRmFjdCA9IHBEYXRhWyAnZXhwRmFjdCcgXTtcbiAgICB2YXIgbE1heEV4cEl0ID0gcERhdGFbICdtYXhFeHBJdCcgXTtcbiAgICB2YXIgbE1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zID0gcERhdGFbICdtYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9ucycgXTtcblxuICAgIC8vIFByZXBhcmUgdGhlIGRhdGEgdG8gb3V0cHV0XG4gICAgdmFyIHNhdmVQb3NpdGlvbnMgPSBmdW5jdGlvbigpe1xuICAgICAgcERhdGFbICd3aWR0aCcgXSA9IGxXaWR0aDtcbiAgICAgIHBEYXRhWyAnaGVpZ2h0JyBdID0gbEhlaWdodDtcbiAgICAgIHBEYXRhWyAnZXhwSXQnIF0gPSBleHBhbmRJdGVyYXRpb247XG4gICAgICBwRGF0YVsgJ2V4cEZhY3QnIF0gPSBsRXhwRmFjdDtcblxuICAgICAgcERhdGFbICd2ZXJ0aWNlcycgXSA9IFtdO1xuICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBmdi5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgcERhdGFbICd2ZXJ0aWNlcycgXS5wdXNoKCB7XG4gICAgICAgICAgaWQ6IGZ2WyBpIF0ubGFiZWwsXG4gICAgICAgICAgeDogZnZbIGkgXS54LFxuICAgICAgICAgIHk6IGZ2WyBpIF0ueVxuICAgICAgICB9ICk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBtZXNzYWdlUG9zaXRpb25zID0gZnVuY3Rpb24oKXtcbiAgICAgIGJyb2FkY2FzdCggcERhdGEgKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBGSVJTVCBTVEVQOiBBcHBsaWNhdGlvbiBvZiB0aGUgRnJ1Y2h0ZXJtYW4tUmVpbmdvbGQgYWxnb3JpdGhtXG4gICAgICpcbiAgICAgKiBXZSB1c2UgdGhlIHZlcnNpb24gaW1wbGVtZW50ZWQgYnkgdGhlIGZvb2dyYXBoIGxpYnJhcnlcbiAgICAgKlxuICAgICAqIFJlZi46IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvZm9vZ3JhcGgvXG4gICAgICovXG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhIGdyYXBoIGNvbXBhdGlibGUgd2l0aCB0aGUgbGlicmFyeVxuICAgIHZhciBmcmcgPSBuZXcgZm9vZ3JhcGguR3JhcGgoIFwiRlJncmFwaFwiLCBmYWxzZSApO1xuXG4gICAgdmFyIGZyZ05vZGVzID0ge307XG5cbiAgICAvLyBUaGVuIHdlIGhhdmUgdG8gYWRkIHRoZSB2ZXJ0aWNlc1xuICAgIHZhciBkYXRhVmVydGljZXMgPSBwRGF0YVsgJ3ZlcnRpY2VzJyBdO1xuICAgIGZvciggdmFyIG5pID0gMDsgbmkgPCBkYXRhVmVydGljZXMubGVuZ3RoOyArK25pICkge1xuICAgICAgdmFyIGlkID0gZGF0YVZlcnRpY2VzWyBuaSBdWyAnaWQnIF07XG4gICAgICB2YXIgdiA9IG5ldyBmb29ncmFwaC5WZXJ0ZXgoIGlkLCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogbEhlaWdodCApLCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogbEhlaWdodCApICk7XG4gICAgICBmcmdOb2Rlc1sgaWQgXSA9IHY7XG4gICAgICBmcmcuaW5zZXJ0VmVydGV4KCB2ICk7XG4gICAgfVxuXG4gICAgdmFyIGRhdGFFZGdlcyA9IHBEYXRhWyAnZWRnZXMnIF07XG4gICAgZm9yKCB2YXIgZWkgPSAwOyBlaSA8IGRhdGFFZGdlcy5sZW5ndGg7ICsrZWkgKSB7XG4gICAgICB2YXIgc3JjTm9kZUlkID0gZGF0YUVkZ2VzWyBlaSBdWyAnc3JjJyBdO1xuICAgICAgdmFyIHRndE5vZGVJZCA9IGRhdGFFZGdlc1sgZWkgXVsgJ3RndCcgXTtcbiAgICAgIGZyZy5pbnNlcnRFZGdlKCBcIlwiLCAxLCBmcmdOb2Rlc1sgc3JjTm9kZUlkIF0sIGZyZ05vZGVzWyB0Z3ROb2RlSWQgXSApO1xuICAgIH1cblxuICAgIHZhciBmdiA9IGZyZy52ZXJ0aWNlcztcblxuICAgIC8vIFRoZW4gd2UgYXBwbHkgdGhlIGxheW91dFxuICAgIHZhciBpdGVyYXRpb25zID0gbE1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zO1xuICAgIHZhciBmckxheW91dE1hbmFnZXIgPSBuZXcgZm9vZ3JhcGguRm9yY2VEaXJlY3RlZFZlcnRleExheW91dCggbFdpZHRoLCBsSGVpZ2h0LCBpdGVyYXRpb25zLCBmYWxzZSwgbE1pbkRpc3QgKTtcblxuICAgIGZyTGF5b3V0TWFuYWdlci5jYWxsYmFjayA9IGZ1bmN0aW9uKCl7XG4gICAgICBzYXZlUG9zaXRpb25zKCk7XG4gICAgICBtZXNzYWdlUG9zaXRpb25zKCk7XG4gICAgfTtcblxuICAgIGZyTGF5b3V0TWFuYWdlci5sYXlvdXQoIGZyZyApO1xuXG4gICAgc2F2ZVBvc2l0aW9ucygpO1xuICAgIG1lc3NhZ2VQb3NpdGlvbnMoKTtcblxuICAgIGlmKCBsTWF4RXhwSXQgPD0gMCApe1xuICAgICAgcmV0dXJuIHBEYXRhO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogU0VDT05EIFNURVA6IFRpZGluZyB1cCBvZiB0aGUgZ3JhcGguXG4gICAgICpcbiAgICAgKiBXZSB1c2UgdGhlIG1ldGhvZCBkZXNjcmliZWQgYnkgR2Fuc25lciBhbmQgTm9ydGgsIGJhc2VkIG9uIFZvcm9ub2lcbiAgICAgKiBkaWFncmFtcy5cbiAgICAgKlxuICAgICAqIFJlZjogZG9pOjEwLjEwMDcvMy01NDAtMzc2MjMtMl8yOFxuICAgICAqL1xuXG4gICAgLy8gV2UgY2FsY3VsYXRlIHRoZSBWb3Jvbm9pIGRpYWdyYW0gZG9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgbm9kZXNcbiAgICB2YXIgdm9yb25vaSA9IG5ldyBWb3Jvbm9pKCk7XG4gICAgdmFyIGJib3ggPSB7XG4gICAgICB4bDogMCxcbiAgICAgIHhyOiBsV2lkdGgsXG4gICAgICB5dDogMCxcbiAgICAgIHliOiBsSGVpZ2h0XG4gICAgfTtcbiAgICB2YXIgdlNpdGVzID0gW107XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBmdi5sZW5ndGg7ICsraSApIHtcbiAgICAgIHZTaXRlc1sgZnZbIGkgXS5sYWJlbCBdID0gZnZbIGkgXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja01pbkRpc3QoIGVlICkge1xuICAgICAgdmFyIGluZnJhY3Rpb25zID0gMDtcbiAgICAgIC8vIFRoZW4gd2UgY2hlY2sgaWYgdGhlIG1pbmltdW0gZGlzdGFuY2UgaXMgc2F0aXNmaWVkXG4gICAgICBmb3IoIHZhciBlZWkgPSAwOyBlZWkgPCBlZS5sZW5ndGg7ICsrZWVpICkge1xuICAgICAgICB2YXIgZSA9IGVlWyBlZWkgXTtcbiAgICAgICAgaWYoICggZS5sU2l0ZSAhPSBudWxsICkgJiYgKCBlLnJTaXRlICE9IG51bGwgKSAmJiBzaXRlc0Rpc3RhbmNlKCBlLmxTaXRlLCBlLnJTaXRlICkgPCBsTWluRGlzdCApIHtcbiAgICAgICAgICArK2luZnJhY3Rpb25zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5mcmFjdGlvbnM7XG4gICAgfVxuXG4gICAgdmFyIGRpYWdyYW0gPSB2b3Jvbm9pLmNvbXB1dGUoIGZ2LCBiYm94ICk7XG5cbiAgICAvLyBUaGVuIHdlIHJlcG9zaXRpb24gdGhlIG5vZGVzIGF0IHRoZSBjZW50cm9pZCBvZiB0aGVpciBWb3Jvbm9pIGNlbGxzXG4gICAgdmFyIGNlbGxzID0gZGlhZ3JhbS5jZWxscztcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgKytpICkge1xuICAgICAgdmFyIGNlbGwgPSBjZWxsc1sgaSBdO1xuICAgICAgdmFyIHNpdGUgPSBjZWxsLnNpdGU7XG4gICAgICB2YXIgY2VudHJvaWQgPSBjZWxsQ2VudHJvaWQoIGNlbGwgKTtcbiAgICAgIHZhciBjdXJydiA9IHZTaXRlc1sgc2l0ZS5sYWJlbCBdO1xuICAgICAgY3VycnYueCA9IGNlbnRyb2lkLng7XG4gICAgICBjdXJydi55ID0gY2VudHJvaWQueTtcbiAgICB9XG5cbiAgICBpZiggbEV4cEZhY3QgPCAwLjAgKSB7XG4gICAgICAvLyBDYWxjdWxhdGVzIHRoZSBleHBhbmRpbmcgZmFjdG9yXG4gICAgICBsRXhwRmFjdCA9IE1hdGgubWF4KCAwLjA1LCBNYXRoLm1pbiggMC4xMCwgbE1pbkRpc3QgLyBNYXRoLnNxcnQoICggbFdpZHRoICogbEhlaWdodCApIC8gZnYubGVuZ3RoICkgKiAwLjUgKSApO1xuICAgICAgLy9jb25zb2xlLmluZm8oXCJFeHBhbmRpbmcgZmFjdG9yIGlzIFwiICsgKG9wdGlvbnMuZXhwYW5kaW5nRmFjdG9yICogMTAwLjApICsgXCIlXCIpO1xuICAgIH1cblxuICAgIHZhciBwcmV2SW5mcmFjdGlvbnMgPSBjaGVja01pbkRpc3QoIGRpYWdyYW0uZWRnZXMgKTtcbiAgICAvL2NvbnNvbGUuaW5mbyhcIkluaXRpYWwgaW5mcmFjdGlvbnMgXCIgKyBwcmV2SW5mcmFjdGlvbnMpO1xuXG4gICAgdmFyIGJTdG9wID0gKCBwcmV2SW5mcmFjdGlvbnMgPD0gMCApIHx8IGxNYXhFeHBJdCA8PSAwO1xuXG4gICAgdmFyIHZvcm9ub2lJdGVyYXRpb24gPSAwO1xuICAgIHZhciBleHBhbmRJdGVyYXRpb24gPSAwO1xuXG4gICAgLy8gdmFyIGluaXRXaWR0aCA9IGxXaWR0aDtcblxuICAgIHdoaWxlKCAhYlN0b3AgKSB7XG4gICAgICArK3Zvcm9ub2lJdGVyYXRpb247XG4gICAgICBmb3IoIHZhciBpdCA9IDA7IGl0IDw9IDQ7ICsraXQgKSB7XG4gICAgICAgIHZvcm9ub2kucmVjeWNsZSggZGlhZ3JhbSApO1xuICAgICAgICBkaWFncmFtID0gdm9yb25vaS5jb21wdXRlKCBmdiwgYmJveCApO1xuXG4gICAgICAgIC8vIFRoZW4gd2UgcmVwb3NpdGlvbiB0aGUgbm9kZXMgYXQgdGhlIGNlbnRyb2lkIG9mIHRoZWlyIFZvcm9ub2kgY2VsbHNcbiAgICAgICAgLy8gY2VsbHMgPSBkaWFncmFtLmNlbGxzO1xuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgKytpICkge1xuICAgICAgICAgIHZhciBjZWxsID0gY2VsbHNbIGkgXTtcbiAgICAgICAgICB2YXIgc2l0ZSA9IGNlbGwuc2l0ZTtcbiAgICAgICAgICB2YXIgY2VudHJvaWQgPSBjZWxsQ2VudHJvaWQoIGNlbGwgKTtcbiAgICAgICAgICB2YXIgY3VycnYgPSB2U2l0ZXNbIHNpdGUubGFiZWwgXTtcbiAgICAgICAgICBjdXJydi54ID0gY2VudHJvaWQueDtcbiAgICAgICAgICBjdXJydi55ID0gY2VudHJvaWQueTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY3VyckluZnJhY3Rpb25zID0gY2hlY2tNaW5EaXN0KCBkaWFncmFtLmVkZ2VzICk7XG4gICAgICAvL2NvbnNvbGUuaW5mbyhcIkN1cnJlbnQgaW5mcmFjdGlvbnMgXCIgKyBjdXJySW5mcmFjdGlvbnMpO1xuXG4gICAgICBpZiggY3VyckluZnJhY3Rpb25zIDw9IDAgKSB7XG4gICAgICAgIGJTdG9wID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKCBjdXJySW5mcmFjdGlvbnMgPj0gcHJldkluZnJhY3Rpb25zIHx8IHZvcm9ub2lJdGVyYXRpb24gPj0gNCApIHtcbiAgICAgICAgICBpZiggZXhwYW5kSXRlcmF0aW9uID49IGxNYXhFeHBJdCApIHtcbiAgICAgICAgICAgIGJTdG9wID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbFdpZHRoICs9IGxXaWR0aCAqIGxFeHBGYWN0O1xuICAgICAgICAgICAgbEhlaWdodCArPSBsSGVpZ2h0ICogbEV4cEZhY3Q7XG4gICAgICAgICAgICBiYm94ID0ge1xuICAgICAgICAgICAgICB4bDogMCxcbiAgICAgICAgICAgICAgeHI6IGxXaWR0aCxcbiAgICAgICAgICAgICAgeXQ6IDAsXG4gICAgICAgICAgICAgIHliOiBsSGVpZ2h0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgKytleHBhbmRJdGVyYXRpb247XG4gICAgICAgICAgICB2b3Jvbm9pSXRlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiRXhwYW5kZWQgdG8gKFwiK3dpZHRoK1wiLFwiK2hlaWdodCtcIilcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmV2SW5mcmFjdGlvbnMgPSBjdXJySW5mcmFjdGlvbnM7XG5cbiAgICAgIHNhdmVQb3NpdGlvbnMoKTtcbiAgICAgIG1lc3NhZ2VQb3NpdGlvbnMoKTtcbiAgICB9XG5cbiAgICBzYXZlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIHBEYXRhO1xuXG4gIH0gKS50aGVuKCBmdW5jdGlvbiggcERhdGEgKSB7XG4gICAgLy8gdmFyIGV4cGFuZEl0ZXJhdGlvbiA9IHBEYXRhWyAnZXhwSXQnIF07XG4gICAgdmFyIGRhdGFWZXJ0aWNlcyA9IHBEYXRhWyAndmVydGljZXMnIF07XG5cbiAgICBzZXRQb3NpdGlvbnMoIHBEYXRhICk7XG5cbiAgICAvLyBHZXQgZW5kIHRpbWVcbiAgICB2YXIgc3RhcnRUaW1lID0gcERhdGFbICdzdGFydFRpbWUnIF07XG4gICAgdmFyIGVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnNvbGUuaW5mbyggXCJMYXlvdXQgb24gXCIgKyBkYXRhVmVydGljZXMubGVuZ3RoICsgXCIgbm9kZXMgdG9vayBcIiArICggZW5kVGltZSAtIHN0YXJ0VGltZSApICsgXCIgbXNcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRzdG9wXCIsIG9wdGlvbnMuc3RvcCApO1xuXG4gICAgaWYoICFvcHRpb25zLmFuaW1hdGUgKXtcbiAgICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHJlYWR5XCIgKTtcbiAgICB9XG5cbiAgICBsYXlvdXQudHJpZ2dlciggXCJsYXlvdXRzdG9wXCIgKTtcblxuICAgIHQxLnN0b3AoKTtcbiAgfSApO1xuXG5cbiAgcmV0dXJuIHRoaXM7XG59OyAvLyBydW5cblxuU3ByZWFkTGF5b3V0LnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKXtcbiAgaWYoIHRoaXMudGhyZWFkICl7XG4gICAgdGhpcy50aHJlYWQuc3RvcCgpO1xuICB9XG5cbiAgdGhpcy50cmlnZ2VyKCdsYXlvdXRzdG9wJyk7XG59O1xuXG5TcHJlYWRMYXlvdXQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICBpZiggdGhpcy50aHJlYWQgKXtcbiAgICB0aGlzLnRocmVhZC5zdG9wKCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0KCBjeXRvc2NhcGUsIHdlYXZlciApe1xuICBUaHJlYWQgPSB3ZWF2ZXIuVGhyZWFkO1xuXG4gIHJldHVybiBTcHJlYWRMYXlvdXQ7XG59O1xuIiwiLyohXG5Db3B5cmlnaHQgKEMpIDIwMTAtMjAxMyBSYXltb25kIEhpbGw6IGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaVxuTUlUIExpY2Vuc2U6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvTElDRU5TRS5tZFxuKi9cbi8qXG5BdXRob3I6IFJheW1vbmQgSGlsbCAocmhpbGxAcmF5bW9uZGhpbGwubmV0KVxuQ29udHJpYnV0b3I6IEplc3NlIE1vcmdhbiAobW9yZ2FqZWxAZ21haWwuY29tKVxuRmlsZTogcmhpbGwtdm9yb25vaS1jb3JlLmpzXG5WZXJzaW9uOiAwLjk4XG5EYXRlOiBKYW51YXJ5IDIxLCAyMDEzXG5EZXNjcmlwdGlvbjogVGhpcyBpcyBteSBwZXJzb25hbCBKYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mXG5TdGV2ZW4gRm9ydHVuZSdzIGFsZ29yaXRobSB0byBjb21wdXRlIFZvcm9ub2kgZGlhZ3JhbXMuXG5cbkxpY2Vuc2U6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvTElDRU5TRS5tZFxuQ3JlZGl0czogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9DUkVESVRTLm1kXG5IaXN0b3J5OiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL0NIQU5HRUxPRy5tZFxuXG4jIyBVc2FnZTpcblxuICB2YXIgc2l0ZXMgPSBbe3g6MzAwLHk6MzAwfSwge3g6MTAwLHk6MTAwfSwge3g6MjAwLHk6NTAwfSwge3g6MjUwLHk6NDUwfSwge3g6NjAwLHk6MTUwfV07XG4gIC8vIHhsLCB4ciBtZWFucyB4IGxlZnQsIHggcmlnaHRcbiAgLy8geXQsIHliIG1lYW5zIHkgdG9wLCB5IGJvdHRvbVxuICB2YXIgYmJveCA9IHt4bDowLCB4cjo4MDAsIHl0OjAsIHliOjYwMH07XG4gIHZhciB2b3Jvbm9pID0gbmV3IFZvcm9ub2koKTtcbiAgLy8gcGFzcyBhbiBvYmplY3Qgd2hpY2ggZXhoaWJpdHMgeGwsIHhyLCB5dCwgeWIgcHJvcGVydGllcy4gVGhlIGJvdW5kaW5nXG4gIC8vIGJveCB3aWxsIGJlIHVzZWQgdG8gY29ubmVjdCB1bmJvdW5kIGVkZ2VzLCBhbmQgdG8gY2xvc2Ugb3BlbiBjZWxsc1xuICByZXN1bHQgPSB2b3Jvbm9pLmNvbXB1dGUoc2l0ZXMsIGJib3gpO1xuICAvLyByZW5kZXIsIGZ1cnRoZXIgYW5hbHl6ZSwgZXRjLlxuXG5SZXR1cm4gdmFsdWU6XG4gIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblxuICByZXN1bHQudmVydGljZXMgPSBhbiBhcnJheSBvZiB1bm9yZGVyZWQsIHVuaXF1ZSBWb3Jvbm9pLlZlcnRleCBvYmplY3RzIG1ha2luZ1xuICAgIHVwIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gIHJlc3VsdC5lZGdlcyA9IGFuIGFycmF5IG9mIHVub3JkZXJlZCwgdW5pcXVlIFZvcm9ub2kuRWRnZSBvYmplY3RzIG1ha2luZyB1cFxuICAgIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gIHJlc3VsdC5jZWxscyA9IGFuIGFycmF5IG9mIFZvcm9ub2kuQ2VsbCBvYmplY3QgbWFraW5nIHVwIHRoZSBWb3Jvbm9pIGRpYWdyYW0uXG4gICAgQSBDZWxsIG9iamVjdCBtaWdodCBoYXZlIGFuIGVtcHR5IGFycmF5IG9mIGhhbGZlZGdlcywgbWVhbmluZyBubyBWb3Jvbm9pXG4gICAgY2VsbCBjb3VsZCBiZSBjb21wdXRlZCBmb3IgYSBwYXJ0aWN1bGFyIGNlbGwuXG4gIHJlc3VsdC5leGVjVGltZSA9IHRoZSB0aW1lIGl0IHRvb2sgdG8gY29tcHV0ZSB0aGUgVm9yb25vaSBkaWFncmFtLCBpblxuICAgIG1pbGxpc2Vjb25kcy5cblxuVm9yb25vaS5WZXJ0ZXggb2JqZWN0OlxuICB4OiBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgdmVydGV4LlxuICB5OiBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgdmVydGV4LlxuXG5Wb3Jvbm9pLkVkZ2Ugb2JqZWN0OlxuICBsU2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3QgYXQgdGhlIGxlZnQgb2YgdGhpcyBWb3Jvbm9pLkVkZ2Ugb2JqZWN0LlxuICByU2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3QgYXQgdGhlIHJpZ2h0IG9mIHRoaXMgVm9yb25vaS5FZGdlIG9iamVjdCAoY2FuXG4gICAgYmUgbnVsbCkuXG4gIHZhOiBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5IGRlZmluaW5nIHRoZSBzdGFydCBwb2ludFxuICAgIChyZWxhdGl2ZSB0byB0aGUgVm9yb25vaSBzaXRlIG9uIHRoZSBsZWZ0KSBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QuXG4gIHZiOiBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5IGRlZmluaW5nIHRoZSBlbmQgcG9pbnRcbiAgICAocmVsYXRpdmUgdG8gVm9yb25vaSBzaXRlIG9uIHRoZSBsZWZ0KSBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QuXG5cbiAgRm9yIGVkZ2VzIHdoaWNoIGFyZSB1c2VkIHRvIGNsb3NlIG9wZW4gY2VsbHMgKHVzaW5nIHRoZSBzdXBwbGllZCBib3VuZGluZ1xuICBib3gpLCB0aGUgclNpdGUgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuXG5Wb3Jvbm9pLkNlbGwgb2JqZWN0OlxuICBzaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggdGhlIFZvcm9ub2kgY2VsbC5cbiAgaGFsZmVkZ2VzOiBhbiBhcnJheSBvZiBWb3Jvbm9pLkhhbGZlZGdlIG9iamVjdHMsIG9yZGVyZWQgY291bnRlcmNsb2Nrd2lzZSxcbiAgICBkZWZpbmluZyB0aGUgcG9seWdvbiBmb3IgdGhpcyBWb3Jvbm9pIGNlbGwuXG5cblZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0OlxuICBzaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBvd25pbmcgdGhpcyBWb3Jvbm9pLkhhbGZlZGdlIG9iamVjdC5cbiAgZWRnZTogYSByZWZlcmVuY2UgdG8gdGhlIHVuaXF1ZSBWb3Jvbm9pLkVkZ2Ugb2JqZWN0IHVuZGVybHlpbmcgdGhpc1xuICAgIFZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0LlxuICBnZXRTdGFydHBvaW50KCk6IGEgbWV0aG9kIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5XG4gICAgZm9yIHRoZSBzdGFydCBwb2ludCBvZiB0aGlzIGhhbGZlZGdlLiBLZWVwIGluIG1pbmQgaGFsZmVkZ2VzIGFyZSBhbHdheXNcbiAgICBjb3VudGVyY29ja3dpc2UuXG4gIGdldEVuZHBvaW50KCk6IGEgbWV0aG9kIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhbiAneCcgYW5kIGEgJ3knIHByb3BlcnR5XG4gICAgZm9yIHRoZSBlbmQgcG9pbnQgb2YgdGhpcyBoYWxmZWRnZS4gS2VlcCBpbiBtaW5kIGhhbGZlZGdlcyBhcmUgYWx3YXlzXG4gICAgY291bnRlcmNvY2t3aXNlLlxuXG5UT0RPOiBJZGVudGlmeSBvcHBvcnR1bml0aWVzIGZvciBwZXJmb3JtYW5jZSBpbXByb3ZlbWVudC5cblxuVE9ETzogTGV0IHRoZSB1c2VyIGNsb3NlIHRoZSBWb3Jvbm9pIGNlbGxzLCBkbyBub3QgZG8gaXQgYXV0b21hdGljYWxseS4gTm90IG9ubHkgbGV0XG4gICAgICBoaW0gY2xvc2UgdGhlIGNlbGxzLCBidXQgYWxzbyBhbGxvdyBoaW0gdG8gY2xvc2UgbW9yZSB0aGFuIG9uY2UgdXNpbmcgYSBkaWZmZXJlbnRcbiAgICAgIGJvdW5kaW5nIGJveCBmb3IgdGhlIHNhbWUgVm9yb25vaSBkaWFncmFtLlxuKi9cblxuLypnbG9iYWwgTWF0aCAqL1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gVm9yb25vaSgpIHtcbiAgICB0aGlzLnZlcnRpY2VzID0gbnVsbDtcbiAgICB0aGlzLmVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLmNlbGxzID0gbnVsbDtcbiAgICB0aGlzLnRvUmVjeWNsZSA9IG51bGw7XG4gICAgdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZCA9IFtdO1xuICAgIHRoaXMuY2lyY2xlRXZlbnRKdW5reWFyZCA9IFtdO1xuICAgIHRoaXMudmVydGV4SnVua3lhcmQgPSBbXTtcbiAgICB0aGlzLmVkZ2VKdW5reWFyZCA9IFtdO1xuICAgIHRoaXMuY2VsbEp1bmt5YXJkID0gW107XG4gICAgfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVm9yb25vaS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuYmVhY2hsaW5lKSB7XG4gICAgICAgIHRoaXMuYmVhY2hsaW5lID0gbmV3IHRoaXMuUkJUcmVlKCk7XG4gICAgICAgIH1cbiAgICAvLyBNb3ZlIGxlZnRvdmVyIGJlYWNoc2VjdGlvbnMgdG8gdGhlIGJlYWNoc2VjdGlvbiBqdW5reWFyZC5cbiAgICBpZiAodGhpcy5iZWFjaGxpbmUucm9vdCkge1xuICAgICAgICB2YXIgYmVhY2hzZWN0aW9uID0gdGhpcy5iZWFjaGxpbmUuZ2V0Rmlyc3QodGhpcy5iZWFjaGxpbmUucm9vdCk7XG4gICAgICAgIHdoaWxlIChiZWFjaHNlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYmVhY2hzZWN0aW9uSnVua3lhcmQucHVzaChiZWFjaHNlY3Rpb24pOyAvLyBtYXJrIGZvciByZXVzZVxuICAgICAgICAgICAgYmVhY2hzZWN0aW9uID0gYmVhY2hzZWN0aW9uLnJiTmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHRoaXMuYmVhY2hsaW5lLnJvb3QgPSBudWxsO1xuICAgIGlmICghdGhpcy5jaXJjbGVFdmVudHMpIHtcbiAgICAgICAgdGhpcy5jaXJjbGVFdmVudHMgPSBuZXcgdGhpcy5SQlRyZWUoKTtcbiAgICAgICAgfVxuICAgIHRoaXMuY2lyY2xlRXZlbnRzLnJvb3QgPSB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQgPSBudWxsO1xuICAgIHRoaXMudmVydGljZXMgPSBbXTtcbiAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgdGhpcy5jZWxscyA9IFtdO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnNxcnQgPSBmdW5jdGlvbihuKXsgcmV0dXJuIE1hdGguc3FydChuKTsgfTtcblZvcm9ub2kucHJvdG90eXBlLmFicyA9IGZ1bmN0aW9uKG4peyByZXR1cm4gTWF0aC5hYnMobik7IH07XG5Wb3Jvbm9pLnByb3RvdHlwZS7OtSA9IFZvcm9ub2kuzrUgPSAxZS05O1xuVm9yb25vaS5wcm90b3R5cGUuaW52zrUgPSBWb3Jvbm9pLmluds61ID0gMS4wIC8gVm9yb25vaS7OtTtcblZvcm9ub2kucHJvdG90eXBlLmVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLmFicyhhLWIpPDFlLTk7fTtcblZvcm9ub2kucHJvdG90eXBlLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBhLWI+MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUuZ3JlYXRlclRoYW5PckVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBiLWE8MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUubGVzc1RoYW5XaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYT4xZS05O307XG5Wb3Jvbm9pLnByb3RvdHlwZS5sZXNzVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEtYjwxZS05O307XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmVkLUJsYWNrIHRyZWUgY29kZSAoYmFzZWQgb24gQyB2ZXJzaW9uIG9mIFwicmJ0cmVlXCIgYnkgRnJhbmNrIEJ1aS1IdXVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYnVpaHV1L2xpYnRyZWUvYmxvYi9tYXN0ZXIvcmIuY1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5SQlRyZWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJJbnNlcnRTdWNjZXNzb3IgPSBmdW5jdGlvbihub2RlLCBzdWNjZXNzb3IpIHtcbiAgICB2YXIgcGFyZW50O1xuICAgIGlmIChub2RlKSB7XG4gICAgICAgIC8vID4+PiByaGlsbCAyMDExLTA1LTI3OiBQZXJmb3JtYW5jZTogY2FjaGUgcHJldmlvdXMvbmV4dCBub2Rlc1xuICAgICAgICBzdWNjZXNzb3IucmJQcmV2aW91cyA9IG5vZGU7XG4gICAgICAgIHN1Y2Nlc3Nvci5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgICAgICBub2RlLnJiTmV4dC5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBub2RlLnJiTmV4dCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgLy8gPDw8XG4gICAgICAgIGlmIChub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgIC8vIGluLXBsYWNlIGV4cGFuc2lvbiBvZiBub2RlLnJiUmlnaHQuZ2V0Rmlyc3QoKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZS5yYkxlZnQpIHtub2RlID0gbm9kZS5yYkxlZnQ7fVxuICAgICAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yYlJpZ2h0ID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlO1xuICAgICAgICB9XG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wNzogaWYgbm9kZSBpcyBudWxsLCBzdWNjZXNzb3IgbXVzdCBiZSBpbnNlcnRlZFxuICAgIC8vIHRvIHRoZSBsZWZ0LW1vc3QgcGFydCBvZiB0aGUgdHJlZVxuICAgIGVsc2UgaWYgKHRoaXMucm9vdCkge1xuICAgICAgICBub2RlID0gdGhpcy5nZXRGaXJzdCh0aGlzLnJvb3QpO1xuICAgICAgICAvLyA+Pj4gUGVyZm9ybWFuY2U6IGNhY2hlIHByZXZpb3VzL25leHQgbm9kZXNcbiAgICAgICAgc3VjY2Vzc29yLnJiUHJldmlvdXMgPSBudWxsO1xuICAgICAgICBzdWNjZXNzb3IucmJOZXh0ID0gbm9kZTtcbiAgICAgICAgbm9kZS5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAvLyA8PDxcbiAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gPj4+IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgICAgIHN1Y2Nlc3Nvci5yYlByZXZpb3VzID0gc3VjY2Vzc29yLnJiTmV4dCA9IG51bGw7XG4gICAgICAgIC8vIDw8PFxuICAgICAgICB0aGlzLnJvb3QgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICBzdWNjZXNzb3IucmJMZWZ0ID0gc3VjY2Vzc29yLnJiUmlnaHQgPSBudWxsO1xuICAgIHN1Y2Nlc3Nvci5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBzdWNjZXNzb3IucmJSZWQgPSB0cnVlO1xuICAgIC8vIEZpeHVwIHRoZSBtb2RpZmllZCB0cmVlIGJ5IHJlY29sb3Jpbmcgbm9kZXMgYW5kIHBlcmZvcm1pbmdcbiAgICAvLyByb3RhdGlvbnMgKDIgYXQgbW9zdCkgaGVuY2UgdGhlIHJlZC1ibGFjayB0cmVlIHByb3BlcnRpZXMgYXJlXG4gICAgLy8gcHJlc2VydmVkLlxuICAgIHZhciBncmFuZHBhLCB1bmNsZTtcbiAgICBub2RlID0gc3VjY2Vzc29yO1xuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50LnJiUmVkKSB7XG4gICAgICAgIGdyYW5kcGEgPSBwYXJlbnQucmJQYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgPT09IGdyYW5kcGEucmJMZWZ0KSB7XG4gICAgICAgICAgICB1bmNsZSA9IGdyYW5kcGEucmJSaWdodDtcbiAgICAgICAgICAgIGlmICh1bmNsZSAmJiB1bmNsZS5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHVuY2xlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGdyYW5kcGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudC5yYlJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBncmFuZHBhLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHVuY2xlID0gZ3JhbmRwYS5yYkxlZnQ7XG4gICAgICAgICAgICBpZiAodW5jbGUgJiYgdW5jbGUucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB1bmNsZS5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyYW5kcGEucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBncmFuZHBhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gcGFyZW50O1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICB9XG4gICAgdGhpcy5yb290LnJiUmVkID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJlbW92ZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgLy8gPj4+IHJoaWxsIDIwMTEtMDUtMjc6IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgIG5vZGUucmJOZXh0LnJiUHJldmlvdXMgPSBub2RlLnJiUHJldmlvdXM7XG4gICAgICAgIH1cbiAgICBpZiAobm9kZS5yYlByZXZpb3VzKSB7XG4gICAgICAgIG5vZGUucmJQcmV2aW91cy5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgfVxuICAgIG5vZGUucmJOZXh0ID0gbm9kZS5yYlByZXZpb3VzID0gbnVsbDtcbiAgICAvLyA8PDxcbiAgICB2YXIgcGFyZW50ID0gbm9kZS5yYlBhcmVudCxcbiAgICAgICAgbGVmdCA9IG5vZGUucmJMZWZ0LFxuICAgICAgICByaWdodCA9IG5vZGUucmJSaWdodCxcbiAgICAgICAgbmV4dDtcbiAgICBpZiAoIWxlZnQpIHtcbiAgICAgICAgbmV4dCA9IHJpZ2h0O1xuICAgICAgICB9XG4gICAgZWxzZSBpZiAoIXJpZ2h0KSB7XG4gICAgICAgIG5leHQgPSBsZWZ0O1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldEZpcnN0KHJpZ2h0KTtcbiAgICAgICAgfVxuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gZW5mb3JjZSByZWQtYmxhY2sgcnVsZXNcbiAgICB2YXIgaXNSZWQ7XG4gICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgaXNSZWQgPSBuZXh0LnJiUmVkO1xuICAgICAgICBuZXh0LnJiUmVkID0gbm9kZS5yYlJlZDtcbiAgICAgICAgbmV4dC5yYkxlZnQgPSBsZWZ0O1xuICAgICAgICBsZWZ0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgaWYgKG5leHQgIT09IHJpZ2h0KSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBuZXh0LnJiUGFyZW50O1xuICAgICAgICAgICAgbmV4dC5yYlBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICBub2RlID0gbmV4dC5yYlJpZ2h0O1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IG5vZGU7XG4gICAgICAgICAgICBuZXh0LnJiUmlnaHQgPSByaWdodDtcbiAgICAgICAgICAgIHJpZ2h0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXh0LnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgcGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIG5vZGUgPSBuZXh0LnJiUmlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaXNSZWQgPSBub2RlLnJiUmVkO1xuICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgICAgfVxuICAgIC8vICdub2RlJyBpcyBub3cgdGhlIHNvbGUgc3VjY2Vzc29yJ3MgY2hpbGQgYW5kICdwYXJlbnQnIGl0c1xuICAgIC8vIG5ldyBwYXJlbnQgKHNpbmNlIHRoZSBzdWNjZXNzb3IgY2FuIGhhdmUgYmVlbiBtb3ZlZClcbiAgICBpZiAobm9kZSkge1xuICAgICAgICBub2RlLnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgLy8gdGhlICdlYXN5JyBjYXNlc1xuICAgIGlmIChpc1JlZCkge3JldHVybjt9XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5yYlJlZCkge1xuICAgICAgICBub2RlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIC8vIHRoZSBvdGhlciBjYXNlc1xuICAgIHZhciBzaWJsaW5nO1xuICAgIGRvIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiUmlnaHQ7XG4gICAgICAgICAgICBpZiAoc2libGluZy5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoc2libGluZy5yYkxlZnQgJiYgc2libGluZy5yYkxlZnQucmJSZWQpIHx8IChzaWJsaW5nLnJiUmlnaHQgJiYgc2libGluZy5yYlJpZ2h0LnJiUmVkKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2libGluZy5yYlJpZ2h0IHx8ICFzaWJsaW5nLnJiUmlnaHQucmJSZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChzaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHBhcmVudC5yYlJlZDtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlTGVmdChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJMZWZ0O1xuICAgICAgICAgICAgaWYgKHNpYmxpbmcucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKHNpYmxpbmcucmJMZWZ0ICYmIHNpYmxpbmcucmJMZWZ0LnJiUmVkKSB8fCAoc2libGluZy5yYlJpZ2h0ICYmIHNpYmxpbmcucmJSaWdodC5yYlJlZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmcucmJMZWZ0IHx8ICFzaWJsaW5nLnJiTGVmdC5yYlJlZCkge1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHNpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBwYXJlbnQucmJSZWQ7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5yYlBhcmVudDtcbiAgICB9IHdoaWxlICghbm9kZS5yYlJlZCk7XG4gICAgaWYgKG5vZGUpIHtub2RlLnJiUmVkID0gZmFsc2U7fVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJSb3RhdGVMZWZ0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJSaWdodCwgLy8gY2FuJ3QgYmUgbnVsbFxuICAgICAgICBwYXJlbnQgPSBwLnJiUGFyZW50O1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IHApIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gcTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBxO1xuICAgICAgICB9XG4gICAgcS5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBwLnJiUGFyZW50ID0gcTtcbiAgICBwLnJiUmlnaHQgPSBxLnJiTGVmdDtcbiAgICBpZiAocC5yYlJpZ2h0KSB7XG4gICAgICAgIHAucmJSaWdodC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiTGVmdCA9IHA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJvdGF0ZVJpZ2h0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJMZWZ0LCAvLyBjYW4ndCBiZSBudWxsXG4gICAgICAgIHBhcmVudCA9IHAucmJQYXJlbnQ7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnJiTGVmdCA9PT0gcCkge1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IHE7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJiUmlnaHQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHE7XG4gICAgICAgIH1cbiAgICBxLnJiUGFyZW50ID0gcGFyZW50O1xuICAgIHAucmJQYXJlbnQgPSBxO1xuICAgIHAucmJMZWZ0ID0gcS5yYlJpZ2h0O1xuICAgIGlmIChwLnJiTGVmdCkge1xuICAgICAgICBwLnJiTGVmdC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiUmlnaHQgPSBwO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0Rmlyc3QgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgd2hpbGUgKG5vZGUucmJMZWZ0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgfVxuICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0TGFzdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB3aGlsZSAobm9kZS5yYlJpZ2h0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gbWV0aG9kc1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5EaWFncmFtID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IHNpdGU7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDZWxsIG1ldGhvZHNcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggY2VsbCApIHtcbiAgICAgICAgcmV0dXJuIGNlbGwuaW5pdChzaXRlKTtcbiAgICAgICAgfVxuICAgIHJldHVybiBuZXcgdGhpcy5DZWxsKHNpdGUpO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLnByZXBhcmVIYWxmZWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgLy8gZ2V0IHJpZCBvZiB1bnVzZWQgaGFsZmVkZ2VzXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNzogS2VlcCBpdCBzaW1wbGUsIG5vIHBvaW50IGhlcmUgaW4gdHJ5aW5nXG4gICAgLy8gdG8gYmUgZmFuY3k6IGRhbmdsaW5nIGVkZ2VzIGFyZSBhIHR5cGljYWxseSBhIG1pbm9yaXR5LlxuICAgIHdoaWxlIChpSGFsZmVkZ2UtLSkge1xuICAgICAgICBlZGdlID0gaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKCFlZGdlLnZiIHx8ICFlZGdlLnZhKSB7XG4gICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlIYWxmZWRnZSwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNjogSSB0cmllZCB0byB1c2UgYSBiaW5hcnkgc2VhcmNoIGF0IGluc2VydGlvblxuICAgIC8vIHRpbWUgdG8ga2VlcCB0aGUgYXJyYXkgc29ydGVkIG9uLXRoZS1mbHkgKGluIENlbGwuYWRkSGFsZmVkZ2UoKSkuXG4gICAgLy8gVGhlcmUgd2FzIG5vIHJlYWwgYmVuZWZpdHMgaW4gZG9pbmcgc28sIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gRmlyZWZveCAzLjYgd2FzIGltcHJvdmVkIG1hcmdpbmFsbHksIHdoaWxlIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gT3BlcmEgMTEgd2FzIHBlbmFsaXplZCBtYXJnaW5hbGx5LlxuICAgIGhhbGZlZGdlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGIuYW5nbGUtYS5hbmdsZTt9KTtcbiAgICByZXR1cm4gaGFsZmVkZ2VzLmxlbmd0aDtcbiAgICB9O1xuXG4vLyBSZXR1cm4gYSBsaXN0IG9mIHRoZSBuZWlnaGJvciBJZHNcblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldE5laWdoYm9ySWRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5laWdoYm9ycyA9IFtdLFxuICAgICAgICBpSGFsZmVkZ2UgPSB0aGlzLmhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKXtcbiAgICAgICAgZWRnZSA9IHRoaXMuaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKGVkZ2UubFNpdGUgIT09IG51bGwgJiYgZWRnZS5sU2l0ZS52b3Jvbm9pSWQgIT0gdGhpcy5zaXRlLnZvcm9ub2lJZCkge1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5sU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlZGdlLnJTaXRlICE9PSBudWxsICYmIGVkZ2UuclNpdGUudm9yb25vaUlkICE9IHRoaXMuc2l0ZS52b3Jvbm9pSWQpe1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5yU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgcmV0dXJuIG5laWdoYm9ycztcbiAgICB9O1xuXG4vLyBDb21wdXRlIGJvdW5kaW5nIGJveFxuLy9cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldEJib3ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIHhtaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeW1pbiA9IEluZmluaXR5LFxuICAgICAgICB4bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB5bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB2LCB2eCwgdnk7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKSB7XG4gICAgICAgIHYgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHZ4ID0gdi54O1xuICAgICAgICB2eSA9IHYueTtcbiAgICAgICAgaWYgKHZ4IDwgeG1pbikge3htaW4gPSB2eDt9XG4gICAgICAgIGlmICh2eSA8IHltaW4pIHt5bWluID0gdnk7fVxuICAgICAgICBpZiAodnggPiB4bWF4KSB7eG1heCA9IHZ4O31cbiAgICAgICAgaWYgKHZ5ID4geW1heCkge3ltYXggPSB2eTt9XG4gICAgICAgIC8vIHdlIGRvbnQgbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBlbmQgcG9pbnQsXG4gICAgICAgIC8vIHNpbmNlIGVhY2ggZW5kIHBvaW50IG1hdGNoZXMgYSBzdGFydCBwb2ludFxuICAgICAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeG1pbixcbiAgICAgICAgeTogeW1pbixcbiAgICAgICAgd2lkdGg6IHhtYXgteG1pbixcbiAgICAgICAgaGVpZ2h0OiB5bWF4LXltaW5cbiAgICAgICAgfTtcbiAgICB9O1xuXG4vLyBSZXR1cm4gd2hldGhlciBhIHBvaW50IGlzIGluc2lkZSwgb24sIG9yIG91dHNpZGUgdGhlIGNlbGw6XG4vLyAgIC0xOiBwb2ludCBpcyBvdXRzaWRlIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDA6IHBvaW50IGlzIG9uIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDE6IHBvaW50IGlzIGluc2lkZSB0aGUgcGVyaW1ldGVyIG9mIHRoZSBjZWxsXG4vL1xuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUucG9pbnRJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgLy8gQ2hlY2sgaWYgcG9pbnQgaW4gcG9seWdvbi4gU2luY2UgYWxsIHBvbHlnb25zIG9mIGEgVm9yb25vaVxuICAgIC8vIGRpYWdyYW0gYXJlIGNvbnZleCwgdGhlbjpcbiAgICAvLyBodHRwOi8vcGF1bGJvdXJrZS5uZXQvZ2VvbWV0cnkvcG9seWdvbm1lc2gvXG4gICAgLy8gU29sdXRpb24gMyAoMkQpOlxuICAgIC8vICAgXCJJZiB0aGUgcG9seWdvbiBpcyBjb252ZXggdGhlbiBvbmUgY2FuIGNvbnNpZGVyIHRoZSBwb2x5Z29uXG4gICAgLy8gICBcImFzIGEgJ3BhdGgnIGZyb20gdGhlIGZpcnN0IHZlcnRleC4gQSBwb2ludCBpcyBvbiB0aGUgaW50ZXJpb3JcbiAgICAvLyAgIFwib2YgdGhpcyBwb2x5Z29ucyBpZiBpdCBpcyBhbHdheXMgb24gdGhlIHNhbWUgc2lkZSBvZiBhbGwgdGhlXG4gICAgLy8gICBcImxpbmUgc2VnbWVudHMgbWFraW5nIHVwIHRoZSBwYXRoLiAuLi5cbiAgICAvLyAgIFwiKHkgLSB5MCkgKHgxIC0geDApIC0gKHggLSB4MCkgKHkxIC0geTApXG4gICAgLy8gICBcImlmIGl0IGlzIGxlc3MgdGhhbiAwIHRoZW4gUCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIGxpbmUgc2VnbWVudCxcbiAgICAvLyAgIFwiaWYgZ3JlYXRlciB0aGFuIDAgaXQgaXMgdG8gdGhlIGxlZnQsIGlmIGVxdWFsIHRvIDAgdGhlbiBpdCBsaWVzXG4gICAgLy8gICBcIm9uIHRoZSBsaW5lIHNlZ21lbnRcIlxuICAgIHZhciBoYWxmZWRnZXMgPSB0aGlzLmhhbGZlZGdlcyxcbiAgICAgICAgaUhhbGZlZGdlID0gaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgaGFsZmVkZ2UsXG4gICAgICAgIHAwLCBwMSwgcjtcbiAgICB3aGlsZSAoaUhhbGZlZGdlLS0pIHtcbiAgICAgICAgaGFsZmVkZ2UgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXTtcbiAgICAgICAgcDAgPSBoYWxmZWRnZS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHAxID0gaGFsZmVkZ2UuZ2V0RW5kcG9pbnQoKTtcbiAgICAgICAgciA9ICh5LXAwLnkpKihwMS54LXAwLngpLSh4LXAwLngpKihwMS55LXAwLnkpO1xuICAgICAgICBpZiAoIXIpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAociA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHJldHVybiAxO1xuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRWRnZSBtZXRob2RzXG4vL1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5WZXJ0ZXggPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkVkZ2UgPSBmdW5jdGlvbihsU2l0ZSwgclNpdGUpIHtcbiAgICB0aGlzLmxTaXRlID0gbFNpdGU7XG4gICAgdGhpcy5yU2l0ZSA9IHJTaXRlO1xuICAgIHRoaXMudmEgPSB0aGlzLnZiID0gbnVsbDtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZSA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IGxTaXRlO1xuICAgIHRoaXMuZWRnZSA9IGVkZ2U7XG4gICAgLy8gJ2FuZ2xlJyBpcyBhIHZhbHVlIHRvIGJlIHVzZWQgZm9yIHByb3Blcmx5IHNvcnRpbmcgdGhlXG4gICAgLy8gaGFsZnNlZ21lbnRzIGNvdW50ZXJjbG9ja3dpc2UuIEJ5IGNvbnZlbnRpb24sIHdlIHdpbGxcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIHRoZSBsaW5lIGRlZmluZWQgYnkgdGhlICdzaXRlIHRvIHRoZSBsZWZ0J1xuICAgIC8vIHRvIHRoZSAnc2l0ZSB0byB0aGUgcmlnaHQnLlxuICAgIC8vIEhvd2V2ZXIsIGJvcmRlciBlZGdlcyBoYXZlIG5vICdzaXRlIHRvIHRoZSByaWdodCc6IHRodXMgd2VcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIGxpbmUgcGVycGVuZGljdWxhciB0byB0aGUgaGFsZnNlZ21lbnQgKHRoZVxuICAgIC8vIGVkZ2Ugc2hvdWxkIGhhdmUgYm90aCBlbmQgcG9pbnRzIGRlZmluZWQgaW4gc3VjaCBjYXNlLilcbiAgICBpZiAoclNpdGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IE1hdGguYXRhbjIoclNpdGUueS1sU2l0ZS55LCByU2l0ZS54LWxTaXRlLngpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgICAgICB2YiA9IGVkZ2UudmI7XG4gICAgICAgIC8vIHJoaWxsIDIwMTEtMDUtMzE6IHVzZWQgdG8gY2FsbCBnZXRTdGFydHBvaW50KCkvZ2V0RW5kcG9pbnQoKSxcbiAgICAgICAgLy8gYnV0IGZvciBwZXJmb3JtYW5jZSBwdXJwb3NlLCB0aGVzZSBhcmUgZXhwYW5kZWQgaW4gcGxhY2UgaGVyZS5cbiAgICAgICAgdGhpcy5hbmdsZSA9IGVkZ2UubFNpdGUgPT09IGxTaXRlID9cbiAgICAgICAgICAgIE1hdGguYXRhbjIodmIueC12YS54LCB2YS55LXZiLnkpIDpcbiAgICAgICAgICAgIE1hdGguYXRhbjIodmEueC12Yi54LCB2Yi55LXZhLnkpO1xuICAgICAgICB9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlSGFsZmVkZ2UgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0U3RhcnRwb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVkZ2UubFNpdGUgPT09IHRoaXMuc2l0ZSA/IHRoaXMuZWRnZS52YSA6IHRoaXMuZWRnZS52YjtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0RW5kcG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lZGdlLmxTaXRlID09PSB0aGlzLnNpdGUgPyB0aGlzLmVkZ2UudmIgOiB0aGlzLmVkZ2UudmE7XG4gICAgfTtcblxuXG5cbi8vIHRoaXMgY3JlYXRlIGFuZCBhZGQgYSB2ZXJ0ZXggdG8gdGhlIGludGVybmFsIGNvbGxlY3Rpb25cblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlVmVydGV4ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0ZXhKdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoICF2ICkge1xuICAgICAgICB2ID0gbmV3IHRoaXMuVmVydGV4KHgsIHkpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHYueCA9IHg7XG4gICAgICAgIHYueSA9IHk7XG4gICAgICAgIH1cbiAgICB0aGlzLnZlcnRpY2VzLnB1c2godik7XG4gICAgcmV0dXJuIHY7XG4gICAgfTtcblxuLy8gdGhpcyBjcmVhdGUgYW5kIGFkZCBhbiBlZGdlIHRvIGludGVybmFsIGNvbGxlY3Rpb24sIGFuZCBhbHNvIGNyZWF0ZVxuLy8gdHdvIGhhbGZlZGdlcyB3aGljaCBhcmUgYWRkZWQgdG8gZWFjaCBzaXRlJ3MgY291bnRlcmNsb2Nrd2lzZSBhcnJheVxuLy8gb2YgaGFsZmVkZ2VzLlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVFZGdlID0gZnVuY3Rpb24obFNpdGUsIHJTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCByU2l0ZSk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS5sU2l0ZSA9IGxTaXRlO1xuICAgICAgICBlZGdlLnJTaXRlID0gclNpdGU7XG4gICAgICAgIGVkZ2UudmEgPSBlZGdlLnZiID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgdGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xuICAgIGlmICh2YSkge1xuICAgICAgICB0aGlzLnNldEVkZ2VTdGFydHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmEpO1xuICAgICAgICB9XG4gICAgaWYgKHZiKSB7XG4gICAgICAgIHRoaXMuc2V0RWRnZUVuZHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmIpO1xuICAgICAgICB9XG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKSk7XG4gICAgdGhpcy5jZWxsc1tyU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgclNpdGUsIGxTaXRlKSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQm9yZGVyRWRnZSA9IGZ1bmN0aW9uKGxTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCBudWxsKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgZWRnZS52YSA9IHZhO1xuICAgIGVkZ2UudmIgPSB2YjtcbiAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuc2V0RWRnZVN0YXJ0cG9pbnQgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUsIHZlcnRleCkge1xuICAgIGlmICghZWRnZS52YSAmJiAhZWRnZS52Yikge1xuICAgICAgICBlZGdlLnZhID0gdmVydGV4O1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSByU2l0ZTtcbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UubFNpdGUgPT09IHJTaXRlKSB7XG4gICAgICAgIGVkZ2UudmIgPSB2ZXJ0ZXg7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS52YSA9IHZlcnRleDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnNldEVkZ2VFbmRwb2ludCA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KSB7XG4gICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChlZGdlLCByU2l0ZSwgbFNpdGUsIHZlcnRleCk7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBCZWFjaGxpbmUgbWV0aG9kc1xuXG4vLyByaGlsbCAyMDExLTA2LTA3OiBGb3Igc29tZSByZWFzb25zLCBwZXJmb3JtYW5jZSBzdWZmZXJzIHNpZ25pZmljYW50bHlcbi8vIHdoZW4gaW5zdGFuY2lhdGluZyBhIGxpdGVyYWwgb2JqZWN0IGluc3RlYWQgb2YgYW4gZW1wdHkgY3RvclxuVm9yb25vaS5wcm90b3R5cGUuQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgfTtcblxuLy8gcmhpbGwgMjAxMS0wNi0wMjogQSBsb3Qgb2YgQmVhY2hzZWN0aW9uIGluc3RhbmNpYXRpb25zXG4vLyBvY2N1ciBkdXJpbmcgdGhlIGNvbXB1dGF0aW9uIG9mIHRoZSBWb3Jvbm9pIGRpYWdyYW0sXG4vLyBzb21ld2hlcmUgYmV0d2VlbiB0aGUgbnVtYmVyIG9mIHNpdGVzIGFuZCB0d2ljZSB0aGVcbi8vIG51bWJlciBvZiBzaXRlcywgd2hpbGUgdGhlIG51bWJlciBvZiBCZWFjaHNlY3Rpb25zIG9uIHRoZVxuLy8gYmVhY2hsaW5lIGF0IGFueSBnaXZlbiB0aW1lIGlzIGNvbXBhcmF0aXZlbHkgbG93LiBGb3IgdGhpc1xuLy8gcmVhc29uLCB3ZSByZXVzZSBhbHJlYWR5IGNyZWF0ZWQgQmVhY2hzZWN0aW9ucywgaW4gb3JkZXJcbi8vIHRvIGF2b2lkIG5ldyBtZW1vcnkgYWxsb2NhdGlvbi4gVGhpcyByZXN1bHRlZCBpbiBhIG1lYXN1cmFibGVcbi8vIHBlcmZvcm1hbmNlIGdhaW4uXG5cblZvcm9ub2kucHJvdG90eXBlLmNyZWF0ZUJlYWNoc2VjdGlvbiA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgYmVhY2hzZWN0aW9uID0gdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoIWJlYWNoc2VjdGlvbikge1xuICAgICAgICBiZWFjaHNlY3Rpb24gPSBuZXcgdGhpcy5CZWFjaHNlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIGJlYWNoc2VjdGlvbi5zaXRlID0gc2l0ZTtcbiAgICByZXR1cm4gYmVhY2hzZWN0aW9uO1xuICAgIH07XG5cbi8vIGNhbGN1bGF0ZSB0aGUgbGVmdCBicmVhayBwb2ludCBvZiBhIHBhcnRpY3VsYXIgYmVhY2ggc2VjdGlvbixcbi8vIGdpdmVuIGEgcGFydGljdWxhciBzd2VlcCBsaW5lXG5Wb3Jvbm9pLnByb3RvdHlwZS5sZWZ0QnJlYWtQb2ludCA9IGZ1bmN0aW9uKGFyYywgZGlyZWN0cml4KSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9QYXJhYm9sYVxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUXVhZHJhdGljX2VxdWF0aW9uXG4gICAgLy8gaDEgPSB4MSxcbiAgICAvLyBrMSA9ICh5MStkaXJlY3RyaXgpLzIsXG4gICAgLy8gaDIgPSB4MixcbiAgICAvLyBrMiA9ICh5MitkaXJlY3RyaXgpLzIsXG4gICAgLy8gcDEgPSBrMS1kaXJlY3RyaXgsXG4gICAgLy8gYTEgPSAxLyg0KnAxKSxcbiAgICAvLyBiMSA9IC1oMS8oMipwMSksXG4gICAgLy8gYzEgPSBoMSpoMS8oNCpwMSkrazEsXG4gICAgLy8gcDIgPSBrMi1kaXJlY3RyaXgsXG4gICAgLy8gYTIgPSAxLyg0KnAyKSxcbiAgICAvLyBiMiA9IC1oMi8oMipwMiksXG4gICAgLy8gYzIgPSBoMipoMi8oNCpwMikrazIsXG4gICAgLy8geCA9ICgtKGIyLWIxKSArIE1hdGguc3FydCgoYjItYjEpKihiMi1iMSkgLSA0KihhMi1hMSkqKGMyLWMxKSkpIC8gKDIqKGEyLWExKSlcbiAgICAvLyBXaGVuIHgxIGJlY29tZSB0aGUgeC1vcmlnaW46XG4gICAgLy8gaDEgPSAwLFxuICAgIC8vIGsxID0gKHkxK2RpcmVjdHJpeCkvMixcbiAgICAvLyBoMiA9IHgyLXgxLFxuICAgIC8vIGsyID0gKHkyK2RpcmVjdHJpeCkvMixcbiAgICAvLyBwMSA9IGsxLWRpcmVjdHJpeCxcbiAgICAvLyBhMSA9IDEvKDQqcDEpLFxuICAgIC8vIGIxID0gMCxcbiAgICAvLyBjMSA9IGsxLFxuICAgIC8vIHAyID0gazItZGlyZWN0cml4LFxuICAgIC8vIGEyID0gMS8oNCpwMiksXG4gICAgLy8gYjIgPSAtaDIvKDIqcDIpLFxuICAgIC8vIGMyID0gaDIqaDIvKDQqcDIpK2syLFxuICAgIC8vIHggPSAoLWIyICsgTWF0aC5zcXJ0KGIyKmIyIC0gNCooYTItYTEpKihjMi1rMSkpKSAvICgyKihhMi1hMSkpICsgeDFcblxuICAgIC8vIGNoYW5nZSBjb2RlIGJlbG93IGF0IHlvdXIgb3duIHJpc2s6IGNhcmUgaGFzIGJlZW4gdGFrZW4gdG9cbiAgICAvLyByZWR1Y2UgZXJyb3JzIGR1ZSB0byBjb21wdXRlcnMnIGZpbml0ZSBhcml0aG1ldGljIHByZWNpc2lvbi5cbiAgICAvLyBNYXliZSBjYW4gc3RpbGwgYmUgaW1wcm92ZWQsIHdpbGwgc2VlIGlmIGFueSBtb3JlIG9mIHRoaXNcbiAgICAvLyBraW5kIG9mIGVycm9ycyBwb3AgdXAgYWdhaW4uXG4gICAgdmFyIHNpdGUgPSBhcmMuc2l0ZSxcbiAgICAgICAgcmZvY3ggPSBzaXRlLngsXG4gICAgICAgIHJmb2N5ID0gc2l0ZS55LFxuICAgICAgICBwYnkyID0gcmZvY3ktZGlyZWN0cml4O1xuICAgIC8vIHBhcmFib2xhIGluIGRlZ2VuZXJhdGUgY2FzZSB3aGVyZSBmb2N1cyBpcyBvbiBkaXJlY3RyaXhcbiAgICBpZiAoIXBieTIpIHtcbiAgICAgICAgcmV0dXJuIHJmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGxBcmMgPSBhcmMucmJQcmV2aW91cztcbiAgICBpZiAoIWxBcmMpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgICAgfVxuICAgIHNpdGUgPSBsQXJjLnNpdGU7XG4gICAgdmFyIGxmb2N4ID0gc2l0ZS54LFxuICAgICAgICBsZm9jeSA9IHNpdGUueSxcbiAgICAgICAgcGxieTIgPSBsZm9jeS1kaXJlY3RyaXg7XG4gICAgLy8gcGFyYWJvbGEgaW4gZGVnZW5lcmF0ZSBjYXNlIHdoZXJlIGZvY3VzIGlzIG9uIGRpcmVjdHJpeFxuICAgIGlmICghcGxieTIpIHtcbiAgICAgICAgcmV0dXJuIGxmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGhsID0gbGZvY3gtcmZvY3gsXG4gICAgICAgIGFieTIgPSAxL3BieTItMS9wbGJ5MixcbiAgICAgICAgYiA9IGhsL3BsYnkyO1xuICAgIGlmIChhYnkyKSB7XG4gICAgICAgIHJldHVybiAoLWIrdGhpcy5zcXJ0KGIqYi0yKmFieTIqKGhsKmhsLygtMipwbGJ5MiktbGZvY3krcGxieTIvMityZm9jeS1wYnkyLzIpKSkvYWJ5MityZm9jeDtcbiAgICAgICAgfVxuICAgIC8vIGJvdGggcGFyYWJvbGFzIGhhdmUgc2FtZSBkaXN0YW5jZSB0byBkaXJlY3RyaXgsIHRodXMgYnJlYWsgcG9pbnQgaXMgbWlkd2F5XG4gICAgcmV0dXJuIChyZm9jeCtsZm9jeCkvMjtcbiAgICB9O1xuXG4vLyBjYWxjdWxhdGUgdGhlIHJpZ2h0IGJyZWFrIHBvaW50IG9mIGEgcGFydGljdWxhciBiZWFjaCBzZWN0aW9uLFxuLy8gZ2l2ZW4gYSBwYXJ0aWN1bGFyIGRpcmVjdHJpeFxuVm9yb25vaS5wcm90b3R5cGUucmlnaHRCcmVha1BvaW50ID0gZnVuY3Rpb24oYXJjLCBkaXJlY3RyaXgpIHtcbiAgICB2YXIgckFyYyA9IGFyYy5yYk5leHQ7XG4gICAgaWYgKHJBcmMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdEJyZWFrUG9pbnQockFyYywgZGlyZWN0cml4KTtcbiAgICAgICAgfVxuICAgIHZhciBzaXRlID0gYXJjLnNpdGU7XG4gICAgcmV0dXJuIHNpdGUueSA9PT0gZGlyZWN0cml4ID8gc2l0ZS54IDogSW5maW5pdHk7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuZGV0YWNoQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oYmVhY2hzZWN0aW9uKSB7XG4gICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChiZWFjaHNlY3Rpb24pOyAvLyBkZXRhY2ggcG90ZW50aWFsbHkgYXR0YWNoZWQgY2lyY2xlIGV2ZW50XG4gICAgdGhpcy5iZWFjaGxpbmUucmJSZW1vdmVOb2RlKGJlYWNoc2VjdGlvbik7IC8vIHJlbW92ZSBmcm9tIFJCLXRyZWVcbiAgICB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkLnB1c2goYmVhY2hzZWN0aW9uKTsgLy8gbWFyayBmb3IgcmV1c2VcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5yZW1vdmVCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihiZWFjaHNlY3Rpb24pIHtcbiAgICB2YXIgY2lyY2xlID0gYmVhY2hzZWN0aW9uLmNpcmNsZUV2ZW50LFxuICAgICAgICB4ID0gY2lyY2xlLngsXG4gICAgICAgIHkgPSBjaXJjbGUueWNlbnRlcixcbiAgICAgICAgdmVydGV4ID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeCwgeSksXG4gICAgICAgIHByZXZpb3VzID0gYmVhY2hzZWN0aW9uLnJiUHJldmlvdXMsXG4gICAgICAgIG5leHQgPSBiZWFjaHNlY3Rpb24ucmJOZXh0LFxuICAgICAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucyA9IFtiZWFjaHNlY3Rpb25dLFxuICAgICAgICBhYnNfZm4gPSBNYXRoLmFicztcblxuICAgIC8vIHJlbW92ZSBjb2xsYXBzZWQgYmVhY2hzZWN0aW9uIGZyb20gYmVhY2hsaW5lXG4gICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24oYmVhY2hzZWN0aW9uKTtcblxuICAgIC8vIHRoZXJlIGNvdWxkIGJlIG1vcmUgdGhhbiBvbmUgZW1wdHkgYXJjIGF0IHRoZSBkZWxldGlvbiBwb2ludCwgdGhpc1xuICAgIC8vIGhhcHBlbnMgd2hlbiBtb3JlIHRoYW4gdHdvIGVkZ2VzIGFyZSBsaW5rZWQgYnkgdGhlIHNhbWUgdmVydGV4LFxuICAgIC8vIHNvIHdlIHdpbGwgY29sbGVjdCBhbGwgdGhvc2UgZWRnZXMgYnkgbG9va2luZyB1cCBib3RoIHNpZGVzIG9mXG4gICAgLy8gdGhlIGRlbGV0aW9uIHBvaW50LlxuICAgIC8vIGJ5IHRoZSB3YXksIHRoZXJlIGlzICphbHdheXMqIGEgcHJlZGVjZXNzb3Ivc3VjY2Vzc29yIHRvIGFueSBjb2xsYXBzZWRcbiAgICAvLyBiZWFjaCBzZWN0aW9uLCBpdCdzIGp1c3QgaW1wb3NzaWJsZSB0byBoYXZlIGEgY29sbGFwc2luZyBmaXJzdC9sYXN0XG4gICAgLy8gYmVhY2ggc2VjdGlvbnMgb24gdGhlIGJlYWNobGluZSwgc2luY2UgdGhleSBvYnZpb3VzbHkgYXJlIHVuY29uc3RyYWluZWRcbiAgICAvLyBvbiB0aGVpciBsZWZ0L3JpZ2h0IHNpZGUuXG5cbiAgICAvLyBsb29rIGxlZnRcbiAgICB2YXIgbEFyYyA9IHByZXZpb3VzO1xuICAgIHdoaWxlIChsQXJjLmNpcmNsZUV2ZW50ICYmIGFic19mbih4LWxBcmMuY2lyY2xlRXZlbnQueCk8MWUtOSAmJiBhYnNfZm4oeS1sQXJjLmNpcmNsZUV2ZW50LnljZW50ZXIpPDFlLTkpIHtcbiAgICAgICAgcHJldmlvdXMgPSBsQXJjLnJiUHJldmlvdXM7XG4gICAgICAgIGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLnVuc2hpZnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQmVhY2hzZWN0aW9uKGxBcmMpOyAvLyBtYXJrIGZvciByZXVzZVxuICAgICAgICBsQXJjID0gcHJldmlvdXM7XG4gICAgICAgIH1cbiAgICAvLyBldmVuIHRob3VnaCBpdCBpcyBub3QgZGlzYXBwZWFyaW5nLCBJIHdpbGwgYWxzbyBhZGQgdGhlIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpbW1lZGlhdGVseSB0byB0aGUgbGVmdCBvZiB0aGUgbGVmdC1tb3N0IGNvbGxhcHNlZCBiZWFjaCBzZWN0aW9uLCBmb3JcbiAgICAvLyBjb252ZW5pZW5jZSwgc2luY2Ugd2UgbmVlZCB0byByZWZlciB0byBpdCBsYXRlciBhcyB0aGlzIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpcyB0aGUgJ2xlZnQnIHNpdGUgb2YgYW4gZWRnZSBmb3Igd2hpY2ggYSBzdGFydCBwb2ludCBpcyBzZXQuXG4gICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMudW5zaGlmdChsQXJjKTtcbiAgICB0aGlzLmRldGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuXG4gICAgLy8gbG9vayByaWdodFxuICAgIHZhciByQXJjID0gbmV4dDtcbiAgICB3aGlsZSAockFyYy5jaXJjbGVFdmVudCAmJiBhYnNfZm4oeC1yQXJjLmNpcmNsZUV2ZW50LngpPDFlLTkgJiYgYWJzX2ZuKHktckFyYy5jaXJjbGVFdmVudC55Y2VudGVyKTwxZS05KSB7XG4gICAgICAgIG5leHQgPSByQXJjLnJiTmV4dDtcbiAgICAgICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMucHVzaChyQXJjKTtcbiAgICAgICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24ockFyYyk7IC8vIG1hcmsgZm9yIHJldXNlXG4gICAgICAgIHJBcmMgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gd2UgYWxzbyBoYXZlIHRvIGFkZCB0aGUgYmVhY2ggc2VjdGlvbiBpbW1lZGlhdGVseSB0byB0aGUgcmlnaHQgb2YgdGhlXG4gICAgLy8gcmlnaHQtbW9zdCBjb2xsYXBzZWQgYmVhY2ggc2VjdGlvbiwgc2luY2UgdGhlcmUgaXMgYWxzbyBhIGRpc2FwcGVhcmluZ1xuICAgIC8vIHRyYW5zaXRpb24gcmVwcmVzZW50aW5nIGFuIGVkZ2UncyBzdGFydCBwb2ludCBvbiBpdHMgbGVmdC5cbiAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucy5wdXNoKHJBcmMpO1xuICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAvLyB3YWxrIHRocm91Z2ggYWxsIHRoZSBkaXNhcHBlYXJpbmcgdHJhbnNpdGlvbnMgYmV0d2VlbiBiZWFjaCBzZWN0aW9ucyBhbmRcbiAgICAvLyBzZXQgdGhlIHN0YXJ0IHBvaW50IG9mIHRoZWlyIChpbXBsaWVkKSBlZGdlLlxuICAgIHZhciBuQXJjcyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLmxlbmd0aCxcbiAgICAgICAgaUFyYztcbiAgICBmb3IgKGlBcmM9MTsgaUFyYzxuQXJjczsgaUFyYysrKSB7XG4gICAgICAgIHJBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1tpQXJjXTtcbiAgICAgICAgbEFyYyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zW2lBcmMtMV07XG4gICAgICAgIHRoaXMuc2V0RWRnZVN0YXJ0cG9pbnQockFyYy5lZGdlLCBsQXJjLnNpdGUsIHJBcmMuc2l0ZSwgdmVydGV4KTtcbiAgICAgICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgbmV3IGVkZ2UgYXMgd2UgaGF2ZSBub3cgYSBuZXcgdHJhbnNpdGlvbiBiZXR3ZWVuXG4gICAgLy8gdHdvIGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdlcmUgcHJldmlvdXNseSBub3QgYWRqYWNlbnQuXG4gICAgLy8gc2luY2UgdGhpcyBlZGdlIGFwcGVhcnMgYXMgYSBuZXcgdmVydGV4IGlzIGRlZmluZWQsIHRoZSB2ZXJ0ZXhcbiAgICAvLyBhY3R1YWxseSBkZWZpbmUgYW4gZW5kIHBvaW50IG9mIHRoZSBlZGdlIChyZWxhdGl2ZSB0byB0aGUgc2l0ZVxuICAgIC8vIG9uIHRoZSBsZWZ0KVxuICAgIGxBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1swXTtcbiAgICByQXJjID0gZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnNbbkFyY3MtMV07XG4gICAgckFyYy5lZGdlID0gdGhpcy5jcmVhdGVFZGdlKGxBcmMuc2l0ZSwgckFyYy5zaXRlLCB1bmRlZmluZWQsIHZlcnRleCk7XG5cbiAgICAvLyBjcmVhdGUgY2lyY2xlIGV2ZW50cyBpZiBhbnkgZm9yIGJlYWNoIHNlY3Rpb25zIGxlZnQgaW4gdGhlIGJlYWNobGluZVxuICAgIC8vIGFkamFjZW50IHRvIGNvbGxhcHNlZCBzZWN0aW9uc1xuICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChyQXJjKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5hZGRCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgdmFyIHggPSBzaXRlLngsXG4gICAgICAgIGRpcmVjdHJpeCA9IHNpdGUueTtcblxuICAgIC8vIGZpbmQgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdpbGwgc3Vycm91bmQgdGhlIG5ld2x5XG4gICAgLy8gY3JlYXRlZCBiZWFjaCBzZWN0aW9uLlxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDE6IFRoaXMgbG9vcCBpcyBvbmUgb2YgdGhlIG1vc3Qgb2Z0ZW4gZXhlY3V0ZWQsXG4gICAgLy8gaGVuY2Ugd2UgZXhwYW5kIGluLXBsYWNlIHRoZSBjb21wYXJpc29uLWFnYWluc3QtZXBzaWxvbiBjYWxscy5cbiAgICB2YXIgbEFyYywgckFyYyxcbiAgICAgICAgZHhsLCBkeHIsXG4gICAgICAgIG5vZGUgPSB0aGlzLmJlYWNobGluZS5yb290O1xuXG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgZHhsID0gdGhpcy5sZWZ0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCkteDtcbiAgICAgICAgLy8geCBsZXNzVGhhbldpdGhFcHNpbG9uIHhsID0+IGZhbGxzIHNvbWV3aGVyZSBiZWZvcmUgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgIGlmIChkeGwgPiAxZS05KSB7XG4gICAgICAgICAgICAvLyB0aGlzIGNhc2Ugc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgICAgICAgLy8gaWYgKCFub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgLy8gICAgckFyYyA9IG5vZGUucmJMZWZ0O1xuICAgICAgICAgICAgLy8gICAgYnJlYWs7XG4gICAgICAgICAgICAvLyAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5yYkxlZnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZHhyID0geC10aGlzLnJpZ2h0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCk7XG4gICAgICAgICAgICAvLyB4IGdyZWF0ZXJUaGFuV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgc29tZXdoZXJlIGFmdGVyIHRoZSByaWdodCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgIGlmIChkeHIgPiAxZS05KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geGwgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgbGVmdCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAoZHhsID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICAgICAgckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZHhyID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHJBcmMgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGZhbGxzIGV4YWN0bHkgc29tZXdoZXJlIGluIHRoZSBtaWRkbGUgb2YgdGhlIGJlYWNoc2VjdGlvblxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBrZWVwIGluIG1pbmQgdGhhdCBsQXJjIGFuZC9vciByQXJjIGNvdWxkIGJlXG4gICAgLy8gdW5kZWZpbmVkIG9yIG51bGwuXG5cbiAgICAvLyBjcmVhdGUgYSBuZXcgYmVhY2ggc2VjdGlvbiBvYmplY3QgZm9yIHRoZSBzaXRlIGFuZCBhZGQgaXQgdG8gUkItdHJlZVxuICAgIHZhciBuZXdBcmMgPSB0aGlzLmNyZWF0ZUJlYWNoc2VjdGlvbihzaXRlKTtcbiAgICB0aGlzLmJlYWNobGluZS5yYkluc2VydFN1Y2Nlc3NvcihsQXJjLCBuZXdBcmMpO1xuXG4gICAgLy8gY2FzZXM6XG4gICAgLy9cblxuICAgIC8vIFtudWxsLG51bGxdXG4gICAgLy8gbGVhc3QgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGlzIHRoZSBmaXJzdCBiZWFjaCBzZWN0aW9uIG9uIHRoZVxuICAgIC8vIGJlYWNobGluZS5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBubyBuZXcgdHJhbnNpdGlvbiBhcHBlYXJzXG4gICAgLy8gICBubyBjb2xsYXBzaW5nIGJlYWNoIHNlY3Rpb25cbiAgICAvLyAgIG5ldyBiZWFjaHNlY3Rpb24gYmVjb21lIHJvb3Qgb2YgdGhlIFJCLXRyZWVcbiAgICBpZiAoIWxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbEFyYyxyQXJjXSB3aGVyZSBsQXJjID09IHJBcmNcbiAgICAvLyBtb3N0IGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBzcGxpdCBhbiBleGlzdGluZyBiZWFjaFxuICAgIC8vIHNlY3Rpb24uXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIG5ldyB0cmFuc2l0aW9uIGFwcGVhcnNcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIHR3byBuZXcgbm9kZXMgYWRkZWQgdG8gdGhlIFJCLXRyZWVcbiAgICBpZiAobEFyYyA9PT0gckFyYykge1xuICAgICAgICAvLyBpbnZhbGlkYXRlIGNpcmNsZSBldmVudCBvZiBzcGxpdCBiZWFjaCBzZWN0aW9uXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG5cbiAgICAgICAgLy8gc3BsaXQgdGhlIGJlYWNoIHNlY3Rpb24gaW50byB0d28gc2VwYXJhdGUgYmVhY2ggc2VjdGlvbnNcbiAgICAgICAgckFyYyA9IHRoaXMuY3JlYXRlQmVhY2hzZWN0aW9uKGxBcmMuc2l0ZSk7XG4gICAgICAgIHRoaXMuYmVhY2hsaW5lLnJiSW5zZXJ0U3VjY2Vzc29yKG5ld0FyYywgckFyYyk7XG5cbiAgICAgICAgLy8gc2luY2Ugd2UgaGF2ZSBhIG5ldyB0cmFuc2l0aW9uIGJldHdlZW4gdHdvIGJlYWNoIHNlY3Rpb25zLFxuICAgICAgICAvLyBhIG5ldyBlZGdlIGlzIGJvcm5cbiAgICAgICAgbmV3QXJjLmVkZ2UgPSByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLCBuZXdBcmMuc2l0ZSk7XG5cbiAgICAgICAgLy8gY2hlY2sgd2hldGhlciB0aGUgbGVmdCBhbmQgcmlnaHQgYmVhY2ggc2VjdGlvbnMgYXJlIGNvbGxhcHNpbmdcbiAgICAgICAgLy8gYW5kIGlmIHNvIGNyZWF0ZSBjaXJjbGUgZXZlbnRzLCB0byBiZSBub3RpZmllZCB3aGVuIHRoZSBwb2ludCBvZlxuICAgICAgICAvLyBjb2xsYXBzZSBpcyByZWFjaGVkLlxuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KHJBcmMpO1xuICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIC8vIFtsQXJjLG51bGxdXG4gICAgLy8gZXZlbiBsZXNzIGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBpcyB0aGUgKmxhc3QqIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBvbiB0aGUgYmVhY2hsaW5lIC0tIHRoaXMgY2FuIGhhcHBlbiAqb25seSogaWYgKmFsbCogdGhlIHByZXZpb3VzIGJlYWNoXG4gICAgLy8gc2VjdGlvbnMgY3VycmVudGx5IG9uIHRoZSBiZWFjaGxpbmUgc2hhcmUgdGhlIHNhbWUgeSB2YWx1ZSBhc1xuICAgIC8vIHRoZSBuZXcgYmVhY2ggc2VjdGlvbi5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBvbmUgbmV3IHRyYW5zaXRpb24gYXBwZWFyc1xuICAgIC8vICAgbm8gY29sbGFwc2luZyBiZWFjaCBzZWN0aW9uIGFzIGEgcmVzdWx0XG4gICAgLy8gICBuZXcgYmVhY2ggc2VjdGlvbiBiZWNvbWUgcmlnaHQtbW9zdCBub2RlIG9mIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgbmV3QXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLG5ld0FyYy5zaXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbnVsbCxyQXJjXVxuICAgIC8vIGltcG9zc2libGUgY2FzZTogYmVjYXVzZSBzaXRlcyBhcmUgc3RyaWN0bHkgcHJvY2Vzc2VkIGZyb20gdG9wIHRvIGJvdHRvbSxcbiAgICAvLyBhbmQgbGVmdCB0byByaWdodCwgd2hpY2ggZ3VhcmFudGVlcyB0aGF0IHRoZXJlIHdpbGwgYWx3YXlzIGJlIGEgYmVhY2ggc2VjdGlvblxuICAgIC8vIG9uIHRoZSBsZWZ0IC0tIGV4Y2VwdCBvZiBjb3Vyc2Ugd2hlbiB0aGVyZSBhcmUgbm8gYmVhY2ggc2VjdGlvbiBhdCBhbGwgb25cbiAgICAvLyB0aGUgYmVhY2ggbGluZSwgd2hpY2ggY2FzZSB3YXMgaGFuZGxlZCBhYm92ZS5cbiAgICAvLyByaGlsbCAyMDExLTA2LTAyOiBObyBwb2ludCB0ZXN0aW5nIGluIG5vbi1kZWJ1ZyB2ZXJzaW9uXG4gICAgLy9pZiAoIWxBcmMgJiYgckFyYykge1xuICAgIC8vICAgIHRocm93IFwiVm9yb25vaS5hZGRCZWFjaHNlY3Rpb24oKTogV2hhdCBpcyB0aGlzIEkgZG9uJ3QgZXZlblwiO1xuICAgIC8vICAgIH1cblxuICAgIC8vIFtsQXJjLHJBcmNdIHdoZXJlIGxBcmMgIT0gckFyY1xuICAgIC8vIHNvbWV3aGF0IGxlc3MgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGZhbGxzICpleGFjdGx5KiBpbiBiZXR3ZWVuIHR3b1xuICAgIC8vIGV4aXN0aW5nIGJlYWNoIHNlY3Rpb25zXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIHRyYW5zaXRpb24gZGlzYXBwZWFyc1xuICAgIC8vICAgdHdvIG5ldyB0cmFuc2l0aW9ucyBhcHBlYXJcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIG9ubHkgb25lIG5ldyBub2RlIGFkZGVkIHRvIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgIT09IHJBcmMpIHtcbiAgICAgICAgLy8gaW52YWxpZGF0ZSBjaXJjbGUgZXZlbnRzIG9mIGxlZnQgYW5kIHJpZ2h0IHNpdGVzXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAgICAgLy8gYW4gZXhpc3RpbmcgdHJhbnNpdGlvbiBkaXNhcHBlYXJzLCBtZWFuaW5nIGEgdmVydGV4IGlzIGRlZmluZWQgYXRcbiAgICAgICAgLy8gdGhlIGRpc2FwcGVhcmFuY2UgcG9pbnQuXG4gICAgICAgIC8vIHNpbmNlIHRoZSBkaXNhcHBlYXJhbmNlIGlzIGNhdXNlZCBieSB0aGUgbmV3IGJlYWNoc2VjdGlvbiwgdGhlXG4gICAgICAgIC8vIHZlcnRleCBpcyBhdCB0aGUgY2VudGVyIG9mIHRoZSBjaXJjdW1zY3JpYmVkIGNpcmNsZSBvZiB0aGUgbGVmdCxcbiAgICAgICAgLy8gbmV3IGFuZCByaWdodCBiZWFjaHNlY3Rpb25zLlxuICAgICAgICAvLyBodHRwOi8vbWF0aGZvcnVtLm9yZy9saWJyYXJ5L2RybWF0aC92aWV3LzU1MDAyLmh0bWxcbiAgICAgICAgLy8gRXhjZXB0IHRoYXQgSSBicmluZyB0aGUgb3JpZ2luIGF0IEEgdG8gc2ltcGxpZnlcbiAgICAgICAgLy8gY2FsY3VsYXRpb25cbiAgICAgICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICAgICAgYXggPSBsU2l0ZS54LFxuICAgICAgICAgICAgYXkgPSBsU2l0ZS55LFxuICAgICAgICAgICAgYng9c2l0ZS54LWF4LFxuICAgICAgICAgICAgYnk9c2l0ZS55LWF5LFxuICAgICAgICAgICAgclNpdGUgPSByQXJjLnNpdGUsXG4gICAgICAgICAgICBjeD1yU2l0ZS54LWF4LFxuICAgICAgICAgICAgY3k9clNpdGUueS1heSxcbiAgICAgICAgICAgIGQ9MiooYngqY3ktYnkqY3gpLFxuICAgICAgICAgICAgaGI9YngqYngrYnkqYnksXG4gICAgICAgICAgICBoYz1jeCpjeCtjeSpjeSxcbiAgICAgICAgICAgIHZlcnRleCA9IHRoaXMuY3JlYXRlVmVydGV4KChjeSpoYi1ieSpoYykvZCtheCwgKGJ4KmhjLWN4KmhiKS9kK2F5KTtcblxuICAgICAgICAvLyBvbmUgdHJhbnNpdGlvbiBkaXNhcHBlYXJcbiAgICAgICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChyQXJjLmVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KTtcblxuICAgICAgICAvLyB0d28gbmV3IHRyYW5zaXRpb25zIGFwcGVhciBhdCB0aGUgbmV3IHZlcnRleCBsb2NhdGlvblxuICAgICAgICBuZXdBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShsU2l0ZSwgc2l0ZSwgdW5kZWZpbmVkLCB2ZXJ0ZXgpO1xuICAgICAgICByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2Uoc2l0ZSwgclNpdGUsIHVuZGVmaW5lZCwgdmVydGV4KTtcblxuICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9ucyBhcmUgY29sbGFwc2luZ1xuICAgICAgICAvLyBhbmQgaWYgc28gY3JlYXRlIGNpcmNsZSBldmVudHMsIHRvIGhhbmRsZSB0aGUgcG9pbnQgb2YgY29sbGFwc2UuXG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ2lyY2xlIGV2ZW50IG1ldGhvZHNcblxuLy8gcmhpbGwgMjAxMS0wNi0wNzogRm9yIHNvbWUgcmVhc29ucywgcGVyZm9ybWFuY2Ugc3VmZmVycyBzaWduaWZpY2FudGx5XG4vLyB3aGVuIGluc3RhbmNpYXRpbmcgYSBsaXRlcmFsIG9iamVjdCBpbnN0ZWFkIG9mIGFuIGVtcHR5IGN0b3JcblZvcm9ub2kucHJvdG90eXBlLkNpcmNsZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmhpbGwgMjAxMy0xMC0xMjogaXQgaGVscHMgdG8gc3RhdGUgZXhhY3RseSB3aGF0IHdlIGFyZSBhdCBjdG9yIHRpbWUuXG4gICAgdGhpcy5hcmMgPSBudWxsO1xuICAgIHRoaXMucmJMZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJiTmV4dCA9IG51bGw7XG4gICAgdGhpcy5yYlBhcmVudCA9IG51bGw7XG4gICAgdGhpcy5yYlByZXZpb3VzID0gbnVsbDtcbiAgICB0aGlzLnJiUmVkID0gZmFsc2U7XG4gICAgdGhpcy5yYlJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnNpdGUgPSBudWxsO1xuICAgIHRoaXMueCA9IHRoaXMueSA9IHRoaXMueWNlbnRlciA9IDA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuYXR0YWNoQ2lyY2xlRXZlbnQgPSBmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgbEFyYyA9IGFyYy5yYlByZXZpb3VzLFxuICAgICAgICByQXJjID0gYXJjLnJiTmV4dDtcbiAgICBpZiAoIWxBcmMgfHwgIXJBcmMpIHtyZXR1cm47fSAvLyBkb2VzIHRoYXQgZXZlciBoYXBwZW4/XG4gICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICBjU2l0ZSA9IGFyYy5zaXRlLFxuICAgICAgICByU2l0ZSA9IHJBcmMuc2l0ZTtcblxuICAgIC8vIElmIHNpdGUgb2YgbGVmdCBiZWFjaHNlY3Rpb24gaXMgc2FtZSBhcyBzaXRlIG9mXG4gICAgLy8gcmlnaHQgYmVhY2hzZWN0aW9uLCB0aGVyZSBjYW4ndCBiZSBjb252ZXJnZW5jZVxuICAgIGlmIChsU2l0ZT09PXJTaXRlKSB7cmV0dXJuO31cblxuICAgIC8vIEZpbmQgdGhlIGNpcmN1bXNjcmliZWQgY2lyY2xlIGZvciB0aGUgdGhyZWUgc2l0ZXMgYXNzb2NpYXRlZFxuICAgIC8vIHdpdGggdGhlIGJlYWNoc2VjdGlvbiB0cmlwbGV0LlxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjY6IEl0IGlzIG1vcmUgZWZmaWNpZW50IHRvIGNhbGN1bGF0ZSBpbi1wbGFjZVxuICAgIC8vIHJhdGhlciB0aGFuIGdldHRpbmcgdGhlIHJlc3VsdGluZyBjaXJjdW1zY3JpYmVkIGNpcmNsZSBmcm9tIGFuXG4gICAgLy8gb2JqZWN0IHJldHVybmVkIGJ5IGNhbGxpbmcgVm9yb25vaS5jaXJjdW1jaXJjbGUoKVxuICAgIC8vIGh0dHA6Ly9tYXRoZm9ydW0ub3JnL2xpYnJhcnkvZHJtYXRoL3ZpZXcvNTUwMDIuaHRtbFxuICAgIC8vIEV4Y2VwdCB0aGF0IEkgYnJpbmcgdGhlIG9yaWdpbiBhdCBjU2l0ZSB0byBzaW1wbGlmeSBjYWxjdWxhdGlvbnMuXG4gICAgLy8gVGhlIGJvdHRvbS1tb3N0IHBhcnQgb2YgdGhlIGNpcmN1bWNpcmNsZSBpcyBvdXIgRm9ydHVuZSAnY2lyY2xlXG4gICAgLy8gZXZlbnQnLCBhbmQgaXRzIGNlbnRlciBpcyBhIHZlcnRleCBwb3RlbnRpYWxseSBwYXJ0IG9mIHRoZSBmaW5hbFxuICAgIC8vIFZvcm9ub2kgZGlhZ3JhbS5cbiAgICB2YXIgYnggPSBjU2l0ZS54LFxuICAgICAgICBieSA9IGNTaXRlLnksXG4gICAgICAgIGF4ID0gbFNpdGUueC1ieCxcbiAgICAgICAgYXkgPSBsU2l0ZS55LWJ5LFxuICAgICAgICBjeCA9IHJTaXRlLngtYngsXG4gICAgICAgIGN5ID0gclNpdGUueS1ieTtcblxuICAgIC8vIElmIHBvaW50cyBsLT5jLT5yIGFyZSBjbG9ja3dpc2UsIHRoZW4gY2VudGVyIGJlYWNoIHNlY3Rpb24gZG9lcyBub3RcbiAgICAvLyBjb2xsYXBzZSwgaGVuY2UgaXQgY2FuJ3QgZW5kIHVwIGFzIGEgdmVydGV4ICh3ZSByZXVzZSAnZCcgaGVyZSwgd2hpY2hcbiAgICAvLyBzaWduIGlzIHJldmVyc2Ugb2YgdGhlIG9yaWVudGF0aW9uLCBoZW5jZSB3ZSByZXZlcnNlIHRoZSB0ZXN0LlxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ3VydmVfb3JpZW50YXRpb24jT3JpZW50YXRpb25fb2ZfYV9zaW1wbGVfcG9seWdvblxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjE6IE5hc3R5IGZpbml0ZSBwcmVjaXNpb24gZXJyb3Igd2hpY2ggY2F1c2VkIGNpcmN1bWNpcmNsZSgpIHRvXG4gICAgLy8gcmV0dXJuIGluZmluaXRlczogMWUtMTIgc2VlbXMgdG8gZml4IHRoZSBwcm9ibGVtLlxuICAgIHZhciBkID0gMiooYXgqY3ktYXkqY3gpO1xuICAgIGlmIChkID49IC0yZS0xMil7cmV0dXJuO31cblxuICAgIHZhciBoYSA9IGF4KmF4K2F5KmF5LFxuICAgICAgICBoYyA9IGN4KmN4K2N5KmN5LFxuICAgICAgICB4ID0gKGN5KmhhLWF5KmhjKS9kLFxuICAgICAgICB5ID0gKGF4KmhjLWN4KmhhKS9kLFxuICAgICAgICB5Y2VudGVyID0geStieTtcblxuICAgIC8vIEltcG9ydGFudDogeWJvdHRvbSBzaG91bGQgYWx3YXlzIGJlIHVuZGVyIG9yIGF0IHN3ZWVwLCBzbyBubyBuZWVkXG4gICAgLy8gdG8gd2FzdGUgQ1BVIGN5Y2xlcyBieSBjaGVja2luZ1xuXG4gICAgLy8gcmVjeWNsZSBjaXJjbGUgZXZlbnQgb2JqZWN0IGlmIHBvc3NpYmxlXG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gdGhpcy5jaXJjbGVFdmVudEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICghY2lyY2xlRXZlbnQpIHtcbiAgICAgICAgY2lyY2xlRXZlbnQgPSBuZXcgdGhpcy5DaXJjbGVFdmVudCgpO1xuICAgICAgICB9XG4gICAgY2lyY2xlRXZlbnQuYXJjID0gYXJjO1xuICAgIGNpcmNsZUV2ZW50LnNpdGUgPSBjU2l0ZTtcbiAgICBjaXJjbGVFdmVudC54ID0geCtieDtcbiAgICBjaXJjbGVFdmVudC55ID0geWNlbnRlcit0aGlzLnNxcnQoeCp4K3kqeSk7IC8vIHkgYm90dG9tXG4gICAgY2lyY2xlRXZlbnQueWNlbnRlciA9IHljZW50ZXI7XG4gICAgYXJjLmNpcmNsZUV2ZW50ID0gY2lyY2xlRXZlbnQ7XG5cbiAgICAvLyBmaW5kIGluc2VydGlvbiBwb2ludCBpbiBSQi10cmVlOiBjaXJjbGUgZXZlbnRzIGFyZSBvcmRlcmVkIGZyb21cbiAgICAvLyBzbWFsbGVzdCB0byBsYXJnZXN0XG4gICAgdmFyIHByZWRlY2Vzc29yID0gbnVsbCxcbiAgICAgICAgbm9kZSA9IHRoaXMuY2lyY2xlRXZlbnRzLnJvb3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKGNpcmNsZUV2ZW50LnkgPCBub2RlLnkgfHwgKGNpcmNsZUV2ZW50LnkgPT09IG5vZGUueSAmJiBjaXJjbGVFdmVudC54IDw9IG5vZGUueCkpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVkZWNlc3NvciA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vZGUucmJSaWdodCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJlZGVjZXNzb3IgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHRoaXMuY2lyY2xlRXZlbnRzLnJiSW5zZXJ0U3VjY2Vzc29yKHByZWRlY2Vzc29yLCBjaXJjbGVFdmVudCk7XG4gICAgaWYgKCFwcmVkZWNlc3Nvcikge1xuICAgICAgICB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQgPSBjaXJjbGVFdmVudDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLmRldGFjaENpcmNsZUV2ZW50ID0gZnVuY3Rpb24oYXJjKSB7XG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gYXJjLmNpcmNsZUV2ZW50O1xuICAgIGlmIChjaXJjbGVFdmVudCkge1xuICAgICAgICBpZiAoIWNpcmNsZUV2ZW50LnJiUHJldmlvdXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RDaXJjbGVFdmVudCA9IGNpcmNsZUV2ZW50LnJiTmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgdGhpcy5jaXJjbGVFdmVudHMucmJSZW1vdmVOb2RlKGNpcmNsZUV2ZW50KTsgLy8gcmVtb3ZlIGZyb20gUkItdHJlZVxuICAgICAgICB0aGlzLmNpcmNsZUV2ZW50SnVua3lhcmQucHVzaChjaXJjbGVFdmVudCk7XG4gICAgICAgIGFyYy5jaXJjbGVFdmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gY29tcGxldGlvbiBtZXRob2RzXG5cbi8vIGNvbm5lY3QgZGFuZ2xpbmcgZWRnZXMgKG5vdCBpZiBhIGN1cnNvcnkgdGVzdCB0ZWxscyB1c1xuLy8gaXQgaXMgbm90IGdvaW5nIHRvIGJlIHZpc2libGUuXG4vLyByZXR1cm4gdmFsdWU6XG4vLyAgIGZhbHNlOiB0aGUgZGFuZ2xpbmcgZW5kcG9pbnQgY291bGRuJ3QgYmUgY29ubmVjdGVkXG4vLyAgIHRydWU6IHRoZSBkYW5nbGluZyBlbmRwb2ludCBjb3VsZCBiZSBjb25uZWN0ZWRcblZvcm9ub2kucHJvdG90eXBlLmNvbm5lY3RFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIC8vIHNraXAgaWYgZW5kIHBvaW50IGFscmVhZHkgY29ubmVjdGVkXG4gICAgdmFyIHZiID0gZWRnZS52YjtcbiAgICBpZiAoISF2Yikge3JldHVybiB0cnVlO31cblxuICAgIC8vIG1ha2UgbG9jYWwgY29weSBmb3IgcGVyZm9ybWFuY2UgcHVycG9zZVxuICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgIHhsID0gYmJveC54bCxcbiAgICAgICAgeHIgPSBiYm94LnhyLFxuICAgICAgICB5dCA9IGJib3gueXQsXG4gICAgICAgIHliID0gYmJveC55YixcbiAgICAgICAgbFNpdGUgPSBlZGdlLmxTaXRlLFxuICAgICAgICByU2l0ZSA9IGVkZ2UuclNpdGUsXG4gICAgICAgIGx4ID0gbFNpdGUueCxcbiAgICAgICAgbHkgPSBsU2l0ZS55LFxuICAgICAgICByeCA9IHJTaXRlLngsXG4gICAgICAgIHJ5ID0gclNpdGUueSxcbiAgICAgICAgZnggPSAobHgrcngpLzIsXG4gICAgICAgIGZ5ID0gKGx5K3J5KS8yLFxuICAgICAgICBmbSwgZmI7XG5cbiAgICAvLyBpZiB3ZSByZWFjaCBoZXJlLCB0aGlzIG1lYW5zIGNlbGxzIHdoaWNoIHVzZSB0aGlzIGVkZ2Ugd2lsbCBuZWVkXG4gICAgLy8gdG8gYmUgY2xvc2VkLCB3aGV0aGVyIGJlY2F1c2UgdGhlIGVkZ2Ugd2FzIHJlbW92ZWQsIG9yIGJlY2F1c2UgaXRcbiAgICAvLyB3YXMgY29ubmVjdGVkIHRvIHRoZSBib3VuZGluZyBib3guXG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuICAgIHRoaXMuY2VsbHNbclNpdGUudm9yb25vaUlkXS5jbG9zZU1lID0gdHJ1ZTtcblxuICAgIC8vIGdldCB0aGUgbGluZSBlcXVhdGlvbiBvZiB0aGUgYmlzZWN0b3IgaWYgbGluZSBpcyBub3QgdmVydGljYWxcbiAgICBpZiAocnkgIT09IGx5KSB7XG4gICAgICAgIGZtID0gKGx4LXJ4KS8ocnktbHkpO1xuICAgICAgICBmYiA9IGZ5LWZtKmZ4O1xuICAgICAgICB9XG5cbiAgICAvLyByZW1lbWJlciwgZGlyZWN0aW9uIG9mIGxpbmUgKHJlbGF0aXZlIHRvIGxlZnQgc2l0ZSk6XG4gICAgLy8gdXB3YXJkOiBsZWZ0LnggPCByaWdodC54XG4gICAgLy8gZG93bndhcmQ6IGxlZnQueCA+IHJpZ2h0LnhcbiAgICAvLyBob3Jpem9udGFsOiBsZWZ0LnggPT0gcmlnaHQueFxuICAgIC8vIHVwd2FyZDogbGVmdC54IDwgcmlnaHQueFxuICAgIC8vIHJpZ2h0d2FyZDogbGVmdC55IDwgcmlnaHQueVxuICAgIC8vIGxlZnR3YXJkOiBsZWZ0LnkgPiByaWdodC55XG4gICAgLy8gdmVydGljYWw6IGxlZnQueSA9PSByaWdodC55XG5cbiAgICAvLyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiwgZmluZCB0aGUgYmVzdCBzaWRlIG9mIHRoZVxuICAgIC8vIGJvdW5kaW5nIGJveCB0byB1c2UgdG8gZGV0ZXJtaW5lIGEgcmVhc29uYWJsZSBzdGFydCBwb2ludFxuXG4gICAgLy8gcmhpbGwgMjAxMy0xMi0wMjpcbiAgICAvLyBXaGlsZSBhdCBpdCwgc2luY2Ugd2UgaGF2ZSB0aGUgdmFsdWVzIHdoaWNoIGRlZmluZSB0aGUgbGluZSxcbiAgICAvLyBjbGlwIHRoZSBlbmQgb2YgdmEgaWYgaXQgaXMgb3V0c2lkZSB0aGUgYmJveC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE1XG4gICAgLy8gVE9ETzogRG8gYWxsIHRoZSBjbGlwcGluZyBoZXJlIHJhdGhlciB0aGFuIHJlbHkgb24gTGlhbmctQmFyc2t5XG4gICAgLy8gd2hpY2ggZG9lcyBub3QgZG8gd2VsbCBzb21ldGltZXMgZHVlIHRvIGxvc3Mgb2YgYXJpdGhtZXRpY1xuICAgIC8vIHByZWNpc2lvbi4gVGhlIGNvZGUgaGVyZSBkb2Vzbid0IGRlZ3JhZGUgaWYgb25lIG9mIHRoZSB2ZXJ0ZXggaXNcbiAgICAvLyBhdCBhIGh1Z2UgZGlzdGFuY2UuXG5cbiAgICAvLyBzcGVjaWFsIGNhc2U6IHZlcnRpY2FsIGxpbmVcbiAgICBpZiAoZm0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBkb2Vzbid0IGludGVyc2VjdCB3aXRoIHZpZXdwb3J0XG4gICAgICAgIGlmIChmeCA8IHhsIHx8IGZ4ID49IHhyKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgLy8gZG93bndhcmRcbiAgICAgICAgaWYgKGx4ID4gcngpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeWIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyB1cHdhcmRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPiB5Yikge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoZngsIHliKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YS55IDwgeXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIHZlcnRpY2FsIHRoYW4gaG9yaXpvbnRhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyB0b3Agb3IgYm90dG9tIHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2UgaWYgKGZtIDwgLTEgfHwgZm0gPiAxKSB7XG4gICAgICAgIC8vIGRvd253YXJkXG4gICAgICAgIGlmIChseCA+IHJ4KSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPCB5dCkge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIHVwd2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA+IHliKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIGhvcml6b250YWwgdGhhbiB2ZXJ0aWNhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyBsZWZ0IG9yIHJpZ2h0IHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2Uge1xuICAgICAgICAvLyByaWdodHdhcmRcbiAgICAgICAgaWYgKGx5IDwgcnkpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA8IHhsKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgZm0qeGwrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPj0geHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyBsZWZ0d2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA+IHhyKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPCB4bCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBmbSp4bCtmYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlZGdlLnZhID0gdmE7XG4gICAgZWRnZS52YiA9IHZiO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gbGluZS1jbGlwcGluZyBjb2RlIHRha2VuIGZyb206XG4vLyAgIExpYW5nLUJhcnNreSBmdW5jdGlvbiBieSBEYW5pZWwgV2hpdGVcbi8vICAgaHR0cDovL3d3dy5za3l0b3BpYS5jb20vcHJvamVjdC9hcnRpY2xlcy9jb21wc2NpL2NsaXBwaW5nLmh0bWxcbi8vIFRoYW5rcyFcbi8vIEEgYml0IG1vZGlmaWVkIHRvIG1pbmltaXplIGNvZGUgcGF0aHNcblZvcm9ub2kucHJvdG90eXBlLmNsaXBFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIHZhciBheCA9IGVkZ2UudmEueCxcbiAgICAgICAgYXkgPSBlZGdlLnZhLnksXG4gICAgICAgIGJ4ID0gZWRnZS52Yi54LFxuICAgICAgICBieSA9IGVkZ2UudmIueSxcbiAgICAgICAgdDAgPSAwLFxuICAgICAgICB0MSA9IDEsXG4gICAgICAgIGR4ID0gYngtYXgsXG4gICAgICAgIGR5ID0gYnktYXk7XG4gICAgLy8gbGVmdFxuICAgIHZhciBxID0gYXgtYmJveC54bDtcbiAgICBpZiAoZHg9PT0wICYmIHE8MCkge3JldHVybiBmYWxzZTt9XG4gICAgdmFyIHIgPSAtcS9keDtcbiAgICBpZiAoZHg8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeD4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIHJpZ2h0XG4gICAgcSA9IGJib3gueHItYXg7XG4gICAgaWYgKGR4PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSBxL2R4O1xuICAgIGlmIChkeDwwKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR4PjApIHtcbiAgICAgICAgaWYgKHI8dDApIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocjx0MSkge3QxPXI7fVxuICAgICAgICB9XG4gICAgLy8gdG9wXG4gICAgcSA9IGF5LWJib3gueXQ7XG4gICAgaWYgKGR5PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSAtcS9keTtcbiAgICBpZiAoZHk8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeT4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIGJvdHRvbVxuICAgIHEgPSBiYm94LnliLWF5O1xuICAgIGlmIChkeT09PTAgJiYgcTwwKSB7cmV0dXJuIGZhbHNlO31cbiAgICByID0gcS9keTtcbiAgICBpZiAoZHk8MCkge1xuICAgICAgICBpZiAocj50MSkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPnQwKSB7dDA9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeT4wKSB7XG4gICAgICAgIGlmIChyPHQwKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI8dDEpIHt0MT1yO31cbiAgICAgICAgfVxuXG4gICAgLy8gaWYgd2UgcmVhY2ggdGhpcyBwb2ludCwgVm9yb25vaSBlZGdlIGlzIHdpdGhpbiBiYm94XG5cbiAgICAvLyBpZiB0MCA+IDAsIHZhIG5lZWRzIHRvIGNoYW5nZVxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDM6IHdlIG5lZWQgdG8gY3JlYXRlIGEgbmV3IHZlcnRleCByYXRoZXJcbiAgICAvLyB0aGFuIG1vZGlmeWluZyB0aGUgZXhpc3Rpbmcgb25lLCBzaW5jZSB0aGUgZXhpc3RpbmdcbiAgICAvLyBvbmUgaXMgbGlrZWx5IHNoYXJlZCB3aXRoIGF0IGxlYXN0IGFub3RoZXIgZWRnZVxuICAgIGlmICh0MCA+IDApIHtcbiAgICAgICAgZWRnZS52YSA9IHRoaXMuY3JlYXRlVmVydGV4KGF4K3QwKmR4LCBheSt0MCpkeSk7XG4gICAgICAgIH1cblxuICAgIC8vIGlmIHQxIDwgMSwgdmIgbmVlZHMgdG8gY2hhbmdlXG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wMzogd2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgdmVydGV4IHJhdGhlclxuICAgIC8vIHRoYW4gbW9kaWZ5aW5nIHRoZSBleGlzdGluZyBvbmUsIHNpbmNlIHRoZSBleGlzdGluZ1xuICAgIC8vIG9uZSBpcyBsaWtlbHkgc2hhcmVkIHdpdGggYXQgbGVhc3QgYW5vdGhlciBlZGdlXG4gICAgaWYgKHQxIDwgMSkge1xuICAgICAgICBlZGdlLnZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoYXgrdDEqZHgsIGF5K3QxKmR5KTtcbiAgICAgICAgfVxuXG4gICAgLy8gdmEgYW5kL29yIHZiIHdlcmUgY2xpcHBlZCwgdGh1cyB3ZSB3aWxsIG5lZWQgdG8gY2xvc2VcbiAgICAvLyBjZWxscyB3aGljaCB1c2UgdGhpcyBlZGdlLlxuICAgIGlmICggdDAgPiAwIHx8IHQxIDwgMSApIHtcbiAgICAgICAgdGhpcy5jZWxsc1tlZGdlLmxTaXRlLnZvcm9ub2lJZF0uY2xvc2VNZSA9IHRydWU7XG4gICAgICAgIHRoaXMuY2VsbHNbZWRnZS5yU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbi8vIENvbm5lY3QvY3V0IGVkZ2VzIGF0IGJvdW5kaW5nIGJveFxuVm9yb25vaS5wcm90b3R5cGUuY2xpcEVkZ2VzID0gZnVuY3Rpb24oYmJveCkge1xuICAgIC8vIGNvbm5lY3QgYWxsIGRhbmdsaW5nIGVkZ2VzIHRvIGJvdW5kaW5nIGJveFxuICAgIC8vIG9yIGdldCByaWQgb2YgdGhlbSBpZiBpdCBjYW4ndCBiZSBkb25lXG4gICAgdmFyIGVkZ2VzID0gdGhpcy5lZGdlcyxcbiAgICAgICAgaUVkZ2UgPSBlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2UsXG4gICAgICAgIGFic19mbiA9IE1hdGguYWJzO1xuXG4gICAgLy8gaXRlcmF0ZSBiYWNrd2FyZCBzbyB3ZSBjYW4gc3BsaWNlIHNhZmVseVxuICAgIHdoaWxlIChpRWRnZS0tKSB7XG4gICAgICAgIGVkZ2UgPSBlZGdlc1tpRWRnZV07XG4gICAgICAgIC8vIGVkZ2UgaXMgcmVtb3ZlZCBpZjpcbiAgICAgICAgLy8gICBpdCBpcyB3aG9sbHkgb3V0c2lkZSB0aGUgYm91bmRpbmcgYm94XG4gICAgICAgIC8vICAgaXQgaXMgbG9va2luZyBtb3JlIGxpa2UgYSBwb2ludCB0aGFuIGEgbGluZVxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdEVkZ2UoZWRnZSwgYmJveCkgfHxcbiAgICAgICAgICAgICF0aGlzLmNsaXBFZGdlKGVkZ2UsIGJib3gpIHx8XG4gICAgICAgICAgICAoYWJzX2ZuKGVkZ2UudmEueC1lZGdlLnZiLngpPDFlLTkgJiYgYWJzX2ZuKGVkZ2UudmEueS1lZGdlLnZiLnkpPDFlLTkpKSB7XG4gICAgICAgICAgICBlZGdlLnZhID0gZWRnZS52YiA9IG51bGw7XG4gICAgICAgICAgICBlZGdlcy5zcGxpY2UoaUVkZ2UsMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyBDbG9zZSB0aGUgY2VsbHMuXG4vLyBUaGUgY2VsbHMgYXJlIGJvdW5kIGJ5IHRoZSBzdXBwbGllZCBib3VuZGluZyBib3guXG4vLyBFYWNoIGNlbGwgcmVmZXJzIHRvIGl0cyBhc3NvY2lhdGVkIHNpdGUsIGFuZCBhIGxpc3Rcbi8vIG9mIGhhbGZlZGdlcyBvcmRlcmVkIGNvdW50ZXJjbG9ja3dpc2UuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jbG9zZUNlbGxzID0gZnVuY3Rpb24oYmJveCkge1xuICAgIHZhciB4bCA9IGJib3gueGwsXG4gICAgICAgIHhyID0gYmJveC54cixcbiAgICAgICAgeXQgPSBiYm94Lnl0LFxuICAgICAgICB5YiA9IGJib3gueWIsXG4gICAgICAgIGNlbGxzID0gdGhpcy5jZWxscyxcbiAgICAgICAgaUNlbGwgPSBjZWxscy5sZW5ndGgsXG4gICAgICAgIGNlbGwsXG4gICAgICAgIGlMZWZ0LFxuICAgICAgICBoYWxmZWRnZXMsIG5IYWxmZWRnZXMsXG4gICAgICAgIGVkZ2UsXG4gICAgICAgIHZhLCB2YiwgdnosXG4gICAgICAgIGxhc3RCb3JkZXJTZWdtZW50LFxuICAgICAgICBhYnNfZm4gPSBNYXRoLmFicztcblxuICAgIHdoaWxlIChpQ2VsbC0tKSB7XG4gICAgICAgIGNlbGwgPSBjZWxsc1tpQ2VsbF07XG4gICAgICAgIC8vIHBydW5lLCBvcmRlciBoYWxmZWRnZXMgY291bnRlcmNsb2Nrd2lzZSwgdGhlbiBhZGQgbWlzc2luZyBvbmVzXG4gICAgICAgIC8vIHJlcXVpcmVkIHRvIGNsb3NlIGNlbGxzXG4gICAgICAgIGlmICghY2VsbC5wcmVwYXJlSGFsZmVkZ2VzKCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAoIWNlbGwuY2xvc2VNZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIGZpbmQgZmlyc3QgJ3VuY2xvc2VkJyBwb2ludC5cbiAgICAgICAgLy8gYW4gJ3VuY2xvc2VkJyBwb2ludCB3aWxsIGJlIHRoZSBlbmQgcG9pbnQgb2YgYSBoYWxmZWRnZSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBtYXRjaCB0aGUgc3RhcnQgcG9pbnQgb2YgdGhlIGZvbGxvd2luZyBoYWxmZWRnZVxuICAgICAgICBoYWxmZWRnZXMgPSBjZWxsLmhhbGZlZGdlcztcbiAgICAgICAgbkhhbGZlZGdlcyA9IGhhbGZlZGdlcy5sZW5ndGg7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZTogb25seSBvbmUgc2l0ZSwgaW4gd2hpY2ggY2FzZSwgdGhlIHZpZXdwb3J0IGlzIHRoZSBjZWxsXG4gICAgICAgIC8vIC4uLlxuXG4gICAgICAgIC8vIGFsbCBvdGhlciBjYXNlc1xuICAgICAgICBpTGVmdCA9IDA7XG4gICAgICAgIHdoaWxlIChpTGVmdCA8IG5IYWxmZWRnZXMpIHtcbiAgICAgICAgICAgIHZhID0gaGFsZmVkZ2VzW2lMZWZ0XS5nZXRFbmRwb2ludCgpO1xuICAgICAgICAgICAgdnogPSBoYWxmZWRnZXNbKGlMZWZ0KzEpICUgbkhhbGZlZGdlc10uZ2V0U3RhcnRwb2ludCgpO1xuICAgICAgICAgICAgLy8gaWYgZW5kIHBvaW50IGlzIG5vdCBlcXVhbCB0byBzdGFydCBwb2ludCwgd2UgbmVlZCB0byBhZGQgdGhlIG1pc3NpbmdcbiAgICAgICAgICAgIC8vIGhhbGZlZGdlKHMpIHVwIHRvIHZ6XG4gICAgICAgICAgICBpZiAoYWJzX2ZuKHZhLngtdnoueCk+PTFlLTkgfHwgYWJzX2ZuKHZhLnktdnoueSk+PTFlLTkpIHtcblxuICAgICAgICAgICAgICAgIC8vIHJoaWxsIDIwMTMtMTItMDI6XG4gICAgICAgICAgICAgICAgLy8gXCJIb2xlc1wiIGluIHRoZSBoYWxmZWRnZXMgYXJlIG5vdCBuZWNlc3NhcmlseSBhbHdheXMgYWRqYWNlbnQuXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL2lzc3Vlcy8xNlxuXG4gICAgICAgICAgICAgICAgLy8gZmluZCBlbnRyeSBwb2ludDpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRydWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIGRvd253YXJkIGFsb25nIGxlZnQgc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS54LHhsKSAmJiB0aGlzLmxlc3NUaGFuV2l0aEVwc2lsb24odmEueSx5Yik6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeGwsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgcmlnaHR3YXJkIGFsb25nIGJvdHRvbSBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLnkseWIpICYmIHRoaXMubGVzc1RoYW5XaXRoRXBzaWxvbih2YS54LHhyKTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LnkseWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnggOiB4ciwgeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayB1cHdhcmQgYWxvbmcgcmlnaHQgc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS54LHhyKSAmJiB0aGlzLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24odmEueSx5dCk6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeHIsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgbGVmdHdhcmQgYWxvbmcgdG9wIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odmEueSx5dCkgJiYgdGhpcy5ncmVhdGVyVGhhbldpdGhFcHNpbG9uKHZhLngseGwpOlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueSx5dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueCA6IHhsLCB5dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FsayBkb3dud2FyZCBhbG9uZyBsZWZ0IHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgcmlnaHR3YXJkIGFsb25nIGJvdHRvbSBzaWRlXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei55LHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgobGFzdEJvcmRlclNlZ21lbnQgPyB2ei54IDogeHIsIHliKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIHVwd2FyZCBhbG9uZyByaWdodCBzaWRlXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei54LHhyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeHIsIGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueSA6IHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFwiVm9yb25vaS5jbG9zZUNlbGxzKCkgPiB0aGlzIG1ha2VzIG5vIHNlbnNlIVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgY2VsbC5jbG9zZU1lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERlYnVnZ2luZyBoZWxwZXJcbi8qXG5Wb3Jvbm9pLnByb3RvdHlwZS5kdW1wQmVhY2hsaW5lID0gZnVuY3Rpb24oeSkge1xuICAgIGNvbnNvbGUubG9nKCdWb3Jvbm9pLmR1bXBCZWFjaGxpbmUoJWYpID4gQmVhY2hzZWN0aW9ucywgZnJvbSBsZWZ0IHRvIHJpZ2h0OicsIHkpO1xuICAgIGlmICggIXRoaXMuYmVhY2hsaW5lICkge1xuICAgICAgICBjb25zb2xlLmxvZygnICBOb25lJyk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGJzID0gdGhpcy5iZWFjaGxpbmUuZ2V0Rmlyc3QodGhpcy5iZWFjaGxpbmUucm9vdCk7XG4gICAgICAgIHdoaWxlICggYnMgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnICBzaXRlICVkOiB4bDogJWYsIHhyOiAlZicsIGJzLnNpdGUudm9yb25vaUlkLCB0aGlzLmxlZnRCcmVha1BvaW50KGJzLCB5KSwgdGhpcy5yaWdodEJyZWFrUG9pbnQoYnMsIHkpKTtcbiAgICAgICAgICAgIGJzID0gYnMucmJOZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiovXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSGVscGVyOiBRdWFudGl6ZSBzaXRlc1xuXG4vLyByaGlsbCAyMDEzLTEwLTEyOlxuLy8gVGhpcyBpcyB0byBzb2x2ZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE1XG4vLyBTaW5jZSBub3QgYWxsIHVzZXJzIHdpbGwgZW5kIHVwIHVzaW5nIHRoZSBraW5kIG9mIGNvb3JkIHZhbHVlcyB3aGljaCB3b3VsZFxuLy8gY2F1c2UgdGhlIGlzc3VlIHRvIGFyaXNlLCBJIGNob3NlIHRvIGxldCB0aGUgdXNlciBkZWNpZGUgd2hldGhlciBvciBub3Rcbi8vIGhlIHNob3VsZCBzYW5pdGl6ZSBoaXMgY29vcmQgdmFsdWVzIHRocm91Z2ggdGhpcyBoZWxwZXIuIFRoaXMgd2F5LCBmb3Jcbi8vIHRob3NlIHVzZXJzIHdobyB1c2VzIGNvb3JkIHZhbHVlcyB3aGljaCBhcmUga25vd24gdG8gYmUgZmluZSwgbm8gb3ZlcmhlYWQgaXNcbi8vIGFkZGVkLlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5xdWFudGl6ZVNpdGVzID0gZnVuY3Rpb24oc2l0ZXMpIHtcbiAgICB2YXIgzrUgPSB0aGlzLs61LFxuICAgICAgICBuID0gc2l0ZXMubGVuZ3RoLFxuICAgICAgICBzaXRlO1xuICAgIHdoaWxlICggbi0tICkge1xuICAgICAgICBzaXRlID0gc2l0ZXNbbl07XG4gICAgICAgIHNpdGUueCA9IE1hdGguZmxvb3Ioc2l0ZS54IC8gzrUpICogzrU7XG4gICAgICAgIHNpdGUueSA9IE1hdGguZmxvb3Ioc2l0ZS55IC8gzrUpICogzrU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEhlbHBlcjogUmVjeWNsZSBkaWFncmFtOiBhbGwgdmVydGV4LCBlZGdlIGFuZCBjZWxsIG9iamVjdHMgYXJlXG4vLyBcInN1cnJlbmRlcmVkXCIgdG8gdGhlIFZvcm9ub2kgb2JqZWN0IGZvciByZXVzZS5cbi8vIFRPRE86IHJoaWxsLXZvcm9ub2ktY29yZSB2MjogbW9yZSBwZXJmb3JtYW5jZSB0byBiZSBnYWluZWRcbi8vIHdoZW4gSSBjaGFuZ2UgdGhlIHNlbWFudGljIG9mIHdoYXQgaXMgcmV0dXJuZWQuXG5cblZvcm9ub2kucHJvdG90eXBlLnJlY3ljbGUgPSBmdW5jdGlvbihkaWFncmFtKSB7XG4gICAgaWYgKCBkaWFncmFtICkge1xuICAgICAgICBpZiAoIGRpYWdyYW0gaW5zdGFuY2VvZiB0aGlzLkRpYWdyYW0gKSB7XG4gICAgICAgICAgICB0aGlzLnRvUmVjeWNsZSA9IGRpYWdyYW07XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgJ1Zvcm9ub2kucmVjeWNsZURpYWdyYW0oKSA+IE5lZWQgYSBEaWFncmFtIG9iamVjdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUb3AtbGV2ZWwgRm9ydHVuZSBsb29wXG5cbi8vIHJoaWxsIDIwMTEtMDUtMTk6XG4vLyAgIFZvcm9ub2kgc2l0ZXMgYXJlIGtlcHQgY2xpZW50LXNpZGUgbm93LCB0byBhbGxvd1xuLy8gICB1c2VyIHRvIGZyZWVseSBtb2RpZnkgY29udGVudC4gQXQgY29tcHV0ZSB0aW1lLFxuLy8gICAqcmVmZXJlbmNlcyogdG8gc2l0ZXMgYXJlIGNvcGllZCBsb2NhbGx5LlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24oc2l0ZXMsIGJib3gpIHtcbiAgICAvLyB0byBtZWFzdXJlIGV4ZWN1dGlvbiB0aW1lXG4gICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBpbml0IGludGVybmFsIHN0YXRlXG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgLy8gYW55IGRpYWdyYW0gZGF0YSBhdmFpbGFibGUgZm9yIHJlY3ljbGluZz9cbiAgICAvLyBJIGRvIHRoYXQgaGVyZSBzbyB0aGF0IHRoaXMgaXMgaW5jbHVkZWQgaW4gZXhlY3V0aW9uIHRpbWVcbiAgICBpZiAoIHRoaXMudG9SZWN5Y2xlICkge1xuICAgICAgICB0aGlzLnZlcnRleEp1bmt5YXJkID0gdGhpcy52ZXJ0ZXhKdW5reWFyZC5jb25jYXQodGhpcy50b1JlY3ljbGUudmVydGljZXMpO1xuICAgICAgICB0aGlzLmVkZ2VKdW5reWFyZCA9IHRoaXMuZWRnZUp1bmt5YXJkLmNvbmNhdCh0aGlzLnRvUmVjeWNsZS5lZGdlcyk7XG4gICAgICAgIHRoaXMuY2VsbEp1bmt5YXJkID0gdGhpcy5jZWxsSnVua3lhcmQuY29uY2F0KHRoaXMudG9SZWN5Y2xlLmNlbGxzKTtcbiAgICAgICAgdGhpcy50b1JlY3ljbGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHNpdGUgZXZlbnQgcXVldWVcbiAgICB2YXIgc2l0ZUV2ZW50cyA9IHNpdGVzLnNsaWNlKDApO1xuICAgIHNpdGVFdmVudHMuc29ydChmdW5jdGlvbihhLGIpe1xuICAgICAgICB2YXIgciA9IGIueSAtIGEueTtcbiAgICAgICAgaWYgKHIpIHtyZXR1cm4gcjt9XG4gICAgICAgIHJldHVybiBiLnggLSBhLng7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gcHJvY2VzcyBxdWV1ZVxuICAgIHZhciBzaXRlID0gc2l0ZUV2ZW50cy5wb3AoKSxcbiAgICAgICAgc2l0ZWlkID0gMCxcbiAgICAgICAgeHNpdGV4LCAvLyB0byBhdm9pZCBkdXBsaWNhdGUgc2l0ZXNcbiAgICAgICAgeHNpdGV5LFxuICAgICAgICBjZWxscyA9IHRoaXMuY2VsbHMsXG4gICAgICAgIGNpcmNsZTtcblxuICAgIC8vIG1haW4gbG9vcFxuICAgIGZvciAoOzspIHtcbiAgICAgICAgLy8gd2UgbmVlZCB0byBmaWd1cmUgd2hldGhlciB3ZSBoYW5kbGUgYSBzaXRlIG9yIGNpcmNsZSBldmVudFxuICAgICAgICAvLyBmb3IgdGhpcyB3ZSBmaW5kIG91dCBpZiB0aGVyZSBpcyBhIHNpdGUgZXZlbnQgYW5kIGl0IGlzXG4gICAgICAgIC8vICdlYXJsaWVyJyB0aGFuIHRoZSBjaXJjbGUgZXZlbnRcbiAgICAgICAgY2lyY2xlID0gdGhpcy5maXJzdENpcmNsZUV2ZW50O1xuXG4gICAgICAgIC8vIGFkZCBiZWFjaCBzZWN0aW9uXG4gICAgICAgIGlmIChzaXRlICYmICghY2lyY2xlIHx8IHNpdGUueSA8IGNpcmNsZS55IHx8IChzaXRlLnkgPT09IGNpcmNsZS55ICYmIHNpdGUueCA8IGNpcmNsZS54KSkpIHtcbiAgICAgICAgICAgIC8vIG9ubHkgaWYgc2l0ZSBpcyBub3QgYSBkdXBsaWNhdGVcbiAgICAgICAgICAgIGlmIChzaXRlLnggIT09IHhzaXRleCB8fCBzaXRlLnkgIT09IHhzaXRleSkge1xuICAgICAgICAgICAgICAgIC8vIGZpcnN0IGNyZWF0ZSBjZWxsIGZvciBuZXcgc2l0ZVxuICAgICAgICAgICAgICAgIGNlbGxzW3NpdGVpZF0gPSB0aGlzLmNyZWF0ZUNlbGwoc2l0ZSk7XG4gICAgICAgICAgICAgICAgc2l0ZS52b3Jvbm9pSWQgPSBzaXRlaWQrKztcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGNyZWF0ZSBhIGJlYWNoc2VjdGlvbiBmb3IgdGhhdCBzaXRlXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWFjaHNlY3Rpb24oc2l0ZSk7XG4gICAgICAgICAgICAgICAgLy8gcmVtZW1iZXIgbGFzdCBzaXRlIGNvb3JkcyB0byBkZXRlY3QgZHVwbGljYXRlXG4gICAgICAgICAgICAgICAgeHNpdGV5ID0gc2l0ZS55O1xuICAgICAgICAgICAgICAgIHhzaXRleCA9IHNpdGUueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXRlID0gc2l0ZUV2ZW50cy5wb3AoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgYmVhY2ggc2VjdGlvblxuICAgICAgICBlbHNlIGlmIChjaXJjbGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQmVhY2hzZWN0aW9uKGNpcmNsZS5hcmMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIC8vIGFsbCBkb25lLCBxdWl0XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIC8vIHdyYXBwaW5nLXVwOlxuICAgIC8vICAgY29ubmVjdCBkYW5nbGluZyBlZGdlcyB0byBib3VuZGluZyBib3hcbiAgICAvLyAgIGN1dCBlZGdlcyBhcyBwZXIgYm91bmRpbmcgYm94XG4gICAgLy8gICBkaXNjYXJkIGVkZ2VzIGNvbXBsZXRlbHkgb3V0c2lkZSBib3VuZGluZyBib3hcbiAgICAvLyAgIGRpc2NhcmQgZWRnZXMgd2hpY2ggYXJlIHBvaW50LWxpa2VcbiAgICB0aGlzLmNsaXBFZGdlcyhiYm94KTtcblxuICAgIC8vICAgYWRkIG1pc3NpbmcgZWRnZXMgaW4gb3JkZXIgdG8gY2xvc2Ugb3BlbmVkIGNlbGxzXG4gICAgdGhpcy5jbG9zZUNlbGxzKGJib3gpO1xuXG4gICAgLy8gdG8gbWVhc3VyZSBleGVjdXRpb24gdGltZVxuICAgIHZhciBzdG9wVGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBwcmVwYXJlIHJldHVybiB2YWx1ZXNcbiAgICB2YXIgZGlhZ3JhbSA9IG5ldyB0aGlzLkRpYWdyYW0oKTtcbiAgICBkaWFncmFtLmNlbGxzID0gdGhpcy5jZWxscztcbiAgICBkaWFncmFtLmVkZ2VzID0gdGhpcy5lZGdlcztcbiAgICBkaWFncmFtLnZlcnRpY2VzID0gdGhpcy52ZXJ0aWNlcztcbiAgICBkaWFncmFtLmV4ZWNUaW1lID0gc3RvcFRpbWUuZ2V0VGltZSgpLXN0YXJ0VGltZS5nZXRUaW1lKCk7XG5cbiAgICAvLyBjbGVhbiB1cFxuICAgIHRoaXMucmVzZXQoKTtcblxuICAgIHJldHVybiBkaWFncmFtO1xuICAgIH07XG5cbm1vZHVsZS5leHBvcnRzID0gVm9yb25vaTtcbiJdfQ==

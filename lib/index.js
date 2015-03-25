var _ = require('lodash');


var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;


var makePublic = Promise;
/**
 *
 */
var Promise = function(fn) {
  var state = PENDING;
  var value = null;
  var handlers = [];

  /**
   * Called from resolve
   */
  var fulfill = function(result) {
    state = FULFILLED;
    value = result;
    handlers.forEach(handle);
    handlers = null;
  };

  /**
   * Passed to doResolve. Call either from doResolve or resolve
   */
  var reject = function(error) {
    state = REJECTED;
    value = error;
    handlers.forEach(handle);
    handlers = null;
  };

  /**
   * Passed to doResolve. Call from doResolve
   */
  var resolve = function(result) {
    try {
      var then = getThen(result);
      if(then) {
        doResolve(then.bind(result), resolve, reject);
        return;
      }
      fulfill(result);
    } catch(err) {
      reject(err);
    }
  };

  /**
   *
   */
  var handle = function(handler) {
    if(state === PENDING) {
      handlers.push(handler);
    } else if(state === FULFILLED && typeof handler.onFulfilled === 'function') {
      handler.onFulfilled(value);
    } else if(state === REJECTED && typeof handler.onRejected === 'function') {
      handler.onRejected(value);
    }
  };
  
  /**
   *
   */
  this.done = function(onFulfilled, onRejected) {
    //make it asynchronous, we want to run this after .done returns
    setTimeout(function() {
      handle({
        onFulfilled: onFulfilled,
        onRejected: onRejected
      })
    }, 0);
  };

  this.then = function(onFulfilled, onRejected) {
    var self = this;
    return new Promise(function(resolve, reject) {
      return self.done(function(result) {
        if (typeof onFulfilled === 'function') {
          try {
            return resolve(onFulfilled(result));
          } catch(err) {
            return reject(ex);
          }
        } else {
          return resolve(result);
        }
      }, function(error) {
        if(typeof onRejected === 'function') {
          try {
            return resolve(onRejected(error));
          } catch(err) {
            return reject(err);
          }
        } else {
          return reject(error);
        }
      }); 
    });
  };

  doResolve(fn, resolve, reject);
};

/**
 * Expose promisify method attached to Promise constructor
 */
Promise.promisify = function() {

}
/**
 * check if value passed is a promise or an actual value
 */

var getThen = function(value) {
  var type = typeof value;
  if(value && (type === 'object' || type === 'function')) {
    var then = value.then;
    if(typeof then === 'function') {
      return then;
    }
  }
  return null;
};

/**
 *
 */
var doResolve = function(fn, onFulfilled, onRejected) {
  var done = false;
  //use try because fn is passed by user --> code not trusted, could break
  try {
    /**
     * Run function passed to API. Takes two functions: 
     * One will take the result value that the user passes through API 
     * The other will take the error that the user passes through API
     */
    fn(function(valuePassed) {
      if(done) return;
      done = true;
      onFulfilled(valuePassed);
    }, function(errorPassed) {
      if(done) return;
      done = true;
      onRejected(errorPassed);
    });
  } catch(err) {
    if(done) return;
    done = true;
    onRejected(err);
  }
};


module.exports = makePublic;

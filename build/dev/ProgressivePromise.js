;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ProgressivePromise = factory();
  }
}(this, function() {
"use strict";
/* globals window: false, Promise: false */

/**
Returns a Promise decorated with a progress() event.
*/
function ProgressivePromise(fn) {
	if (typeof Promise !== "function") {
		throw new Error("Promise implementation not available in this environment.");
	}

	var progressCallbacks = [];
	var progressHistory = [];

	function doProgress(value) {
		for (var i = 0, l = progressCallbacks.length; i < l; ++i) {
			progressCallbacks[i](value);
		}

		progressHistory.push(value);
	}

	var promise = new Promise(function(resolve, reject) {
		fn(resolve, reject, doProgress);
	});

	promise.progress = function(cb) {
		if (typeof cb !== "function") {
			throw new Error("cb is not a function.");
		}

		// Report the previous progress history
		for (var i = 0, l = progressHistory.length; i < l; ++i) {
			cb(progressHistory[i]);
		}

		progressCallbacks.push(cb);
		return promise;
	};

	var origThen = promise.then;

	promise.then = function(onSuccess, onFail, onProgress) {
		origThen.call(promise, onSuccess, onFail);

		if (onProgress !== undefined) {
			promise.progress(onProgress);
		}

		return promise;
	};

	return promise;
}
return ProgressivePromise;
}));

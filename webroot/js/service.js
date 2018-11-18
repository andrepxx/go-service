"use strict";

/*
 * A class for storing global state required by the application.
 */
function Globals() {
	this.cgi = '/cgi-bin/service';
}

/*
 * The global state object.
 */
var globals = new Globals();

/*
 * A class supposed to make life a little easier.
 */
function Helper() {
	
	/*
	 * Blocks or unblocks the site for user interactions.
	 */
	this.blockSite = function(blocked) {
		var blocker = document.getElementById('blocker');
		var displayStyle = '';
		
		/*
		 * If we should block the site, display blocker, otherwise hide it.
		 */
		if (blocked)
			displayStyle = 'block';
		else
			displayStyle = 'none';
		
		/*
		 * Apply style if the site has a blocker.
		 */
		if (blocker != null)
			blocker.style.display = displayStyle;
		
	};
	
	/*
	 * Parse JSON string into an object without raising exceptions.
	 */
	this.parseJSON = function(jsonString) {
		
		/*
		 * Try to parse JSON structure.
		 */
		try {
			var obj = JSON.parse(jsonString);
			return obj;
		} catch (ex) {
			return null;
		}
		
	};
	
}

/*
 * The (global) helper object.
 */
var helper = new Helper();

/*
 * A class implementing an Ajax engine.
 */
function Ajax() {
	
	/*
	 * Sends an Ajax request to the server.
	 *
	 * Parameters:
	 * - method (string): The request method (e. g. 'GET', 'POST', ...).
	 * - url (string): The request URL.
	 * - data (string): Data to be passed along the request (e. g. form data).
	 * - callback (function): The function to be called when a response is
	 *	returned from the server.
	 * - block (boolean): Whether the site should be blocked.
	 *
	 * Returns: Nothing.
	 */
	this.request = function(method, url, data, callback, block) {
		var xhr = new XMLHttpRequest();
		
		/*
		 * Event handler for ReadyStateChange event.
		 */
		xhr.onreadystatechange = function() {
			helper.blockSite(block);
			
			/*
			 * If we got a response, pass the response text to
			 * the callback function.
			 */
			if (this.readyState == 4) {
				
				/*
				 * If we blocked the site on the request,
				 * unblock it on the response.
				 */
				if (block)
					helper.blockSite(false);
				
				/*
				 * Check if callback is registered.
				 */
				if (callback != null) {
					var content = xhr.responseText;
					callback(content);
				}
				
			}
			
		};
		
		xhr.open(method, url, true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.send(data);
	};
	
}

/*
 * The (global) Ajax engine.
 */
var ajax = new Ajax();

/*
 * A class implementing a key-value-pair.
 */
function KeyValuePair(key, value) {
	var g_key = key;
	var g_value = value;
	
	/*
	 * Returns the key stored in this key-value pair.
	 */
	this.getKey = function() {
		return g_key;
	};
	
	/*
	 * Returns the value stored in this key-value pair.
	 */
	this.getValue = function() {
		return g_value;
	};
	
}

/*
 * A class implementing a JSON request.
 */
function Request() {
	var g_keyValues = Array();
	
	/*
	 * Append a key-value-pair to a request.
	 */
	this.append = function(key, value) {
		var kv = new KeyValuePair(key, value);
		g_keyValues.push(kv);
	}
	
	/*
	 * Returns the URL encoded data for this request.
	 */
	this.getData = function() {
		var numPairs = g_keyValues.length;
		var s = '';
		
		/*
		 * Iterate over the key-value pairs.
		 */
		for (var i = 0; i < numPairs; i++) {
			var keyValue = g_keyValues[i];
			var key = keyValue.getKey();
			var keyEncoded = encodeURIComponent(key);
			var value = keyValue.getValue();
			var valueEncoded = encodeURIComponent(value);
			
			/*
			 * If this is not the first key-value pair, we need a separator.
			 */
			if (i > 0)
				s += '&';
			
			s += keyEncoded + '=' + valueEncoded;
		}
		
		return s;
	};
	
}

/*
 * This class implements all handler functions for user interaction.
 */
function Handler() {
	var self = this;
	
	/*
	 * Perform a no-op on the server.
	 */
	this.noOp = function() {
		
		/*
		 * This gets called when the server returns a response.
		 */
		var responseHandler = function(response) {
			var webResponse = helper.parseJSON(response);
			
			/*
			 * Check if the response is valid JSON.
			 */
			if (webResponse != null) {
				
				/*
				 * If we were not successful, log failed attempt, otherwise refresh rack.
				 */
				if (webResponse.Success != true) {
					var reason = webResponse.Reason;
					var msg = 'No-op failed: ' + reason;
					console.log(msg);
				} else {
					console.log('Service responded successfully.');
				}
				
			}
			
		};
		
		var request = new Request();
		request.append('cgi', 'do-nothing');
		var requestBody = request.getData();
		ajax.request('POST', globals.cgi, requestBody, responseHandler, true);
	}
	
}

/*
 * The (global) event handlers.
 */
var handler = new Handler();


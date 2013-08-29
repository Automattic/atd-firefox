/*
 * atd.js - Load AtD into Firefox
 * Author      : mitcho (Michael Yoshitaka Erlewine)
 * License     : GPL 2.0 or higher
 * Project     : http://www.afterthedeadline.com/
 * Contact     : mitcho@mitcho.com
 */

// a list of conduit modules; used by AtD.addConduits
if (!com) var com = {};

com.automattic = (function() {
	const CONDUIT_MODULES = ["resource://afterthedeadline/textarea.js", "resource://afterthedeadline/contenteditable.js", "resource://afterthedeadline/iframe.js"];

	var AtD_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	AtD_prefs = AtD_prefs.getBranch("extensions.afterthedeadline.");

	var AtD = {
		getBoolPref: AtD_prefs.getBoolPref,
		conduitRegistry: {},
		i18n: {},
		init: function atd_init() {
			// load i18n stringbundles
			this.i18n = document.getElementById('afterthedeadline-strings');

			// create a "loader" which will pass the event to this.onPageLoad
			// Note: this step is necessary so we don't confuse our "this" contexts
			var self = this;
			var loader = function (event) { self.onPageLoad(event); };
			var unloader = function (event) { self.onPageUnload(event); };

			// get the browser
			// nb: document here is the browser-level "document"
			var appcontent = document.getElementById("appcontent");
			if (appcontent) {
				appcontent.addEventListener("DOMContentLoaded", loader, true);
				appcontent.addEventListener("unload", unloader, true);
			}
      
			// add the AtD CSS
			var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
			var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
			var uri = ios.newURI("chrome://afterthedeadline/skin/content.css", null, null);
			sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
		},

		log: function atd_log() {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var recentWindow = wm.getMostRecentWindow("navigator:browser");
			if (recentWindow.Firebug)
				recentWindow.Firebug.Console.log(arguments);
		},

		onPageLoad: function atd_onPageLoad(e) {
			var doc = e.originalTarget; // doc is document that triggered "onload" event

			// only continue if it's a real DOM document
			if (doc.nodeName != '#document' || !doc.body)
				return false;
  
			try {    
				// if it's an ignored domain, just stop now.
				if (doc.location && doc.location.hostname && this.isIgnoreDomain(doc.location.hostname))
					return;
			} 
			catch (e) { // if we can't get the domain name, stop now too.
				return;
			}

			if (this.isDisabled(doc))
				return;
    	
			var self = this;

			// make sure that conduits gets unregistered when removed from the DOM
			doc.body.addEventListener('DOMNodeRemoved',function(e) {
				self.findDescendantConduits(e.target).forEach(function(c) {
					if (c.inTransition)
						return;
					self.removeConduit(c.id);
					//dump('removed directly '+c.id+"\n");
				});
			},false);

			this.addConduits(doc);
			this.loadUnloadDocEvents(doc);
		},
  
		onPageUnload: function atd_onPageLoad(e) {
			var doc = e.originalTarget; // doc is document that triggered "onload" event

			// only continue if it's a real DOM document
			if (doc.nodeName != '#document')
				return false;

			this.removeConduits(doc);
			this.loadUnloadDocEvents(doc,true); // the final true is for unload rather than load.
		},
  
		// recursively checks whether this node is part of an AtD frame
		// if it is, figures out the associated conduit and returns it.
		findConduit: function atd_findConduit(node) {
			var thisNode = node;
			for (var id in this.conduitRegistry) {
				var conduit = this.conduitRegistry[id];
				if (conduit.target.ownerDocument !== thisNode.ownerDocument)
					continue;

				var CONTAINEDBY = Node.DOCUMENT_POSITION_CONTAINED_BY;

				// if the node is the target, or is contained by the target...
				if (conduit.target == thisNode || (conduit.target.compareDocumentPosition(thisNode) & CONTAINEDBY))
					return conduit;

				// or we're proofreading and the node is the frame or contained by the frame...
				if (conduit.isProofreading && (conduit.frame == thisNode || (conduit.isProofreading && conduit.frame.compareDocumentPosition(thisNode) & CONTAINEDBY)))
					return conduit;
			}
			return false;
		},
  
		isConduitVisible: function atd_checkConduitVisibility(conduit) {
			var temp = conduit.target;
			var doc = conduit.target.ownerDocument;

			while (temp != undefined && temp != null && temp != doc && temp.style != undefined) {
				var css = doc.defaultView.getComputedStyle(temp, null);
				if (css.getPropertyValue('display') == 'none')
					return false;
				temp = temp.parentNode;
			}         
          
			return true;              
		},

		// find all conduits with targets within the given element.
		findDescendantConduits: function atd_findDescendantConduits(thisNode) {
			var conduits = [];
			for (var id in this.conduitRegistry) {
				var conduit = this.conduitRegistry[id];
				if (conduit.target.ownerDocument !== thisNode.ownerDocument)
					continue;

				var CONTAINEDBY = Node.DOCUMENT_POSITION_CONTAINED_BY;

				// if the node is the target, or contains the target...
				if (thisNode == conduit.target || (thisNode.compareDocumentPosition(conduit.target) & CONTAINEDBY))
					conduits.push(conduit);

				// or we're proofreading and the node is the frame or contains the frame...
				if (conduit.isProofreading && (thisNode == conduit.frame || (conduit.isProofreading && thisNode.compareDocumentPosition(conduit.frame) & CONTAINEDBY)))
					conduits.push(conduit);
			}
			return conduits;
		},
  
		addConduits: function atd_addConduits(root) {
			var originalRoot = root;
			var doc = root;

			// if the element we start with isn't a "document"...
			if (root.nodeName != '#document') {
				// get the relevant document
				doc = root.ownerDocument;

				// start one level up, so that getElementsByTagName below will find the root
				// (for cases where a textarea is itself what triggered addConduit)
				if (root.parentNode)
					root = root.parentNode;
			}

			if (this.isDisabled(doc))
				return;

			if (typeof root.getElementsByTagName != 'function')
   				return;

			if (root.afterthedeadlineId != undefined)
				return;

			if (root.id == "AtD_Content")
				return;

			for (var i in CONDUIT_MODULES) {
				var modulePath = CONDUIT_MODULES[i];

				// import the conduit module into moduleScope
				var moduleScope = {};
				Components.utils.import(modulePath, moduleScope);
      	
				// if the module doesn't export tagNames and conduit objects, stop.
				if (!('tagNames' in moduleScope) || !('conduit' in moduleScope))
					continue;
      
				// get all the nodes that the conduit wants to consider:
				var nodes = [];

				moduleScope.tagNames.forEach(function(name) {
					var newNodes = root.getElementsByTagName(name);
					for (var j = 0; j < newNodes.length; j++) {
						if (name != 'div' || newNodes[j].contentEditable == 'true')
							nodes.push(newNodes[j]);
					}
				});
      
				for (var j = 0; j < nodes.length; j++) {
					var thisNode = nodes[j];

					// skip it if it's already registered.
					if (this.findConduit(thisNode))
						continue;

					// skip it if it's exempt
					if (moduleScope.isExempt && typeof moduleScope.isExempt == 'function' && moduleScope.isExempt(thisNode, this))
						continue;

					// create a new AtDCore
					var core = this.getNewCore();

					// create the new conduit and register it
					var conduit = new moduleScope.conduit(thisNode,this,core);

					// create an ID for this instance of the conduit and add it to the DOM element.
					conduit.id = (new Date()).getTime();
					conduit.target.afterthedeadlineId = conduit.id;
					conduit.domId = conduit.target.id; // just in case, hold onto domId
					//dump('registered '+conduit.id+"\n");

					var self = this;
					this.conduitRegistry[conduit.id] = conduit;
				}
			}
		},
  
		getNewCore: function atd_getNewCore(e) {
			Components.utils.import("resource://afterthedeadline/atd.core.firefox.js");
			var core = new AtDCore(); // a new AtD core for this input
			core.i18n = this.i18n; // inherit stringbundle
			return core;
		},
  
		formSubmitHandler: function atd_formSubmitHandler(e) {
			var form = e.target;
			var self = this;

			/* ignore Facebook's "view all N comments" link which is really a form submit */
			/* now we ignore Facebook's "Like" and "Unlike" which fires a form submit too */
			if (e.explicitOriginalTarget != undefined) {
				var name = e.explicitOriginalTarget.name;
				if (name == 'view_all' || name == 'like' || name == 'unlike' || name == 'share')
					return;
			}

			if (this.isDisabled(form.ownerDocument || form)) {
				return;
			}

			var conduits = this.findDescendantConduits(form);

			var warn = AtD_prefs.getBoolPref("warn");
			if (!warn) { 
				// warnings are turned off
				return;
			}
    
			// if we've already warned, stop. Don't block it.
			if (form.afterthedeadlineWarned)
				return;
    
			// let's mark the form as already warned.
			form.afterthedeadlineWarned = true;
    
			var parent = this;
			var conduitsToCheckNow = [];
			conduits.forEach(function(c) {
				if (c.counter == -1 && parent.isConduitVisible(c))
					conduitsToCheckNow.push(c);
			});
			var conduitsToCheckNumber = conduitsToCheckNow.length;

			var continuation = function() {
				var doneCheckingForms = conduitsToCheckNow.every(function(c) {
					return (c.hasBeenChecked || c.counter === 0)
				});

				if (doneCheckingForms) { 
    					self.simulateFormSubmit(form, e);
					return;
				}

				var ignoreWarning = self.ignoreWarning();

				if (ignoreWarning) {
					self.simulateFormSubmit(form, e);
				} 
				else { 
					// the user chose to stop submission and check first
					for (var i = 0; i < conduits.length; i++) {
						var conduit = conduits[i];
						if (conduit.hasBeenChecked || conduit.counter === 0)
							continue;
						conduit.check();
					}
				}
			};

			if (conduitsToCheckNow.length) {

				var conduitCheckCallback = function() {
					conduitsToCheckNumber--;
					if (conduitsToCheckNumber == 0)
						continuation();
				};

				/* let's only stop the submit (and deal with potentially breaking it... if we really have to */
				e.stopPropagation();
				e.preventDefault();

				conduitsToCheckNow.forEach(function(c) {
					c.checkWithoutDisplay(conduitCheckCallback);
				});
			} 
		},
  
		simulateFormSubmit: function atd_simulateFormSubmit(form, originalEvent) {
			var event;
			var doc = form.ownerDocument;
    
			var originalTarget = originalEvent.explicitOriginalTarget;
			var buttonType = /submit|button|image/i;
        
			// if there's an separate explicit target which is a button, click it.
			if (originalTarget != originalEvent.target && ((originalTarget.nodeName == 'INPUT' && buttonType.test(originalTarget.type)) || originalTarget.nodeName == 'BUTTON')) {
				event = document.createEvent('MouseEvents');
				event.initMouseEvent("click", true, true, doc.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

				// we delay this next click event by 10ms as otherwise sometimes it is
				// not recognized as a submission (bug #68)
				(doc.defaultView['set'+'Timeout'])(function() {
					originalTarget.dispatchEvent(event)
				}, 10);
			} 
			else {
				// if the original event's target is the frame, just create an HTML event on it
				event = document.createEvent('HTMLEvents');
				event.initEvent('submit',true,false); // final false is for cancelable.
			}
		},

		// remove all conduits from a document
		removeConduits: function atd_removeConduits(doc) {
			for (var id in this.conduitRegistry) {
				if (this.conduitRegistry[id].target.ownerDocument !== doc)
					continue;
				this.removeConduit(id);
				//dump('removed '+id+"\n");
			}
		},

		removeConduit: function atd_removeConduit(id) {
			var conduit = this.conduitRegistry[id];

			if (!conduit)
				return true;

			// first, restore the input target
			conduit.restore();

			// next, if there's a remove method, run it.
			if (conduit.remove)
				conduit.remove();

			// finally, unregister it.
			delete this.conduitRegistry[id];
		},
  
		check: function atd_check(text, conduit, cb, dontDisplay) {
			var self = this;

			var callback = function atd_check_callback(xml) {
				// if the conduit is not set up for proofreading, quit here
				if (!conduit.isProofreading && !dontDisplay)
					return false;

				if (xml === null) { 
					// if we got no response
					conduit.restore();
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
					var prompt = prompts.alert(window, self.i18n.getString('prompt_title_connection_error'), self.i18n.getString('prompt_message_connection_error'));
					return false;
				}

				/* check for and display error messages from the server */
				if (conduit.core.hasErrorMessage(xml)) {
					if (conduit != undefined && conduit.error != undefined)
						conduit.error(conduit.core.getErrorMessage(xml));
					return;
				}

				// get the latest ignore strings from prefs
				conduit.core.ignore_strings = self.getIgnoreStrings();
				conduit.core.ignore_types = self.getIgnoreTypes();

				var count = self.processXML(conduit, xml, dontDisplay);

				if (conduit != undefined && conduit.ready != undefined)
					conduit.ready(count);
  
				if (count == 0 && conduit != undefined && conduit.success != undefined)
					conduit.success(count);
  
				conduit.counter = count;
				conduit.count   = count;

				if (cb && typeof cb == 'function')
					cb();
			};

			var server = AtD_prefs.getCharPref("proofreadServer");
			if (server != '') {
				this.post(server + '/checkDocument?guess=' + AtD_prefs.getBoolPref("detectLanguage"), 'data=' + encodeURI(text).replace(/&/g, '%26'), callback);
			}
			else {
				server = AtD_prefs.getCharPref("proofreadLanguage");
				this.post('https://' + server + '/checkDocument?guess=' + AtD_prefs.getBoolPref("detectLanguage"), 'data=' + encodeURI(text).replace(/&/g, '%26'), callback);
			}
		},
  
		processXML: function atd_processXML(conduit, responseXML, dontDisplay) {
			if (!conduit.isProofreading && !dontDisplay)
				return false;
 
			var results = conduit.core.processXML(responseXML);

			if (results.count > 0 && !dontDisplay)
				results.count = conduit.core.markMyWords(conduit.frame.childNodes, results.errors);
  
			return results.count;
		},

		useSuggestion: function atd_useSuggestion(errorElement, word) {
			var conduit = this.findConduit(errorElement);
			var scrollPosition = null;

			if ('getScrollPosition' in conduit)
				scrollPosition = conduit.getScrollPosition();

			conduit.core.applySuggestion(errorElement, word);

			if ('setScrollPosition' in conduit && scrollPosition != null) 
				conduit.setScrollPosition(scrollPosition);

			if (conduit.update)
				conduit.update("useSuggestion");

			conduit.counter --;
	
			if (conduit.counter == 0 && conduit.success != undefined)
				conduit.success(conduit.count);
		},
  
		editSelection: function atd_editSelection(errorElement) {
			var conduit = this.findConduit(errorElement);
			var parent = errorElement.parentNode;
  
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
			var textWidget = {value: errorElement.textContent};
			var prompt = prompts.prompt(window, this.i18n.getString('prompt_title_edit_selection'), this.i18n.getString('prompt_message_edit_selection'), textWidget, null, {value: true});
    
			if (prompt) {
				var text = textWidget.value;
				var node = errorElement.ownerDocument.createTextNode(text);
				conduit.core.replaceWith(errorElement,node);
			}
  
			if (errorElement.parentNode != parent) {
				if (conduit.update)
					conduit.update("editSelection");

				conduit.counter --;

				if (conduit.counter == 0 && conduit.success != undefined)
					conduit.success(conduit.count);
			}
		},

		ignoreSuggestion: function atd_ignoreSuggestion(errorElement,conduit) {
			if (this.isIgnoreAll || errorElement.atd_removing == true)
				return;
	
			// flag that we're removing this element and it shouldn't be touched further
			errorElement.atd_removing = true;

			if (!conduit)
				conduit = this.findConduit(errorElement);

			var scrollPosition = null;

			if ('getScrollPosition' in conduit)
				scrollPosition = conduit.getScrollPosition();
		
			conduit.core.removeParent(errorElement);

			if ('setScrollPosition' in conduit && scrollPosition != null)
				conduit.setScrollPosition(scrollPosition);
  
			if (conduit.update)
				conduit.update("ignore suggestion");

			conduit.counter --;
	
			if (conduit.counter == 0 && conduit.success != undefined)
				conduit.success(conduit.count);
		},
  
		explainError: function atd_explainError(errorElement, url) {
			var conduit = this.findConduit(errorElement);

			if (!conduit.explanation || conduit.explanation.closed) {
				conduit.explanation = window.open( url, 'afterthedeadlineExplanation', 'width=480,height=380,toolbar=no,status=no,resizable=no,menubar=no,chrome,centerscreen');
			}

			conduit.explanation.focus();
		},
  
		ignoreAll: function atd_ignoreAll(errorElement) {
			this.isIgnoreAll = true;

			var conduit = this.findConduit(errorElement);
			var target = errorElement.textContent;
			var scrollPosition = null;

			if ('getScrollPosition' in conduit)
				scrollPosition = conduit.getScrollPosition(); 

			var removed = conduit.core.removeWords(conduit.frame, target);

			if ('setScrollPosition' in conduit && scrollPosition != null)
				conduit.setScrollPosition(scrollPosition);
  
			if (conduit.update)
				conduit.update("ignore All");

			conduit.counter -= removed;
  
			if (conduit.counter == 0 && conduit.success != undefined)
				conduit.success(conduit.count);
  
			this.setIgnoreStrings(target);
			this.isIgnoreAll = false;
		},
  
		getIgnoreStrings: function atd_getIgnoreStrings() {
			var rawpref = AtD_prefs.getCharPref("ignoreStrings");
			var words = {};
			rawpref.split(',').forEach(function(word) {
				words[word] = 1;
			});
			return words;
		},
 
		setIgnoreStrings: function atd_setIgnoreStrings(word) {
			var words = AtD_prefs.getCharPref("ignoreStrings");
			if (words.length)
				words += ',';
			words += word;
			AtD_prefs.setCharPref("ignoreStrings",words);
		},
 
		getIgnoreTypes: function atd_getIgnoreTypes() {
			var rawpref = AtD_prefs.getCharPref("ignoreTypes");
			return rawpref.split(',');
		},

		isIgnoreDomain: function atd_isIgnoreDomain(domain) {
			if (!domain)
				return false;

			var rawpref = AtD_prefs.getCharPref("ignoreDomains");
			return (new RegExp('(^|,)'+domain+'($|,)')).test(rawpref);
		},
  
		addIgnoreDomain: function atd_addIgnoreDomain(domain) {
			var rawpref = AtD_prefs.getCharPref("ignoreDomains");
			if (rawpref.length)
				rawpref += ','+domain;
			else
				rawpref = domain;
			AtD_prefs.setCharPref("ignoreDomains",rawpref);
		},
  
		removeIgnoreDomain: function atd_removeIgnoreDomain(domain) {
			var rawpref = AtD_prefs.getCharPref("ignoreDomains");
			rawpref = rawpref.replace((new RegExp('(^|,)'+domain+'($|,)')),'$1').replace(/,$/,'');
			AtD_prefs.setCharPref("ignoreDomains",rawpref);
		},
  
		ignoreWarning: function atd_ignoreWarning() {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
			var confirmation = prompts.confirm(window, this.i18n.getString('prompt_title_submit_warning'), this.i18n.getString('prompt_message_submit_warning'));

			return confirmation; // bool, whether to ignore the warning or not.
		},
  
		// atd_post code taken from CKEditor version by Raphael
		post: function atd_post(url, data, callback) {
			var xhr = new XMLHttpRequest();
  
			if (!xhr)
				return null;
 
			xhr.open('POST', url, true );
  
			xhr.onreadystatechange = function() {
				if ( xhr.readyState == 4 )
					callback( xhr.responseXML );
			};
  
			if (data.length)
				data +=  '&key=' + this.api_key;
			else
				data = 'key=' + this.api_key;
  
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.setRequestHeader("Content-length", data.length);
			xhr.setRequestHeader("Connection", "close");
			xhr.send(data);
		},

		isKey: function atd_isKey(e,keyType) { 
			// keyType should be proofreadKey or refreshKey
			var code = [e.shiftKey,e.altKey,e.ctrlKey,e.metaKey,e.charCode,e.keyCode].join(',');
			return (code == AtD_prefs.getCharPref(keyType));
		},
  
		get api_key() {
			// Firefox user profile directories are of the form xxxxxxxx.name where
			// xxxxxxxx is a random sequence of eight [a-z0-9] characters, and name 
			// is the profile's name. We will use this xxxxxxxx prefix as part of our
			// unique API key.
    
			// First, get the profile directory node name
			var profile_dir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).leafName;

			// The API key will be of the form firefox-dev-xxxxxxxx
			return 'firefox-dev-'+profile_dir.replace(/\..*$/,'');
		},

		get CONTAINEDBY() {
			// we add this to AtD so that it can be used from modules, like conduits,
			// which don't have access to DOM constants like Node.
			return Node.DOCUMENT_POSITION_CONTAINED_BY;
		},

		isDisabled: function atd_isDisabled(doc) {
			return ('AtDdisabled' in doc || 'AtDdisabled' in doc['wrapped'+'JSObject']);
		}
	}

	/**
	 * Setup document-level event handlers
	 * 
	 * We put these handlers in the global scope so that when we add or remove them
	 * using AtD.loadUnloadDocEvents, we're targetting the exact same functions.
	 */
	var docSubmitHandler = function(e) { 
		AtD.formSubmitHandler.apply(AtD,[e]) 
	};
	var docInsertHandler = function(e) { 
		/* we're using a timer to let the other processing happen first so we're not firing all kinds of events
		   as the parent page updates the newly added element */
		var doc = typeof e == 'Document' ? e.originalTarget : e.originalTarget.ownerDocument;
		(doc.defaultView['set'+'Timeout'])(function() {
			AtD.addConduits.apply(AtD,[e.target]) 
		}, 50);
	};

	var docModifiedHandler = function(e) { 
		/* we're using a timer to let the other processing happen first so we're not firing all kinds of events
		   as the parent page updates the newly added element */
		var doc = typeof e == 'Document' ? e.originalTarget : e.originalTarget.ownerDocument;
		AtD.lastModified = (new Date()).getTime();

		var handler = function() {
			for (var id in AtD.conduitRegistry) {
				var conduit = AtD.conduitRegistry[id];
				if (conduit.target.ownerDocument == e.target.ownerDocument) {
					conduit.__adjustWidget();
				}
			}
		};

		(doc.defaultView['set'+'Timeout'])(function() {
			var now = (new Date()).getTime() - AtD.lastModified;
			if (now >= 100) {
				handler();
				AtD.lastModified += now;
			}
		}, 100);
	};


	var docInterceptor = function(e) {
		var doc = e.originalTarget;
		if (AtD.isDisabled(doc))
			return;

		if (doc.activeElement == doc.body)
			return;

		var conduit = AtD.findConduit(e.originalTarget);

		// if it's part of an AtD item and it's in proofreading mode
		// and it's not F7
		if (conduit && conduit.isProofreading && !(AtD.isKey(e,'proofreadKey') || AtD.isKey(e,'refreshKey')))
			e.stopPropagation();
	};

	AtD.loadUnloadDocEvents = function atd_loadUnloadDocEvents(doc, unload) {
		// if unload == false, we load; if unload == true, we unload.
		var applyEvent;

		if (unload)
			applyEvent = doc.removeEventListener;
		else
			applyEvent = doc.addEventListener;

		try {
			// the last argument is useCapture
			applyEvent('submit', docSubmitHandler, true);
			applyEvent('DOMNodeInserted', docInsertHandler, false);
			applyEvent('DOMSubtreeModified', docModifiedHandler, false);

			// add interceptor to capture typing events when in an AtD frame
			applyEvent('keypress',docInterceptor,true);
			applyEvent('keydown',docInterceptor,true);
			applyEvent('keyup',docInterceptor,true);
		}
		catch (ex) {
			// if an error happened then we probably called this before listeners were added
		}
	};

	/**
	 * atd_bootstrap()
	 * sets up AtD on the current window
	 */

	function atd_bootstrap() {
		AtD.init();
		var atd = AtD;
  
		var suggestionsMenuCreation = function atd_suggestionsMenuCreation(event) {
			var contextMenu = event.target;

			// if it's not the main context menu, stop
			if (contextMenu.id != 'contentAreaContextMenu')
				return;

			var menuItems = contextMenu.childNodes;
			// atdTime = true if the target is a highlighted error.
    
			var atdTime = false;
			var errorElement = document.popupNode;
			var conduit = atd.findConduit(errorElement);

			if (conduit)
				atdTime = (conduit.core.isMarkedNode(errorElement));

			// if it's not AtD time, we're done.
			if (!atdTime)
				return;
    
			document.getElementById('afterthedeadline-switch').hidden = true;
	    
			// hide non-AtD items when it's AtD time
			for (i = 0; i < menuItems.length; i++) {
				var menuItem = menuItems[i];

				/* kill down-them-all context menu */
				if (/dtaCtx/.test(menuItem.id) || /abp-.*?-menuitem/.test(menuItem.id)) {
					menuItem.afterthedeadlineProperty = menuItem.style.getPropertyValue('display');
					menuItem.style.setProperty('display', 'none', '');
				}
				else if (menuItem.id.indexOf('afterthedeadline') == -1) {
					menuItem.afterthedeadlineHidden = menuItem.hidden;
					menuItem.hidden = true;
				}
			}

			document.getElementById('afterthedeadline-branding').hidden = false;
    
			/* find the correct suggestions object */
			var errorDescription = conduit.core.findSuggestion(errorElement);
	  
			if (errorDescription == undefined) {
				var item = document.createElement('menuitem');
				item.id = 'afterthedeadline-reason';
				item.setAttribute('label',atd.i18n.getString('menu_title_no_suggestions'));
				item.setAttribute('disabled',true);
				contextMenu.appendChild(item);
			} 
			else {
				var item = document.createElement('menuitem');
				item.id = 'afterthedeadline-reason';
				item.setAttribute('label',errorDescription['description'].replace(/&eacute;/, '\xe9'));
				item.setAttribute('disabled',true);

				// add special styling to make it bold and black, even though disabled.
				item.setAttribute('style','font-weight: bold; color: menutext');
				item.addEventListener('command',function(){},false);
				contextMenu.appendChild(item);

				// add suggestions
				if (errorDescription["suggestions"].length) {
					var listener = function(event){atd.useSuggestion(errorElement,event.target.label)};

					for (var i = 0; i < errorDescription["suggestions"].length; i++) {
 						var sugg = errorDescription["suggestions"][i];
						var item = document.createElement('menuitem');
						item.id = 'afterthedeadline-'+i;
						item.setAttribute('label',sugg);
						item.addEventListener('command',listener,false);
						contextMenu.appendChild(item);
					}
				}
			}
    
			// add explanation
			if (errorDescription['moreinfo'] != undefined) {
				var sep = document.createElement('menuseparator');
				sep.id = 'afterthedeadline-moreinfo-sep';
				contextMenu.appendChild(sep);

				var item = document.createElement('menuitem');
				item.id = 'afterthedeadline-moreinfo';
				item.setAttribute('label',atd.i18n.getString('menu_option_explain'));
				item.addEventListener('command',function(){atd.explainError(errorElement,errorDescription['moreinfo'])},false);
				contextMenu.appendChild(item);
			}
    
			// add ignore options
			var sep = document.createElement('menuseparator');
			sep.id = 'afterthedeadline-ignore-sep';
			contextMenu.appendChild(sep);

			var item = document.createElement('menuitem');
			item.id = 'afterthedeadline-ignore';
			item.setAttribute('label',atd.i18n.getString('menu_option_ignore_once'));
			item.addEventListener('command',function(){atd.ignoreSuggestion(errorElement)},false);
			contextMenu.appendChild(item);

			var item = document.createElement('menuitem');
			item.id = 'afterthedeadline-ignoreall';
			item.setAttribute('label',atd.i18n.getString('menu_option_ignore_always'));
			item.addEventListener('command',function(){atd.ignoreAll(errorElement)},false);
			contextMenu.appendChild(item);
    
			var sep = document.createElement('menuseparator');
			sep.id = 'afterthedeadline-edit-sep';
			contextMenu.appendChild(sep);
    
			var item = document.createElement('menuitem');
			item.id = 'afterthedeadline-edit';
			item.setAttribute('label',atd.i18n.getString('menu_option_edit_selection'));
			item.addEventListener('command',function(){atd.editSelection(errorElement)},false);
			contextMenu.appendChild(item);
		};

		var suggestionsMenuRemoval = function atd_suggestionsMenuRemoval(event) {
			document.getElementById('afterthedeadline-switch').hidden = false;
			var contextMenu = event.target;

			// if it's not the main context menu, stop
			if (contextMenu.id != 'contentAreaContextMenu')
				return;

			for (var i = contextMenu.childNodes.length - 1; i >= 0; i--) {
				var item = contextMenu.childNodes[i];
				if (item.id.indexOf('afterthedeadline') > -1 && item.id != 'afterthedeadline-proofread' && item.id != 'afterthedeadline-branding' && item.id != 'afterthedeadline-switch')
					contextMenu.removeChild(item);
			}

			// turn other items back on.
			var contextMenu = document.getElementById("contentAreaContextMenu");

			var menuItems = contextMenu.childNodes;

			for (i = 0; i < menuItems.length; i++) {
				var menuItem = menuItems[i];

				/* restore down-them-all context menu */
				if (/dtaCtx/.test(menuItem.id) || /abp-.*?-menuitem/.test(menuItem.id)) {
					menuItem.style.setProperty('display', menuItem.afterthedeadlineProperty, '');
				}
				else {
					menuItem.hidden = menuItem.afterthedeadlineHidden;
				}
			}
		};

		var proofreadMenuItemToggle = function atd_proofreadMenuItemToggle(event) {
			var contextMenu = event.target;
			var clickTarget = document.popupNode;
			var doc = clickTarget.ownerDocument;

			// if it's not the main context menu, stop
			if (contextMenu.id != 'contentAreaContextMenu')
				return;

			var domain;

			try {
				domain = doc.location.hostname;
			}
			catch (exception) {
				domain = "localhost";
			}
			// mark it as checked if it's not being ignored.
			var ignored = atd.isIgnoreDomain(domain);

			var switchItem = document.getElementById('afterthedeadline-switch');
			switchItem.setAttribute('checked',!ignored);
			// hide the menu item if there's no domain name for this page.
			switchItem.hidden = !domain.length;

			// check if we're clicking on an AtD-enabled input
			var conduit = atd.findConduit(clickTarget);
    
			var AtDelement = (conduit != false);
			var AtDtime = (conduit != false) && (conduit.frame != undefined);

			// if it's not AtD-enabled, or if it's already in AtD mode, don't display
			var branding = document.getElementById('afterthedeadline-branding');
			var menuitem = document.getElementById('afterthedeadline-proofread');
			menuitem.hidden = !AtDelement || AtDtime;
			branding.hidden = true;

			// turn native spellcheck off on AtD-enabled items
			if (AtDelement && !AtD_prefs.getBoolPref('nativeSpell')) {
				document.getElementById('spell-check-enabled').hidden = true;
				document.getElementById('spell-add-dictionaries-main').hidden = true;
				document.getElementById('spell-dictionaries').hidden = true;
			}
    
			if (AtDelement && AtDtime)
				document.getElementById('spell-separator').hidden = true;
		};

		var proofreadMenuItemHandler = function atd_proofreadMenuItemHandler(event) {
			var clickTarget = document.popupNode;
			var conduit = atd.findConduit(clickTarget);
			conduit.check();
		};

		var switchHandler = function atd_switchHandler(event) {
			var clickTarget = document.popupNode;
			var doc = clickTarget.ownerDocument;
			var switchItem = document.getElementById('afterthedeadline-switch');
			var domain = doc.location.hostname;

			if (atd.isIgnoreDomain(domain)) {	
				// remove from ignoredDomains
				atd.removeIgnoreDomain(domain);
				switchItem.setAttribute('checked',true);
			} 
			else {
				// add to ignoredDomains
				atd.addIgnoreDomain(domain);
				switchItem.setAttribute('checked',false);
			}
		}

		var menuItem = document.getElementById('afterthedeadline-proofread');
		menuItem.addEventListener('command',proofreadMenuItemHandler,true);
		var switchItem = document.getElementById('afterthedeadline-switch');
		switchItem.addEventListener('command',switchHandler,true);

		var contextMenu = document.getElementById("contentAreaContextMenu");
		if (contextMenu) {
			contextMenu.addEventListener("popupshowing", proofreadMenuItemToggle, false);
			contextMenu.addEventListener("popupshowing", suggestionsMenuCreation, false);
			contextMenu.addEventListener("popuphidden", suggestionsMenuRemoval, false);
		}
	}

	window.addEventListener("load", atd_bootstrap, false);

	return this;
})();

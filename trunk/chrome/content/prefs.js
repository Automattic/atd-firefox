/*
 * prefs.js - Manage the preference pane
 * Author      : mitcho (Michael Yoshitaka Erlewine)
 * License     : LGPL?
 * Project     : http://www.afterthedeadline.com/
 * Contact     : mitcho@mitcho.com
 */

if (!com) var com = {};
if (!com.automattic) com.automattic = {};

const HTML_NS = 'http://www.w3.org/1999/xhtml';

com.automattic.AtDPrefs = {
	AtD_prefs : {},
	removeMe  : undefined, // defined later

	init : function() {
		AtD_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		AtD_prefs = AtD_prefs.getBranch("extensions.afterthedeadline.");

		document.getElementById('afterthedeadlinePrefs').blur();

		var mediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		var window = mediator.getMostRecentWindow("navigator:browser");

		// let's set up the activation key
		var key = document.getElementById('key');

		key.blur();
		key.value = displayKeys(AtD_prefs.getCharPref('proofreadKey'));

		function displayKeys(code) {
			var keys = code.split(',');
			var label = (keys[0] == 'true'?'shift-':'') 
				+ (keys[1] == 'true'?'alt-':'') 
				+ (keys[2] == 'true'?'ctrl-':'') 
				+ (keys[3] == 'true'?'⌘-':'');

			if (keys[4] != '0') { // if charCode-based
				label += String.fromCharCode(keys[4]).toUpperCase();
			}
			else { // if keyCode-based
				for (var prop in KeyEvent) {
					if (!/^DOM_VK_/.test(prop))
						continue;
					if (KeyEvent[prop] != keys[5])
						continue;
					label += prop.replace('DOM_VK_','');
				}
			}
			return label;
		}
  
		key.addEventListener('keypress',function(e) {
  			if (e.keyCode == KeyEvent.DOM_VK_TAB)
				return;
  
			e.stopPropagation();
			e.preventDefault();
    
			// if we press a charCode or a base keyCode (not an F-key) without a modifier
			if ((e.charCode || (e.keyCode && (e.keyCode < KeyEvent.DOM_VK_F1 || e.keyCode > KeyEvent.DOM_VK_F24) ) )
					&& !e.altKey && !e.ctrlKey && !e.metaKey)
				return;

			// if we press ESCAPE (27)
			if (e.keyCode == 27 && !e.charCode && !e.ctrlKey && !e.metaKey) {
				key.blur();
				return;
			}

			var code = [e.shiftKey,e.altKey,e.ctrlKey,e.metaKey,e.charCode,e.keyCode].join(',');
			key.value = displayKeys(code);
    
			AtD_prefs.setCharPref('proofreadKey',code);
			var refreshCode = [!e.shiftKey,e.altKey,e.ctrlKey,e.metaKey,(e.charCode?( e.shiftKey?e.charCode+32:e.charCode-32):0),e.keyCode].join(',');
			AtD_prefs.setCharPref('refreshKey',refreshCode);
    
			key.blur();
		}, false)

		// let's set up the ignoreTypes
		var ignoreTypes = AtD_prefs.getCharPref('ignoreTypes');
		var ignoreTypesHash = {};
		ignoreTypes.split(',').forEach(function(word) {
			ignoreTypesHash[word] = 1;
		});

		var checkboxHandler = function atd_prefs_checkboxHandler(e) {
			var type = e.target.getAttribute('value');
			if (e.target.getAttribute('checked'))
				delete ignoreTypesHash[type];
			else
				ignoreTypesHash[type] = 1;
			updateTypes();
		};
  
		var updateTypes = function atd_prefs_updateTypes() {
			var prefvalue = [type for (type in ignoreTypesHash)].join(',');
			AtD_prefs.setCharPref('ignoreTypes',prefvalue);
		};

		var checkboxes = document.getElementById('ignoreTypes').getElementsByTagName('checkbox');

		for (var i=0; i< checkboxes.length; i++) {
			var box = checkboxes[i];

			if (box.getAttribute('value') in ignoreTypesHash)
				box.setAttribute('checked',false);
			else
				box.setAttribute('checked',true);
			box.addEventListener('click',checkboxHandler,false); // for XUL checkboxes, click is like change
		}

		// now set up the ignoreStrings
		var addStringWidget = function atd_prefs_addStringWidget(string) {
			var widget = document.createElementNS(HTML_NS,'html:span');
			widget.className = 'ignoreWidget';
			var text = document.createTextNode(string);
			widget.appendChild(text);
			document.getElementById('ignoreStrings').appendChild(widget);
		};

		var addDomainWidget = function atd_prefs_addDomainWidget(string) {
			var widget = document.createElementNS(HTML_NS,'html:span');
			widget.className = 'ignoreWidget';
			var text = document.createTextNode(string);
			widget.appendChild(text);
			document.getElementById('ignoreDomains').appendChild(widget);
		};

		var ignoreStrings = AtD_prefs.getCharPref('ignoreStrings');
		var ignoreStringsHash = {};
		var splitIgnoreStrings = ignoreStrings.length ? ignoreStrings.split(',') : [];

		splitIgnoreStrings.forEach(function(word) {
			ignoreStringsHash[word] = 1;
		});

		var ignoreDomains = AtD_prefs.getCharPref('ignoreDomains');
		var ignoreDomainsHash = {};
		var splitIgnoreDomains = ignoreDomains.length ? ignoreDomains.split(',') : [];

		splitIgnoreDomains.forEach(function(word) {
			ignoreDomainsHash[word] = 1;
		});
  
		// removeMe is shared between 
		removeMe = function removeMe (xit) {
			var widget = xit.parentNode;
			var word = widget.innerHTML;
    
			// if we're removing a string...
			if (widget.parentNode.id == 'ignoreStrings') {
				delete ignoreStringsHash[word];
				updateStrings();
			} 
			else { // else it's a domain...
				delete ignoreDomainsHash[word];
				updateDomains();     
			}
			widget.parentNode.removeChild(widget);
		};
 
		var updateStrings = function atd_prefs_updateStrings() {
			var prefvalue = [type for (type in ignoreStringsHash)].join(',');
			AtD_prefs.setCharPref('ignoreStrings',prefvalue);
		};

		var updateDomains = function atd_prefs_updateDomains() {
			var prefvalue = [type for (type in ignoreDomainsHash)].join(',');
			AtD_prefs.setCharPref('ignoreDomains',prefvalue);
		};
 
		for (var string in ignoreStringsHash) {
			addStringWidget(string);
		}

		for (var string in ignoreDomainsHash) {
			addDomainWidget(string);
		}

		var addString = function atd_prefs_addString() {
			var word = document.getElementById('newIgnoreString').value;
			if (!word)
				return false;

			document.getElementById('newIgnoreString').value = '';
			addStringWidget(word);
			ignoreStringsHash[word] = 1;
			updateStrings();
		};

		var addDomain = function atd_prefs_addDomain() {
			var word = document.getElementById('newIgnoreDomain').value;
			if (!word)
				return false;

			document.getElementById('newIgnoreDomain').value = '';
			addDomainWidget(word);
			ignoreDomainsHash[word] = 1;
			updateDomains();
		};  

		document.getElementById('newIgnoreStringButton').addEventListener('command',addString,false);
		document.getElementById('newIgnoreDomainButton').addEventListener('command',addDomain,false);

		document.getElementById('afterthedeadlinePrefs').focus()
	}
};

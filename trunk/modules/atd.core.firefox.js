/*
 * atd.core.firefox.js - A module for AtDCore with modifications for the Firefox addon
 * Author      : mitcho (Michael Yoshitaka Erlewine)
 * License     : LGPL?
 * Project     : http://www.afterthedeadline.com/
 * Contact     : mitcho@mitcho.com
 */

var EXPORTED_SYMBOLS = ['AtDCore'];

Components.utils.import("resource://afterthedeadline/atd.core.js");

AtDCore.prototype.isIE = function(){ return false; };
AtDCore.prototype.document = null; // must be set outside of the module.

AtDCore.prototype.map = function atd_core_map(array, callback) {
  return array.map(callback)
};
AtDCore.prototype.hasClass = function atd_core_hasClass(element, className) {
  if ('classList' in element) // if Firefox 3.6
    return element.classList.contains(className);
  return RegExp('\\b'+className+'\\b').test(element.className);
};
AtDCore.prototype.contents = function atd_core_contents(element) {
  return this.makeArray(element.childNodes);
};
AtDCore.prototype.replaceWith = function atd_core_replaceWith(old_element, new_element) {
  try {
    var result = old_element.parentNode.replaceChild(new_element,old_element);
    return true;
  } catch(e) {
    return false;
  }
};
AtDCore.prototype.create = function atd_core_create(string) {
  // replace out all tags with &-equivalents so that we preserve tag text.
  string = string.replace('&','&amp;');
  string = string.replace('<','&lt;','g').replace('>','&gt;','g');
  // find all instances of AtD-created spans
  var matches = string.match(/&lt;span class="hidden\w+?" pre="[^"]*"&gt;.*?&lt;\/span&gt;/g);
  // ... and fix the tags in those substrings.
  if (matches) {
    matches.forEach(function(match) {
      string = string.replace(match,match.replace('&lt;','<','g').replace('&gt;','>','g'));
    },this);
  }
  var node = this.document.createElement('span');
  node.className = 'mceItemHidden';
  node.setAttribute('spellcheck', false);
  node.innerHTML = string;
  return node;
};
AtDCore.prototype.removeParent = function atd_core_removeParent(element) {
  if (element.parentNode) {
     var parent = element.parentNode;
     var next = element.nextSibling;
     var children = [];

     while (element.firstChild)
           children.push(element.removeChild(element.firstChild));

     if (next == null)
        for (var x = 0; x < children.length; x++)
           parent.appendChild(children[x])
     else
        for (var x = 0; x < children.length; x++)
           parent.insertBefore(children[x], next)

     if (element.parentNode)
        element.parentNode.removeChild(element);
  }
};
AtDCore.prototype.remove = function atd_core_remove(element) {
  element.parentNode.removeChild(element);
  return true;
};
AtDCore.prototype.getAttrib = function atd_core_getAttrib(element, name) {
  if (element.hasAttribute(name))
    return element.getAttribute(name);
  return false;
};
AtDCore.prototype.findSpans = function atd_core_findSpans(element) {
  var nodeList = element.getElementsByTagName('span');
  return this.makeArray(nodeList);
};

AtDCore.prototype.makeArray = function atd_core_makeArray(nodeList) {
  var returnArr = [];
  for (var i = 0; i < nodeList.length; i++) {
    returnArr.push(nodeList[i]);
  }
  return returnArr;
}

// updated for HTML text editing
AtDCore.prototype.makeError = function(error_s, tokens, type, seps, pre) {        
	var struct = new Object();
	struct.type = type;
	struct.string = error_s;
	struct.tokens = tokens;

	if (new RegExp(error_s + "\\b").test(error_s)) {
		struct.regexp = new RegExp("(?!"+error_s+"</span)" + error_s.replace(/\s+/g, seps) + "\\b");
	} else {
		struct.regexp = new RegExp("(?!"+error_s+"</span)" + error_s.replace(/\s+/g, seps));
	}

	struct.used   = false; /* flag whether we've used this rule or not */

	return struct;
};

AtDCore.prototype.getLang = function(key, defaultk) {
  try {
    return this.i18n.getString(key);
  } catch(e) {
    return defaultk;
  }
};

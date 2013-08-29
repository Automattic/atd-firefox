/*
 * textarea.js - the textarea conduit module
 * Author      : mitcho (Michael Yoshitaka Erlewine)
 * License     : GPL 2.0 or higher
 * Project     : http://www.afterthedeadline.com/
 * Contact     : mitcho@mitcho.com
 */

var EXPORTED_SYMBOLS = ['conduit','isExempt','tagNames'];

// nodeNames is the list of DOM node (tag) types that will be AtD-ified with
// this conduit.
var tagNames = ['textarea'];

/*
 * AtD "conduits" must have .check and .restore methods. .target must point
 * to the original DOM element, and .frame must point to the replacement
 * element (may be the same as the target).
 *
 * Optionally, the .update method is triggered when the frame is updated.
 */

conduit = function atd_textarea(textarea,atd,core) {
	this.target = textarea;
	this.atd = atd; // a reference to the AtD instance that created this.

	this.core = core;
  
	this.core.document = textarea.ownerDocument;

	this.__addWidget();
	this.__addShortcuts();
	this.__addSubmitHandler();
};

conduit.prototype = {
	count: -1, // -1 marks that it hasn't been checked yet
	counter: -1,
	__hasBeenChecked: false,
	__inTransition: false,

	__addWidget: function atd_textarea_addWidget() {
		var conduit = this;
		var target = this.target;
		var atd = this.atd;
  
		// create a DOM label which triggers "check"
		var doc = target.ownerDocument;
		var widget = doc.createElement('div');
		widget.className = 'afterthedeadline-button';
		widget.innerHTML = '&nbsp;';
		this.widget = widget;
		widget.addEventListener('click',function(){conduit.toggle()},true);    

		var buttonFocusToggle = function atd_textarea_buttonFocusToggle(e) {
			var widget = conduit.widget;
			if (e.type == 'blur') {
				if (widget.classList) // if Firefox 3.6
					widget.classList.remove('afterthedeadline-focus');
				else
					widget.className = widget.className.replace(/(\s+|\b)afterthedeadline-focus(\s+|\b)/,'$1$2');
		}

		if (e.type == 'focus') {
			if (widget.classList) // if Firefox 3.6
				widget.classList.add('afterthedeadline-focus');
			else	
				widget.className += ' afterthedeadline-focus';
			}
		}
    
		var buttonHoverToggle = function atd_textarea_buttonHoverToggle(e) {
			var widget = conduit.widget;
      
			if (e.type == 'mouseout') {
				if (widget.classList) // if Firefox 3.6
					widget.classList.remove('afterthedeadline-hover');
				else
					widget.className = widget.className.replace(/(\s+|\b)afterthedeadline-hover(\s+|\b)/,'$1$2');
	 		}

			if (e.type == 'mouseover') {
				if (widget.classList) // if Firefox 3.6
					widget.classList.add('afterthedeadline-hover');
				else
					widget.className += ' afterthedeadline-hover';
			}
		};

		target.addEventListener('focus',buttonFocusToggle,false);
		target.addEventListener('blur',buttonFocusToggle,false);

		target.addEventListener('mouseover',buttonHoverToggle,false);
		target.addEventListener('mouseout',buttonHoverToggle,false);
    
		target.parentNode.appendChild(widget);
    
		// turn native spellcheck off
		target.setAttribute('spellcheck', this.atd.getBoolPref('nativeSpell'));
		target.ownerDocument.body.setAttribute('spellcheck', this.atd.getBoolPref('nativeSpell'));
    
		this.__adjustWidget();
		this.__addScrollbarHandler();

		target.addEventListener('DOMAttrModified', function(e) {
			if (e.attrName == 'style') 
				conduit.__enforceDisplay();
		}, true);
	},

	__adjustWidget: function atd_textarea_adjustWidget() {
		var widget = this.widget;
		var target = this.target;
		var frame = this.frame;
		var doc = this.target.ownerDocument;
		var css = doc.defaultView.getComputedStyle(target,null);

		if ((!frame && target.offsetHeight === 0 && target.offsetWidth === 0) || (frame && frame.offsetHeight === 0 && frame.offsetWidth === 0) || css.getPropertyValue('display') == 'none' || css.getPropertyValue('visibility') == 'hidden') {
			if (!this.isProofreading && !this.inTransition) {
 				this.__hideWidget();
				return;
			}
		}
		this.__showWidget();

		/**
		  * getContainingBlockOffset()
		  * 
		  * Function adapted from It's All Text! addon
		  * https://addons.mozilla.org/en-US/firefox/addon/4125
		  * Copyright (C) 2006-2007 Christian Höltje
		  *
		  * Used via GPL licensing
		  */
		var getContainingBlockOffset = function (node, container) {
			if (typeof(container) == 'undefined') {
				container = node.offsetParent;
			}
			var pos = {left:node.offsetLeft, top:node.offsetTop};
			var pnode = node.offsetParent;

			while (pnode && (container === null || pnode != container)) {
				pos.left += pnode.offsetLeft || 0;
				pos.top  += pnode.offsetTop  || 0;
				pos.left -= pnode.scrollLeft || 0;
				pos.top  -= pnode.scrollTop  || 0;
				pnode = pnode.offsetParent;
			}
			return pos;
		};
		/**
		 * END GPL-licensed code
		 */

		if (frame)
			target = frame;

		this.widgetScrollbar = (target.scrollHeight > target.clientHeight);

		var top = target.offsetHeight - widget.offsetHeight - 3;
		var left = 0 - widget.offsetWidth - 3;

		if (this.widgetScrollbar) {
			left += target.clientWidth
				 + parseInt(css.getPropertyValue('border-left-width'))
				 + parseInt(css.getPropertyValue('border-right-width'));

			// for textareas, we also have to add the left padding value as
			// clientWidth doesn't include it. Note it's included for divs.

			if (target.nodeName == 'TEXTAREA')
				left += parseInt(css.getPropertyValue('padding-left'));
		} 
		else {
			left += target.offsetWidth;
		}
    
		if (target.ownerDocument != null && target.ownerDocument.location != null && target.ownerDocument.location.host == 'www.facebook.com') {
			var box = target.getBoundingClientRect();
			var body = doc.body;
			var docElem = doc.documentElement;
			var clientTop = docElem.clientTop || body.clientTop || 0; 
			var clientLeft = docElem.clientLeft || body.clientLeft || 0;

			top  = box.top  + (docElem.scrollTop  || body.scrollTop ) - clientTop;
			left = box.left + (docElem.scrollLeft || body.scrollLeft) - clientLeft;

			left += box.width - (widget.offsetWidth + 3);
			top += box.height - (widget.offsetHeight); 
		}
		else if (target.offsetParent === widget.offsetParent) {
			top += target.offsetTop;
			left += target.offsetLeft;
		} 
		else {
			var offset = getContainingBlockOffset(target,widget.offsetParent);
			left += offset.left;
			top  += offset.top;
		}
		
		var zindex = css.getPropertyValue('z-index');
		if (zindex != undefined && zindex != '0' && zindex != '') {
			widget.style.setProperty('z-index', parseInt(zindex) + 1, '');
		}

		widget.style.setProperty('top',top+'px','');
		widget.style.setProperty('left',left+'px','');
	},

	__enforceDisplay: function atd_textarea_enforceDisplay() {
		// if in transition or not proofreading, stop here. let it take care of it.
		if (!this.isProofreading || this.inTransition)
			return;
      
		if (!(this.target.offsetHeight === 0 && this.target.offsetWidth === 0) && !(this.frame.offsetHeight === 0 && this.frame.offsetWidth === 0)) {
			if (this.restore())

			// we got here because the textarea + frame was hidden, somehow.
			// if the target is now displayed, let's hide it now.
			if (!(this.target.offsetHeight === 0 && this.target.offsetWidth === 0)) {
				this.target.style.removeProperty('display');
				this.target.style.setProperty('display','none','');
			}
			return;
		}
      
		var targetStyle = this.target.style;
		var frameStyle = this.frame.style;

		// one fix for inline textareas - they should get replaced by inline-block divs
		frameStyle.removeProperty('display');
		if (this.targetDisplay == 'inline')
			frameStyle.setProperty('display','inline-block','');
		else
			frameStyle.setProperty('display',this.targetDisplay,'');

		targetStyle.removeProperty('display');
		targetStyle.setProperty('display','none','');
	},

	__addShortcuts: function atd_textarea_addShortcuts(target) {
		if (!target)
			target = this.target;
		var conduit = this;

		var shortcutsHandler = function atd_textarea_shortcutsHandler(e) {
			if (conduit.atd.isDisabled(target.ownerDocument))
				return;
			if (conduit.atd.isKey(e,'refreshKey')) {
				conduit.refresh();
				e.preventDefault();
			}

			if (conduit.atd.isKey(e,'proofreadKey')) {
				conduit.toggle();
				e.preventDefault();
			}
		};

		target.addEventListener('keypress',shortcutsHandler,false);
	},

	// Add the submit handler which restores the textarea in cases when we submit
	// the form and we're in proofreading mode.
	// Note that this is not the handler which handles the form submission
	// warning, which is added in AtD itself on a per-form basis.
	__addSubmitHandler: function atd_textarea_addSubmitHandler(target) {
		if (!target)
			target = this.target;

		var conduit = this;
    
		var submitHandler = function atd_textarea_submitHandler(e) {
			// if the event target (form) is the "target," or contains the "target"...
			if (!e.target == target && !(e.target.compareDocumentPosition(target) & conduit.atd.CONTAINEDBY))
				return;
			if (conduit.isProofreading)
				conduit.restore();
		};
		target.ownerDocument.addEventListener('submit',submitHandler,true);
	},

	__addScrollbarHandler: function atd_textarea_addScrollbarHandler(target) {
		if (!target)
			target = this.target;
		var conduit = this;

		var scrollbarHandler = function atd_textarea_scrollbarHandler(e) {
			if (conduit.widgetScrollbar !== (target.scrollHeight > target.clientHeight))
				conduit.__adjustWidget();
		};
		target.addEventListener('keyup',scrollbarHandler,false);
	},

	check: function atd_textarea_check() {
		this.__inTransition = true; // mark transition
    
		this.widget.className = 'afterthedeadline-button afterthedeadline-done';

		this.__hasBeenChecked = true;

		var target = this.target;
		var text = target.value;
		var doc = target.ownerDocument;
		var frame = doc.createElement('div');
		frame.afterthedeadlineId = target.afterthedeadlineId;
		var textNode = doc.createTextNode(text);
		frame.appendChild(textNode);

		// copy the scrollTop value as well (applied later)
		var scrollPosition = this.getScrollPosition();

		// let's copy the attributes that the previous textarea had
		//frame.id = this.target.id;
		frame.setAttribute('style',target.style.cssText);
		frame.className = target.className;
		var css = doc.defaultView.getComputedStyle(target,null);

		for (var i = 0; i < css.length; i++) {
			var property = css.item(i);
			if (property != '-moz-binding')
				frame.style.removeProperty(property);        
			frame.style.setProperty(property,css.getPropertyValue(property),css.getPropertyPriority(property));
		}

		frame.style.setProperty('overflow','auto','');
		frame.style.setProperty('white-space','pre-wrap','');

		// keep a copy of the display value for later
		this.targetDisplay = css.getPropertyValue('display');
		this.targetDisplayPriority = css.getPropertyPriority('display');

		// one fix for inline textareas - they should get replaced by inline-block divs
		if (this.targetDisplay == 'inline')
			frame.style.setProperty('display','inline-block','');

		frame.setAttribute('contentEditable',true);
		frame.setAttribute('spellcheck', false);
		target.ownerDocument.body.setAttribute('spellcheck', false);

		var conduit = this;

		this.frame = frame;
		this.__addShortcuts(frame);
		this.__addScrollbarHandler(frame);

		frame.addEventListener('DOMSubtreeModified',function(event) {
			if (!conduit.inTransition)
				conduit.update();
		},false);

		target.style.removeProperty('display');
		target.style.setProperty('display','none','');
		target.parentNode.insertBefore(frame,target);
		frame.focus();

		var spanClearer = function atd_spanClearer(e) {
			var errorElement = e.currentTarget;
			var grandParent = errorElement.parentNode;
      
			if (conduit.core.isMarkedNode(errorElement))
				conduit.atd.ignoreSuggestion(errorElement,conduit);
			if (grandParent)
				setSpanClearers(grandParent);
		};

		var setSpanClearers = function atd_textarea_setSpanClearers(frame) {
			conduit.__inTransition = false;

			if (!frame && 'frame' in conduit)
				frame = conduit.frame;

			if (!frame) // if we still can't find the frame, stop.
				return;

			conduit.core.findSpans(frame).forEach(function(span) {
				if (conduit.core.isMarkedNode(span))
					span.addEventListener('DOMSubtreeModified',spanClearer,false);
			});
		};

		var results = this.atd.check(text, this, setSpanClearers);
		this.setScrollPosition(scrollPosition);
	},

	checkWithoutDisplay: function atd_textarea_check(cb) {
		if (this.isProofreading || this.inTransition)
			return;

		var target = this.target;
		var text = target.value;
		var conduit = this;
    
		// the last true is for dontDisplay
		var results = this.atd.check(text, this, cb, true);
	},

	restore: function atd_textarea_restore() {
		this.__inTransition = true; // mark transition
		// if we're not in proofreading mode, exit.
		if (!this.isProofreading)
			return false;
      
		var scrollPosition = this.getScrollPosition();
			this.core.remove(this.frame);
    
		this.target.style.removeProperty('display');
		this.target.style.setProperty('display',this.targetDisplay,this.targetDisplayPriority);

		delete this.frame;
    
		this.setScrollPosition(scrollPosition);
    
		this.widget.className = 'afterthedeadline-button';
    
		this.target.focus();
		this.__inTransition = false; // end transition
	},

	refresh: function atd_textarea_refresh() {
		this.restore();
		this.check();
	},

	toggle: function atd_textarea_toggle() {
		if (this.inTransition)
			return;

		if (this.isProofreading) {
			this.restore();
		} 
		else {
			this.check();
		}
	},

	update: function atd_textarea_update() {
		// if we're not in proofreading mode, exit.
		if (!this.isProofreading)
			return;

		// get the content but without breaks.
		var content = this.frame.innerHTML.replace(/<br\/?>/g,"\r");
		// make a copy of the frame and fill it with updated HTML
		var frameCopy = this.frame.cloneNode(false);
		frameCopy.innerHTML = content;
		// remove all markup from the frame
		this.core.removeWords(frameCopy,null);
		this.target.value = frameCopy.textContent;
	},

	success: function atd_textarea_success() {
		this.restore();
	},

	error: function atd_textarea_error(message) {
		throw new Error(message);
	},

	remove: function atd_textarea_remove() {
		var widget = this.widget;
		widget.parentNode.removeChild(widget);
	},

	__hideWidget: function atd_textarea_hideWidget() {
		this.widget.style.display = 'none';
	},

	__showWidget: function atd_textarea_showWidget() {
		this.widget.style.display = 'block';
	},
  
	getScrollPosition: function atd_textarea_getScrollPosition() {
		if (this.isProofreading)
			return this.frame.scrollTop;
		else
			return this.target.scrollTop;
	},

	setScrollPosition: function atd_textarea_setScrollPosition(value) {
		if (this.isProofreading)
			this.frame.scrollTop = value;
		else
			this.target.scrollTop = value;
	},
  
	get hasBeenChecked() {
		return this.__hasBeenChecked;
	},

	get isProofreading() {
		return this.frame !== undefined && this.frame !== null;
	},

	get inTransition() {
		return this.__inTransition;
	}
};

isExempt = function atd_textarea_isExempt(textarea, atd) {
	var doc = textarea.ownerDocument;
  
	// exempt hotmail to/cc/bcc fields
	if (/.*?\$[iI]nputBox/.test(textarea.id))
		return true;

	// exempt if there are already more widgets than there are textareas.
	if (textarea.parentNode && textarea.parentNode.getElementsByClassName('afterthedeadline-button').length >= textarea.parentNode.getElementsByTagName('textarea').length)
		return true;

	// exempt the facebook status textarea, only the status textarea
	if (/UIComposer_TextArea\s/.test(textarea.className) && !/DOMControl_autogrow/.test(textarea.className)) {	
		return true;
	}

	// exempt paypal checkout seller-notes area
	if (textarea.id == 'seller-notes')
		return true;

	// exempt cPanel code editor
	if (textarea.id == 'codewindow')
		return true;

	// exempt facebook chat.
	if (textarea.className == 'chat_input' || textarea.className == 'chat_shadow_input')
		return true;
	
	// disable in Google spreadsheets
	if (textarea.ownerDocument != null && textarea.ownerDocument.location != null && textarea.ownerDocument.location.host == 'spreadsheets.google.com') 
		return true;

	// exempt gmail's contact fields
	if (textarea.ownerDocument != null && textarea.ownerDocument.location != null && textarea.ownerDocument.location.host == 'mail.google.com' && textarea.parentNode.nodeName == 'TD')
		return true;

	// example yahoo's contact fields.
	if (/compHeaderField/.test(textarea.className))
		return true;

	return false;
}

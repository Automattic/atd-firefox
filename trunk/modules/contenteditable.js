/*
 * contenteditable.js - allow AtD checking in content editable areas
 * Author      : Raphael Mudge
 * License     : GPL 2.0 or higher
 * Project     : http://www.afterthedeadline.com/
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 */

var EXPORTED_SYMBOLS = ['conduit','isExempt','tagNames'];
var tagNames = ['div'];

conduit = function atd_contenteditable(textarea,atd,core) {
	this.target = textarea;
	this.atd = atd;

	this.core = core;
  
	this.core.document = textarea.ownerDocument;

	this.__addWidget();
	this.__addShortcuts();
	this.__addSubmitHandler();
}

conduit.prototype = {
	count: -1, // -1 marks that it hasn't been checked yet
	counter: -1,
	__hasBeenChecked: false,
	__inTransition: false,
	__addWidget: function atd_contenteditable_addWidget() {
		var conduit = this;
		var target = this.target;
		var atd = this.atd;

		// create a DOM label which triggers "check"
		var doc = target.ownerDocument;
		var widget = doc.createElement('div');
		widget.className = 'afterthedeadline-button';
		widget.innerHTML = '&nbsp;';
		this.widget = widget;

		widget.addEventListener('click',function() { 
			conduit.toggle() 
		}, true);    

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
		}

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
			left += target.clientWidth + parseInt(css.getPropertyValue('border-left-width')) + parseInt(css.getPropertyValue('border-right-width'));

			// for textareas, we also have to add the left padding value as
			// clientWidth doesn't include it. Note it's included for divs.
			if (target.nodeName == 'TEXTAREA')
				left += parseInt(css.getPropertyValue('padding-left'));
		} 
		else {
			left += target.offsetWidth;
		}
    
		if (target.offsetParent === widget.offsetParent) {
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

	__addShortcuts: function atd_contenteditable_addShortcuts(target) {
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
		var text = target.innerHTML;

		var doc = target.ownerDocument;
		var frame = doc.createElement('div');
		frame.afterthedeadlineId = target.afterthedeadlineId;
		frame.innerHTML = text;

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

		frame.setAttribute('spellcheck', false);
		target.ownerDocument.body.setAttribute('spellcheck', false);

		frame.setAttribute('contentEditable',true);

		var conduit = this;

		this.frame = frame;
		this.__addShortcuts(frame);
		this.__addScrollbarHandler(frame);

                frame.addEventListener('DOMSubtreeModified', function() {
                        conduit.lastModified = (new Date()).getTime();
                
                        var handler = function() {
                                if (!conduit.inTransition)
                                        conduit.update("DOMSubtTreeModified");
                        };
                
                        (doc.defaultView['set'+'Timeout'])(function() {
                                var now = (new Date()).getTime() - conduit.lastModified;
                                if (now >= 500) {
                                        handler();
                                }
                        }, 500);
                }, false);

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
			conduit.__inTransition = false; // complete transition

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
		var text = target.innerHTML;
		var conduit = this;
    
		// the last true is for dontDisplay
		var results = this.atd.check(text, this, cb, true);
	},

	restore: function atd_textarea_restore() {
		// sync contents before doing a restore
		this.update();

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

	update: function atd_contenteditable_update() {
		// if we're not in proofreading mode, exit.
		if (!this.isProofreading)
			return;

		// get the content but without breaks.
		var content = this.frame.innerHTML; //.replace(/<br\/?>/g,"\r");
		// make a copy of the frame and fill it with updated HTML
		var frameCopy = this.frame.cloneNode(false);
		frameCopy.innerHTML = content;
		// remove all markup from the frame
		this.core.removeWords(frameCopy,null);
		this.target.innerHTML = frameCopy.innerHTML;
		this.lastModified = (new Date()).getTime();
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

isExempt = function atd_textarea_isExempt(node, atd) {

	if (node.contentEditable != 'true')
		return true;

	/* disable on small editable divs */
	if (node.clientHeight < 24)
		return true;

        // disable in Google spreadsheets
        if (node.ownerDocument != null && node.ownerDocument.location != null && node.ownerDocument.location.host == 'spreadsheets.google.com')
                return true;

	/* exclude GMail task list */
	if (node.className == 'EY')
		return true;

	return false;
}

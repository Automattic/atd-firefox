### 1.51 - 20120202

*   Updated Firefox 10 compatibility

### 1.5 - 20100809

*   Removed first-run and what's new screens
*   Updated for Firefox 4 compatibility.

### 1.4 - 20100728

*   auto-proofread is now off by default.
*   Ignored sites/ignored phrases now scrolls if there is too much information.
*   Disabled AtD on draft.blogger.com WYSIWYG editor.
*   AtD widget now inherits z-order property. It should display on some pages where it didn't show before.
*   Updated translations using strings from http://translator.wordpress.com/projects/atd/atd-firefox. Thanks volunteers!
*   AtD now honors the extensions.afterthedeadline.proofreadServer key. You can set this in about:config to the URL of a server that speaks the AtD protocol. Set this key if you run an AtD server or to make this extension speak to another technology. This key should contain a URL (e.g., http://127.0.0.1:1049). See: http://wp.me/pCBVi-bR
*   AtD now attaches to any site (whether that site has AtD or not). This has worked fine with our Chrome extension, so we're bringing this here.

### 1.3 - 20100510

*   AtD/FF no longer attaches to Facebook chat
*   Fixed a typo in the preferences pane
*   Fixed an exception caused in some situations when page with textarea has no document.location value
*   Fixed an issue with highlighted errors floating to the left in WuFoo forms
*   AtD no longer auto-proofreads comment on Like/Unlike presses on Facebook
*   Auto-proofread only activates on visible form elements now
*   AtD no longer attaches to cells in Google's spreadsheet app
*   Added translations (some are partial) for:

    *   ar-AR, de-DE, es-ES, fa-FA, fi-FI, it-IT, ja-JA, ms-MS, no-NO, pt-BR, pt-PT, and tr-TR
    *   You can contribute to and improve these at [http://translate.wordpress.com/projects/atd/atd-firefox](http://translate.wordpress.com/projects/atd/atd-firefox)
    *   Special thanks to the translators who made these possible, your work is greatly appreciated
*   Updated text of auto-proofread prompt to clarify what OK does and what Cancel does
*   Fixed positioning of AtD widget on Facebook comments
*   AtD/FF now communicates with the AtD service over SSL to protect your emails and other things
*   Widget repositioning is now more responsive

### 1.2 - 20100323

*   Updated to latest AtD/Core module:

    *   Added L10n string _menu_title_confused_word_ to localize "Did you mean..."
    *   Fixed two cases of parent variable polution (two for loops not declaring their vars)
    *   Fixed bug preventing subsequent occurences of one error (w/ the same context) from highlighting
    *   Error highlighter now uses beginning of word boundary to accurately find error location in text
    *   Fixed bug preventing misspelled words in single quotes from being highlighted
*   Added an exemption to prevent AtD from attaching to cPanel's code editor.
*   Fixed bugs surrounding the Ignore Suggestion menu option (#100, #109)
*   Preferences are now organized using a tabbed interface
*   Fixed AtD showing branding logo in about: context menu (#117)
*   Added a hack to prevent AdBlock Plus menu item from displaying with AtD
*   Fixed AtD not attaching to some dynamically created form elements (e.g., P2 comment replies)
*   Added a hack to prevent auto-proofread from engaging when clicking "View all N comments" on Facebook (#104)
*   AtD now does a better job keeping the proofread button in the right place (#106)
*   Fixed AtD keyboard shortcut from removing text area in WP Dashboard comment reply (#96)
*   DIV/IFRAME conduits sync contents before restore (text typed during proofreading won't be lost) (#110)
*   Added AtD preferences link to the Tools menu (#95)
*   Improved WYSIWYG proofread mode likeness with original WYSIWYG editor
*   Errors now show in non-word wrapped paragraphs in Zoho Writer
*   Proofreader is smarter about syncing to the editor now--should make AtD feel faster
*   AtD now remembers scrollbar position in GMail (and probably others too) (#122)
*   Rewrote some code to better "respect" the global scope
*   Added an exception to prevent AtD from attaching to GMail Task List and content editable divs <20px high

### 1.11 - 20100222

*   Fixed code causing AtD to pause Firefox for 3-6s on load for some pages (affected Facebook)

### 1.1 - 20100219

*   Added exception for Paypal checkout page to prevent add-on swallowing submit events (#90)
*   AtD will not swallow (and reinject submit event) unless there is a proofreadable form item (fixes #81)
*   Renamed global prefs var to AtD_prefs (fixes #80, Text Formatting Toolbar add-on conflict)
*   Added a conduit for contentEditable divs. This means AtD works in more forms now.
*   Relaxed textarea ignore restriction to allow AtD to attach to more forms on Facebook (status update, compose message, etc.)
*   Exempted contact fields from Yahoo Mail
*   Added *experimental* feature to add AtD to WYSIWYG editors. You must enable this in the preferences. I think it works fine but I'll be on vacation next week and unable to solve emergency bugs that come up. Use at your own risk.

*   Added a hack to prevent "Down-Them-All" context menu items displaying in AtD menu (#78)
*   Changed default proofread key value to F4 (you can still change it)
*   Added language options for French, German, Portuguese, and Spanish. Also added language auto-detect.
*   Added an option to allow native Firefox spell checker on AtD enhanced form items. (#79).
*   Clich&ecuate; menu item now displays correctly
*   Several performance enhancements--this version is lightning quick.

### 1.0 - 20100130

*   The big 1.0 release!
*   Fix for scroll position bug (#75).

### 0.1a14 - 20100129

*   Improved AtDdisabled handling (#74).
*   Fix for AtD widget not showing up on some sites (#72).
*   Bugfix for some preferences not getting updated correctly.
*   Tweaked refresh key code generation.
*   Fixed a styling bug in Firefox 3.0.
*   Updated default settings.
*   Code cleanup. Fixed various strict JavaScript warnings.

### 0.1a13 - 20100128

*   Refactored conduit registration.
*   Better implentation of AtD-disabling (#67).
*   New preference for activation keystroke (#63).
*   Code cleanup. Fixed various strict JavaScript warnings.
*   Fix for some forms requiring multiple clicks to submit (#68).

### 0.1a12 - 20100127

*   Added help links to help menu and preferences (#62).
*   Added (very hacky) ability to detect site-level AtD and disable add-on AtD in those cases (#66).
*   String change (#58).
*   Replaced branding image with improved version (#60). Now in living color.
*   Fixed #65 (simulateFormSubmit fix for forms with multiple submit buttons).
*   Removed "Use AtD on this site" switch when seeing suggestion menu (#61).
*   Made preference screen Automattic and AtD logos clickable.
*   Changed upgrade and first run URL's.
*   Added a logo!

### 0.1a11 - 20100127

*   Implemented improved auto-proofread behavior (#57).
*   Added "Disable AtD on these sites" preference and functionality, including "Use After the Deadline on this Site" context menu item.
*   Made preferences screen localizable.
*   Incorporated latest AtD Core module.

### 0.1a9 - 20100125

*   Fixed textarea's exemption rules to allow for sister textareas.
*   Implemented offline (no connection) warning.
*   Internationalized "edit selection" strings.
*   Added submit event handler, both to restore textareas and to implement the submission warning.
*   Code cleanup, including marking private methods in the textarea conduit.
*   Fixed a minor aesthetic issue with the check button.

### 0.1a8 - 20100120

*   Made compatible with the Gmail plain text editor (#45).
*   Disables native spell checker in AtD-enabled textareas.
*   Added branding element to the context menu when displaying proofreading suggestions and the "check" icon to the "Check Spelling and Grammar" menu item.
*   General performance optimizations.

### 0.1a7 - 20100119

*   Perfected button position with respect to scrollbars (#46).
*   Added preliminary first-run and upgrade screens.
*   Added preference screen (accessible from the Add-Ons Manager window).

### 0.1a6 - 20100118

*   Bugfix to `core.getLang()`, improving activation reliability.
*   Improved AtD check button positioning using `getContainingBlockOffset()` from [It's All Text!](https://addons.mozilla.org/en-US/firefox/addon/4125) (GPL)
*   Now handles unregistration for textarea removal to prevent leaks.
*   Dynamically registers new conduits for new textareas (#36).
*   Created new `isExempt()` filter. Exempts facebook status textarea, which isn't a real textarea.
*   Restores focus to textareas when restoring from proofreading mode.
*   Made gray AtD check button fainter.
*   Code cleanup.

### 0.1a5 - 20100115

*   Fixed a bug where explanation windows only appeared once (#32).
*   Now intercepts all document-level key events when typing in an AtD frame in proofreading mode (#33).
*   Initial internationalization (#38). Next step: getting localizations (#42).
*   Changed AtD check button attachment: now positioned dynamically. Fixed LinkedIn status (#30) and improves Facebook usage (#49).
*   Fixed a bug where some websites' CSS rules would make errors not get highlighted.
*   Code cleanup.

### 0.1a4 - 20100114

*   Added a keyboard shortcut (F7) to toggle AtD spellchecking within textareas. Shift-F7 will recheck in case the text has been edited.
*   Made the AtD check button gray when the textarea is not focused.
*   Implemented error explanations as popup windows (bug #31).
*   Bugfix for other addons' menu items getting permanently hidden after suggestions are shown (reported by Faktor12 on AMO).

### 0.1a3 - 20100113

*   Made text editable while in error display mode. When an error text is edited in this mode, its suggestions are ignored. Currently manual rechecking is required to get new errors to be highlighted.
*   Improved handling of &lt; and &gt; characters in textareas.
*   Moved AtD check widget to the bottom right corner of textareas.
*   Fixed a bug where multiple uses of the context menu item would mess up state information (thanks Paul!)

### 0.1a2 - 20100111

*   Added "Check Spelling and Grammar" context menu item
*   Added `.update` method to conduits; textarea conduit now works by hiding and syncing the original textarea rather than removing it from the DOM.
*   Replacing element.querySelectorAll with element.getElementsByTagName which is much faster. Now `minVersion = 3.0`.
*   Initial upload to [AMO](http://addons.mozilla.org).

### 0.1a1 - 20100108

*   Initial prototype
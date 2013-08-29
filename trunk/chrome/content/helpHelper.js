if (!com) var com = {};
if (!com.automattic) com.automattic = {};

com.automattic.AtDHelp = {
	atdOpenUrl : function(url) {
		if (!('gBrowser' in self)) {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var recentWindow = wm.getMostRecentWindow("navigator:browser");
			gBrowser = recentWindow.gBrowser;
		}
		gBrowser.selectedTab = gBrowser.addTab(url);
	},

	showAtDHelp : function() { 
		this.atdOpenUrl('http://firefox.afterthedeadline.com/proofreading-for-firefox-documentation/');
	},

	showAutomattic : function() { 
		this.atdOpenUrl('http://automattic.com');
	},

	showAtDWebsite : function() {
		this.atdOpenUrl('http://firefox.afterthedeadline.com');
	},

	showAtDPreferences : function() {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var window = wm.getMostRecentWindow("navigator:browser");

		var features = "chrome,titlebar,toolbar,centerscreen";
		window.openDialog("chrome://afterthedeadline/content/prefs.xul", "Preferences", features);
	}
};

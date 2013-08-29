atd-firefox
===========    

## After the Deadline Firefox Add-on

[After the Deadline](http://www.afterthedeadline.com) is an [open source](http://open.afterthedeadline.com/) software service that [checks spelling, style, and grammar](http://www.afterthedeadline.com/features.slp).
    This directory houses the development of a Firefox add-on which enables After the Deadline in forms and documents across the web. The add-on itself is downloadable from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/58947/).

Automattic no longer supports this add-on.  We're putting it on Github so that you can feel free to fork it, hack it, and release your own version.

### Installation of `trunk` version

At this time no clean install script has been made, but here are the manual installation steps:

1.  Locate your [profile folder](http://kb.mozillazine.org/Profile_folder) and beneath it the profile you want to work with (e.g. `Firefox/Profiles/&lt;profile_id&gt;.default/`).
2.  Open the `extensions/` folder, creating it if need be.
3.  Create a new text file in the `extensions` directory called `afterthedeadline@afterthedeadline.com`. In the file, put the full path to your development folder inside (e.g. `C:\atd_firefox\trunk\` or `~/atd_firefox/trunk/)`. Windows users should retain the OS' slash direction, and _everyone_ should remember to **include** a closing slash and **remove** any trailing spaces.
4.  Restart Firefox. After the Deadline should show up in the list of active add-ons.

### Distribution instructions

This addon is distributed via [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/58947/). The following steps are used to package and distribute a new version of AtD:

1.  Make sure the version information is updated in `install.rdf` and update information is added to the changelog.
2.  `cd trunk`
3.  `zip -r ../xpi/atd-firefox-VERSION.xpi * -x \*/.\*` where `VERSION` is the new version number. The exclude flag is used to keep cruft like `.svn` out.
4.  Add and commit the new `xpi` file to SVN for posterity.
5.  (optional) You may want to set the `svn:mime-type` flag to `application/x-xpinstall` so it's installable right from the SVN server.
6.  Login to [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/58947/) and upload the new `xpi`. Copy changelog information into the release notes.

### Commercial use and running your own server

This add-on requires a running instance of an [After the Deadline Server](https://github.com/automattic/atd-server) in order to work.  Automattic operates an that you can use for personal use as long as you don't send too much traffic.  The extension is configured to use this instance by default.

For high volume and commercial uses of AtD, you must run your own server.  The code is available on Github: [After the Deadline Server](https://github.com/automattic/atd-server).  See the [After the Deadline Developer's page](http://open.afterthedeadline.com/) for more information, and check out the [AtD Developers Google Group](http://groups.google.com/group/atd-developers) for discussion and community support.  

When you run your own server, replace `service.afterthedeadline.com` with your server's hostname.

### Credits

*   Uses [AtD Core](https://github.com/automattic/atd-core) by Raphael Mudge
*   `getContainingBlockOffset()` function adapted from [It's All Text! addon](https://addons.mozilla.org/en-US/firefox/addon/4125) Copyright &copy; 2006-2007 Christian Höltje, used via GPL licensing

### License

The AtD Firefox add-on is licensed under [GPL](http://www.opensource.org/licenses/gpl-2.0.php) version 2 or greater.

### Contact

[mitcho (Michael 芳貴 Erlewine)](http://mitcho.com)

This code has always been open source.  We're putting it on Github so that you can feel free to fork it, hack it, and release your own version.

Join the [atd-developers](http://groups.google.com/group/atd-developers) list for community support.

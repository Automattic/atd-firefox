To generate strings (and have them work in AtD/FF):

1. Export PO files from http://translate.wordpress.com/projects/atd/atd-firefox
2. Place the PO files in the po/ directory
3. rm -rf out ; mkdir out
4. java -jar sleep.jar makelocale.sl
5. mv out/* to trunk/chrome/locale
6. update trunk/chrome.manifest to point to the locales (makelocale.sl will output the lines)

To extract strings (for translation):

1. Copy the trunk/chrome/locale/en_US/* files to src/
2. java -jar sleep.jar makepo.sl >atd.po
3. Upload this file to http://translate.wordpress.com/projects/atd/atd-firefox

Note: do not update the src/ directory files until they've been on GlotPress for a while.

#
# This is a Sleep script to convert the AtD/Firefox preference files into mos
#

sub getFile {
	local('$handle @lines');
	$handle = openf($1);
	@lines = readAll($handle);
	closef($handle);
	return @lines;
}

sub printProperty {
	println("#: $1 $+ : $+ $2");
	if ('\n' isin $3) {
		println('msgid ""');
		printAll(map({ return '"'.$1.'"'; }, split('\\\\n', $3)));
	}
	else {
		println('msgid "'.$3.'"');
	}

	println('msgstr ""');
	println();
}

# process property file

sub processProperties {
	local('@lines $handle $key $value $lineNo $text');
	@lines = getFile($1);
	foreach $lineNo => $text (@lines) {
		if ("#*" !iswm $text && '*=*' iswm $text) {
			($key, $value) = split('=', $text);
			printProperty($1, $lineNo, $value);			
		}
	}
}

# process DTD file

sub processDTD {
	local('@lines $handle $key $value $lineNo $text');
	@lines = getFile($1);
	foreach $lineNo => $text (@lines) {
		if ($text ismatch '<!ENTITY (.*?) "(.*)">') {
			($key, $value) = matched();
			printProperty($1, $lineNo, $value);
		}
	}
}

processProperties("src/atd.properties");
processDTD("src/overlay.dtd");
processDTD("src/prefs.dtd");


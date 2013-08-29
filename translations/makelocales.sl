#
# This script accepts several .po files and generates AtD/FF compatible files in the output  
# directory.
#
# You'll need the sleep.jar file from: http://sleep.dashnine.org to use this:
#
# java -jar sleep.jar makelocale.sl 
#

#
# formatters
#
sub print {
	println($1, $2);
}

sub translateProperty {
	println($1, "$2 $+ = $+ $3");
}

sub translateEntity {
	println($1, "<!ENTITY $2 \" $+ $3 $+ \">");
}

#
# parsers for the translation files
#
sub handleDTDFile {
	local('$handle $line $key $value @reproduce');
	$handle = openf($1);
	while $line (readln($handle)) {
		if ($line ismatch '\<\!ENTITY\s+(.*?)\s+"(.*?)"\>.*') {
			($key, $value) = map({ return [$1 trim]; }, matched());
			push(@reproduce, @(&translateEntity, $key, $value));
		}
		else {
			push(@reproduce, @(&print, $line));	
		}
	}
	closef($handle);
	return @reproduce;
}

sub handlePropertyFile {
	local('$handle $line $key $value @reproduce');
	$handle = openf($1);
	while $line (readln($handle)) {
		if ('*=*' iswm $line) {
			($key, $value) = map({ return [$1 trim]; }, split('=', $line));
			push(@reproduce, @(&translateProperty, $key, $value));
		}
		else {
			push(@reproduce, @(&print, $line));	
		}
	}
	closef($handle);
	return @reproduce;
}

# parse the po file
sub parsePO {
	local('$handle $text $key $value %results');
	$handle = openf($1);
	while $text (readln($handle)) {
		if ($text ismatch 'msgid "(.*?)"') {
			$key = matched()[0];
			$text = readln($handle);
			if ($text ismatch 'msgstr "(.*?)"') {
				$value = matched()[0];
				%results[$key] = $value;
			}
		}	
	}
	closef($handle);
	return %results;
}

sub name {
	local('$country $lang');

	if ($1 ismatch 'atd-atd-firefox-(\w+).po') {
		$lang    = matched()[0];
		$country = uc($lang);
	}
	else if ($1 ismatch 'atd-atd-firefox-(\w+)-(\w+).po') {
		($lang, $country) = matched();
		$country = uc($country);
	}
	return "$lang $+ - $+ $country";
}

sub main {
	local('%files');
	%files['atd.properties'] = handlePropertyFile("src/atd.properties");
	%files['overlay.dtd'] = handleDTDFile("src/overlay.dtd");
	%files['prefs.dtd'] = handleDTDFile("src/prefs.dtd");

	foreach $po (ls("po")) {
		local('$name %strings $file $tasks $task $handle $function $key $value');
		$name = name(getFileName($po));

		if ($name eq '-') { continue; }

		println("locale afterthedeadline $name chrome/locale/ $+ $name $+ /");

		%strings = parsePO($po);

		mkdir("out/ $+ $name");

		foreach $file => $tasks (%files) {
			$handle = openf(">out/ $+ $name $+ / $+ $file");
			foreach $task ($tasks) {
				($function, $key, $value) = $task;
				[$function: $handle, $key, iff(%strings[$value] eq "", $value, %strings[$value])];
			}
			closef($handle);
		}
	}
}

invoke(&main, @_);

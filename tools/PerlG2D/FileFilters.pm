use strict;
use warnings;
use utf8;

use StringFilters;

package FileFilters;

sub new($)
{
	my ($patterns) = @_;
	
	my $patternsDir = [];
	my $patternsFile = [];
	
	for(@$patterns)
	{
		my $pattern = $_;
		if($pattern =~ /\/$/)
		{
			push @$patternsDir, substr($pattern, 0, length($pattern)-1);
		}
		else
		{
			push @$patternsFile, $pattern;
		}
	}
	
	my $this = bless
	{
		filterDir 	=> StringFilters::new($patternsDir),
		filterFile	=> StringFilters::new($patternsFile),
		roorDir		=> "",
	};
	
	return $this;
}

sub D ($) { (local $_ = shift) =~ s/[\\\/]+/\//g; s/[\\\/]*$/\//; $_ }
sub F ($) { (local $_ = shift) =~ s/[\\\/]+/\//g; s/[\\\/]*$//; $_ }

sub dirname($)
{
    (my $name = shift) =~ s/[\\\/][^\\\/]*?$//;
    return D$name;
}

sub dir($)
{
    my $dirname = D(shift);
    opendir my $dir, $dirname or die "Can't Find dir $dirname: $!";
    my @files = grep !/^\./, readdir $dir;
    closedir $dir;
    return @files;
}

sub acceptFile($$)
{
	my ($this, $pathname) = @_;

	if(length($pathname) <= length($this->{rootDir}) || lc(substr($pathname, 0, length($this->{rootDir}))) ne lc($this->{rootDir}))
	{
		return 0;
	}
	
	$pathname = substr($pathname, length($this->{rootDir}));
	$pathname =~ s/\//\\/g;
	
	my $dir = "";
	if($pathname =~ /^(.*\\)[^\\]+$/)
	{
		$dir = $1;
	}
	if(!$this->{filterDir}->accept($dir))
	{
		return 0;
	}
	if(!$this->{filterFile}->accept($pathname))
	{
		return 0;
	}
	return 1;
}

sub listAll($$)
{
	my ($this, $rootDir) = @_;
	$this->{rootDir} = D($rootDir);
	my $ret = [];
	$this->listAllEx($ret, "");
	return $ret;
}

sub listAllEx($$$)
{
	my ($this, $ret, $subDir) = @_;
	$this->listAllChildren($ret, F($subDir));
}

sub listAllChildren($$$)
{
	my ($this, $ret, $subDir) = @_;
	my $fullDir = F("$this->{rootDir}$subDir");
	$subDir =~ s/^\///g;
	if(-f $fullDir)
	{
		if($this->acceptFile($fullDir))
		{
			push @$ret, $fullDir;
		}
	}
	elsif(-d $fullDir)
	{
		$fullDir = D($fullDir);
		opendir my $dir, $fullDir or die "Can't Find dir $fullDir: $!";
	    my @files = grep !/^\./, readdir $dir;
	    closedir $dir;
	    for(@files)
	    {
	    	my $file = F"$subDir/$_";
	    	$this->listAllEx($ret, $file);
	    }
	}
}

sub test()
{
	print "FileFilters::test\n";

	{
		my $filters = FileFilters::new(['+.png$', '.jpg$', '+\\\\res/', , '\\\\asset\\\\/', '-\\\\res\\\\temp/']);
		my $samples = 
		{
			"\\res\\1.jpg"				=> 1,
			"\\res\\1.gif"				=> 0,
			"\\res\\1.png"				=> 1,
			"\\asset\\1.jpg"			=> 0,
			"\\asset\\1.gif"			=> 0,
			"\\asset\\1.png"			=> 0,
			"\\res\\temp\\1.jpg"		=> 0,
			"\\res\\temp\\1.gif"		=> 0,
			"\\res\\temp\\1.png"		=> 0,
			"\\asset\\temp\\1.jpg"		=> 1,
			"\\asset\\temp\\1.gif"		=> 0,
			"\\asset\\temp\\1.png"		=> 1,
			"\\misc\\1.jpg"				=> 0,
			"\\misc\\1.gif"				=> 0,
			"\\misc\\1.png"				=> 0,
			
			"/res/1.jpg"				=> 1,
			"/res/1.gif"				=> 0,
			"/res/1.png"				=> 1,
			"/asset/1.jpg"				=> 0,
			"/asset/1.gif"				=> 0,
			"/asset/1.png"				=> 0,
			"/res/temp/1.jpg"			=> 0,
			"/res/temp/1.gif"			=> 0,
			"/res/temp/1.png"			=> 0,
			"/asset/temp/1.jpg"			=> 1,
			"/asset/temp/1.gif"			=> 0,
			"/asset/temp/1.png"			=> 1,
			"/misc/1.jpg"				=> 0,
			"/misc/1.gif"				=> 0,
			"/misc/1.png"				=> 0,
		};
		for(keys %$samples)
		{
			my $text = $_;
			my $ret = $samples->{$text};
			if($filters->acceptFile($text) != $ret)
			{
				die "impossible $text";
			}
		}
	}
	
	{
		my $filters = FileFilters::new(['+.xml$', '+atteff\\\\/']);
		my $ret = [];
		$filters->listAll($ret, "f:\\res_400\\res_400");
	}
}

1;

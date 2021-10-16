use strict;
use warnings;
use utf8;

use File::stat;

package FileMake;

sub new($)
{
	my ($arg) = @_;
	
	my $this = 
	bless
	{
		replaces	=> {},
	};
	
	my @rp = split("\\|", $arg, -1);
	for(@rp)
	{
		my $r = $_;
		my @kv = split("\\>", $r, -1);
		die "impossible $arg" if(scalar(@kv) != 2);
		my $key = $kv[0];
		my $value = $kv[1];
		my @exts = split(";", $value);
		$this->{replaces}->{$key} = \@exts;
	}
	
	return $this;
}

sub isNewer($$)
{
	my ($this, $pathname) = @_;
	if(scalar(keys %{$this->{replaces}}) != 0)
	{
		for(keys %{$this->{replaces}})
		{
			my $in = $_;
			my $exts = $this->{replaces}->{$in};
			for(@$exts)
			{
				my $out = $_;
				my $sub = substr($pathname, length($pathname) - length($in), length($in));
				if(length($pathname) > length($in) && substr($pathname, length($pathname) - length($in), length($in)) eq $in)
				{
					my $newName = substr($pathname, 0, length($pathname) - length($in)) . $out;
					if(!-f $newName || File::stat::stat($newName)->mtime < File::stat::stat($pathname)->mtime)
					{
						return 1;
					}
				}
			}
			return 0;
		}
	}
	return 1;
}

sub getNewest($$)
{
	my ($this, $pathnames) = @_;
	my $ret = [];
	for(@$pathnames)
	{
		my $pathname = $_;
		if($this->isNewer($pathname))
		{
			push @$ret, $pathname;
		}
	}
	return $ret;
}

sub test()
{
	print "FileFilters::test\n";
	
	{
		my $fileMake = FileMake::new(".test1>.test1.out|.test2>.test2.out");
		unlink("temp.test1");
		unlink("temp.test1.out");
		unlink("temp.test2");
		unlink("temp.test2.out");
		unlink("temp.test3");
		unlink("temp.test3.out");
		
		open(FILE, ">temp.test1") and close(FILE);
		open(FILE, ">temp.test2") and close(FILE);
		open(FILE, ">temp.test3") and close(FILE);
		die "impossible" if($fileMake->isNewer("temp.test1") == 0);
		die "impossible" if($fileMake->isNewer("temp.test2") == 0);
		die "impossible" if($fileMake->isNewer("temp.test3") == 0);
		
		sleep(2);
		open(FILE, ">temp.test1.out") and close(FILE);
		open(FILE, ">temp.test2.out") and close(FILE);
		open(FILE, ">temp.test3.out") and close(FILE);
		die "impossible" if($fileMake->isNewer("temp.test1") == 1);
		die "impossible" if($fileMake->isNewer("temp.test2") == 1);
		die "impossible" if($fileMake->isNewer("temp.test3") == 0);

		sleep(2);
		open(FILE, ">temp.test1") and close(FILE);
		open(FILE, ">temp.test2") and close(FILE);
		open(FILE, ">temp.test3") and close(FILE);
		die "impossible" if($fileMake->isNewer("temp.test1") == 0);
		die "impossible" if($fileMake->isNewer("temp.test2") == 0);
		die "impossible" if($fileMake->isNewer("temp.test3") == 0);

		unlink("temp.test1");
		unlink("temp.test1.out");
		unlink("temp.test2");
		unlink("temp.test2.out");
		unlink("temp.test3");
		unlink("temp.test3.out");
	}
}

1;

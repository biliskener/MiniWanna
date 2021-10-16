use strict;
use warnings;
use utf8;

package StringFilters;

sub new($)
{
	my ($patterns) = @_;
	
	my $this = 
	{
		patternsAdd => [],
		patternsDec => [],
	};
	
	for(@$patterns)
	{
		my $pattern = $_;
		if($pattern =~ /^\-/)
		{
			push @{$this->{patternsDec}}, substr($pattern, 1);
		}
		elsif($pattern =~ /^\+/)
		{
			push @{$this->{patternsAdd}}, substr($pattern, 1);
		}
		else
		{
			push @{$this->{patternsAdd}}, $pattern;
		}
	}
	
	return bless $this;
}

sub accept($$)
{
	my ($this, $text) = @_;
	
	for(@{$this->{patternsDec}})
	{
		my $pattern = $_;
		if($text =~ /$pattern/)
		{
			return 0;
		}
	}
	
	if(scalar(@{$this->{patternsAdd}}))
	{
		for(@{$this->{patternsAdd}})
		{
			my $pattern = $_;
			if($text =~ /$pattern/)
			{
				return 1;
			}
		}
		return 0;
	}
	
	return 1;
}

sub test()
{
	print "StringFilters::test\n";
	
	{
		my $filters = StringFilters::new(['-^[a-zA-Z_][a-zA-Z_]+$']);
		my $samples = 
		{
			"()"		=> 1,
			"a1008"		=> 1,
			"azz"		=> 0,
			"1003"		=> 1
		};
		for(keys %$samples)
		{
			my $text = $_;
			my $ret = $samples->{$text};
			if($filters->accept($text) != $ret)
			{
				die "impossible $text";
			}
		}
	}
	
	{
		my $filters = StringFilters::new(['+^[a-zA-Z_][a-zA-Z_0-9]+$', '-^[a-zA-Z_][a-zA-Z_]+$', '^\\d+$']);
		my $samples = 
		{
			"()"		=> 0,
			"a1008"		=> 1,
			"azz"		=> 0,
			"1003"		=> 1
		};
		for(keys %$samples)
		{
			my $text = $_;
			my $ret = $samples->{$text};
			if($filters->accept($text) != $ret)
			{
				die "impossible $text";
			}
		}
	}
}

1;

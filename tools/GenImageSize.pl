use strict;
use warnings;
use utf8;

use XML::LibXML;
use File::Path;
use File::Spec;
use File::Copy;
use Image::Size;
use Crypt::Blowfish;
use JSON;

use Archive::Zip;
use Archive::Zip qw( :ERROR_CODES :CONSTANTS );

use Data::Dumper;
$Data::Dumper::Terse = 1;
$Data::Dumper::Indent = 1;
$Data::Dumper::Quotekeys = 0;

use FindBin;
BEGIN
{
	chdir($FindBin::Bin);
}

BEGIN
{
	push(@INC, "PerlG2D");
}

use SUtils;

sub main() {
	my $workingDir = $FindBin::Bin;
	my $inputDir = SUtils::AD "../assets/resources";
	my $outputDir = SUtils::AD "../assets/src/db";

	print "=== searching $inputDir\n";

	my $fileList = SUtils::listAllFiles($inputDir, { matches => ['\.jpe?g$', '\.png$'] });

	my $imgSizeResults = {};
	my $imgPathResults = {};

	print "=== parsing all files\n";
	for(sort { $a cmp $b } @$fileList) {
		my $inputFile = $_;

		#print "   parsing ", $inputFile, "\n";
		my $resName = SUtils::F substr($inputFile, length($inputDir));

		my $baseName = $resName;
		#$baseName =~ s/.*[\\\/]//g;

		my $spriteFrameName = $baseName;
		$spriteFrameName =~ s/\.(jpe?g|png)$//;

		my $metaJson = SUtils::decodeJson(SUtils::loadFile($inputFile . ".meta"));
		#die "subMeta $spriteFrameName not found" unless $subMetaJson;
		for my $subMetaJson (values %{$metaJson->{subMetas}}) {
			if($subMetaJson->{name} eq "spriteFrame") {
				my $width = $subMetaJson->{userData}->{width};
				my $height = $subMetaJson->{userData}->{height};
				my $rawWidth = $subMetaJson->{userData}->{rawWidth};
				my $rawHeight = $subMetaJson->{userData}->{rawHeight};
				
				#my ($width, $height) = imgsize($inputFile);
				#die "Cannot retrive imagesize from $inputFile" if(!$width || !$height);

				$imgSizeResults->{$resName} = [$width + 0, $height + 0, $rawWidth + 0, $rawHeight + 0];
				if($imgPathResults->{$spriteFrameName}) {
					if($imgPathResults->{$spriteFrameName} =~ /^review_vn\//) {
						$imgPathResults->{$spriteFrameName} = $resName;
					}
					elsif($resName =~ /^review_vn\//) {
					}
					else {
						print "    warning: image $resName spriteFrameName exists: $imgPathResults->{$spriteFrameName}\n";
					}
				}
				else {
					$imgPathResults->{$spriteFrameName} = $resName;
				}
			}
		}
	}

	{
		my $outputFile = $outputDir . "AllImageSize.ts";
		my $content = SUtils::encodeJson($imgSizeResults, 1);
		print "saving file $outputFile\n";
		$content = "export const AllImageSize = $content";
		$content =~ s/\s*$/;/;
		SUtils::saveFile($outputFile, $content);
	}

	{
		my $outputFile = $outputDir . "AllSpriteFrames.ts";
		my $content = SUtils::encodeJson($imgPathResults, 1);
		print "saving file $outputFile\n";
		$content = "export const AllSpriteFrames = $content";
		$content =~ s/\s*$/;/;
		SUtils::saveFile($outputFile, $content);
	}
}

main();

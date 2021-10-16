use strict;
use warnings;
use utf8;

use Encode;

use XML::LibXML;
use File::Path;
use File::Spec;
use File::Copy;
use Image::Size;
use Crypt::Blowfish;
use JSON::PP;
use JSON;
use Digest::MD5 qw(md5 md5_hex);

package SUtils;

use Archive::Zip;
use Archive::Zip qw( :ERROR_CODES :CONSTANTS );
use File::stat;
use Parse::CSV;

# 是否为Win系统
sub isWinOS() {
	return $^O eq "MSWin32";
}

# 转换为标准路径
sub P($) {
	(local $_ = shift) =~ s/[\\\/]+/\//g;
	$_
}

# 转换为目录名称
sub D ($)
{
	(local $_ = shift) =~ s/[\\\/]+/\//g;
	s/[\\\/]*$/\//;
	$_
}

# 转换为文件名称
sub F ($)
{
	(local $_ = shift) =~ s/[\\\/]+/\//g;
	s/[\\\/]*$//;
	$_
}

# 转换为本地操作系统路径名称(不进行转码)
sub OP ($)
{
	my $path = shift;
	if($^O eq 'MSWin32') {
		$path =~ s/\//\\/g;
	}
	else {
		$path =~ s/\//\//g;
	}
	return $path;
}

# 编码成操作系统路径名
sub EOP ($) {
	my ($path) = @_;
	if($^O eq 'MSWin32') {
		$path =~ s/\//\\/g;
		$path = Encode::encode("gbk", $path);
	}
	else {
		$path =~ s/\//\//g;
		$path = Encode::encode("utf8", $path);
	}
	return $path;
}

# 从操作系统路径名解码
sub DOP ($) {
	my ($path) = @_;
	if($^O eq 'MSWin32') {
		$path = Encode::decode("gbk", $path);
	}
	else {
		$path = Encode::decode("utf8", $path);
	}
	$path =~ s/\//\//g;
	return $path;
}

# 转换为绝对路径
sub AP($;$) {
	my ($inputDir, $workingDir) = @_;
	$workingDir = $FindBin::Bin unless $workingDir;
	if(!File::Spec->file_name_is_absolute($inputDir)) {
		$inputDir = File::Spec->rel2abs($inputDir, $workingDir);
	}
	$inputDir = SUtils::P($inputDir);
	return $inputDir;
}

# 转换为相对路径
sub RP($;$) {
	my ($inputDir, $workingDir) = @_;
	$workingDir = $FindBin::Bin unless $workingDir;
	if(File::Spec->file_name_is_absolute($inputDir)) {
		$inputDir = File::Spec->abs2rel($inputDir, $workingDir);
	}
	$inputDir = SUtils::P($inputDir);
	return $inputDir;
}

# 转换为绝对目录
sub AD($;$) {
	my ($inputDir, $workingDir) = @_;
	return SUtils::D(SUtils::AP($inputDir, $workingDir));
}

# 转换为相对目录
sub RD($;$) {
	my ($inputDir, $workingDir) = @_;
	return SUtils::D(SUtils::RP($inputDir, $workingDir));
}

# 转换为绝对文件
sub AF($;$) {
	my ($inputDir, $workingDir) = @_;
	return SUtils::F(SUtils::AP($inputDir, $workingDir));
}

# 转换为相对文件
sub RF($;$) {
	my ($inputDir, $workingDir) = @_;
	return SUtils::F(SUtils::RP($inputDir, $workingDir));
}

sub splitDir($)
{
	my ($dir) = @_;
	my @dirList = split /[\\\/]+/, $dir, -1;
	pop(@dirList);
	return @dirList;
}

sub makeDirAll($)
{
	my ($dir) = @_;

	my @dirList = splitDir($dir);

	my $d = "";
	for(@dirList)
	{
		$d .= $_ . "/";
		File::Path::mkpath(EOP($d));
	}
}

sub listAllFiles($;$) {
	my ($folder, $options) = @_;

	$folder = D($folder);

	my $checkValid = sub($$) {
		my ($name, $options) = @_;
		if(!$options) {
			return 1;
		}

		# 存在忽略条件时
		if($options->{ignores}) {
			my $ignores = ref($options->{ignores}) eq "ARRAY" ? $options->{ignores} : [$options->{ignores}];
			for my $ignore (@$ignores) {
				if($name =~ /$ignore/) {
					return 0;
				}
			}
		}

		# 存在匹配条件时需要检查
		if($options->{matches}) {
			my $matches = ref($options->{matches}) eq "ARRAY" ? $options->{matches} : [$options->{matches}];
			for my $match (@$matches) {
				if($name =~ /$match/) {
					return 1; # 与一个匹配达成时
				}
			}
			return 0; # 与任何匹配都未达成时
		}

		return 1;
	};

	my $listAllFilesEx;

	$listAllFilesEx = sub($$$) {
		my ($folder, $root, $options) = @_;

		if(opendir my $dir, EOP($folder)) {
			my @items = grep !/^\./, readdir $dir;
			closedir $dir;

			@items = map { $folder . DOP($_) } @items;

			my @files = ();
			my @folders = ();
			for my $item (@items) {
				my $name = substr($item, length($root));
				if(-f(EOP($item))) {
					if($checkValid->($name, $options)) {
						push @files, $item;
					}
				}
				elsif(-d(EOP($item))) {
					push @folders, $item;
				}
				else {
					die "impossible $item";
				}
			}

			if(!$options->{nodeep}) {
				for my $childFolder (@folders) {
					my $folderFullPath = $childFolder . "/";
					my $childFiles = $listAllFilesEx->($folderFullPath, $root, $options);
					push @files, @$childFiles;
				}
			}

			return \@files;
		}

		return [];
	};

	return $listAllFilesEx->($folder, $folder, $options);
}

sub deleteFile($) {
	my ($src) = @_;
	unlink(EOP($src));
	return !-f(EOP($src));
}

sub copyFile($$)
{
	my ($src, $dst) = @_;
	File::Copy::copy(EOP($src), EOP($dst));
}

sub loadFile($)
{
	my ($path) = @_;
	my $size = -s EOP($path);
	my $content;
	open my $fh, "<", EOP($path) or die "$path: $!";
	binmode $fh;
	sysread $fh, $content, $size;
	close $fh;
	return $content;
}

sub saveFile($$)
{
	my ($path, $content) = @_;
	open my $fh, ">", EOP($path) or die "$path: $!";
	binmode $fh;
	syswrite $fh, $content;
	close $fh;
}

sub getFileMD5($)
{
	my ($pathname) = @_;
	open my $file, '<', EOP($pathname) or die "getFileMD5($pathname) failed: $!";
	binmode $file;
	my $md5 = Digest::MD5->new->addfile($file)->hexdigest;
	close $file;
	return $md5;
}

sub getMD5($)
{
	my ($data) = @_;
	return Digest::MD5->new->add($data)->hexdigest;
}

sub encodeJson {
    my ($data, $pretty) = @_;
    #return Encode::decode("utf8", JSON::encode_json($data));
    my $json = new JSON::PP;

    if ($pretty) {
        $json->pretty($pretty);
    }

    $json->sort_by(sub {
        if ($JSON::PP::a =~ /^([0-9]+)$/ && $JSON::PP::b =~ /^([0-9]+)$/) {
            return $JSON::PP::a <=> $JSON::PP::b;
        }

        if ($JSON::PP::a =~ /^([0-9]+)$/) {
            return -1;
        }

        if ($JSON::PP::b =~ /^([0-9]+)$/) {
            return 1;
        }

        return $JSON::PP::a cmp $JSON::PP::b;
    });

    return $json->utf8->encode($data);
}

sub decodeJson($) {
    my ($content) = @_;
    return JSON::decode_json($content);
}

sub loadCSV($)
{
	my ($file) = @_;
	my $parser = Parse::CSV->new(
		file 	=> $file,
		names	=> 1,
	);

	my $ret = [];
	while(my $item = $parser->fetch()) {
		push @$ret, $item;
	}
	return $ret;
}

sub getSVNRevision {
	my ($dir) = @_;
	$dir = "$FindBin::Bin/" unless $dir;
	$dir = D($dir);

	my @lines = `svn info $dir`;
	if(!@lines) {
		@lines = `\"C:\\Program Files\\TortoiseSVN\\bin\\svn.exe\" info $dir`;
	}

	die "fatal error " . scalar(@lines) if(@lines != 13);

	my $rev = undef;
	if($lines[10] =~ /:\s+(\d+)$/) {
		$rev = $1 + 0;
	}

	die "impossible" unless $rev;

	return $rev;
}

sub replaceStr($$$) {
	my ($str, $r1, $r2) = @_;
	$str =~ s/$r1/$r2/g;
	return $str;
}

# 帕斯卡命名法[PascalCase]
sub toSnakeCase($) {
	my ($str) = @_;
	$str =~ s/([A-Z]+\d+)$/'_' . lc($1)/ge;
	$str =~ s/(\d*[A-Z]+)(\d+)/lc($1) . '_' . lc($2)/ge;
	$str =~ s/_*(\d+)/_$1/g;
	$str =~ s/(\d*[A-Z]+)([A-Z])/'_' . lc($1) . '_' . lc($2)/ge;
	$str =~ s/(\d*[A-Z])/'_' . lc($1)/ge;
	$str =~ s/_+/_/g;
	$str =~ s/_+(\d+)$/$1/g;
	$str =~ s/^_+//g;
	$str = '_' . $str if($str =~ /^\d/);
	return $str;
}

# 测试代码
#print toSnakeCase("__XYZ10DEF11Liujun12My34ABCFirstJOB100") . "\n";
#exit(0);

sub toPascalCase($) {
	my ($str) = @_;
	return join('', map { ucfirst($_) } split(/_/, $str));
}

sub getSVNInfo($) {
	my ($dir) = @_;
	$dir = "$FindBin::Bin/" unless $dir;
	$dir = D($dir);

	my @lines = `svn info $dir`;
	if(!@lines) {
		@lines = `\"C:\\Program Files\\TortoiseSVN\\bin\\svn.exe\" info $dir`;
	}

	my $url = undef;
	my $rev = undef;
	my $date = undef;

	for(@lines)
	{
		if(/^(Last Changed Rev:)\s*([\d]+)$/i)
		{
			$rev = $2;
		}
		elsif(/^(URL: )\s*(svn:.*)$/i)
		{
			$url = $2;
		}
		elsif(/^(Last Changed Date:)\s*(\d+\-\d+\-\d+\s+\d+:\d+:\d+)/i)
		{
			$date = $2;
		}
	}

	die "impossible" if(!$url || !$rev || !$date);
	return {
		url			=> $url,
		revision	=> $rev,
		date		=> $date,
	};
}

1;

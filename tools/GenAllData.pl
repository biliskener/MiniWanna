use strict;
use warnings;
use utf8;
use 5.010;

use XML::LibXML;
use File::Path;
use File::Spec;
use File::Copy;
use Image::Size;
use Crypt::Blowfish;
use JSON;
use POSIX;
use FindBin;

use Parse::CSV;
use Archive::Zip;
use Archive::Zip qw( :ERROR_CODES :CONSTANTS );
use Spreadsheet::ParseXLSX;

use Data::Dumper;
$Data::Dumper::Terse = 1;
$Data::Dumper::Indent = 1;
$Data::Dumper::Quotekeys = 0;

use Encode;
if($^O eq 'MSWin32')
{
	binmode(STDOUT, ":encoding(gbk)");
	binmode(STDERR, ":encoding(gbk)");
}

BEGIN
{
	chdir($FindBin::Bin);
}

BEGIN
{
	push(@INC, "PerlG2D");
}

use FileFilters;
use SUtils;


sub convChr($) {
	my ($c) = @_;
	if(ord($c) >= ord 'a' && ord($c) <= ord 'z') {
		return uc(chr(ord('z') - (ord($c) - ord('a'))));
	}
	elsif(ord($c) >= ord 'A' && ord($c) <= ord 'Z') {
		return lc(chr(ord('Z') - (ord($c) - ord('A'))));
	}
	else {
		return $c;
	}
}

my $genLocalRef    = 0;  # 生成表内引用
my $refNeedLength  = 8;  # 创建引用时需要的字符串长度
my $globalInfoNewStyle = 0; # 全局表使用新方式

my $localRefTableByKey = {}; # 外部引用数据存放点
my $localRefTableById =  {}; # 外部引用数据存放点
my $localRefAutoId = 1; # 引部引用自增ID
my $localRefAllObjects = [];

my $clientPartCount = 8;
my $allClientPartJson = [];
push @$allClientPartJson, { length => 0, items => {} } for(1 .. $clientPartCount);
my $allServerJson = {};
my $allClientJson = {};
my $allColInfosForClient = {};
my $allColInfosForServer = {};

my $isServerMode = 0;  # 当前是否服务器模式
my $tempDisableLocalRef = 0; # 临时关闭局部引用

my $workingDir = $FindBin::Bin;
my $inputDir = SUtils::AD "../data/xls";
my $clientOutputDir = SUtils::AD "../assets/resources/data";
my $clientJsonOutputDir = SUtils::AD "../data/json";
my $clientCodeOutputDir = SUtils::AD "../assets/src/lib";;
my $serverJsonOutputDir = [SUtils::AD("../PokemonServer/NOXGameServer/json"), SUtils::AD("../PokemonServer/NOXBattleServer/json")]; # 暂定此目录
my $serverCodeOutputDir = SUtils::AD "../PokemonServer/NOXGameServer/src";
my $serverCodeNamespace = "com.leocool.sgland.info";
$serverCodeOutputDir = $serverCodeOutputDir . SUtils::replaceStr($serverCodeNamespace, '\.', '/') . '/';

my $svnRevision = 0; #SUtils::getSVNRevision($inputDir);

sub resetLocalRefTable() {
	$localRefTableByKey = {};
	$localRefTableById = {};
	$localRefAutoId = 1;
	$localRefAllObjects = [];
}

sub getLocalRefItem($$) {
	my ($type, $content) = @_;
	my $refKey = "$type $content";
	my $refItem = $localRefTableByKey->{$refKey};
	return $refItem;
}

sub addLocalRefItem($$$) {
	my ($type, $content, $data) = @_;
	my $refKey = "$type $content";
	my $refId = $localRefAutoId++;
	$refId = '$lr' . $refId;
	my $refItem = {
		refId    => $refId,
		refKey   => $refKey,
		refCount => 1,
		type     => $type,
		content  => $content,
		data     => $data,
		allUsed  => [],
	};
	$localRefTableByKey->{$refKey} = $refItem;
	$localRefTableById->{$refId} = $refItem;
	return $refItem;
}

sub wrapRefFunc($$$) {
	my ($type, $content, $func) = @_;
	if($genLocalRef && !$tempDisableLocalRef && !$isServerMode && $content ne '' && ($content =~ /[\|\#\_]/)) {
		my $refItem = getLocalRefItem($type, $content);
		if($refItem) {
			$refItem->{refCount}++;
			return $refItem->{refId};
		}
		else {
			my $data = $func->($content);
			push @$localRefAllObjects, $data;
			my $refItem = addLocalRefItem($type, $content, $data);
			return $refItem->{refId};
		}
	}
	else {
		return $func->($content);
	}
}

sub convertCellArray1Data($) {
	my ($cellData) = @_;
	if($cellData =~ /^\[/) {
		$cellData =~ s/^\[//g;
		$cellData =~ s/\]$//g;
		$cellData =~ s/\|/_/g;
		die "impossible $cellData" if $cellData =~ /[\[\]]/;
	}
	return $cellData;
}

sub convertCellArray2Data($) {
	my ($cellData) = @_;
	if($cellData =~ /^\[/) {
		die "impossible $cellData" if $cellData =~ /[#_]/;
		$cellData =~ s/\]\|\[/#/g;
		$cellData =~ s/^\[\[//g;
		$cellData =~ s/\]\]$//g;
		$cellData =~ s/\|/_/g;
		$cellData =~ s/\#/|/g;
		die "impossible $cellData" if $cellData =~ /[\[\]]/;
	}
	return $cellData;
}

sub checkStr($) {
	my ($itemData) = @_;
}

sub splitToStrArray1($) {
	my ($itemData) = @_;
	my $type = "sarray1";
	my @itemData = split(/\_/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i)
	{
		my $data = $itemData[$i];
		$itemData[$i] = $data . "";
		$itemData[$i] =~ s/\\n/\n/g;
		$itemData[$i] =~ s/\\r//g;
		$itemData[$i] =~ s/\\\'/\'/g;
		die "impossible $itemData[$i]" if($itemData[$i] =~ /\\/);
	}
	return \@itemData;
}

sub splitToStrArray1Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("strarray1", $content, \&splitToStrArray1);
}

sub splitToStrArray2($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i)
	{
		my $data = $itemData[$i];
		$itemData[$i] = splitToStrArray1Wrapped($data);
	}
	return \@itemData;
}

sub splitToStrArray2Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("strarray2", $content, \&splitToStrArray2);
}

sub splitToStrArray3($) {
	my ($itemData) = @_;
	my @itemData = split(/\#/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToStrArray2Wrapped($data);
	}
	return \@itemData;
}

sub splitToStrArray3Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("strarray3", $content, \&splitToStrArray3);
}

sub splitToNumArray1($) {
	my ($itemData) = @_;
	my @itemData = split(/\_/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		die "Invalid itemData $itemData" if($data !~ /^\-?\d+$/);
		$itemData[$i] = $data + 0;
	}
	return \@itemData;
}

sub splitToNumArray1Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("array1", $content, \&splitToNumArray1);
}

sub splitToNumArray2($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToNumArray1Wrapped($data);
	}
	return \@itemData;
}

sub splitToNumArray2Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("array2", $content, \&splitToNumArray2);
}

sub splitToNumArray3($) {
	my ($itemData) = @_;
	my @itemData = split(/\#/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToNumArray2Wrapped($data);
	}
	return \@itemData;
}

sub splitToNumArray3Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("array3", $content, \&splitToNumArray3);
}

sub splitToFloatArray1($) {
	my ($itemData) = @_;
	my @itemData = split(/\_/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		die "Invalid itemData $itemData" if($data !~ /^\-?[\d\.]+$/);
		$itemData[$i] = $data + 0;
	}
	return \@itemData;
}

sub splitToFloatArray1Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("floatarray1", $content, \&splitToFloatArray1);
}

sub splitToFloatArray2($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToFloatArray1Wrapped($data);
	}
	return \@itemData;
}

sub splitToFloatArray2Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("floatarray2", $content, \&splitToFloatArray2);
}

sub splitToFloatArray3($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToFloatArray2Wrapped($data);
	}
	return \@itemData;
}

sub splitToFloatArray3Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("floatarray3", $content, \&splitToFloatArray3);
}

sub splitToBoolArray1($) {
	my ($itemData) = @_;
	my @itemData = split(/\_/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		die "Invalid itemData $itemData" if($data !~ /^(0|1)$/);
		$itemData[$i] = $data + 0;
	}
	return \@itemData;
}

sub splitToBoolArray1Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("boolarray1", $content, \&splitToBoolArray1);
}

sub splitToBoolArray2($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToBoolArray1Wrapped($data);
	}
	return \@itemData;
}

sub splitToBoolArray2Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("boolarray2", $content, \&splitToBoolArray2);
}

sub splitToBoolArray3($) {
	my ($itemData) = @_;
	my @itemData = split(/\|/, $itemData);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];
		$itemData[$i] = splitToBoolArray2Wrapped($data);
	}
	return \@itemData;
}

sub splitToBoolArray3Wrapped($) {
	my ($content) = @_;
	return wrapRefFunc("boolarray3", $content, \&splitToBoolArray3);
}

sub splitToNumMap($) {
	my ($content) = @_;

	my $ret = {};

	my @itemData = split(/\|/, $content);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];

		my $index = index($data, "_");
		die "impossible $data" if($index <= 0);

		my $key = substr($data, 0, $index);
		my $value = substr($data, $index + 1);
		die "Invalid itemData $key : $value" if($value !~ /^\-?\d+$/);
		$ret->{$key} = $value + 0;
	}

	return $ret;
}

sub splitToNumMapWrapped($) {
	my ($content) = @_;
	return wrapRefFunc("map", $content, \&splitToNumMap);
}

sub splitToNumArray1Map($) {
	my ($content) = @_;

	my $ret = {};

	my @itemData = split(/\|/, $content);
	for(my $i = 0; $i < scalar(@itemData); ++$i) {
		my $data = $itemData[$i];

		my $index = index($data, "_");
		die "impossible $data" if($index <= 0);

		my $key = substr($data, 0, $index);
		my $child = substr($data, $index + 1);
		my $value = splitToNumArray1($child);
		$ret->{$key} = $value;
	}

	return $ret;
}

sub splitToNumArray1MapWrapped($) {
	my ($content) = @_;
	return wrapRefFunc("array1map", $content, \&splitToNumArray1Map);
}

sub getJsonKeyForCol($$) {
	my ($cellKey, $isServer) = @_;
	return $isServer || $cellKey =~ /^_/ ? $cellKey : '_' . $cellKey;
}

sub genTableData($$$$$$$) {
	my ($inputFile, $tableKey, $tableData, $maxRow, $maxCol, $colInfosByName, $colInfosByIndex) = @_;

	# 生成数据
	my $tableJson = {};
	for(my $rowIndex = 4; $rowIndex < $maxRow; ++$rowIndex) {
		next if($tableData->[$rowIndex]->[0] =~ /^\s*$/);

		my $itemJson = {};
		my $primaryKey = undef;
		for(my $colIndex = 0; $colIndex < $maxCol; ++$colIndex) {
			my $colInfo = $colInfosByIndex->{$colIndex};

			next if(!$colInfo);

			my $cellData = $tableData->[$rowIndex]->[$colIndex];
			my $cellType = $colInfo->{type};
			my $cellKey = $colInfo->{name};

			if($colInfo->{isPrimaryColumn}) {
				$primaryKey = $cellData;
				die "Invalid primary key $cellData" if($cellData !~ /^\-?\d+$/);
			}

			if($cellType eq 'int') {
				$cellData = 0 if($cellData eq '');
				if($cellData !~ /^\-?\d+$/) {
					# 非数值项存在的情况
					print "    warn: found string item in $cellType: $cellData\n";
				}
				else {
					# 转数值
					$cellData = $cellData + 0;
				}
			}
			elsif($cellType eq 'int64') {
				die "impossible [$cellData]" if($cellData !~ /^\-?\d+$/);
				$cellData = $cellData + 0;
			}
			elsif($cellType eq 'float64') {
				die "impossible [$cellData]" if($cellData !~ /^\-?[\d\.]+(E-\d+)?$/);
				$cellData = $cellData + 0;
			}
			elsif($cellType eq 'boolean' || $cellType eq 'bool') {
				die "impossible [$cellData]" if($cellData !~ /^(0|1)$/);
				$cellData = $cellData + 0;
			}
			elsif($cellType eq 'json') {
				#print "invalid json data: $cellData\n" if ($cellData =~ /^\{\\/);
				$cellData =~ s/^\{\\/{\"/;
				#print "invalid json data: $cellData\n" if ($cellData =~ /\"$/);
				$cellData =~ s/\"$//g;
				$cellData =~ s/\\\"/\"/g;
				$cellData = SUtils::decodeJson($cellData);				
			}
			elsif($cellType eq 'string' || $cellType eq 'time' || $cellType eq 'time_range') {
				$cellData = $cellData . "";
				$cellData =~ s/\t/\t/g;
				$cellData =~ s/\r*\n/\n/g;
				$cellData =~ s/(\\r)*\\n/\n/g;
			}
			elsif($cellType eq 'sarray1') {
				$cellData = splitToStrArray1Wrapped($cellData);
			}
			elsif($cellType eq 'sarray2') {
				$cellData = splitToStrArray2Wrapped($cellData);
			}
			elsif($cellType eq 'sarray3') {
				$cellData = splitToStrArray3Wrapped($cellData);
			}
			elsif($cellType eq 'farray1') {
				$cellData = splitToFloatArray1Wrapped($cellData);
			}
			elsif($cellType eq 'farray2') {
				$cellData = splitToFloatArray2Wrapped($cellData);
			}
			elsif($cellType eq 'farray3') {
				$cellData = splitToFloatArray3Wrapped($cellData);
			}
			elsif($cellType eq 'array1' || $cellType eq 'i64array1') {
				$cellData = convertCellArray1Data($cellData);
				$cellData = splitToNumArray1Wrapped($cellData);
			}
			elsif($cellType eq 'array2' || $cellType eq 'i64array2') {
				$cellData = convertCellArray2Data($cellData);
				$cellData = splitToNumArray2Wrapped($cellData);
			}
			elsif($cellType eq 'array3' || $cellType eq 'i64array3') {
				$cellData = splitToNumArray3Wrapped($cellData);
			}
			elsif($cellType eq 'barray1') {
				$cellData = splitToBoolArray1Wrapped($cellData);
			}
			elsif($cellType eq 'barray2') {
				$cellData = splitToBoolArray2Wrapped($cellData);
			}
			elsif($cellType eq 'barray3') {
				$cellData = splitToBoolArray3Wrapped($cellData);
			}
			elsif($cellType eq 'map') {
				# 有出现过&字符的情况，需要注意
				die "cellKey: $cellKey primaryKey: $primaryKey cellType: $cellType inputFile: $inputFile" if($cellData =~ /\&/);
				$cellData = splitToNumMapWrapped($cellData);
			}
			elsif($cellType eq 'array1map') {
				$cellData = splitToNumArray1MapWrapped($cellData);
			}
			else {
				die "Unexpected itemType $cellType cellData: $cellData";
			}

			if(defined($cellData)) {
				$itemJson->{$cellKey} = $cellData;
			}
		}

		if($tableKey eq 'global') {
			$itemJson->{svnRevision} = $svnRevision;
			$tableJson = $itemJson;
		}
		elsif($tableKey ne 'LanguageByCH') {
			die "    No primary key" if($primaryKey eq '');
			$tableJson->{$primaryKey} = $itemJson;
		}
		else {
			die "    No primary key" if($primaryKey eq '');
			$tableJson->{$primaryKey} = $itemJson->{CH};
		}
	}

	# 生成引用
	if($genLocalRef && !$isServerMode && $tableKey ne 'global') {
		my $refs = {};
		for(keys %$localRefTableById) {
			my $refId = $_;
			my $refItem = $localRefTableById->{$refId};
			$refs->{$refId} = $refItem->{data};
		}
		$tableJson->{'$refs'} = $refs;
		print "    refsItemCount: " . scalar(keys(%$refs)) . "\n";
		if(scalar(keys %$refs) == 0) {
			delete $tableJson->{'$refs'};
		}

		my $checker;
		$checker = sub {
			my ($object) = @_;
			if(ref($object) eq 'ARRAY') {
				for(@$object) {
					my $item = $_;
					$checker->($item);
				}
			}
			elsif(ref($object) eq 'HASH') {
				for(values %$object) {
					my $item = $_;
					$checker->($item);
				}
			}
			elsif($object =~ /^\$lr\d+$/) {
				my $refId = $object;
				die "ref object not found: $refId" if(!$localRefTableById->{$refId});
			}
		};
		$checker->($tableJson);
	}

	if($isServerMode) {
		$allServerJson->{$tableKey} = $tableJson;
	}
	else {
		$allClientJson->{$tableKey} = $tableJson;

		# 添加到part中
		my @sortedAllPartJson = sort { $a->{length} <=> $b->{length} } @$allClientPartJson;
		my $currentPartJson = $sortedAllPartJson[0];
		$currentPartJson->{items}->{$tableKey} = $tableJson;
		$currentPartJson->{length} += length(SUtils::encodeJson($tableJson));
		if(!$currentPartJson->{items}->{_ConfigList}) {
			$currentPartJson->{items}->{_ConfigList} = [];
		}
		push @{$currentPartJson->{items}->{_ConfigList}}, $tableKey;
	}

	resetLocalRefTable();
}

# 专门为服务器特殊处理
sub processGlobalInfoData($$) {
	my ($allColInfos, $allJson) = @_;
	my $tableKey = 'global';
	my $data = $allJson->{$tableKey} or die "impossible $tableKey";

	my $newColInfos = {
		name	=> {
			colIndex		=> 0,
			isPrimaryColumn	=> 1,
			desc			=> "属性名称",
			name			=> "name",
			type			=> "string",
			genColForServer	=> 1,
			genColForClient	=> 1,
		},
		values	=> {
			colIndex		=> 1,
			isPrimaryColumn	=> 0,
			desc			=> "属性值",
			name			=> "values",
			type			=> "array1",
			genColForServer	=> 1,
			genColForClient	=> 1,
		},
	};
	$allColInfos->{$tableKey} = $newColInfos;
	my $colInfos = $allColInfos->{$tableKey} or die "impossible $tableKey";

	# 把所有数据转换成数组, 因为服务器都是数组方式
	for my $key (keys %$data) {
		my $val = $data->{$key};
		$val = [$val] if(ref($val) eq '');
		$data->{$key} = { name => $key, values => $val };
	}
}

sub addUnderlinePrefixForClientData() {
	for my $tableKey (sort { $a cmp $b } keys %$allColInfosForClient) {
		my $colInfos = $allColInfosForClient->{$tableKey};
		my $tableData = $allClientJson->{$tableKey};

		# 转换数据
		if($tableKey eq 'global') {
			my $rowData = $tableData;
			for my $colKey (keys %$colInfos) {
				my $colVal = $rowData->{$colKey};
				my $newName = getJsonKeyForCol($colKey, 0);
				delete $rowData->{$colKey};
				$rowData->{$newName} = $colVal;
			}
		}
		else {
			for my $rowKey (grep { $_ ne '$refs' } keys %$tableData) {
				my $rowData = $tableData->{$rowKey};
				for my $colKey (keys %$colInfos) {
					my $colVal = $rowData->{$colKey};
					my $newName = getJsonKeyForCol($colKey, 0);
					delete $rowData->{$colKey};
					$rowData->{$newName} = $colVal;
				}
			}
		}

		# 转换列信息
		for my $colKey (keys %$colInfos) {
			my $colInfo = $colInfos->{$colKey};
			my $newName = getJsonKeyForCol($colKey, 0);
			delete $colInfos->{$colKey};
			$colInfo->{name} = $newName;
			$colInfos->{$newName} = $colInfo;
		}
	}
}

sub toComplexWord($) {
	my ($word) = @_;
	my $newWord = lcfirst(SUtils::toPascalCase($word));
	if($newWord eq "global") {
	}
	elsif($newWord =~ /move$/i) {
		$newWord .= "s";
	}
	elsif($newWord =~ /foot$/i) {
		$newWord =~ s/oot$/eet/;
	}
	elsif($newWord =~ /child$/i) {
		$newWord .= "ren";
	}
	elsif($newWord =~ /human$/i) {
		$newWord .= "s";
	}
	elsif($newWord =~ /man$/i) {
		$newWord =~ s/an$/en/;
	}
	elsif($newWord =~ /tooth$/i) {
		$newWord =~ s/ooth$/eeth/;
	}
=pod
	elsif($newWord =~ /person$/i) {
		$newWord =~ s/erson$/eople/;
	}
=cut
	elsif($newWord =~ /[ml]ouse$/i) {
		$newWord =~ s/ouse$/ice/;
	}
	elsif($newWord =~ /(x|ch|ss|sh|us|as|is|os)$/i) {
		$newWord .= "es";
	}
	elsif($newWord =~ /([^aeiouy]|qu)y$/i) {
		$newWord =~ s/y$/ies/;
	}
	elsif($newWord =~ /[^f]fe$/i) {
		$newWord =~ s/fe$/ves/;
	}
	elsif($newWord =~ /[lr]f$/i) {
		$newWord =~ s/f$/ves/;
	}
	elsif($newWord =~ /(shea|lea|loa|thie)f$/i) {
		$newWord =~ s/f$/ves/;
	}
	elsif($newWord =~ /([ti])um$/i) {
		$newWord =~ s/um$/a/;
	}
	elsif($newWord =~ /(tomato|potato|echo|hero|veto)$/i) {
		$newWord .= "es";
	}
	elsif($newWord =~ /bus$/i) {
		$newWord .= "es";
	}
	elsif($newWord =~ /(ax|test)is$/i) {
		$newWord =~ s/is$/es/;
	}
	elsif($newWord =~ /s$/i) {
	}
	else {
		$newWord .= "s";
	}
	return $newWord;
}

sub convertTableNameForClientData() {
	for my $tableKey (sort { $a cmp $b } keys %$allColInfosForClient) {
		my $newTableKey = toComplexWord($tableKey);
		my $tableData = $allClientJson->{$tableKey};
		delete $allClientJson->{$tableKey};
		$allClientJson->{$newTableKey} = $tableData;
	}
}

sub saveAllInfosDeclFile($) {	
	my ($file) = @_;

	my $prefix = "";
	my $suffix = "_info";

	my $lines = [];
	for(sort { $a cmp $b } keys %$allColInfosForClient) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForClient->{$tableKey};

		my $typeName = SUtils::toPascalCase("$prefix$tableKey$suffix");
		push @$lines, "declare interface $typeName {";
		if($tableKey eq 'global') {
			push @$lines, "    'svnRevision': number,";
		}
		for my $colInfo (sort { $a->{colIndex} <=> $b->{colIndex} } values %$colInfosByName) {
			my $colName = $colInfo->{name};
			my $colType = $colInfo->{type};
			if($colType =~ /^(int|int64|float64)$/) {
				push @$lines, "    '$colName': number,";
			}
			elsif($colType =~ /^(bool|boolean)$/) {
				push @$lines, "    '$colName': boolean,";
			}
			elsif($colType eq 'json') {
				push @$lines, "    '$colName': any,";
			}
			elsif($colType =~ /^(string|time|time_range)$/) {
				push @$lines, "    '$colName': string,";
			}
			elsif($colType =~ /^(array1|farray1)$/) {
				push @$lines, "    '$colName': number[],";
			}
			elsif($colType =~ /^(array2|farray2)$/) {
				push @$lines, "    '$colName': number[][],";
			}
			elsif($colType =~ /^(array3|farray3)$/) {
				push @$lines, "    '$colName': number[][][],";
			}
			elsif($colType eq 'barray1') {
				push @$lines, "    '$colName': boolean[],";
			}
			elsif($colType eq 'barray2') {
				push @$lines, "    '$colName': boolean[][],";
			}
			elsif($colType eq 'barray3') {
				push @$lines, "    '$colName': boolean[][][],";
			}
			elsif($colType eq 'sarray1') {
				push @$lines, "    '$colName': string[],";
			}
			elsif($colType eq 'sarray2') {
				push @$lines, "    '$colName': string[][],";
			}
			elsif($colType eq 'sarray3') {
				push @$lines, "    '$colName': string[][][],";
			}
			else {
				die "$colType not support";
			}
		}
		push @$lines, "}";
		push @$lines, "";
	}

	push @$lines, "declare type AllInfos = {";
	for(sort { $a cmp $b } keys %$allColInfosForClient) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForClient->{$tableKey};
		if($tableKey ne 'particle') {
			my $newTableKey = toComplexWord($tableKey);
			my $typeName = SUtils::toPascalCase("$prefix$tableKey$suffix");
			if($tableKey ne 'global') {
				push @$lines, "    '$newTableKey'?: { [key: number]: $typeName },";
			}
			else {
				push @$lines, "    '$newTableKey'?: $typeName,";
			}
		}
	}
	push @$lines, "}";
	push @$lines, "";

	push @$lines, "declare let gAllInfos: AllInfos;";

	SUtils::saveFile($file, join("\n", @$lines));
}

my $particleProperties = {
	angle => "real",
	angleVariance => "real",
	blendFuncDestination => "integer",
	blendFuncSource => "integer",
	duration => "real",
	emitterType => "real",
	finishColorAlpha => "real",
	finishColorBlue => "real",
	finishColorGreen => "real",
	finishColorRed => "real",
	finishColorVarianceAlpha => "real",
	finishColorVarianceBlue => "real",
	finishColorVarianceGreen => "real",
	finishColorVarianceRed => "real",
	finishParticleSize => "real",
	finishParticleSizeVariance => "real",
	gravityx => "real",
	gravityy => "real",
	maxParticles => "real",
	maxRadius => "real",
	maxRadiusVariance => "real",
	minRadius => "real",
	particleLifespan => "real",
	particleLifespanVariance => "real",
	radialAccelVariance => "real",
	radialAcceleration => "real",
	rotatePerSecond => "real",
	rotatePerSecondVariance => "real",
	rotationEnd => "real",
	rotationEndVariance => "real",
	rotationStart => "real",
	rotationStartVariance => "real",
	sourcePositionVariancex => "real",
	sourcePositionVariancey => "real",
	sourcePositionx => "real",
	sourcePositiony => "real",
	speed => "real",
	speedVariance => "real",
	startColorAlpha => "real",
	startColorBlue => "real",
	startColorGreen => "real",
	startColorRed => "real",
	startColorVarianceAlpha => "real",
	startColorVarianceBlue => "real",
	startColorVarianceGreen => "real",
	startColorVarianceRed => "real",
	startParticleSize => "real",
	startParticleSizeVariance => "real",
	tangentialAccelVariance => "real",
	tangentialAcceleration => "real",
	textureFileName => "string",

	absolutePosition => "real",
	emissionRate => "real",
	minRadiusVariance => "real",
	positionType => "real",
	yCoordFlipped => "real",
};

sub saveParticlePlistFiles($$) {
	my ($tableName, $targetDir) = @_;
	my $tableData = $allClientJson->{$tableName};
	my $colInfos = $allColInfosForClient->{$tableName};

	for my $particleData (sort { $a->{_id} <=> $b->{_id} } values %$tableData) {
		my $particleName = $particleData->{_name};
		for my $propertyName (sort { $a cmp $b } keys %$particleProperties) {
			my $keyName = "_" . $propertyName;
			die "impossible $keyName" unless (exists($colInfos->{$keyName}));
			die "impossible $keyName" unless (exists($particleData->{$keyName}));
		}
		my $lines = [];
		push @$lines, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
		push @$lines, "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">";
		push @$lines, "<plist version=\"1.0\">";
		push @$lines, "<dict>";

		for my $keyName (sort { $a cmp $b } keys %$particleData) {
			my $propertyValue = $particleData->{$keyName};
			next if($keyName =~ /^(_id|_name)$/);
			die "impossible $keyName" unless ($keyName =~ /^_/);
			my $propertyName = substr($keyName, 1);
			my $propertyType = $particleProperties->{$propertyName};
			die "property not found $propertyName" unless ($propertyType =~ /^(integer|string|real)$/);
			push @$lines, "    <key>$propertyName</key>";
			if($propertyName eq 'textureFileName') {
				$propertyValue .= ".png";
			}
			if($particleName =~ /^(par_chouka02)$/) {
				if($propertyName eq 'blendFuncSource' && $propertyValue eq '775') {
					print "    changing $particleName blendFuncSource $propertyValue -> 770\n";
					$propertyValue = 770;
				}
			}
			push @$lines, "    <$propertyType>$propertyValue</$propertyType>";
		}

		push @$lines, "</dict>";
		push @$lines, "</plist>";

		my $targetFile = $targetDir . $particleName . ".plist";
		my $content = join("\n", @$lines);
		print "  saving $targetFile\n";
		SUtils::saveFile($targetFile, $content);
	}
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

sub saveAllInfoBaseJavaFile() {
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $lines = [];
		my $className = toPascalCase($tableKey . "_info_base");
		push @$lines, "// PokemonTool generated, do not MODIFY!!!";
		push @$lines, "";
		push @$lines, "package $serverCodeNamespace.base;";
		push @$lines, "";
		push @$lines, "import com.google.common.primitives.Bytes;";
		push @$lines, "import com.google.common.primitives.Shorts;";
		push @$lines, "import java.io.Serializable;";
		push @$lines, "import java.util.Arrays;";
		push @$lines, "import java.lang.String;";
		push @$lines, "import org.json.JSONObject;";
		push @$lines, "import org.json.JSONArray;";
		push @$lines, "import org.json.JSONException;";
		push @$lines, "";
		push @$lines, "public class $className {";

		my $typeToJavaType = {
			int			=> ['int', '0'],
			int64		=> ['long', '0'],
			float64		=> ['double', '0'],
			bool		=> ['boolean', 'false'],
			boolean		=> ['boolean', '0'],
			string		=> ['String', "''"],
			json		=> ['JSONObject', "null"],
			time		=> ['String', "''"],
			time_range	=> ['String', "''"],
			array1		=> ['int[]', "null"],
			array2		=> ['int[][]', "null"],
			array3		=> ['int[][][]', "null"],
			farray1		=> ['double[]', "null"],
			farray2		=> ['double[][]', "null"],
			farray3		=> ['double[][][]', "null"],
			barray1		=> ['boolean[]', "null"],
			barray2		=> ['boolean[][]', "null"],
			barray3		=> ['boolean[][][]', "null"],
			sarray1		=> ['String[]', "null"],
			sarray2		=> ['String[][]', "null"],
			sarray3		=> ['String[][][]', "null"],
		};

		# 成员变量
		for my $colInfo (sort { $a->{colIndex} <=> $b->{colIndex} } values %$colInfosByName) {
			my $colName = $colInfo->{name};
			my $colType = $colInfo->{type};

			my $config = $typeToJavaType->{$colType} or die "unknown colType: $colType";
			my $javaType = $config->[0];
			push @$lines, "    public $javaType $colName;";
		}
		push @$lines, "";

		# 生成GlobalInfo的常量字符串
		if(!$globalInfoNewStyle && $tableKey eq 'global') {
			my $data = $allServerJson->{global};
			for my $key (sort { $a cmp $b } keys %$data) {
				my $varName = $key;
				$varName = toSnakeCase($varName);
				$varName = uc($varName);
				push @$lines, "    public static String $varName = \"$key\";";
			}
			push @$lines, "";
		}

		# 构造函数
		push @$lines, "    public $className() {";
		push @$lines, "    }";
		push @$lines, "";

		# 编码成JSON对象
		#push @$lines, "    JSONObject encodeJson() {";
		#push @$lines, "    }";
		#push @$lines, "";

		my $jsonJavaGetMethod = {
			int		=> 'getInt',
			string	=> 'getString',
			float	=> 'getDouble',
			float64	=> 'getDouble',
			bool	=> 'getBoolean',
			boolean	=> 'getBoolean',
			json	=> 'getJSONObject',
		};

		my $array1Parse = sub($$$$) {
			my ($lines, ${varName}, ${colName}, $type) = @_;
			my $get = $jsonJavaGetMethod->{$type} or die "unknown type: $type";
			push @$lines, "        JSONArray ${varName}_ = json.getJSONArray(\"${colName}\");";
			push @$lines, "        this.${varName} = new int[${varName}_.length()];";
			push @$lines, "        for(int i = 0; i < ${varName}_.length(); ++i) {";
			push @$lines, "            this.${varName}\[i] = ${varName}_.$get(i);";
			push @$lines, "        }";
		};

		my $array2Parse = sub($$$$) {
			my ($lines, ${varName}, ${colName}, $type) = @_;
			my $get = $jsonJavaGetMethod->{$type} or die "unknown type: $type";
			push @$lines, "        JSONArray ${varName}_ = json.getJSONArray(\"${colName}\");";
			push @$lines, "        this.${varName} = new int[${varName}_.length()][];";
			push @$lines, "        for(int i = 0; i < ${varName}_.length(); ++i) {";
			push @$lines, "            JSONArray ${varName}__ = ${varName}_.getJSONArray(i);";
			push @$lines, "            this.${varName}\[i] = new int[${varName}__.length()];";
			push @$lines, "            for(int j = 0; j < ${varName}__.length(); ++j) {";
			push @$lines, "                this.${varName}\[i][j] = ${varName}__.$get(j);";
			push @$lines, "            }";
			push @$lines, "        }";
		};

		my $array3Parse = sub($$$$) {
			my ($lines, ${varName}, ${colName}, $type) = @_;
			my $get = $jsonJavaGetMethod->{$type} or die "unknown type: $type";
			push @$lines, "        JSONArray ${varName}_ = json.getJSONArray(\"${colName}\");";
			push @$lines, "        this.${varName} = new int[${varName}_.length()][][];";
			push @$lines, "        for(int i = 0; i < ${varName}_.length(); ++i) {";
			push @$lines, "            JSONArray ${varName}__ = ${varName}_.getJSONArray(i);";
			push @$lines, "            this.${varName}\[i] = new int[${varName}__.length()][];";
			push @$lines, "            for(int j = 0; j < ${varName}__.length(); ++j) {";
			push @$lines, "                JSONArray ${varName}___ = ${varName}__.getJSONArray(j);";
			push @$lines, "                this.${varName}\[i][j] = new int[${varName}___.length()];";
			push @$lines, "                for(int k = 0; k < ${varName}___.length(); ++k) {";
			push @$lines, "                    this.${varName}\[i][j][k] = ${varName}___.$get(k);";
			push @$lines, "                }";
			push @$lines, "            }";
			push @$lines, "        }";
		};

		# 从JSON解析
		push @$lines, "    public void decodeJson(JSONObject json) throws JSONException {";
		for my $colInfo (sort { $a->{colIndex} <=> $b->{colIndex} } values %$colInfosByName) {
			my $colName = $colInfo->{name};
			my $colType = $colInfo->{type};
			my $config = $typeToJavaType->{$colType} or die "unknown colType: $colType";
			my $javaType = $config->[0];
			my $varName = $colName;
			#$varName = '_' . $varName if($varName =~ /^\d/);
			if($colType eq 'int') {
				push @$lines, "        this.$varName = json.getInt(\"$colName\");";
			}
			elsif($colType eq 'int64') {
				push @$lines, "        this.$varName = json.getLong(\"$colName\");";
			}
			elsif($colType eq 'float64') {
				push @$lines, "        this.$varName = json.getDouble(\"$colName\");";
			}
			elsif($colType =~ /^(bool|boolean)$/) {
				push @$lines, "        this.$varName = (0 != json.getInt(\"$colName\"));";
			}
			elsif($colType =~ /^(string|time|time_range)$/) {
				push @$lines, "        this.$varName = json.getString(\"$colName\");";
			}
			elsif($colType eq 'json') {
				push @$lines, "        this.$varName = json.getJSONObject(\"$colName\");";
			}
			elsif($colType eq 'array1') {
				$array1Parse->($lines, $varName, $colName, 'int');
			}
			elsif($colType eq 'array2') {
				$array2Parse->($lines, $varName, $colName, 'int');
			}
			elsif($colType eq 'array3') {
				$array3Parse->($lines, $varName, $colName, 'int');
			}
			elsif($colType eq 'farray1') {
				$array1Parse->($lines, $varName, $colName, 'float');
			}
			elsif($colType eq 'farray2') {
				$array2Parse->($lines, $varName, $colName, 'float');
			}
			elsif($colType eq 'farray3') {
				$array3Parse->($lines, $varName, $colName, 'float');
			}
			elsif($colType eq 'barray1') {
				$array1Parse->($lines, $varName, $colName, 'bool');
			}
			elsif($colType eq 'barray2') {
				$array2Parse->($lines, $varName, $colName, 'bool');
			}
			elsif($colType eq 'barray3') {
				$array3Parse->($lines, $varName, $colName, 'bool');
			}
			elsif($colType eq 'sarray1') {
				$array1Parse->($lines, $varName, $colName, 'string');
			}
			elsif($colType eq 'sarray2') {
				$array2Parse->($lines, $varName, $colName, 'string');
			}
			elsif($colType eq 'sarray3') {
				$array3Parse->($lines, $varName, $colName, 'string');
			}
			else {
				die "$colType not support";
			}
		}
		push @$lines, "    }";
		push @$lines, "";

		push @$lines, "    public JSONObject encodeJson() {";
		push @$lines, "        return new JSONObject();";
		push @$lines, "    }";
		push @$lines, "";

		push @$lines, '    @Override';
		push @$lines, "    public String toString() {";
		push @$lines, "        return this.encodeJson().toString();";
		push @$lines, "    }";
		push @$lines, "";

		push @$lines, "}";
		push @$lines, "";

		my $outputDir = $serverCodeOutputDir . "/base/";
		SUtils::makeDirAll($outputDir);
		my $outputFile = $outputDir . $className . ".java";
		SUtils::saveFile($outputFile, join("\n", @$lines));
	}
}

sub saveAllInfoJavaFile() {
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $lines = [];
		my $className = toPascalCase($tableKey . "_info");
		my $baseClassName = $className . "Base";
		push @$lines, "package $serverCodeNamespace;";
		push @$lines, "";
		push @$lines, "import $serverCodeNamespace.base.$baseClassName;";
		push @$lines, "";
		push @$lines, "public class $className extends $baseClassName {";

		# 构造函数
		push @$lines, "    public $className() {";
		push @$lines, "    }";
		push @$lines, "";

		# 类结束
		push @$lines, "}";
		push @$lines, "";

		my $outputDir = $serverCodeOutputDir;
		SUtils::makeDirAll($outputDir);
		my $outputFile = $outputDir . $className . ".java";
		if(!-f SUtils::EOP($outputFile)) {
			SUtils::saveFile($outputFile, join("\n", @$lines));
		}
	}
}

sub getJavaMapKeyType($) {
	my ($type) = @_;
	my $table = {
		int		=> 'Integer',
		string	=> 'String',
		int64	=> 'Long',
	};
	my $ret = $table->{$type} or die "unknown type: $type";
	return $ret;
}

sub saveInfoDataBaseJavaFile() {
	my $lines = [];
	push @$lines, "// PokemonTool generated, do not MODIFY!!!";
	push @$lines, "";
	push @$lines, "package $serverCodeNamespace.base;";
	push @$lines, "";
	push @$lines, "import com.google.common.primitives.Bytes;";
	push @$lines, "import com.google.common.primitives.Shorts;";
	push @$lines, "import java.io.Serializable;";
	push @$lines, "import java.util.Arrays;";
	push @$lines, "import java.lang.String;";
	push @$lines, "import org.json.JSONObject;";
	push @$lines, "import org.json.JSONArray;";
	push @$lines, "import org.json.JSONException;";
	push @$lines, "import java.util.Map;";
	push @$lines, "import java.util.HashMap;";
	push @$lines, "import java.util.Iterator;";
	push @$lines, "import java.lang.Integer;";
	push @$lines, "import com.leocool.util.Utils;";
	push @$lines, "";

	# 导入所有Info类
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $className = toPascalCase($tableKey . "_info");
		push @$lines, "import $serverCodeNamespace.$className;";
	}
	push @$lines, "";

	push @$lines, "public class InfoDataBase {";

	# 成员变量
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $className = toPascalCase($tableKey . "_info");
		my $memberName = lcfirst($className) . "s";
		if($globalInfoNewStyle && $tableKey eq 'global') {
			push @$lines, "    protected $className $memberName;";
		}
		else {
			my $primaryColInfo = (grep { $_->{isPrimaryColumn} } values %$colInfosByName)[0];
			die "impossible $tableKey" unless $primaryColInfo;
			my $mapKeyType = getJavaMapKeyType($primaryColInfo->{type});
			push @$lines, "    protected Map<$mapKeyType, $className> $memberName;";
		}
	}
	push @$lines, "";

	# 构造函数
	push @$lines, "    protected InfoDataBase() {";
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $className = toPascalCase($tableKey . "_info");
		my $memberName = lcfirst($className) . "s";
		if($globalInfoNewStyle && $tableKey eq 'global') {
			push @$lines, "        this.$memberName = null;";
		}
		else {
			my $primaryColInfo = (grep { $_->{isPrimaryColumn} } values %$colInfosByName)[0];
			die "impossible $tableKey" unless $primaryColInfo;
			my $mapKeyType = getJavaMapKeyType($primaryColInfo->{type});
			push @$lines, "        this.$memberName = new HashMap<$mapKeyType, $className>();";
		}
	}
	push @$lines, "    }";
	push @$lines, "";

	# get函数
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $className = toPascalCase($tableKey . "_info");
		my $memberName = lcfirst($className) . "s";
		my $getFuncName = "get" . $className . "s";
		if($globalInfoNewStyle && $tableKey eq 'global') {
			push @$lines, "    public $className $getFuncName() {";
		}
		else {
			my $primaryColInfo = (grep { $_->{isPrimaryColumn} } values %$colInfosByName)[0];
			die "impossible $tableKey" unless $primaryColInfo;
			my $mapKeyType = getJavaMapKeyType($primaryColInfo->{type});
			push @$lines, "    public Map<$mapKeyType, $className> $getFuncName() {";
		}
		push @$lines, "        return this.$memberName;";
		push @$lines, "    }";
		push @$lines, "";
	}

	# 解析函数
	push @$lines, "    public void loadAll() throws JSONException {";
	for(sort { $a cmp $b } keys %$allColInfosForServer) {
		my $tableKey = $_;
		my $colInfosByName = $allColInfosForServer->{$tableKey};
		my $className = toPascalCase($tableKey . "_info");
		my $memberName = lcfirst($className) . "s";
		my $jsonVarName = $memberName . "Json";
		my $jsonIterName = $memberName . "Iter";
		my $jsonFileName = "./json/$tableKey.json";
		push @$lines, "        JSONObject $jsonVarName = Utils.loadJson(\"$jsonFileName\");";
		if($globalInfoNewStyle && $tableKey eq 'global') {
			push @$lines, "        this.$memberName = new $className();";
			push @$lines, "        this.$memberName.decodeJson($jsonVarName);";
		}
		else {
			my $primaryColInfo = (grep { $_->{isPrimaryColumn} } values %$colInfosByName)[0];
			die "impossible $tableKey" unless $primaryColInfo;
			my $mapKeyType = getJavaMapKeyType($primaryColInfo->{type});
			push @$lines, "        this.$memberName = new HashMap<$mapKeyType, $className>();";
			push @$lines, "        for(Iterator iter = $jsonVarName.keySet().iterator(); iter.hasNext(); ) {";
			push @$lines, "            String key = (String)iter.next();";
			push @$lines, "            JSONObject val = $jsonVarName.getJSONObject(key);";
			push @$lines, "            $className info = new $className();";
			push @$lines, "            info.decodeJson(val);";
			if($mapKeyType eq 'Integer') {
				push @$lines, "            this.$memberName.put(Integer.parseInt(key), info);";
			}
			else {
				push @$lines, "            this.$memberName.put(key, info);";
			}
			push @$lines, "        }";
		}
		push @$lines, "";
	}
	push @$lines, "    }";
	push @$lines, "";

	push @$lines, "}";
	push @$lines, "";

	my $outputDir = $serverCodeOutputDir . "/base/";
	SUtils::makeDirAll($outputDir);
	my $outputFile = $outputDir . "InfoDataBase.java";
	SUtils::saveFile($outputFile, join("\n", @$lines));
}

sub saveAllPartData($$) {
	my ($allDataJson, $outputDir) = @_;

	# 生成Part
	my $partCount = 8;
	my $allPartJson = [];
	push @$allPartJson, { length => 0, items => {} } for(1 .. $partCount);
	if(1) {
		# 注意先处理大数据, 再处理小数据, 以让各个Part大小相近
		my $tableSize = {};
		for my $tableName (sort { $a cmp $b } keys %$allDataJson) {
			my $data = $allDataJson->{$tableName};
			$tableSize->{$tableName} = length(SUtils::encodeJson($data));
		}
		for my $tableName (sort { $tableSize->{$b} <=> $tableSize->{$a} } keys %$allDataJson) {
			my $data = $allDataJson->{$tableName};
			my @sortedAllPartJson = sort { $a->{length} <=> $b->{length} } @$allPartJson;
			my $currentPartJson = $sortedAllPartJson[0];
			$currentPartJson->{items}->{$tableName} = $data;
			$currentPartJson->{length} += length(SUtils::encodeJson($data));
		}
	}

	# 写入数据
	if(1) {
		print "saving AllParts\n";
		for(my $i = 1; $i <= scalar(@$allPartJson); ++$i) {
			my $partJson = $allPartJson->[$i - 1]->{items};
			SUtils::saveFile($outputDir . "AllData$i.json", SUtils::encodeJson($partJson, 1));
			SUtils::saveFile($outputDir . "AllData$i.txt",  SUtils::encodeJson($partJson));
		}

		print "saving AllData\n";
		my $allDataJson = {};
		for(@$allPartJson) {
			my $partJson = $_->{items};
			for(keys %$partJson) {
				my $key = $_;
				my $value = $partJson->{$key};
				$allDataJson->{$key} = $value;
			}
		}

		SUtils::saveFile($outputDir . "AllData.json", SUtils::encodeJson($allDataJson, 1));
		SUtils::saveFile($outputDir . "AllData.txt",  SUtils::encodeJson($allDataJson));
	}
}

sub saveAllInfosDataFile() {
	print "saving Client AllData\n";

	delete $allClientJson->{particle};

	my $prefixCode = "if(CC_EDITOR){\n\n(function(window){\n\nvar gAllInfos = window.gAllInfos = !CC_EDITOR ? null : \n";
	my $suffixCode = "\n})(typeof(window)==='object'&&window || typeof(global)==='object'&&global || this);\n\n}\n";
	SUtils::saveFile($clientCodeOutputDir . "allInfos.js", $prefixCode . SUtils::encodeJson($allClientJson, 1) . $suffixCode);

	saveAllPartData($allClientJson, $clientOutputDir);
}

sub main() {
	print "=== searching $inputDir\n";

	my $fileList = SUtils::listAllFiles($inputDir, { matches => ['\.xlsx', '\.xls'] });

	print "=== parsing all files\n";
	for(sort { -s $b <=> -s $a } @$fileList) {
		resetLocalRefTable();

		my $inputFile = $_;
		print "  parsing ", $inputFile, "\n";

		my $tableKey = SUtils::F substr($inputFile, length($inputDir));
		$tableKey =~ s/\.xlsx?$//;

		# 子目录跳过
		if($tableKey =~ /[\\\/]/) {
			print "    skipped ", $inputFile, "\n";
			next;
		}

		# 临时文件跳过
		if($tableKey =~ /^\~/) {
			print "    skipped ", $inputFile, "\n";
			next;
		}

		my $tableData = [];
		my $worksheet = Spreadsheet::ParseXLSX->new()->parse($inputFile)->worksheet(0);
		my ($row_min, $row_max) = $worksheet->row_range();
        my ($col_min, $col_max) = $worksheet->col_range();
		for my $row ($row_min .. $row_max) {
			my $rowData = [];
			for my $col ($col_min .. $col_max) {
				my $cell = $worksheet->get_cell($row, $col);
				if($cell) {
					push @$rowData, $cell->value();
				}
				else {
					push @$rowData, "";
				}
			}
			push @$tableData, $rowData;
		}

		# 全局表要反转
		if($tableKey eq 'global') {
			my $allDataRotated = [];
			my $maxRow = scalar(scalar(@$tableData));
			my $maxCol = scalar(@{$tableData->[0]});
			for(my $row = 0; $row < scalar(@$tableData); ++$row) {
				my $rowData = $tableData->[$row];
				for(my $col = 0; $col < scalar(@$rowData); ++$col) {
					my $cellData = $rowData->[$col];

					push @$allDataRotated, [] if($col >= scalar(@$allDataRotated));
					my $colDataRotated = $allDataRotated->[$col];
					push @$colDataRotated, $cellData;
				}
			}
			$tableData = $allDataRotated;
		}

		# 获得行数与列数
		my $maxRow = scalar(scalar(@$tableData));
		die "$inputFile: maxRow $maxRow invalid" if($maxRow < 4);
		my $maxCol = scalar(@{$tableData->[0]});
		die "$inputFile: maxCol $maxCol invalid" if($maxCol < 2);

		# 获得列信息
		my $colInfosByIndexForClient = {};
		my $colInfosByNameForClient = {};
		my $colInfosByIndexForServer = {};
		my $colInfosByNameForServer = {};
		my $genTableForServer = 1;
		my $genTableForClient = 1;
		for(my $colIndex = 0; $colIndex < $maxCol; ++$colIndex) {
			my $colInfo = {};

			$colInfo->{colIndex} = $colIndex;
			$colInfo->{isPrimaryColumn} = $tableKey ne 'global' && ($colIndex == 0 ? 1 : 0);
			$colInfo->{isPrimaryColumn} = 0 if($tableKey eq 'global'); # 全局表没有主列

			# 描述信息
			$colInfo->{desc} = $tableData->[0]->[$colIndex];

			# 名称，碰到无名项就要跳过, 剩下的就给策划用了
			$colInfo->{name} = $tableData->[1]->[$colIndex];
			if($colInfo->{name} eq '') {
				$maxCol = $colIndex;
				last;
			}

			# 类型
			$colInfo->{type} = lc($tableData->[2]->[$colIndex]);

			# 服务器和客户端是否生成数据
			my $flags = $tableData->[3]->[$colIndex];
			if($colInfo->{desc} !~ /^#/) {
				die "Invlaid flags $flags" unless ($flags =~ /^[SC]+$/);
			}
			$colInfo->{genColForServer} = ($colInfo->{desc} !~ /^#/ && $flags =~ /S/ ? 1 : 0);
			$colInfo->{genColForClient} = ($colInfo->{desc} !~ /^#/ && $flags =~ /C/ ? 1 : 0);

			# 非全局表, 并且主列不让客户端生成时, 此表不生成
			if($tableKey ne 'global' && $colInfo->{isPrimaryColumn}) {
				$genTableForClient = $colInfo->{genColForClient};
			}

			# 添加服务器项
			if($colInfo->{genColForServer} || $colInfo->{isPrimaryColumn}) {
				die "Duplicated cellKey $colInfo->{name}" if($colInfosByNameForServer->{$colInfo->{name}});
				my $clonedColInfo = {};
				%$clonedColInfo = %$colInfo;
				$colInfosByNameForServer->{$colInfo->{name}} = $clonedColInfo;
				$colInfosByIndexForServer->{$colIndex} = $clonedColInfo;
				#print "   adding for server $colInfo->{name}\n";
			}

			# 添加客户端项
			if($colInfo->{genColForClient} || $colInfo->{isPrimaryColumn}) {
				die "Duplicated cellKey $colInfo->{name}" if($colInfosByNameForClient->{$colInfo->{name}});
				my $clonedColInfo = {};
				%$clonedColInfo = %$colInfo;
				$colInfosByNameForClient->{$colInfo->{name}} = $clonedColInfo;
				$colInfosByIndexForClient->{$colIndex} = $clonedColInfo;
				#print "   adding for client $colInfo->{name}\n";
			}
		}

		# 添加表格信息
		if($genTableForServer) {
			$allColInfosForServer->{$tableKey} = $colInfosByNameForServer;
		}
		if($genTableForClient) {
			$allColInfosForClient->{$tableKey} = $colInfosByNameForClient;
		}

		# 生成数据
		$isServerMode = 1; # 设置服务器模式
		if($genTableForServer) {
			genTableData($inputFile, $tableKey, $tableData, $maxRow, $maxCol, $colInfosByNameForServer, $colInfosByIndexForServer);
		}
		$isServerMode = 0; # 设置客户端模式
		if($genTableForClient) {
			genTableData($inputFile, $tableKey, $tableData, $maxRow, $maxCol, $colInfosByNameForClient, $colInfosByIndexForClient);
		}
	}

	# 全局表数据的处理
	if(!$globalInfoNewStyle) {
		print "processing server global info data\n";
		processGlobalInfoData($allColInfosForServer, $allServerJson);
	}

=pod
	# 添加下划线前缀
	print "add underline prefix for client data\n";
	addUnderlinePrefixForClientData();
=cut

	print "convert table name for client data\n";
	convertTableNameForClientData();

	# 生成客户端数据
	print "saving client single json data\n";
	SUtils::makeDirAll($clientJsonOutputDir);
	for my $tableKey (keys %$allClientJson) {
		my $tableJson = $allClientJson->{$tableKey};
		my $outputFile = $clientJsonOutputDir . "$tableKey.json";
		SUtils::makeDirAll($outputFile);
		SUtils::saveFile($outputFile, SUtils::encodeJson($tableJson, 1));
	}

	SUtils::makeDirAll($clientCodeOutputDir);
	#print "saving Particles\n";
	#saveParticlePlistFiles("particle", $clientOutputDir . "particle/");
	print "saving Client allInfos.js\n";
	saveAllInfosDataFile();
	print "saving Client allInfos.d.ts\n";
	saveAllInfosDeclFile($clientCodeOutputDir . "allInfos.d.ts");

	if(0) {
		# 生成服务器数据
		print "saving Server Json\n";
		for(@$serverJsonOutputDir) {
			my $jsonOutputDir = $_;
			SUtils::makeDirAll($jsonOutputDir);
			for my $tableKey (keys %$allServerJson) {
				my $tableJson = $allServerJson->{$tableKey};
				my $outputFile = $jsonOutputDir . "$tableKey.json";
				SUtils::makeDirAll($outputFile);
				SUtils::saveFile($outputFile, SUtils::encodeJson($tableJson, 1));
			}
		}

		print "saving Server Code\n";
		saveAllInfoBaseJavaFile();
		saveAllInfoJavaFile();
		saveInfoDataBaseJavaFile();
	}
}

main();

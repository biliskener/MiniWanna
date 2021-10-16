use strict;
use warnings;
use utf8;

use Xml::LibXML;

package CellXml;

our $CD_TYPE_RECT	= 1;
our $CD_TYPE_LINE	= 2;
our $CD_TYPE_POINT	= 3;

sub new($)
{
	my ($pathname) = @_;

	my $this = bless
	{
		imageType	=> "",
		imageTile	=> 0,
		imageGroup	=> 0,
		worlds		=> {},
		images		=> {},
		maps		=> {},
		sprites		=> {},
	};

	my $parser = XML::LibXML->new();
	my $dom    = $parser->parse_file($pathname);
	my $root   = $dom->getDocumentElement;
	
	my @imageTypeNodes = $root->findnodes("IMAGE_TYPE");
	die "impossible" if(scalar(@imageTypeNodes) == 0);
	$this->{imageType} = trim($imageTypeNodes[0]->textContent());
	
	my @imageTileNodes = $root->findnodes("IMAGE_TILE");
	die "impossible" if(scalar(@imageTileNodes) == 0);
	$this->{imageTile} = lc(trim($imageTileNodes[0]->textContent())) eq 'true' ? 1 : 0;

	my @imageGroupNodes = $root->findnodes("IMAGE_GROUP");
	die "impossible" if(scalar(@imageGroupNodes) == 0);
	$this->{imageGroup} = lc(trim($imageGroupNodes[0]->textContent())) eq 'true' ? 1 : 0;
	
	print "imageType: [$this->{imageType}] imageTile: [$this->{imageTile}] imageGroup: [$this->{imageGroup}]\n";
	
	for($root->findnodes("level"))
	{
		my $node = $_;
		$this->initLevel($node);
	}
	
	for($root->findnodes("resource"))
	{
		my $node = $_;
		$this->initResource($node);
	}
	
	return $this;
}

sub initLevel($$)
{
	my ($this, $node) = @_;

	print "begin level\n";
	
	for($node->findnodes("world"))
	{
		my $childNode = $_;
		my $world = $this->initWorld($childNode);
		$this->{worlds}->{$world->{name}} = $world;
	}

	die "impossible" if(scalar(keys %{$this->{worlds}}) != $node->getAttribute("world_count"));
	
	print "end level\n";
}

sub initWorld($$)
{
	my ($this, $node) = @_;
	
	print "\tbegin world\n";
	
	my $world =
	{
		index		=> $node->getAttribute("index"),
		name		=> $node->getAttribute("name"),
		gridXCount	=> $node->getAttribute("grid_x_count"),
		gridYCount	=> $node->getAttribute("grid_y_count"),
		gridW		=> $node->getAttribute("grid_w"),
		gridH		=> $node->getAttribute("grid_h"),
		width		=> $node->getAttribute("width"),
		height		=> $node->getAttribute("height"),
		data		=> parseArray1D($node->getAttribute("data")),
		terrain		=> [],
		maps		=> {},
		sprites		=> {},
		images		=> {},
		wayPoints	=> {},
		regions		=> {},
		events		=> {},
	};
	
	my @terrains = split(",", $node->getAttribute("terrain"));
	my $terrainsCount = $world->{gridXCount} * $world->{gridYCount};
	die "impossible" if(scalar(@terrains) != $terrainsCount);
	for(my $y = 0; $y < $world->{gridYCount}; ++$y)
	{
		my $row = [];
		push @{$world->{terrain}}, $row;
		for(my $x = 0; $x < $world->{gridXCount}; ++$x)
		{
			my $i = $y * $world->{gridXCount} + $x;
			push @$row, $terrains[$i];
		}
	}
	
	for($node->findnodes("unit_map"))
	{
		my $childNode = $_;
		my $map =
		{
			index		=> $childNode->getAttribute("index"),
			name		=> $childNode->getAttribute("map_name"),
			id			=> $childNode->getAttribute("id"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			priority	=> $childNode->getAttribute("priority") || 0,
			images		=> $childNode->getAttribute("images"),
			data		=> parseArray1D($childNode->getAttribute("map_data")),
		};
		$world->{maps}->{$map->{index}} = $map;
	}
	
	for($node->findnodes("unit_sprite"))
	{
		die "impossible";
		my $childNode = $_;
		my $sprite = 
		{
			index		=> $childNode->getAttribute("index"),
			name		=> $childNode->getAttribute("spr_name"),
			id			=> $childNode->getAttribute("id"),
			anim		=> $childNode->getAttribute("animate_id"),
			frame		=> $childNode->getAttribute("frame_id"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			priority	=> $childNode->getAttribute("priority") || 0,
			images		=> $childNode->getAttribute("images"),
			data		=> parseArray1D($childNode->getAttribute("spr_data")),
		};
		$world->{sprites}->{$sprite->{index}} = $sprite;
	}

	for($node->findnodes("unit_image"))
	{
		my $childNode = $_;
		my $image = 
		{
			index		=> $childNode->getAttribute("index"),
			name		=> $childNode->getAttribute("img_name"),
			id			=> $childNode->getAttribute("id"),
			tileID		=> $childNode->getAttribute("tile_id"),
			anchor		=> $childNode->getAttribute("anchor"),
			trans		=> $childNode->getAttribute("trans"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			priority	=> $childNode->getAttribute("priority") || 0,
			data		=> parseArray1D($childNode->getAttribute("img_data")),
		};
		$world->{images}->{$image->{index}} = $image;
	}

	for($node->findnodes("waypoint"))
	{
		die "impossible";
		my $childNode = $_;
		my $wayPoint = 
		{
			index		=> $childNode->getAttribute("index"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			data		=> parseArray1D($childNode->getAttribute("path_data")),
			nexts		=> {},
		};
		$world->{wayPoints}->{$wayPoint->{index}} = $wayPoint;
	}

	for($node->findnodes("region"))
	{
		die "impossible";
		my $childNode = $_;
		my $region = 
		{
			index		=> $childNode->getAttribute("index"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			w			=> $childNode->getAttribute("width"),
			h			=> $childNode->getAttribute("height"),
			data		=> parseArray1D($childNode->getAttribute("region_data")),
		};
		$world->{regions}->{$region->{index}} = $region;
	}

	for($node->findnodes("event"))
	{
		my $childNode = $_;
		my $event = 
		{
			index		=> $childNode->getAttribute("index"),
			id			=> $childNode->getAttribute("id"),
			x			=> $childNode->getAttribute("x"),
			y			=> $childNode->getAttribute("y"),
			name		=> $childNode->getAttribute("event_name"),
			file		=> $childNode->getAttribute("event_file"),
			data		=> $childNode->getAttribute("event_data"),
		};
		$world->{events}->{$event->{index}} = $event;
	}

	for($node->findnodes("waypoint_link"))
	{
		die "impossible";
		my $childNode = $_;
		my $start = $childNode->getAttribute("start");
		my $end = $childNode->getAttribute("end");
		$world->{wayPoints}->{$start}->{nexts}->{$end} = $world->{wayPoints}->{$end};
	}

	for(qw(index name gridXCount gridYCount gridW gridH width height))
	{
		print "\t\t $_: [" . $world->{$_} . "]\n";
	}
	for(qw(data))
	{
		print "\t\t $_: [" . join("|", @{$world->{$_}}) . "]\n";
	}
	for(qw(terrain))
	{
		print "\t\t $_:\n";
		for(@{$world->{$_}})
		{
			print "\t\t\t row: [" . join("|", @{$_}) . "]\n";
		}
	}

	print "\t\t maps:\n";	
	for(sort {$a <=> $b} keys %{$world->{maps}})
	{
		print "\t\t\t map $_:\n";
		my $item = $world->{maps}->{$_};
		for(qw(index name id x y priority images))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
		for(qw(data))
		{
			print "\t\t\t\t $_: [" . join("|", @{$item->{$_}}) . "]\n";
		}
	}

	print "\t\t sprites:\n";	
	for(sort {$a <=> $b} keys %{$world->{sprites}})
	{
		print "\t\t\t sprite $_:\n";
		my $item = $world->{sprites}->{$_};
		for(qw(index name id anim frame x y priority images))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
		for(qw(data))
		{
			print "\t\t\t\t $_: [" . join("|", @{$item->{$_}}) . "]\n";
		}
	}

	print "\t\t images:\n";	
	for(sort {$a <=> $b} keys %{$world->{images}})
	{
		print "\t\t\t image $_:\n";
		my $item = $world->{images}->{$_};
		for(qw(index name id tileID anchor trans x y priority))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
		for(qw(data))
		{
			print "\t\t\t\t $_: [" . join("|", @{$item->{$_}}) . "]\n";
		}
	}

	print "\t\t waypoints:\n";	
	for(sort {$a <=> $b} keys %{$world->{waypoints}})
	{
		print "\t\t\t waypoint $_:\n";
		my $item = $world->{waypoints}->{$_};
		for(qw(index x y))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
		for(qw(data))
		{
			print "\t\t\t\t $_: [" . join("|", @{$item->{$_}}) . "]\n";
		}
		print "\t\t\t\t nexts: [" . join(" ", maps {"$_"."->".$item->{nexts}->{$_}->{index}} keys %{$item->{nexts}}) . "]\n";
	}
	
	print "\t\t regions:\n";	
	for(sort {$a <=> $b} keys %{$world->{regions}})
	{
		print "\t\t\t region $_:\n";
		my $item = $world->{regions}->{$_};
		for(qw(index x y w h))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
		for(qw(data))
		{
			print "\t\t\t\t $_: [" . join("|", @{$item->{$_}}) . "]\n";
		}
	}	

	print "\t\t events:\n";	
	for(sort {$a <=> $b} keys %{$world->{events}})
	{
		print "\t\t\t event $_:\n";
		my $item = $world->{events}->{$_};
		for(qw(index id x y name file data))
		{
			print "\t\t\t\t $_: [" . $item->{$_} . "]\n";
		}
	}

	die "impossible" if(scalar(keys %{$world->{maps}}) != $node->getAttribute("unit_count_map"));
	die "impossible" if(scalar(keys %{$world->{sprites}}) != $node->getAttribute("unit_count_sprite"));
	die "impossible" if(scalar(keys %{$world->{images}}) != $node->getAttribute("unit_count_image"));
	die "impossible" if(scalar(keys %{$world->{waypoints}}) != $node->getAttribute("waypoint_count"));
	die "impossible" if(scalar(keys %{$world->{regions}}) != $node->getAttribute("region_count"));
	die "impossible" if(scalar(keys %{$world->{events}}) != $node->getAttribute("event_count"));

	print "\tend world\n";
	
	return $world;
}

sub initResource($$)
{
	my ($this, $node) = @_;

	print "begin resource\n";
		
	for($node->findnodes("images"))
	{
		my $childNode = $_;
		my $image = $this->initImage($childNode);
		$this->{images}->{$image->{name}} = $image;
	}
	for($node->findnodes("map"))
	{
		my $childNode = $_;
		my $map = $this->initMap($childNode);
		$this->{maps}->{$map->{name}} = $map;
	}
	for($node->findnodes("sprite"))
	{
		my $childNode = $_;
		my $sprite = $this->initSprite($childNode);
		$this->{sprites}->{$sprite->{name}} = $sprite;
	}
	
	die "impossible" if(scalar(keys %{$this->{images}}) != $node->getAttribute("images_count"));
	die "impossible" if(scalar(keys %{$this->{maps}}) != $node->getAttribute("map_count"));
	warn "impossible" if(scalar(keys %{$this->{sprites}}) != $node->getAttribute("sprite_count"));

	print "end resource\n";
}

sub initImage($$)
{
	my ($this, $node) = @_;

	print "\tbegin image\n";
		
	my $count = $node->getAttribute("size");
	my $image =
	{
		index		=> $node->getAttribute("index"),
		name		=> $node->getAttribute("name"),
		count		=> $count,
		outputFile	=> $node->getAttribute("output_file"),
		outputType	=> $node->getAttribute("output_type"),
		#allWidth	=> $node->getAttribute("all_width"),
		#allHeight	=> $node->getAttribute("all_height"),
		clipsX		=> newArray1D($count, 0),
		clipsY		=> newArray1D($count, 0),
		clipsW		=> newArray1D($count, 0),
		clipsH		=> newArray1D($count, 0),
		clipsKey	=> newArray1D($count, ""),
		imageInfo	=> "",
		appendData	=> undef,
	};
	
	if($image->{outputFile})
	{
		$image->{extension} = $image->{outputFile};
	}
	else
	{
		$image->{extension} = $this->{imageType};
	}
	if($image->{outputType} =~ /tile/)
	{
		$image->{isTiles} = 1;
	}
	else
	{
		$image->{isTiles} = $this->{imageTile};
	}
	
	for($node->findnodes("clip"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		$image->{clipsX}->[$index] = $childNode->getAttribute("x");
		$image->{clipsY}->[$index] = $childNode->getAttribute("y");
		$image->{clipsW}->[$index] = $childNode->getAttribute("width");
		$image->{clipsH}->[$index] = $childNode->getAttribute("height");
		$image->{clipsKey}->[$index] = $childNode->getAttribute("data");
	}

	for($node->findnodes("ImageInfo"))
	{
		my $childNode = $_;
		$image->{imageInfo} = trim($childNode->textContent());
	}

	for($node->findnodes("Append"))
	{
		my $childNode = $_;
		$image->{appendData} = parseArray1D($childNode->getAttribute("data"));
	}
	
	for(qw(index name count outputFile outputType))
	{
		print "\t\t $_: [" . $image->{$_} . "]\n";
	}
=pod
	for(qw(allWidth allHeight))
	{
		print "\t\t $_: [" . $image->{$_} . "]\n";
	}
=cut
	for(qw(clipsX clipsY clipsW clipsH clipsKey))
	{
		print "\t\t $_: [" . join("|", @{$image->{$_}}) . "]\n";
	}
	for(qw(imageInfo extension isTiles))
	{
		print "\t\t $_: [" . $image->{$_} . "]\n";
	}
	for(qw(appendData))
	{
		print "\t\t $_: [" . join("|", @{$image->{$_}}) . "]\n";
	}
	
	print "\tend image\n";
		
	return $image;
}

sub initMap($$)
{
	my ($this, $node) = @_;

	print "\tbegin map\n";
		
	my $cdPartCount = $node->getAttribute("cd_part_count");
	my $layerCount = $node->getAttribute("layer_count");
	my $xCount = $node->getAttribute("xcount");
	my $yCount = $node->getAttribute("ycount");
	my $map =
	{
		index		=> $node->getAttribute("index"),
		name		=> $node->getAttribute("name"),
		imagesName	=> $node->getAttribute("images_name"),
		xCount		=> $xCount,
		yCount		=> $yCount,
		layerCount	=> $layerCount,
		cdPartCount	=> $cdPartCount,
		cellW		=> $node->getAttribute("cellw"),
		cellH		=> $node->getAttribute("cellh"),
		blocksType	=> newArray1D($cdPartCount, 0),
		blocksMask	=> newArray1D($cdPartCount, 0),
		blocksX1	=> newArray1D($cdPartCount, 0),
		blocksY1	=> newArray1D($cdPartCount, 0),
		blocksX2	=> newArray1D($cdPartCount, 0),
		blocksY2	=> newArray1D($cdPartCount, 0),
		blocksW		=> newArray1D($cdPartCount, 0),
		blocksH		=> newArray1D($cdPartCount, 0),
		terrainTile	=> newArray3D($layerCount, $yCount, $xCount, 0),
		terrainFlip	=> newArray3D($layerCount, $yCount, $xCount, 0),
		terrainFlag	=> newArray3D($layerCount, $yCount, $xCount, 0),
		appendData	=> undef,
	};
	
	for($node->findnodes("cd_part"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		$map->{blocksType}->[$index] = $childNode->getAttribute("type") eq "rect" ? $CD_TYPE_RECT : $CD_TYPE_LINE;
		$map->{blocksMask}->[$index] = $childNode->getAttribute("mask");
		$map->{blocksX1}->[$index] = $childNode->getAttribute("x1");
		$map->{blocksY1}->[$index] = $childNode->getAttribute("y1");
		$map->{blocksX2}->[$index] = $childNode->getAttribute("x2");
		$map->{blocksY2}->[$index] = $childNode->getAttribute("y2");
		$map->{blocksW}->[$index] = $childNode->getAttribute("width");
		$map->{blocksH}->[$index] = $childNode->getAttribute("height");
	}

	for($node->findnodes("layer"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		my $tileMatrix = parseArray2D($childNode->getAttribute("tile_matrix"));
		my $flipMatrix = parseArray2D($childNode->getAttribute("flip_matrix"));
		my $flagMatrix = parseArray2D($childNode->getAttribute("flag_matrix"));
		for(my $y = 0; $y < $map->{yCount}; ++$y)
		{
			for(my $x = 0; $x < $map->{xCount}; ++$x)
			{
				$map->{terrainTile}->[$index]->[$y]->[$x] = $tileMatrix->[$y]->[$x];
				$map->{terrainFlip}->[$index]->[$y]->[$x] = $flipMatrix->[$y]->[$x];
				$map->{terrainFlag}->[$index]->[$y]->[$x] = $flagMatrix->[$y]->[$x];
			}
		}
	}

	for($node->findnodes("Append"))
	{
		my $childNode = $_;
		$map->{appendData} = parseArray1D($childNode->getAttribute("data"));
	}

	for(qw(index name imagesName xCount yCount layerCount cdPartCount cellW cellH))
	{
		print "\t\t $_: [" . $map->{$_} . "]\n";
	}
	
	for(qw(blocksType blocksMask blocksX1 blocksY1 blocksX2 blocksY2 blocksW blocksH))
	{
		print "\t\t $_: [" . join("|", @{$map->{$_}}) . "]\n";
	}
	for(qw(terrainTile terrainFlip terrainFlag))
	{
		print "\t\t $_:\n";
		for(@{$map->{$_}})
		{
			print "\t\t\t sur:\n";
			for(@{$_})
			{
				print "\t\t\t\t row: [" . join("|", @{$_}) . "]\n";
			}
		}
	}
	
	print "\t\t appendData: [" . join("|", @{$map->{appendData}}) . "]\n";
	
	print "\tend map\n";
		
	return $map;
}

sub initSprite($$)
{
	my ($this, $node) = @_;

	print "\tbegin sprite\n";
	
	my $scenePartCount	= $node->getAttribute("scene_part_count");
	my $sceneFrameCount	= $node->getAttribute("scene_frame_count");
	my $cdPartCount		= $node->getAttribute("cd_part_count");
	my $collidesCount	= $node->getAttribute("cd_frame_count");
	my $animateCount	= $node->getAttribute("animate_count");

	my $sprite =
	{
		index			=> $node->getAttribute("index"),
		name			=> $node->getAttribute("name"),
		imagesName		=> $node->getAttribute("images_name"),
		complexMode		=> lc($node->getAttribute("complexMode")) eq 'true' ? 1 : 0,
		scenePartCount	=> $scenePartCount,
		sceneFrameCount	=> $sceneFrameCount,
		cdPartCount		=> $cdPartCount,
		collidesCount	=> $collidesCount,
		animateCount	=> $animateCount,
		
		partX			=> newArray1D($scenePartCount, 0),
		partY			=> newArray1D($scenePartCount, 0),
		partZ			=> newArray1D($scenePartCount, 0),
		partTileID		=> newArray1D($scenePartCount, 0),
		partTileTrans	=> newArray1D($scenePartCount, 0),
		partAlpha		=> newArray1D($scenePartCount, 0),
		partRotate		=> newArray1D($scenePartCount, 0),
		partScaleX		=> newArray1D($scenePartCount, 0),
		partScaleY		=> newArray1D($scenePartCount, 0),
		partShearX		=> newArray1D($scenePartCount, 0),
		partShearY		=> newArray1D($scenePartCount, 0),
		parts			=> newArray1D($sceneFrameCount, []),
		
		blocksType		=> newArray1D($cdPartCount, ""),
		blocksMask		=> newArray1D($cdPartCount, 0),
		blocksX1		=> newArray1D($cdPartCount, 0),
		blocksY1		=> newArray1D($cdPartCount, 0),
		blocksX2		=> newArray1D($cdPartCount, 0),
		blocksY2		=> newArray1D($cdPartCount, 0),
		blocksW			=> newArray1D($cdPartCount, 0),
		blocksH			=> newArray1D($cdPartCount, 0),
		blocks			=> newArray1D($collidesCount, []),
		
		animateNames	=> newArray1D($animateCount, ""),
		frameAnimate	=> newArray1D($animateCount, []),
		frameCdMap		=> newArray1D($animateCount, []),
		frameCdAtk		=> newArray1D($animateCount, []),
		frameCdDef		=> newArray1D($animateCount, []),
		frameCdExt		=> newArray1D($animateCount, []),
		frameAlpha		=> newArray1D($animateCount, []),
		frameRotate		=> newArray1D($animateCount, []),
		frameScaleX		=> newArray1D($animateCount, []),
		frameScaleY		=> newArray1D($animateCount, []),
		frameShearX		=> newArray1D($animateCount, []),
		frameShearY		=> newArray1D($animateCount, []),
		frameDatas		=> undef,
		appendData		=> undef,
	};

	for($node->findnodes("scene_part"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		$sprite->{partTileID}->[$index] = $childNode->getAttribute("tile");
		$sprite->{partX}->[$index] = $childNode->getAttribute("x");
		$sprite->{partY}->[$index] = $childNode->getAttribute("y");
		$sprite->{partZ}->[$index] = $childNode->getAttribute("z");
		$sprite->{partTrans}->[$index] = $childNode->getAttribute("trans");
		$sprite->{partAlpha}->[$index] = $childNode->getAttribute("alpha");
		$sprite->{partRotate}->[$index] = $childNode->getAttribute("rotate");
		$sprite->{partScaleX}->[$index] = $childNode->getAttribute("scaleX");
		$sprite->{partScaleY}->[$index] = $childNode->getAttribute("scaleY");
		$sprite->{partShearX}->[$index] = $childNode->getAttribute("shearX");
		$sprite->{partShearY}->[$index] = $childNode->getAttribute("shearY");
	}

	for($node->findnodes("scene_frame"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		my $count = $childNode->getAttribute("data_size");
		my $ret = parseArray1D($childNode->getAttribute("data"));
		die "impossible" if(scalar(@$ret) != $count);
		$sprite->{parts}->[$index] = $ret;
	}

	for($node->findnodes("cd_part"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		$sprite->{blocksType}->[$index] = $childNode->getAttribute("type");
		$sprite->{blocksMask}->[$index] = $childNode->getAttribute("mask");
		$sprite->{blocksX1}->[$index] = $childNode->getAttribute("x1");
		$sprite->{blocksY1}->[$index] = $childNode->getAttribute("y1");
		$sprite->{blocksX2}->[$index] = $childNode->getAttribute("x2");
		$sprite->{blocksY2}->[$index] = $childNode->getAttribute("y2");
		$sprite->{blocksW}->[$index] = $childNode->getAttribute("width");
		$sprite->{blocksH}->[$index] = $childNode->getAttribute("height");
	}

	for($node->findnodes("cd_frame"))
	{
		my $childNode = $_;
		my $index = $childNode->getAttribute("index");
		my $count = $childNode->getAttribute("data_size");
		my $ret = parseArray1D($childNode->getAttribute("data"));
		die "impossible" if(scalar(@$ret) != $count);
		$sprite->{blocks}->[$index] = $ret;
	}

	for($node->findnodes("frames"))
	{
		my $childNode = $_;
		$sprite->{animateNames} = parseArray1DExt($childNode->getAttribute("names"), 1);
		die "impossible" if(scalar(@{$sprite->{animateNames}}) != $sprite->{animateCount});
		my $frameCounts = parseArray1D($childNode->getAttribute("counts"));
		die "impossible" if(scalar(@$frameCounts) != $sprite->{animateCount});
		$sprite->{frameAnimate} = parseArray2D($childNode->getAttribute("animates"));
		$sprite->{frameCdMap} = parseArray2D($childNode->getAttribute("cd_map"));
		$sprite->{frameCdAtk} = parseArray2D($childNode->getAttribute("cd_atk"));
		$sprite->{frameCdDef} = parseArray2D($childNode->getAttribute("cd_def"));
		$sprite->{frameCdExt} = parseArray2D($childNode->getAttribute("cd_ext"));
		$sprite->{frameAlpha} = parseArray2D($childNode->getAttribute("alpha"));
		$sprite->{frameRotate} = parseArray2D($childNode->getAttribute("rotate"));
		$sprite->{frameScaleX} = parseArray2D($childNode->getAttribute("scaleX"));
		$sprite->{frameScaleY} = parseArray2D($childNode->getAttribute("scaleY"));
		$sprite->{frameShearX} = parseArray2D($childNode->getAttribute("shearX"));
		$sprite->{frameShearY} = parseArray2D($childNode->getAttribute("shearY"));
		if($childNode->hasAttribute("fdata"))
		{
			$sprite->{frameDatas} = parseArray2DExt($childNode->getAttribute("fdata"), 1);
		}
		for(qw(frameAnimate frameCdMap frameCdAtk frameCdDef frameCdExt frameAlpha frameRotate frameScaleX frameScaleY frameShearX frameShearY frameDatas))
		{
			my $key = $_;
			die "impossible $key" if(scalar(@{$sprite->{$key}}) != $sprite->{animateCount});
			for(my $i = 0; $i < $animateCount; ++$i)
			{
				my $frameCount = $frameCounts->[$i];
				die "impossible $key $i" if(scalar(@{$sprite->{$key}->[$i]}) != $frameCount);
			}
		}
	}
				
	for($node->findnodes("Append"))
	{
		my $childNode = $_;
		$sprite->{appendData} = parseArray1D($childNode->getAttribute("data"));
	}
	
	for(qw(index name imagesName complexMode scenePartCount sceneFrameCount cdPartCount collidesCount animateCount))
	{
		print "\t\t $_: [" . $sprite->{$_} . "]\n";
	}
	for(qw(partX partY partZ partTileID partTileTrans partAlpha partRotate partScaleX partScaleY partShearX partShearY))
	{
		print "\t\t $_: [" . join("|", @{$sprite->{$_}}) . "]\n";
	}
	for(qw(parts))
	{
		print "\t\t $_:\n";
		for(@{$sprite->{$_}})
		{
			print "\t\t\t row: [" . join("|", @{$_}) . "]\n";
		}
	}

	for(qw(blocksType blocksMask blocksX1 blocksY1 blocksX2 blocksY2 blocksW blocksH))
	{
		print "\t\t $_: [" . join("|", @{$sprite->{$_}}) . "]\n";
	}
	for(qw(blocks))
	{
		print "\t\t $_:\n";
		for(@{$sprite->{$_}})
		{
			print "\t\t\t row: [" . join("|", @{$_}) . "]\n";
		}
	}

	for(qw(animateNames))
	{
		print "\t\t $_: [" . join("|", @{$sprite->{$_}}) . "]\n";
	}

	for(qw(frameAnimate frameCdMap frameCdAtk frameCdDef frameCdExt frameAlpha frameRotate frameScaleX frameScaleY frameShearX frameShearY))
	{
		print "\t\t $_:\n";
		for(@{$sprite->{$_}})
		{
			print "\t\t\t row: [" . join("|", @{$_}) . "]\n";
		}
	}

	for(qw(frameDatas))
	{
		print "\t\t $_:\n";
		for(@{$sprite->{$_}})
		{
			print "\t\t\t row: [" . join("|", @{$_}) . "]\n";
		}
	}

	for(qw(appendData))
	{
		print "\t\t $_: [" . join("|", @{$sprite->{$_}}) . "]\n";
	}
	
	print "\tend sprite\n";
	
	return $sprite;
}

sub newArray1D($$)
{
	my ($count, $value) = @_;
	my $ret = [];
	for(my $i = 0; $i < $count; ++$i)
	{
		push @$ret, $value;
	}
	return $ret;
}

sub newArray2D($$$)
{
	my ($yCount, $xCount, $value) = @_;
	my $ret = [];
	for(my $i = 0; $i < $yCount; ++$i)
	{
		push @$ret, newArray1D($xCount, $value);
	}
	return $ret;
}

sub newArray3D($$$$)
{
	my ($zCount, $yCount, $xCount, $value) = @_;
	my $ret = [];
	for(my $i = 0; $i < $zCount; ++$i)
	{
		push @$ret, newArray2D($yCount, $xCount, $value);
	}
	return $ret;
}

sub parseArray1D($)
{
	my ($text) = @_;
	return parseArray1DExt($text, 0);
}

sub parseArray1DExt($$)
{
	my ($text, $withLength) = @_;
	
	my @ret = split(",", $text, -1);
	if($text =~ /,$/)
	{
		pop @ret, 1;
	}
	
	if($withLength)
	{
		die "impossible" if(scalar(@ret) % 2 != 0);
		my $ext = [];
		for(my $i = 0; $i < scalar(@ret); )
		{
			my $length = $ret[$i++];
			my $value = $ret[$i++];
			die "impossible" if($length != length($value));
			push @$ext, $value;
		}
		return $ext;
	}
	else
	{
		return \@ret;
	}
}

sub parseArray2D($)
{
	my ($text) = @_;
	return parseArray2DExt($text, 0);
}

sub parseArray2DExt($$)
{
	my ($text, $withLength) = @_;
	
	my $ret = [];
	
	my @texts = split(/\},?/, $text, -1);
	if($text =~ /\},?$/)
	{
		pop @texts, 1;
	}
	
	for(@texts)
	{
		my $t = $_;
		die "impossible" if(!$t =~ /^\{/);
		$t =~ s/^\{//g;
		my $array1D = parseArray1DExt($t, $withLength);
		push @$ret, $array1D;
	}
	return $ret;
}

sub test
{
	print "CellXml::newArray1D\n";
	{
		die "impossible" if(trim("   abc def ") ne "abc def");
	}
	
	print "CellXml::newArray1D\n";
	{
		my $array1D = newArray1D(10, 's');
		die "impossible" if(scalar(@$array1D) != 10);
		for(@$array1D)
		{
			die "impossible" if($_ ne 's');
		}
	}

	print "CellXml::newArray2D\n";
	{
		my $array2D = newArray2D(5, 10, 's');
		die "impossible" if(scalar(@$array2D) != 5);
		for(@$array2D)
		{
			my $array1D = $_;
			die "impossible" if(scalar(@$array1D) != 10);
			for(@$array1D)
			{
				die "impossible" if($_ ne 's');
			}
		}
	}

	print "CellXml::newArray3D\n";
	{
		my $array3D = newArray3D(2, 5, 10, 's');
		die "impossible" if(scalar(@$array3D) != 2);
		for(@$array3D)
		{
			my $array2D = $_;
			die "impossible" if(scalar(@$array2D) != 5);
			for(@$array2D)
			{
				my $array1D = $_;
				die "impossible" if(scalar(@$array1D) != 10);
				for(@$array1D)
				{
					die "impossible" if($_ ne 's');
				}
			}
		}
	}

	print "CellXml::parseArray1D\n";
	{
		my $array1D = parseArray1D("");
		die "impossible " . scalar(@$array1D) if(scalar(@$array1D) != 0);
		$array1D = parseArray1D(",");
		die "impossible " . scalar(@$array1D) if(scalar(@$array1D) != 1);
		die "impossible " . $array1D->[0] if($array1D->[0] ne "");
		for("a,b,", "a,b")
		{
			$array1D = parseArray1D($_);
			die "impossible " . scalar(@$array1D) if(scalar(@$array1D) != 2);
			die "impossible " . $array1D->[0] if($array1D->[0] ne "a");
			die "impossible " . $array1D->[1] if($array1D->[1] ne "b");
		}
		$array1D = parseArray1D("a,b,,");
		die "impossible " . scalar(@$array1D) if(scalar(@$array1D) != 3);
		die "impossible " . $array1D->[0] if($array1D->[0] ne "a");
		die "impossible " . $array1D->[1] if($array1D->[1] ne "b");
		die "impossible " . $array1D->[2] if($array1D->[2] ne "");
	}

	print "CellXml::parseArray2D\n";
	{
		my $array2D = parseArray2D("");
		die "impossible " . scalar(@$array2D) if(scalar(@$array2D) != 0);
		for("{},", "{}")
		{
			$array2D = parseArray2D($_);
			die "impossible " . scalar(@$array2D) if(scalar(@$array2D) != 1);
			die "impossible " . scalar(@{$array2D->[0]}) if(scalar(@{$array2D->[0]}) != 0);
		}
		for("{},{},", "{},{}")
		{
			$array2D = parseArray2D($_);
			die "impossible " . scalar(@$array2D) if(scalar(@$array2D) != 2);
			die "impossible " . scalar(@{$array2D->[0]}) if(scalar(@{$array2D->[0]}) != 0);
			die "impossible " . scalar(@{$array2D->[1]}) if(scalar(@{$array2D->[1]}) != 0);
		}
		for("{a},{b},", "{a},{b}")
		{
			$array2D = parseArray2D($_);
			die "impossible " . scalar(@$array2D) if(scalar(@$array2D) != 2);
			die "impossible " . scalar(@{$array2D->[0]}) if(scalar(@{$array2D->[0]}) != 1);
			die "impossible " . scalar(@{$array2D->[1]}) if(scalar(@{$array2D->[1]}) != 1);
			die "impossible " . $array2D->[0]->[0] if($array2D->[0]->[0] ne "a");
			die "impossible " . $array2D->[1]->[0] if($array2D->[1]->[0] ne "b");
		}
		for("{a,b,},{c,d,},", "{a,b},{c,d}")
		{
			$array2D = parseArray2D($_);
			die "impossible " . scalar(@$array2D) if(scalar(@$array2D) != 2);
			die "impossible " . scalar(@{$array2D->[0]}) if(scalar(@{$array2D->[0]}) != 2);
			die "impossible " . scalar(@{$array2D->[1]}) if(scalar(@{$array2D->[1]}) != 2);
			die "impossible " . $array2D->[0]->[0] if($array2D->[0]->[0] ne "a");
			die "impossible " . $array2D->[0]->[1] if($array2D->[0]->[1] ne "b");
			die "impossible " . $array2D->[1]->[0] if($array2D->[1]->[0] ne "c");
			die "impossible " . $array2D->[1]->[1] if($array2D->[1]->[1] ne "d");
		}
	}
	
	print "CellXml::new\n";
	{
		my $cellXml = CellXml::new("scene.xml");
	}
}

sub trim($)
{
	my ($text) = @_;
	$text =~ s/^\s+|\s+$//g;
	return $text;
}

1;

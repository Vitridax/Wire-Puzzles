var Level = new Phaser.Class({

    initialize: function(width, height, room, wires)
    {
        //set up tilemap
        this.map = gameScene.make.tilemap({
            tileWidth: gameScene.tileSize,
            tileHeight: gameScene.tileSize,
            width: width,
            height: height 
        });

        var roomTileset = this.map.addTilesetImage('room tiles');
        var poweredWireTiles = this.map.addTilesetImage('powered wire tiles');
        var unpoweredWireTiles = this.map.addTilesetImage('unpowered wire tiles');
        var whiteWireTiles = this.map.addTilesetImage('white wire tiles');


        this.room = this.map.createBlankDynamicLayer('room', roomTileset);
        this.wires = this.map.createBlankDynamicLayer('wires', whiteWireTiles);


        //default room
        if (room === undefined || room === null)
        {
            room = [];
            for (var y = 0; y < height; y ++)
            {
                room.push([]);
                for (var x = 0; x < width; x ++)
                {
                    room[y][x] = ( x === 0 || y === 0 || x === width - 1 || y === height - 1 ) ? TILES.wall : TILES.floor;
                }
            }   
        }

        //default wires
        if (wires === undefined || wires === null)
        {
            wires = [];
            for (var y = 0; y < height; y ++)
            {
                wires.push([]);
                for (var x = 0; x < width; x ++)
                    wires[y][x] = -1;
            }   
        }

        //default wires
        if (wires === undefined || wires === null) wires = [];

        //fill tilemap with tiles
        for (var y = 0; y < height; y ++)
        {
            for (var x = 0; x < width; x ++)
            {
                var tile;
                if (wires[y][x] !== -1) 
                    this.add(new Wire(x, y, null, this.wires.layer));
                else
                    this.wires.putTileAt(-1, x, y);

                if (room[y][x] !== -1)
                    this.add(PuzzleTile.makeFromIndex(room[y][x], x, y, null, this.room.layer));
                else
                    this.room.putTileAt(-1, x, y);
            }
        }
        this.updateWires();

        //scale tiles
        var mapScaleGroup = gameScene.add.group();
        mapScaleGroup.add(this.room);
        mapScaleGroup.add(this.wires);
        Phaser.Actions.ScaleXY(mapScaleGroup.getChildren(), gameScene.tileScale, gameScene.tileScale);

        //move player to start position
        gameScene.player.setPosition(this.map.tileToWorldX(2.5), this.map.tileToWorldY(2.5));
    },

    add: function (tile) 
    {
        if (tile.x >= this.map.width || tile.y >= this.map.height) return;
        if (tile instanceof Wire) 
            this.wires.layer.data[tile.y][tile.x] = tile;
        else
            this.room.layer.data[tile.y][tile.x] = tile;
    },

    updateWires: function ()
    {
        var wires = this.map.getTilesWithin(0, 0, undefined, undefined, {isNotEmpty: true}, 'wires');
        for (var i=0; i < wires.length; i++) 
        {
            wires[i].updateConnections();
        }
        for (var i=0; i < wires.length; i++) 
        {
            var checkedTiles = []
            wires[i].powered = wires[i].findPathToPowerSource(checkedTiles);
            wires[i].updateColor();

            if(wires[i].hasNeighboringPowerInput() && wires[i].powered) 
            {
                this.updatePoweredTiles();
            }
        }
    },

    updatePoweredTiles: function () 
    {
        var tiles = gameScene.level.map.getTilesWithin(0, 0, undefined, undefined, {isNotEmpty: true}, 'room');
        for (var i=0; i<tiles.length; i++) 
        {
            if (tiles[i].index === TILES.hardTWall) tiles[i].index = TILES.softTWall;
            else if (tiles[i].index === TILES.softTWall) tiles[i].index = TILES.hardTWall;
        }
    }
});
var Game = {
  
  state : {
    running : false,
    width : false,
    height : false,    
    objects : [],
    history : [],
    pads : [],
  },
  
  grid : false,
  
  firstLevel : 'l01',
  currentLevel : false,
  
  check : {
    
    boxAt : function(x, y) {
      var result = false;
      each(Stage.layers.boxes.children, function(b) {
        if(b.x == x && b.y == y)
          result = b;
      });
      return(result);
    },
    
    victory : function() {
      var allPadsActive = true;
      each(Game.state.pads, function(pad) {
        if(Game.check.boxAt(pad.x, pad.y)) {
          
        } else {
          allPadsActive = false;
        }
      });
      return(allPadsActive);
    },
    
    loss : function() {
      var playerCell = Game.grid.get(Game.player.x, Game.player.y);
      if(playerCell.type == 'creep') {
        Game.make.failMarker(playerCell);
        return(true);
      }
    },
    
    canMoveTo : function(x, y, byObject) {
      var cell = Game.grid.get(x, y);
      if(!cell) 
        return(false);
      console.log(x, y, cell.isWalkable);
      var canMove = cell.isWalkable;
      if(canMove && byObject && byObject.type == 'box') {
        var collision = Game.check.objectsAt(x, y);
        if(collision.length > 0) {
          canMove = false;
        }
      }
      return(canMove);
    },
    
    objectsAt : function(x, y) {
      var result = [];
      console.log(x, y);
      each(Game.state.objects, function(o) {
        if(o.x == x && o.y == y) 
          result.push(o);
      });
      return(result);
    },
    
    calculateStep : function(x, y, relX, relY, facing) {
      var dir = facing + (relX * Math.PI * -0.5);
      if(relX != 0)
        relY = 1;
      return({ 
        x : x + Math.round(Math.sin(dir) * relY),
        y : y + Math.round(Math.cos(dir) * relY)
      });
    },

  },
  
  'do' : {
    
    addCreep : function(cell) {
      if(!cell.isWalkable || cell.type != 'floor' || Game.check.boxAt(cell.x, cell.y))
        return;
      var o = new THREE.Mesh(Stage.shapes.creep, Stage.mat.creep);
      o.position.x = cell.pos.x;
      o.position.y = cell.pos.y;
      o.position.z = 0.0;
      cell.isWalkable = false;
      cell.type = 'creep';
      cell.creep = o;
      o.type = cell.type;      
      Stage.layers.map.add(o);    
    },
    
    removeCreep : function(cell) {
      cell.type = 'floor';
      cell.isWalkable = true;
      Stage.layers.map.remove(cell.creep);
      cell.creep = false;      
    },
    
    tick : function() {
      var creepList = [];
      Game.grid.each(function(cell) {
        if(cell.type == 'creep') {
          creepList.push(cell);
        }
      });      
      Game.grid.eachInAreaOf(creepList, 1, function(cell) {
        if(cell.type == 'floor' && cell.isWalkable && !Game.check.boxAt(cell.x, cell.y)) {
          Game.do.addCreep(cell);
          Game.do.prepareUndoStep(function() {
            Game.do.removeCreep(cell);
          });
        }
      });
    },
    
    loseLevel : function() {
      console.log('LOSS CONDITION DETCTED');
      Game.do.popUndoStep();
    },
    
    winLevel : function() {
      Game.do.showAnnouncement('WELL DONE!', function() {
        localStorage.setItem('current_level', Game.currentLevel.next);
        Game.initLevel(Levels[Game.currentLevel.next]);
        });   
      Game.state.levelEnded = true;         
    },
    
    showAnnouncement : function(text, whenDone) {
      $('#announcement').text(text).fadeIn(1000);
      Game.state.running = false;
      setTimeout(function() {
        Game.state.announcement = true;
        Game.state.announcementContinue = whenDone;
        }, 2000);
    },
    
    hideAnnouncement : function() {
      $('#announcement').fadeOut(1000);
      Game.state.running = true;
      Game.state.announcement = false;
      if(Game.state.announcementContinue) {
        var f = Game.state.announcementContinue;
        Game.state.announcementContinue = false;
        f();
      }
    },
    
    startUndoStep : function(f) {
      Game.currentUndoStep = [];
    },

    prepareUndoStep : function(f) {
      Game.currentUndoStep.push(f);
      // console.log('undo history ++', Game.state.history.length);
    },
    
    pushUndoStep : function(f) {
      Game.state.history.push(Game.currentUndoStep);
      // console.log('undo history ++', Game.state.history.length);
    },
    
    popUndoStep : function() {
      // console.log('undo history --', Game.state.history.length);
      if(Game.state.history.length == 0) return;
      var fList = Game.state.history.pop();
      if(fList && fList.length > 0) each(fList, function(f) { f(); });
    },
    
    initTargetPosition : function(o) {
      o.targetPosition = {
        x : o.position.x,
        y : o.position.y,
        z : o.position.z
        };
    },
    
    positionTransition : function(o) {
      if(!o.targetPosition) {
        console.log('no target', o);
        return;
      } else {
        o.position.x = o.position.x*(1-Game.player.animationSpeed) + o.targetPosition.x*Game.player.animationSpeed;
        o.position.y = o.position.y*(1-Game.player.animationSpeed) + o.targetPosition.y*Game.player.animationSpeed;
        o.position.z = o.position.z*(1-Game.player.animationSpeed) + o.targetPosition.z*Game.player.animationSpeed;
      }
    },
    
    movePlayerXY : function(x, y, optionalGrid) {
      if(!optionalGrid)
        optionalGrid = Game.grid;
      optionalGrid.projectCellToMap(x, y, Game.player.position);
      Game.player.x = x;
      Game.player.y = y;
      Game.player.facing = 0;
    },
    
    moveBoxXY : function(box, x, y) {
      var px = box.x;
      var py = box.y;
      var pstate = box.state;
      var cell = Game.grid.get(x, y);
      Game.do.prepareUndoStep(function() {
        box.x = px;
        box.y = py;
        box.state = pstate;
        Game.grid.projectCellToMap(box.x, box.y, box.targetPosition);
        });
      box.x = x;
      box.y = y;
      Game.grid.projectCellToMap(box.x, box.y, box.targetPosition);
      if(cell.type == 'destinationPad') {
        box.state = 'destination';
      } else {
        box.state = false;
      }
    },
        
    movePlayer : function(relX, relY) {      
      Game.do.startUndoStep();
      var next = Game.check.calculateStep(Game.player.x, Game.player.y, relX, relY, Game.player.facing);
      if(Game.check.canMoveTo(next.x, next.y)) {
        var canMove = true;
        var inFront = Game.check.objectsAt(next.x, next.y);          
        if(inFront.length > 0) {
          var box = inFront[0];            
          console.log('PUSH', box.type);
          if(box.type == 'box') {
            var dx = next.x - Game.player.x;
            var dy = next.y - Game.player.y;
            if(Game.check.canMoveTo(box.x + dx, box.y + dy, box)) {
              Game.do.moveBoxXY(box, box.x+dx, box.y+dy);
            } else {
              canMove = false;
              Game.make.failMarker(Game.grid.get(box.x+dx, box.y+dy));
            }
          }
        }
        if(canMove) {
          Game.do.destroyTile(Game.player.x, Game.player.y);
          Game.do.tick();
          var px = Game.player.x;
          var py = Game.player.y;
          Game.do.prepareUndoStep(function() {
            Game.player.x = px;
            Game.player.y = py;
            Game.grid.projectCellToMap(Game.player.x, Game.player.y, Game.player.targetPosition);
            });
          Game.player.x = next.x;
          Game.player.y = next.y;
          Game.grid.projectCellToMap(Game.player.x, Game.player.y, Game.player.targetPosition);
          Game.do.pushUndoStep();
          if(Game.check.victory()) {
            Game.do.winLevel();
          } else if(Game.check.loss()) {
            Game.do.loseLevel();
          }
        } else {
          Game.make.failMarker(Game.grid.get(next.x, next.y));
        }
      } else {
        Game.make.failMarker(Game.grid.get(next.x, next.y));
      }
    },
    
    rotatePlayer : function(by) {
      Game.player.facing += by * Math.PI * 0.5;      
    },
    
    destroyTile : function(x, y) {
      var cell = Game.grid.get(x, y);
      if(cell && cell.tile && cell.subType != 's') {
        var destroyAnimation = 1;
        Stage.animate(function(dt) {
          if(destroyAnimation == -1) return(false);
          destroyAnimation -= dt;
          if(destroyAnimation > 0) {
            cell.tile.rotation.x += dt*2;
            cell.tile.position.z -= dt*5;
            cell.tile.scale.z = destroyAnimation;
            cell.tile.scale.y = destroyAnimation;
            return(true);
          } else {
            cell.tile.visible = false;
            return(false);
          }          
          });
        cell.isWalkable = false;
        Game.do.prepareUndoStep(function() {
          cell.tile.visible = true;
          cell.tile.rotation.x = 0;
          cell.tile.scale.z = 1.0;
          cell.tile.scale.y = 1.0;
          cell.tile.position.z = -0.50;
          cell.isWalkable = true;
          destroyAnimation = -1; // cancel animation if still running
          });
      }
    },
    
  },
  
  make : {
    
    failMarker : function(cell) {
      var o = new THREE.Mesh(Stage.shapes.failMarker, Stage.mat.failMarker);
      o.position.x = cell.pos.x;
      o.position.y = cell.pos.y;
      o.position.z = 1;
      Stage.layers.map.add(o);
      var r = new THREE.Mesh(Stage.shapes.ring, Stage.mat.failMarker);
      r.position.x = cell.pos.x;
      r.position.y = cell.pos.y;
      r.position.z = 0.1;
      Stage.layers.map.add(r);
      var r2 = new THREE.Mesh(Stage.shapes.ring, Stage.mat.failMarker);
      r2.position.x = cell.pos.x;
      r2.position.y = cell.pos.y;
      r2.position.z = 0.1;
      Stage.layers.map.add(r2);
      Stage.animate(function(dt) {
        o.scale.z *= 1.1;
        o.scale.x *= 0.9;
        o.scale.y *= 0.9;
        r.scale.x *= 1.1;
        r.scale.y *= 1.1;
        if(o.scale.x < 0.05) {
          Stage.layers.map.remove(o);
          Stage.layers.map.remove(r);
          Stage.layers.map.remove(r2);
          return(false);
        } else {
          return(true);
        }
        });
    },
    
    wall : function(cell) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);
      var tile = new THREE.Mesh(Stage.shapes.tile, Stage.mat.tile);
      tile.position.x = cell.pos.x;
      tile.position.y = cell.pos.y;
      tile.position.z = 0.5;
      cell.type = 'wall';
      cell.isWalkable = false;
      tile.cell = cell;
      Stage.layers.map.add(tile);
    },
    
    floor : function(cell, subType) {
      var tile = new THREE.Mesh(Stage.shapes.tile, subType == 's' ? Stage.mat.safeFloor : Stage.mat.floor);
      tile.position.x = cell.pos.x;
      tile.position.y = cell.pos.y;
      tile.position.z = -0.5;
      cell.type = 'floor';
      cell.subType = subType;
      cell.isWalkable = true;
      tile.cell = cell;
      cell.tile = tile;
      Stage.layers.map.add(tile);
    },
    
    player : function(cell, optionalGrid) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);

      Game.player = new THREE.Mesh(Stage.shapes.player, Stage.mat.player);
      Game.player.position.z = 0.5;

      Game.player.head = new THREE.Mesh(new THREE.BoxBufferGeometry(0.60, 0.60, 0.60, 1, 1), Stage.mat.player);
      Game.player.head.position.z = 0.6;
      Game.player.add(Game.player.head);

      Game.do.movePlayerXY(cell.x, cell.y, optionalGrid);
      Game.do.initTargetPosition(Game.player);
      Game.player.facingCurrent = Game.player.facing;
      Game.player.animationSpeed = 0.2;
      Stage.layers.map.add(Game.player); 
    },
    
    box : function(cell) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);
      var box = new THREE.Mesh(Stage.shapes.box, Stage.mat.box);
      box.position.x = cell.pos.x;
      box.position.y = cell.pos.y;
      box.position.z = 0.5;
      box.x = cell.x;
      box.y = cell.y;
      Game.state.objects.push(box);
      box.type = 'box';
      Game.do.initTargetPosition(box);
      Stage.layers.boxes.add(box);
    },
    
    destinationPad : function(cell) {
      var o = new THREE.Mesh(Stage.shapes.destinationPad, Stage.mat.destinationPad);
      o.position.x = cell.pos.x;
      o.position.y = cell.pos.y;
      o.position.z = 0.0;
      cell.type = 'destinationPad';
      o.type = cell.type;
      cell.pad = o;
      Game.state.pads.push(cell);
      Stage.layers.map.add(o);
    },
    
    creep : function(cell) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);
      Game.do.addCreep(cell);
    },
    
    nothing : function(cell) {
      cell.type = 'nothing';
      cell.isWalkable = false;
    },

  },
  
  initLevel : function(l) {
    
    Game.do.hideAnnouncement();
    
    Stage.layers.remove('map');
    Stage.layers.remove('boxes');
    Stage.layers.create('map');
    Stage.layers.create('boxes');

    Game.state = {
      running : false,
      levelEnded : false,
      width : false,
      height : false,    
      objects : [],
      history : [],
      pads : [],
    };
  
    Game.currentLevel = l;
    
    Stage.camera.targetPosition = { x : 0, y : -3.5, z : 7 };
    Stage.camera.basePosition = { x : 0, y : -3.5, z : 7 };
    merge(Stage.camera.position, { x : 0, y : -5, z : 90 });
    merge(Stage.camera.rotation, { x : 0.4, y : 0, z : 0 });
    Stage.camera.updateMatrixWorld();
    Stage.root.rotation.z = Math.PI * 1.05;

    Game.state.width = l.map[0].length;
    Game.state.height = l.map.length;

    if(l.soundtrack) {
      Sound.fadeInPiece(l.soundtrack);
    } else {
      Sound.composePiece();
    }

    if(Game.grid)
      Game.grid.cells.length = 0;

    Game.grid = UGrid.create(Game.state.width, Game.state.height, {
      
      cellSize : 1.0,
      type : UGrid.square,
      enableDiagonal : false,
      
      mapOffsetX : -Game.state.width * 0.5 + 0.5,
      mapOffsetY : -Game.state.height * 0.5 + 0.5,
      
      onCreateCell : function(cell, grid) {
        cell.type = 'floor';
        cell.isWalkable = true;
        var char = Game.currentLevel.map[cell.y].substr(-1+Game.state.width-cell.x, 1);
        if(Game.currentLevel.defaultTile && char == ' ')
          char = Game.currentLevel.defaultTile;
        if(char == 'X') Game.make.wall(cell);
        else if(char == 'P') Game.make.player(cell, grid);
        else if(char == '0') Game.make.nothing(cell, grid);
        else if(char == 'B') Game.make.box(cell, grid);
        else if(char == '.') Game.make.destinationPad(cell, grid);
        else if(char == 'C') Game.make.creep(cell, grid);
        else if(char == 's') Game.make.floor(cell, char);
        else if(char == 'u') Game.make.floor(cell);
        else Game.make.floor(cell);
      },
      
    });
    
    console.log('new level init', Game.grid.cells.length);
    Game.state.running = true;
  },
  
  keys : {},
  
  on : {
    
    boxOnPad : function(pad, box) {
      
    },
    
    boxOffPad : function(pad) {
      
    },
    
    keydown : function(e) {
      Game.keys[e.key] = true;
      var keyevt = e.key+'_down';
      if(Game.on[keyevt])
        Game.on[keyevt](e);  
      Game.on.any_down(e);
    },
    
    keyup : function(e) {
      Game.keys[e.key] = false;
      Game.on.any_up(e);
    },
    
    any_down : function(e) {
      if(Game.state.announcement)
        Game.do.hideAnnouncement();
    },
    
    any_up : function(e) {
      
    },
    
    w_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(0, -1);
    },
    
    s_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(0, 1);
    },

    a_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(-1, 0);
    },

    d_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(1, 0);
    },

    ArrowUp_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(0, -1);
    },
    
    ArrowDown_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(0, 1);
    },

    ArrowLeft_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(-1, 0);
    },

    ArrowRight_down : function(e) {
      if(Game.state.running) Game.do.movePlayer(1, 0);
    },

    q_down : function(e) {
      if(Game.state.running) Game.do.rotatePlayer(-1);
    },

    e_down : function(e) {
      if(Game.state.running) Game.do.rotatePlayer(1);
    },

    z_down : function(e) {
      if(Game.state.running) Game.do.popUndoStep();
    },

    f_down : function(e) {
      if(Game.state.running) Game.do.popUndoStep();
    },

    r_down : function(e) {
      if(Game.state.running) Game.initLevel(Game.currentLevel);
    },

  },
  
  init : function() {
          
    Stage.shapes.slab = new THREE.BoxBufferGeometry(Game.state.width, Game.state.height, 2.0, 1, 1);
    Stage.shapes.tile = new THREE.BoxBufferGeometry(0.99, 0.99, 1.0, 1, 1);
    Stage.shapes.player = new THREE.BoxBufferGeometry(0.80, 0.80, 1.0, 1, 1);
    Stage.shapes.box = new THREE.BoxBufferGeometry(0.80, 0.80, 0.80, 1, 1);
    Stage.shapes.destinationPad = new THREE.BoxBufferGeometry(0.80, 0.80, 0.10, 1, 1);
    Stage.shapes.creep = new THREE.BoxBufferGeometry(1.0, 1.0, 0.10, 1, 1);
    Stage.shapes.failMarker = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0, 1, 1);
    Stage.shapes.ring = new THREE.RingBufferGeometry(0.5, 0.75, 32, 1);

    Stage.mat.slab = new THREE.MeshStandardMaterial({
      color : 0x999999,
      metalness : 0,
      roughness : 0.5,      
      });
    Stage.mat.tile = new THREE.MeshStandardMaterial({
      color : 0xBBBB99,
      metalness : 0,
      roughness : 1.0,      
      });
    Stage.mat.floor = new THREE.MeshStandardMaterial({
      color : 0x888888,
      metalness : 0,
      roughness : 0.15,      
      });
    Stage.mat.safeFloor = new THREE.MeshStandardMaterial({
      color : 0x88AA44,
      metalness : 0,
      roughness : 0.25,      
      });
    Stage.mat.player = new THREE.MeshStandardMaterial({
      color : 0xFF00FF,
      metalness : 0,
      emissive : 0x440044,
      roughness : 0.3,      
      });
    Stage.mat.box = new THREE.MeshStandardMaterial({
      color : 0x8888CC,
      metalness : 0,
      emissive : 0x000000,
      roughness : 0.0,      
      });      
    Stage.mat.destinationPad = new THREE.MeshStandardMaterial({
      color : 0x4488AA,
      metalness : 0,
      emissive : 0x0044AA,
      roughness : 0.0,      
      });      
    Stage.mat.creep = new THREE.MeshStandardMaterial({
      color : 0x669933,
      metalness : 0.3,
      roughness : 0.2,      
      });
    Stage.mat.failMarker = new THREE.MeshLambertMaterial({
      color : 0x990000,
      emissive : 0xAA0000,
      transparent: true, opacity: 0.5,
      });

    /*
    var slab = new THREE.Mesh(Stage.shapes.slab, Stage.mat.slab);
    slab.position.z = -1;
    Stage.layers.map.add(slab);
    */
    
    var ambient = new THREE.AmbientLight( 0x404040 ); 
    Stage.root.add( ambient );
    
    var directional = new THREE.DirectionalLight( 0x999944, 1.0 );
    directional.position.x = 1;
    directional.position.y = 1;
    directional.position.z = 10;
    Stage.root.add( directional );
        
    Stage.animate(function(dt) {

      Game.player.facingCurrent = Game.player.facingCurrent*(1-Game.player.animationSpeed) + Game.player.facing*Game.player.animationSpeed;
      Game.player.rotation.z = -Game.player.facingCurrent;
      Game.do.positionTransition(Game.player);
      
      Stage.camera.targetPosition.x = Stage.camera.basePosition.x - 0.2*(Game.player.position.x - Game.state.width/4);
      Stage.camera.targetPosition.y = Stage.camera.basePosition.y - 0.1*(Game.player.position.y - Game.state.height/4);
      Game.do.positionTransition(Stage.camera);
      
      //Stage.root.rotation.z += dt*0.05;
      each(Game.state.objects, function(o) {
        if(o.type == 'box') {
          Game.do.positionTransition(o);
        }
      });
      
      return(true);
      
    });
    
    var jumpLevel = localStorage.getItem('current_level');
    if(!jumpLevel)
      jumpLevel = Game.firstLevel;
    Game.initLevel(Levels[jumpLevel]);
       
  },
  
}

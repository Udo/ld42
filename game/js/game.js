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
          pad.active = true;
        } else {
          allPadsActive = false;
          pad.active = false;
        }
      });
      return(allPadsActive);
    },
    
    playerIsOnButton : function() {
      if(!Game.state.button)
        return(false);
      if(Game.player.x == Game.state.button.x && Game.player.y == Game.state.button.y)
        return(true);
    },
    
    loss : function() {
      var playerCell = Game.grid.get(Game.player.x, Game.player.y);
      if(playerCell.type == 'creep') {
        Game.make.marker(playerCell);
        return(true);
      }
    },
    
    canMoveTo : function(x, y, byObject) {
      var cell = Game.grid.get(x, y);
      if(!cell) 
        return(false);
      //console.log(x, y, cell.isWalkable);
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
      //console.log(x, y);
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
    
    updateStats : function() {
      Game.uiStepCounter.text(Game.state.stepCount);
      setTimeout(Game.do.updateStats, 300);
    },
    
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
    
    cleanAllCreep : function() {
      Sound.fx.zap.play();
      Game.grid.each(function(cell) {
        if(cell.creep && Game.state.creepStart != cell) {
          var cancelAnimation = false;
          Game.do.prepareUndoStep(function() {
            cancelAnimation = true;
            if(!cell.creep)
              Game.do.addCreep(cell);
          });
          Stage.animate(function(dt) {
            if(cancelAnimation)
              return;
            cell.creep.position.z += dt*10;
            cell.creep.rotation.x += dt*2;
            cell.creep.scale.x *= 0.9;
            cell.creep.scale.y *= 0.9;
            if(cell.creep.position.z > 5) {
              Game.do.removeCreep(cell);
              return(false);
            } else {
              return(true);
            }
            });
        }
      });
    },
    
    tick : function() {
      if(Game.check.playerIsOnButton()) {
        Game.make.marker(Game.state.button, Stage.mat.greenT);
        if(Game.currentLevel.onButton)
          Game.currentLevel.onButton();
      } else {
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
      }
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
      $('#announcement').html('<h1></h1>');
      Game.state.levelEnded = true;
      Sound.fx.win.play();   
      Game.player.liftoff = true;   
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
      if(Game.check.victory()) {
        Game.do.winLevel();
      } else if(Game.check.loss()) {
        Game.do.loseLevel();
      }
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
      Sound.fx.boxmove.rate(0.9 + Math.random()*0.2);
      Sound.fx.boxmove.play();
      if(cell.type == 'destinationPad') {
        box.state = 'destination';
        Sound.fx.activate.play();
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
              Game.make.marker(Game.grid.get(box.x+dx, box.y+dy));
            }
          }
        }
        if(canMove) {
          Game.state.stepCount++;
          Game.do.destroyTile(Game.player.x, Game.player.y);
          var px = Game.player.x;
          var py = Game.player.y;
          Game.do.prepareUndoStep(function() {
            Game.player.x = px;
            Game.player.y = py;
            Game.state.stepCount--;
            Game.grid.projectCellToMap(Game.player.x, Game.player.y, Game.player.targetPosition);
            });
          Game.player.x = next.x;
          Game.player.y = next.y;
          Game.grid.projectCellToMap(Game.player.x, Game.player.y, Game.player.targetPosition);
          Game.do.tick();
          if(Game.check.victory()) {
            Game.do.winLevel();
          } else if(Game.check.loss()) {
            Game.do.loseLevel();
          }
          Game.do.pushUndoStep();
        } else {
          Game.make.marker(Game.grid.get(next.x, next.y));
        }
      } else {
        Game.make.marker(Game.grid.get(next.x, next.y));
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
        Sound.fx.move.play();
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
    
    marker : function(cell, optionalMaterial) {
      if(!cell)
        return;
      if(!optionalMaterial)
        optionalMaterial = Stage.mat.marker;
      if(optionalMaterial == Stage.mat.marker)
        Sound.fx.fail.play();
      var o = new THREE.Mesh(Stage.shapes.marker, optionalMaterial);
      o.position.x = cell.pos.x;
      o.position.y = cell.pos.y;
      o.position.z = 1;
      Stage.layers.map.add(o);
      var r = new THREE.Mesh(Stage.shapes.ring, optionalMaterial);
      r.position.x = cell.pos.x;
      r.position.y = cell.pos.y;
      r.position.z = 0.1;
      Stage.layers.map.add(r);
      var r2 = new THREE.Mesh(Stage.shapes.ring, optionalMaterial);
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
    
    marker2 : function(cell, optionalMaterial, zOffset) {
      if(!cell)
        return;
      if(!zOffset)
        zOffset = 0;
      if(!optionalMaterial)
        optionalMaterial = Stage.mat.marker;
      var r = new THREE.Mesh(Stage.shapes.ring2, optionalMaterial);
      r.position.x = cell.pos.x;
      r.position.y = cell.pos.y;
      r.position.z = 0.1 + zOffset;
      r.scale.x = 0.01;
      r.scale.y = 0.01;
      Stage.layers.map.add(r);
      Stage.animate(function(dt) {
        if(r.scale.x < 0.5) {
          r.scale.x += dt/1;
          r.scale.y += dt/1;
        }
        r.position.z += dt*2.0;
        if(r.position.z > 4) {
          Stage.layers.map.remove(r);
          return(false);
        } else {
          return(true);
        }
        });
    },
    
    flyEffect : function(obj, optionalMaterial) {
      if(!optionalMaterial)
        optionalMaterial = Stage.mat.blueT;
      var r = new THREE.Mesh(Stage.shapes.ring2, optionalMaterial);
      r.position.x = obj.position.x;
      r.position.y = obj.position.y;
      r.position.z = obj.position.z + 0.70;
      r.scale.x = 0.25;
      r.scale.y = 0.25;
      Stage.layers.map.add(r);
      Stage.animate(function(dt) {
        r.scale.x += dt/1;
        r.scale.y += dt/1;
        if(r.position.z > 0.1)
          r.position.z -= dt*2.0;
        if(r.scale.x > 1.0) {
          Stage.layers.map.remove(r);
          return(false);
        } else {
          return(true);
        }
        });
    },
    
    wall : function(cell) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);
      var tile = new THREE.Mesh(Stage.shapes.tile, Stage.mat.safeFloor);
      tile.position.x = cell.pos.x;
      tile.position.y = cell.pos.y;
      tile.position.z = 0.5;
      cell.type = 'wall';
      cell.isWalkable = false;
      tile.cell = cell;
      Stage.layers.map.add(tile);
    },
    
    button : function(cell) {
      var floor = Game.make.floor(cell, Game.currentLevel.defaultTile);
      var o = new THREE.Mesh(Stage.shapes.sphere, Stage.mat.green);
      o.position.z = 0.5;
      var r2 = new THREE.Mesh(Stage.shapes.ring, Stage.mat.white);
      r2.position.z = 0.52;
      cell.type = 'floor';
      cell.hasButton = true;
      cell.isWalkable = true;
      o.cell = cell;
      floor.add(o);
      floor.add(r2);
      Game.state.button = cell;
    },
    
    floor : function(cell, subType, grid) {
      var floorMat = Stage.mat.floor;
      if(grid) {
        if(cell.x == 0 || cell.y == 0 || cell.x == grid.colCount-1 || cell.y == grid.rowCount-1)
          floorMat = Stage.mat.floor2;
      }
      var tile = new THREE.Mesh(Stage.shapes.tile, subType == 's' ? Stage.mat.safeFloor : floorMat);
      tile.position.x = cell.pos.x;
      tile.position.y = cell.pos.y;
      tile.position.z = -0.5 + Math.random()*0.05;
      tile.rotation.x = -0.025 + Math.random()*0.05;
      tile.rotation.y = -0.025 + Math.random()*0.05;
      cell.type = 'floor';
      cell.subType = subType;
      cell.isWalkable = true;
      tile.cell = cell;
      cell.tile = tile;
      Stage.layers.map.add(tile);
      return(tile);
    },
    
    player : function(cell, optionalGrid) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);

      Game.player = new THREE.Object3D();
      Game.player.position.z = 0.1;
      Game.player.flyAnimation = 0;

      Game.player.head = new THREE.Mesh(Stage.shapes.sphere, Stage.mat.whitePlastic);
      Game.player.head.position.z = 1.0;
      Game.player.head.scale.x = Game.player.head.scale.y = Game.player.head.scale.z = 0.75;
      Game.player.head.bobAnimation = 0;
      Game.player.add(Game.player.head);

      Game.player.body = new THREE.Mesh(Stage.shapes.sphere, Stage.mat.whitePlastic);
      Game.player.body.position.z = 0.5;
      Game.player.body.scale.z = 1.4;
      Game.player.add(Game.player.body);
      
      Game.player.light = new THREE.PointLight( 0x2288FF, 0.5, 3 );
      Game.player.light.position.z = 2;
      Game.player.add(Game.player.light);

      Game.do.movePlayerXY(cell.x, cell.y, optionalGrid);
      Game.do.initTargetPosition(Game.player);
      Game.player.position.z = 1000;
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
      var o = new THREE.Mesh(Stage.shapes.smallCube, Stage.mat.blueT);
      o.position.z = 0.38;
      box.add(o);
    },
    
    destinationPad : function(cell) {
      var o = new THREE.Mesh(Stage.shapes.destinationPad, Stage.mat.destinationPad);
      o.position.x = cell.pos.x;
      o.position.y = cell.pos.y;
      o.position.z = 0.0;
      cell.type = 'destinationPad';
      o.type = cell.type;
      cell.pad = o;
      cell.animationCounter = 0;
      Game.state.pads.push(cell);
      Stage.layers.map.add(o);
      o.marker = new THREE.Mesh(Stage.shapes.box, Stage.mat.blueT);
      o.marker.scale.x = 0.05;
      o.marker.scale.y = 0.05;
      o.marker.scale.z = 5.0;
      o.marker.position.z = 2.5;
      o.add(o.marker);
      o.light = new THREE.PointLight( 0x2244FF, 1.5, 2.0 );
      o.light.position.z = 0.5;
      o.add(o.light);
    },
    
    creep : function(cell) {
      Game.make.floor(cell, Game.currentLevel.defaultTile);
      Game.state.creepStart = cell;
      Game.do.addCreep(cell);
    },
    
    nothing : function(cell) {
      cell.type = 'nothing';
      cell.isWalkable = false;
    },
    
    background : function() {
      var o = new THREE.Mesh(new THREE.PlaneBufferGeometry(500, 500), Stage.mat.stars);
      o.position.z = -50;
      Stage.layers.map.add(o);
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
      stepCount : 0,
    };
  
    Game.currentLevel = l;
    Game.state.width = l.map[0].length;
    Game.state.height = l.map.length;
    
    var camZ = 7;
    var camY = -3.5;
    var mDim = Game.state.width > Game.state.height ? Game.state.width : Game.state.height;
    if(mDim > 8) {
      camZ += (mDim-8)*0.5;
      camY -= (mDim-8)*0.45;
    }
    
    Stage.camera.targetPosition = { x : 0, y : camY, z : camZ };
    Stage.camera.basePosition = { x : 0, y : camY, z : camZ };
    merge(Stage.camera.position, { x : 0, y : -5, z : 90 });
    merge(Stage.camera.rotation, { x : 0.4, y : 0, z : 0 });
    Stage.camera.updateMatrixWorld();
    Stage.root.rotation.z = Math.PI * 1.08;

    if(l.soundtrack) {
      Sound.fadeInPiece(l.soundtrack);
    } else {
      Sound.composePiece();
    }

    if(Game.grid)
      Game.grid.cells.length = 0;
      
    Game.make.background();

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
        else if(char == 'b') Game.make.button(cell, grid);
        else if(char == 's') Game.make.floor(cell, char);
        else if(char == 'u') Game.make.floor(cell, 'u', grid);
        else Game.make.floor(cell, ' ', grid);
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

    /*
    q_down : function(e) {
      if(Game.state.running) Game.do.rotatePlayer(-1);
    },

    e_down : function(e) {
      if(Game.state.running) Game.do.rotatePlayer(1);
    },
    */

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
  
  renderSettings : {},
  
  initRenderSettings : function() {
    Game.renderSettings = {
      pass : {
        render : new THREE.RenderPass(Stage.root, Stage.camera),
        //ssao : new THREE.SSAOPass(Stage.root, Stage.camera),
        fxaa : new THREE.ShaderPass( THREE.FXAAShader ),
        bloom : new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 ),
      },
      composer : new THREE.EffectComposer(Stage.renderer),
    }    

    if(Game.renderSettings.pass.ssao)
      Game.renderSettings.pass.ssao.radius = 2;
    if(Game.renderSettings.pass)
      Game.renderSettings.pass.bloom.threshold = 0.70;
    if(Game.renderSettings.pass.fxaa)
      Game.renderSettings.pass.fxaa.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

    var passCount = 0;
    each(Game.renderSettings.pass, function(pass) { passCount++; });

    var idxCounter = 0;
    each(Game.renderSettings.pass, function(pass) {
      pass.index = idxCounter++;
      if(pass.index >= passCount-1)
        pass.renderToScreen = true;
      Game.renderSettings.composer.addPass(pass);
    });
  },
  
  renderPasses : function() {
    Game.renderSettings.composer.render();
  },
  
  init : function() {
    
    Game.initRenderSettings();
    Stage.overrideRender = Game.renderPasses;
    
    Game.uiStepCounter = $('#stepcount');
    
    Stage.loadTexture = function(fn, size) {
      if(!size)
        size = 0.5;
      var texture = new THREE.TextureLoader().load( fn );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( size, size );
      return(texture);      
    };
          
    Stage.shapes.slab = new THREE.BoxBufferGeometry(Game.state.width, Game.state.height, 2.0, 1, 1);
    Stage.shapes.tile = new THREE.BoxBufferGeometry(0.99, 0.99, 1.0, 1, 1);
    Stage.shapes.player = new THREE.BoxBufferGeometry(0.80, 0.80, 0.2, 1, 1);
    Stage.shapes.box = new THREE.BoxBufferGeometry(0.80, 0.80, 0.80, 1, 1);
    Stage.shapes.smallCube = new THREE.BoxBufferGeometry(0.05, 0.05, 0.05, 1, 1);
    Stage.shapes.crate = new RoundedBoxGeometry(1, 1, 1, 0.1, 1);
    Stage.shapes.destinationPad = new THREE.BoxBufferGeometry(0.80, 0.80, 0.10, 1, 1);
    Stage.shapes.creep = new THREE.BoxBufferGeometry(1.0, 1.0, 0.10, 1, 1);
    Stage.shapes.marker = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0, 1, 1);
    Stage.shapes.ring = new THREE.RingBufferGeometry(0.3, 0.5, 32, 1);
    Stage.shapes.ring2 = new THREE.RingBufferGeometry(0.45, 0.5, 32, 1);
    Stage.shapes.sphere = new THREE.SphereBufferGeometry(0.3, 12, 12);
    
    Stage.tex = {};
    Stage.tex.floor = Stage.loadTexture('img/tile-stone-2.jpg');
    Stage.tex.stars = Stage.loadTexture('img/stars2.jpg', 5);

    Stage.mat.green = new THREE.MeshStandardMaterial({
      color : 0x33FF44,
      metalness : 0.2,
      roughness : 0.15,      
      });
    Stage.mat.white = new THREE.MeshStandardMaterial({
      color : 0xCCCCCC,
      metalness : 0.2,
      roughness : 0.15,      
      });
    Stage.mat.whitePlastic = new THREE.MeshStandardMaterial({
      color : 0xFFFFFF,
      metalness : 0.1,
      roughness : 0.0,      
      });
    Stage.mat.slab = new THREE.MeshStandardMaterial({
      color : 0x999999,
      metalness : 0,
      roughness : 0.5,      
      });
    Stage.mat.stars = new THREE.MeshStandardMaterial({
      color : 0x000000,
      emissive : 0x333333,
      emissiveMap : Stage.tex.stars,      
      });
    Stage.mat.tile = new THREE.MeshStandardMaterial({
      color : 0xAAAAAA,
      metalness : 0.3,
      roughness : 1.0,      
      bumpMap : Stage.tex.floor,
      bumpScale : 0.1,
      metalnessMap : Stage.tex.floor,
      roughnessMap : Stage.tex.floor,
      });
    Stage.mat.floor = new THREE.MeshStandardMaterial({
      color : 0x666666,
      metalness : 0.2,
      roughness : 0.15,      
      bumpMap : Stage.tex.floor,
      bumpScale : 0.01,
      metalnessMap : Stage.tex.floor,
      roughnessMap : Stage.tex.floor,
      });
    Stage.mat.floor2 = new THREE.MeshStandardMaterial({
      color : 0x666666,
      metalness : 0.5,
      roughness : 0.15,      
      bumpMap : Stage.tex.floor,
      bumpScale : 0.01,
      metalnessMap : Stage.tex.floor,
      roughnessMap : Stage.tex.floor,
      });
    Stage.mat.safeFloor = new THREE.MeshStandardMaterial({
      color : 0xDDDD88,
      metalness : 0.5,
      roughness : 0.15,      
      bumpMap : Stage.tex.floor,
      bumpScale : 0.001,
      metalnessMap : Stage.tex.floor,
      roughnessMap : Stage.tex.floor,
      });
    Stage.mat.player = new THREE.MeshStandardMaterial({
      color : 0xFF00FF,
      metalness : 0,
      emissive : 0x440044,
      roughness : 0.3,      
      });
    Stage.mat.box = new THREE.MeshStandardMaterial({
      color : 0x88AAFF,
      metalness : 0.5,
      emissive : 0x000000,
      roughness : 0.5,   
      metalnessMap : Stage.tex.floor,
      roughnessMap : Stage.tex.floor,
      });      
    Stage.mat.destinationPad = new THREE.MeshStandardMaterial({
      color : 0x4488AA,
      metalness : 0,
      emissive : 0x0088AA,
      roughness : 0.0,      
      });      
    Stage.mat.creep = new THREE.MeshStandardMaterial({
      color : 0x448888,
      metalness : 0.3,
      roughness : 0.2,
      emissive : 0xFF6600,      
      });
    Stage.mat.marker = new THREE.MeshLambertMaterial({
      color : 0x999900,
      emissive : 0xAA0000,
      transparent: true, opacity: 0.5,
      });
    Stage.mat.greenT = new THREE.MeshLambertMaterial({
      color : 0x339955,
      emissive : 0x33FF33,
      transparent: true, opacity: 0.75,
      });
    Stage.mat.blueT = new THREE.MeshLambertMaterial({
      color : 0x004488,
      emissive : 0x4488FF,
      transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending,
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
      if(Game.player.liftoff) {
        Game.player.targetPosition.z += dt;
        each(Stage.layers.boxes.children, function(box) {
          if(box.state == 'destination')
            box.targetPosition.z += dt;
        });
      }
      Game.do.positionTransition(Game.player);
      
      Stage.camera.targetPosition.x = Stage.camera.basePosition.x - 0.2*(Game.player.position.x - Game.state.width/4);
      Stage.camera.targetPosition.y = Stage.camera.basePosition.y - 0.1*(Game.player.position.y - Game.state.height/4);
      Stage.camera.targetPosition.z = Stage.camera.basePosition.z;
      Game.do.positionTransition(Stage.camera);
      
      //Stage.root.rotation.z += dt*0.05;
      each(Game.state.objects, function(o) {
        if(o.type == 'box') {
          Game.do.positionTransition(o);
        }
      });

      each(Game.state.pads, function(pad) { 
        if(pad.active) {
          pad.animationCounter += dt;
          pad.pad.marker.visible = true;
          if(pad.animationCounter > 0.5) {
            Game.make.marker2(pad, Stage.mat.blueT, 0.5);
            pad.animationCounter = 0;
          }
        } else {
          pad.pad.marker.visible = false;
        }
      });
      
      Game.player.head.bobAnimation += dt*3;
      Game.player.head.position.z = 1.1 + Math.sin(Game.player.head.bobAnimation)*0.02;
      Game.player.body.position.z = 0.5 + Math.cos(Game.player.head.bobAnimation)*0.05;
      Game.player.flyAnimation += dt*3;
      if(Game.player.flyAnimation > 0.25) {
        Game.player.flyAnimation = 0;
        Game.make.flyEffect(Game.player);
      }
      
      return(true);
      
    });
    
    var jumpLevel = localStorage.getItem('current_level');
    if(!jumpLevel)
      jumpLevel = Game.firstLevel;
    Game.initLevel(Levels[jumpLevel]);
       
  },
  
}

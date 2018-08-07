var GridMap3D = bindThis({
  
  init : function(grid, stage) {

    this.grid = grid;
    this.stage = stage;
    this.createCursor();
    this.createGroundPlane();

  },

  mousePlane : { xw : 0, yw : 0 },
  
  mouseToGroundPlane : function() {
    this.stage.raycaster.setFromCamera(this.stage.mouse, this.stage.camera);
    this.groundPlane.visible = true;
  	var hit = this.stage.raycaster.intersectObject( this.groundPlane );
    this.groundPlane.visible = false;
    if(hit[0]) {
      this.mousePlane.xw = -this.grid.mapOffsetX + (hit[0].uv.x-0.5)*1000;
      this.mousePlane.yw = -this.grid.mapOffsetY + (hit[0].uv.y-0.5)*1000;
      this.mousePlane.x = Math.round(this.mousePlane.xw / this.grid.cellSize);
      this.mousePlane.y = Math.round(this.mousePlane.yw / this.grid.cellSize);
    }
  },
  
  createGroundPlane : function() {
    this.groundPlane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000, 1 ), new THREE.MeshBasicMaterial() );
    this.groundPlane.visible = false;
    this.stage.root.add(this.groundPlane);
  },
  
  createCursor : function() {
    this.cursor = Stage.wireframe(new THREE.Mesh( this.stage.shapes.tile, this.stage.mat.cursor ));
    this.cursor.position.z = this.grid.cellSize*0.5;
    this.stage.layers.ui.add(this.cursor);
  },
  
  placeXY : function(o, pos) {
    o.position.x = this.grid.mapOffsetX + this.grid.cellSize * pos.x;
    o.position.y = this.grid.mapOffsetY + this.grid.cellSize * pos.y;
  },
  
  
})

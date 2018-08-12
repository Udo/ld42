var Sound = {

  loadingCount : 0,
  
  byIndex : [],
  
  load : function(f, iname, type, volume, onload) {
    Sound.loadingCount++;
    if(!Sound[type])
      Sound[type] = {};
    Sound[type][iname] = new Howl({
      src : ['music/'+f],
      autoplay : false,
      loop : false,
      onend : function() {
        Sound.onend(Sound[type][iname], iname, type);
      },
      onload : function() {
        Sound.loadingCount--;
        Sound.byIndex.push(Sound[type][iname]);
        Sound[type][iname].index = Sound.byIndex.length-1;
        console.log('sound loaded', f, iname, 'loading count', Sound.loadingCount);
        if(onload)
          onload(Sound[type][iname], iname);
        if(Sound.loadingCount == 0)
          Sound.onloaded();
        },
      });
  },
  
  onend : function(sound, iname, type) {
    if(type == 'music1') {
      Sound.stopAll();
      Sound.composePiece();
    }
  },
  
  onloaded : function() {
    if(Sound.deferred) {
      console.log('deferred sound action');
      Sound.deferred();
      Sound.deferred = false;
    }
    //Sound.composePiece();
  },

  selectFromList : function(listName, count, into) {
    var list = [];
    each(Sound[listName], function(m, key) { list.push(m); });
    for(var i = 0; i < count; i++) {
      var m = selectRandom(list, true);
      into.push(m.index);
    }
  },
  
  composePiece : function() {
    return;
    var tracks = [];
    Sound.selectFromList('music1', 3+Math.round(2*Math.random()), tracks);
    console.log('COMPOSE tracks', tracks);
    Sound.fadeInPiece(tracks);
  },
  
  currentPiece : false,
  
  fadeAll : function() {
    each(Sound.music1, function(m) {
      if(m.playing())
        m.fade(m.volume(), 0, 2000);
    });
  },
  
  stopAll : function() {
    each(Sound.music1, function(m) {
      if(m.playing())
        m.stop();
    });
  },
  
  fadeInPiece : function(desc) {    
    return;
    if(Sound.loadingCount > 0) {
      Sound.deferred = function() {
        Sound.fadeInPiece(desc);
        };
      return;
    }
    if(desc.join() === Sound.currentPiece) {
      console.log('already playing', desc);
      return;
    }
    Sound.currentPiece = desc.join();
    Sound.fadeAll();
    setTimeout(function() {
      Sound.stopAll();
      Sound.startPiece(desc);
      }, 3000);
  },

  startPiece : function(desc) {
    return;
    var piece = { tracks : [] };
    console.log('SOUND STARTING', desc);
    each(desc, function(idx, k) {
      if(k > 1) return;
      var track = Sound.byIndex[idx];
      piece.tracks.push(track);
      track.play();
      track.volume(0.3/*-k*0.05*/);
    });
  },
  
  init : function() {
    Sound.load('fx-activate.ogg', 'activate', 'fx');
    Sound.load('fx-boxmove.ogg', 'boxmove', 'fx', 0.5);
    Sound.load('fx-fail.ogg', 'fail', 'fx', 0.5);
    Sound.load('fx-move.ogg', 'move', 'fx', 0.5);
    Sound.load('fx-win.ogg', 'win', 'fx', 0.5);
    Sound.load('fx-zap.ogg', 'zap', 'fx', 0.5);

    return;
    Sound.load('Orchestral Kit_bip.ogg', 'perc1', 'music1');
    Sound.load('Quirky Moments_bip.ogg', 'perc2', 'music1');
    Sound.load('Wave Space_bip.ogg', 'perc3', 'music1');
    Sound.load('Airways_bip.ogg', 'pad1', 'music1');
    Sound.load('Classical Ensemble Swells_bip.ogg', 'pad2', 'music1');

    Sound.load('Full Strings_bip_1.ogg', 'pad3', 'music1');
    Sound.load('Full Strings_bip.ogg', 'pad4', 'music1');
    Sound.load('Shifting Panels_bip.ogg', 'pad4', 'music1');
    Sound.load('Classic Analog Arp_bip.ogg', 'bass1', 'music1');
    Sound.load('Fluid Bass_bip.ogg', 'bass2', 'music1');

    Sound.load('Steinway Grand Piano_bip.ogg', 'bass3', 'music1');
    Sound.load('Airship Rising.ogg', 'pad5', 'music1');
    Sound.load('Bass Wave Cycles2.ogg', 'bass4', 'music1');
  },
  
}


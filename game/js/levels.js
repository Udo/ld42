var Levels = {
  
  l01 : {
    name : '1',
    next : 'l02',
    map : [
      'P  B  .',
    ],
    soundtrack : 'track1',
  },
  
  l02 : {
    name : '2',
    next : 'l03',
    defaultTile : 's',
    map : [
      '       ',
      '       ',
      ' PBX.  ',
      '       ',
      '       ',
    ],
    soundtrack : 'track2',
  },

  l03 : {
    name : '3',
    next : 'l04',
    defaultTile : 's',
    map : [
      '  uuu  ',
      '  uuu  ',
      ' PBX.  ',
      '  uuu  ',
      '  uuu  ',
    ],
    soundtrack : 'track3',
  },

  l04 : {
    name : '4',
    next : 'l05',
    map : [
      '    X0000',
      '  B X0000',
      '    XXXXX',
      '      B  ',
      'ss     P ',
      '.s       ',
      '.s       ',
    ],
    soundtrack : 'track4',
  },
  
  l05 : {
    name : '5',
    next : 'l06',
    map : [
      'X  XXXXXXX',
      'X         ',
      'X.s   B   ',
      'X.s    PB ',
      'X.s   B   ',
      'X         ',
      'X         ',
      'X  XXXXXXX',
    ],
    soundtrack : 'track5',
  },

  l06 : {
    name : '6',
    next : 'l07',
    map : [
      '   X     ',
      '         ',
      ' . X B   ',
      '     P   ',
      ' . X B   ',
      '         ',
      '   X     ',
    ],
    soundtrack : 'track1',
  },

  l07 : {
    name : '7',
    next : 'l08',
    map : [
      '  B..B   ',
      '       B ',
      'P  XX  . ',
      '   XX  . ',
      '       B ',
      '  B..B   ',
      '         ',
    ],
    soundtrack : 'track2',
  },

  l08 : {
    name : '8',
    next : 'l09',
    map : [
      '       CX',
      '      XXX',
      '         ',
      ' P       ',
      '         ',
      '         ',
      ' B B B B ',
      '   . .   ',
    ],
    soundtrack : 'track3',
  },

  l09 : {
    name : '9',
    next : 'l10',
    map : [
      'X  C X',
      '      ',
      '   PB ',
      '  B.B ',
      '   B  ',
      'X    X',
    ],
    soundtrack : 'track4',
  },

  l10 : {
    name : '10',
    next : 'l11',
    map : [
      '                  ',
      '      P           ',
      '      B.B     XXX ',
      '    B     B   X   ',
      '    .     .   X XX',
      '    B     B   X  C',
      '    B  b  B   X  C',
      '    .     .   X XX',
      '    B     B   X   ',
      '      B.B     XXX ',
      '                  ',
      '                  ',
    ],
    soundtrack : 'track5',
    onButton : function() {
      Game.do.cleanAllCreep();
    },
    later : [5, 9, 8, 12, 7],
  },

  l11 : {
    name : '42',
    next : 'l11',
    map : [
      '            ',
      '            ',
      '     P .    ',
      '            ',
      '            ',
      '            ',
    ],
    onStart : function() {
      Game.do.showAnnouncement('WELL DONE!', function() {
        localStorage.setItem('current_level', 'l01');
        Game.initLevel(Levels.l01);
        });   
      $('#announcement').html('<h1>BOX RESCUE: COMPLETE</h1>'+
        '<div>THIS GAME WAS MADE IN 48 HOURS</div>'+
        '<div>BY UDO SCHROETER</div>'+
        '<div>FOR <a href="https://ldjam.com/events/ludum-dare/42/box-rescue">LUDUM DARE 42</a></div>'+
        '<div></div>'+
        '<div>I hope this was as fun to play as it was to make :)</div>');
      Game.state.levelEnded = true;
    },
    soundtrack : 'track1',
  },

};

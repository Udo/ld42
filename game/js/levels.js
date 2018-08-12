var Levels = {
  
  l01 : {
    next : 'l02',
    map : [
      'P  B  .',
    ],
    soundtrack : [1, 2, 3, 4, 12],
  },
  
  l02 : {
    next : 'l03',
    defaultTile : 's',
    map : [
      '       ',
      '       ',
      ' PBX.  ',
      '       ',
      '       ',
    ],
    soundtrack : [1, 8, 0, 3, 2],
  },

  l03 : {
    next : 'l04',
    defaultTile : 's',
    map : [
      '  uuu  ',
      '  uuu  ',
      ' PBX.  ',
      '  uuu  ',
      '  uuu  ',
    ],
    soundtrack : [3, 8, 10, 1, 9],
  },

  l04 : {
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
    soundtrack : [0, 11, 2, 8, 7],
  },
  
  l05 : {
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
    soundtrack : [5, 1, 3, 0, 10],
  },

  l06 : {
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
    soundtrack : [3, 6, 0, 2, 4],
  },

  l07 : {
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
    soundtrack : [7, 9, 0, 11],
  },

  l08 : {
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
    soundtrack : [8, 0, 9, 10],
  },

  l09 : {
    next : 'l10',
    map : [
      'X  C X',
      '      ',
      '   PB ',
      '  B.B ',
      '   B  ',
      'X    X',
    ],
    soundtrack : [10, 2, 1, 9, 4],
  },

  l10 : {
    next : 'l10',
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
    soundtrack : [11, 12, 3, 6],
    onButton : function() {
      Game.do.cleanAllCreep();
    },
    later : [5, 9, 8, 12, 7],
  },

};

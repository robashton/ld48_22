define(function(require) {
  var Game = require('./src/game');

  var currentGame = null;

  var onGameReady = function() {
    $('#game-container').show();
    $('#loading').hide();
    $('#splash').hide();
  };

  var startGame = function() {
    $('#game-container').hide();
    $('#loading').show();
    $('#splash').hide();
    currentGame = new Game();
    currentGame.on('ready', onGameReady);
    currentGame.start();
  };

  var showInstructions = function() {
    
  };

  $(document).ready(function() {
    $('#game-container').hide();
    $('#loading').hide();
    $('#splash').show();

    $('#start-game').click(startGame);
    $('#instructions').click(showInstructions);
  });
 });

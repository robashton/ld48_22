define(function(require) {

var Entity = require('../libs/layers/scene/entity');

return function() {
  Entity.call(this); var self = this;

  var inputElement = document
  ,   scene = null
  ,   layer = null
  ,   impulseLeft = false
  ,   impulseRight = false
  ,   impulseUp = false
  ,   firing = false
  ;

  self.id = function() { return 'controller'; }

  self.tick = function() {
    scene.withEntity('player', function(player) {    
      if(impulseLeft) 
        player.moveLeft();
      if(impulseRight)
        player.moveRight();
      if(impulseUp)
        player.moveUp();
      if(firing)
        player.fire();
    });
  };

  var onKeyDown = function(e) {
    switch(e.keyCode) {
      case 37:
        impulseLeft = true;
        break;
      case 38:
        impulseUp = true;
        break;
      case 39:
        impulseRight = true;
        break;
      case 88:
        firing = true
        break;
    }
  };

  var onKeyUp = function(e) {
    switch(e.keyCode) {
      case 37:
        impulseLeft = false;
        break;
      case 38:
        impulseUp = false;
        break;
      case 39:
        impulseRight = false;
        break;
      case 88:
        firing = false;
        break;
    }
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(8.0);
  };

  inputElement.onkeydown = onKeyDown;
  inputElement.onkeyup  = onKeyUp;
  self.on('addedToScene', onAddedToScene);
};
});

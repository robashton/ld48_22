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
  ,   lookUp = false
  ,   lookDown = false
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
      if(lookUp)
        player.lookUp();
      if(lookDown)
        player.lookDown();
      if(firing)
        player.fire();
    });
  };

  var onKeyDown = function(e) {
    switch(e.keyCode) {
      case 32:
        impulseUp = true;
        break;
      case 37:
        impulseLeft = true;
        break;
      case 38:
        lookUp = true;
        break;
      case 39:
        impulseRight = true;
        break;
      case 40:
        lookDown = true;
        break;
      case 88:
        firing = true;
        break;
      default:
        return;
    }
    return false;
  };

  var onKeyUp = function(e) {
    switch(e.keyCode) {
      case 32:
        impulseUp = false;
        break;
      case 37:
        impulseLeft = false;
        break;
      case 38:
        lookUp = false;
        break;
      case 39:
        impulseRight = false;
        break;
      case 40:
        lookDown = false;
        break;
      case 88:
        firing = false;
        break;
      default:
        return;
    }
    return false;
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

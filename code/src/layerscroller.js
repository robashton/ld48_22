define(function(require) {

var Entity = require('../libs/layers/scene/entity');

return function(){
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   topLayer = null
  ;
    
  self.id = function() { return "scroller"; }
  
  self.tick = function() {
    scene.withEntity('player', function(player) {
    
      var position = player.getPosition();

      scrollx = position[0] - (topLayer.getWidth() / 2.0); 
      scrolly = position[1] - (topLayer.getHeight() / 2.0);

      scene.eachLayer(function(layer) {
        layer.transformX(scrollx);
        layer.transformY(scrolly);
      });

    });
  };


  var onAddedToScene = function(data) {
    scene = data.scene;
    topLayer = scene.getLayer(8.0);
  };
  
  self.on('addedToScene', onAddedToScene);  
};

});

define(function() {

return function(scene) {
  var self = this;

  var onPickupCollected = function(data) {
    var pickup = data.pickup;
    scene.removeEntity(pickup);
  }; 

  scene.on('collected', onPickupCollected);
};

});

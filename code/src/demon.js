define(function(require) {

var Npc = require('./npc');

return function(depth) {
  Npc.call(this, "demon", depth);

  var self = this
  ,   health = 15
  ;

  self.notifyBulletHit = function() {
   health--;
   self.raise('health-changed', {
    health: health
   });
   if(health === 0)
    self.raise('killed');
  };

  var oldTick = self.tick;
  self.tick = function() {
    determineIfShouldShoot();
    oldTick();
  };

  var determineIfShouldShoot = function() {

  };

  var chooseDestination = function() {

    var x = (Math.random() * 450) + 840;
    var y = (Math.random() * 200) + 840;

    self.moveTo(x, y);   
  };


  self.setDimensions(64, 64);
  self.setPhysics(false);
  self.on('reached-destination', chooseDestination);

  chooseDestination();
};

});

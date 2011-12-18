define(function(require) {

var Npc = require('./npc');

return function(depth) {
  Npc.call(this, "demon", depth);

  var self = this
  ,   health = 15
  ,   firingRate = 10
  ,   ticks = 0
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
    ticks++;
    determineIfShouldShoot();
    oldTick();
  };

  var determineIfShouldShoot = function() {
   scene.withEntity('player', function(player) {
      if(Math.abs(self.bounds().x - player.bounds().x) < 50)
        fire();
   });
  };

  var fire = function() {
    if(ticks % firingRate !== 0) return;
    self.raise('fired', {
      sender: self.id(),
      x: self.bounds().x + self.bounds().width / 2.0,
      y: self.bounds().y + self.bounds().height,
      direction: "down",
      size: 20
      });    
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

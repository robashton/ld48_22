define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Material = require('../libs/layers/render/material');

return function(depth, maxBullets) {
  Entity.call(this);

  var self = this
  ,   layer = null
  ,   scene = null  
  ,   bullets = []
  ,   ticks = 0
  ,   bulletMaterial = new Material(255,255,255)
  ;

  self.id = function() { return 'bullets'; }

  self.tick = function() {
    ticks++;
    updateBullets();
  };

  self.setLayer = function(ignored) {};

  self.render = function(context) {
    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(!bullet.active) continue;
      context.fillRect(bullet.x * layer.getRenderScaleFactor(), bullet.y * layer.getRenderScaleFactor(), depth, 0, bullet.size, bullet.size, bulletMaterial);
    }
  };

  var updateBullets = function() {
    var level = scene.getEntity('current-level');

    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(!bullet.active) continue;
      if(bullet.lifetime < (ticks - bullet.started)) {
        bullet.active = false;
        continue;
      }
      bullet.x += bullet.velx;
      bullet.y += bullet.vely;

      if(level.isPointInWall(bullet.x, bullet.y)) {
        bullet.active = false;
        continue;
      }
    
      scene.each(function(entity) {
        if(!entity.bounds) return;
        if(entity.id() === bullet.sender) return;

        var bounds = entity.bounds();
        if(bullet.x > bounds.x + bounds.width) return;
        if(bullet.y > bounds.y + bounds.height) return;
        if(bullet.x + bullet.size < bounds.x) return;
        if(bullet.y + bullet.size < bounds.y) return;
        
        bullet.active = false;
        self.raise('bullet-hit', {
          x: bullet.x,
          y: bullet.y        
        });          

        if(entity.notifyBulletHit) 
          entity.notifyBulletHit();    
      });  
    }
  };

  var onEntityFired = function(data) {
    addBulletToScene(data.x, data.y, data.sender, data.direction, data.size);
  };

  var addBulletToScene = function(x, y, sender, direction, size) {
    for(var i = 0 ; i < maxBullets; i++) {
      var bullet = bullets[i];
      if(bullet.active) continue;

      bullet.x = x;
      bullet.y = y;
      bullet.sender = sender;
      bullet.size = size;
      bullet.started = ticks;

      switch(direction) {
        case "left":
          bullet.velx = -10.0;
          bullet.vely = 0;
          break;
        case "right":
          bullet.velx = 10.0;
          bullet.vely = 0;
          break;
        case "down":
          bullet.velx = 0;
          bullet.vely = 10.0;
          break;
        case "up":
          bullet.velx = 0;
          bullet.vely = -10.0;
          break;
        default:
          return;
      }
      bullet.active = true;
      return;
    }
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(depth);
    layer.addRenderable(self);
    scene.on('fired', onEntityFired);
    createInitialBullets();
  };

  var createInitialBullets = function() {
    for(var i = 0 ; i < maxBullets; i++) {
      bullets.push({
        active: false,
        id: i,
        x: 0,
        y: 0,
        size: 0,
        vely: 0,
        velx: 0,
        lifetime: 30,
        started: 0
      });
    };
  };

  self.on('addedToScene', onAddedToScene); 

};

});

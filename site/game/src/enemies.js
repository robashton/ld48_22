define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Enemy = require('./enemy');

  
return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   layer = null
  ,   trackedEnemies = {}
  ;

  self.id = function() { return "enemies"; }

  self.generateEnemies = function() {
    removeExistingEnemies();
    addEnemiesRandomlyToScene();
  };

  var addEnemiesRandomlyToScene = function() {
    for(var i = 0 ; i < 300; i++) {
      var x = Math.random() * 1000;
      var y = Math.random() * 1000;
      var enemy = new Enemy('enemy-' + i, 'img/basicenemy.png', x , y , 8.0,  20, 20);
      trackedEnemies[enemy.id()] = enemy;
      scene.addEntity(enemy);      
    }
  };  

  var removeExistingEnemies = function() {
    for(var i in trackedEnemies) {
      scene.removeEntity(trackedEnemies[i]);
      delete trackedEnemies[i];
    };
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    layer = scene.getLayer(8.0);
    scene.on('enemy-killed', onEnemyKilled);
  };

  var onRemovedFromScene= function() {
    removeExistingEnemies();
  };

  var onEnemyKilled = function(data) {
    var enemy = data.enemy;
    delete trackedEnemies[enemy.id()];
    scene.removeEntity(enemy);
  };
   
  self.on('addedToScene', onAddedToScene);
  self.on('removedFromScene', onRemovedFromScene);
};    

});

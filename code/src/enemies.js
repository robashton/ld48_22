define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Enemy = require('./enemy');

  
return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   trackedEnemies = {}
  ;

  self.id = function() { return "enemies"; }

  self.generateEnemies = function() {
    removeExistingEnemies();
    addEnemiesRandomlyToScene();
  };

  var addEnemiesRandomlyToScene = function() {
    
  };  

  var removeExistingEnemies = function() {
    for(var i in trackedEnemies) {
      scene.removeEntity(trackedEnemies[i]);
      delete trackedEnemies[i];
    };
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
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

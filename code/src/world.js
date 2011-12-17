define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Player = require('./player');
var Level = require('./level');
var Controller = require('./controller');

return function() {
  Entity.call(this);

  var self = this
  ,   loadedLevel = null
  ,   scene = null
  ,   player = null
  ,   controls = null
  ;

  self.id = function() { return 'world'; }

  self.loadLevel = function(path) {
    loadedLevel = new Level('img/test_level.png', 800, 600);
    scene.addEntity(loadedLevel);
    addPlayer();
    addControls();
  };

  self.unloadLevel = function() {
    if(loadedLevel) {
      scene.removeEntity(loadedLevel);
      loadedLevel = null;
    }
    removePlayer();    
    removeControls();
  };
  
  var addPlayer = function() {
    player = new Player(8.0);
    scene.addEntity(player);
  };

  var addControls = function() {
    controls = new Controller();
    scene.addEntity(controls);
  };

  var removeControls = function() {
    scene.removeEntity(controls);
    controls = null;
  };

  var removePlayer = function() {
    scene.removeEntity(player);
    player = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.addLayer(8.0);
  };

  self.on('addedToScene', onAddedToScene); 
};

}); 

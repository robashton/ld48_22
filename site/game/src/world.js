define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Player = require('./player');
var Level = require('./level');
var Controller = require('./controller');
var Scroller = require('./layerscroller');

return function() {
  Entity.call(this);

  var self = this
  ,   loadedLevel = null
  ,   scene = null
  ,   player = null
  ,   controls = null
  ,   scroller = null
  ;

  self.id = function() { return 'world'; }

  self.loadLevel = function(path) {
    loadedLevel = new Level('main');
    scene.addEntity(loadedLevel);
    addPlayer();
    addControls();
    addScroller();
  };

  self.unloadLevel = function() {
    if(loadedLevel) {
      scene.removeEntity(loadedLevel);
      loadedLevel = null;
    }
    removePlayer();    
    removeControls();
    removeScroller();
  };
  
  var addPlayer = function() {
    player = new Player(8.0);
    player.setPosition(20, 20);
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
  
  var addScroller = function() {
    scroller = new Scroller();
    scene.addEntity(scroller);
  };

  var removeScroller = function() {
    scene.removeEntity(scroller);
    scroller = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.addLayer(8.0);
  };

  self.on('addedToScene', onAddedToScene); 
};

}); 

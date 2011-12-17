define(function(require) {

var Entity = require('../libs/layers/scene/entity');
var Player = require('./player');
var Level = require('./level');
var Controller = require('./controller');
var Scroller = require('./layerscroller');
var StoryTeller = require('./storyteller');
var Collision = require('./collision');

return function() {
  Entity.call(this);

  var self = this
  ,   loadedLevel = null
  ,   scene = null
  ,   player = null
  ,   controls = null
  ,   scroller = null
  ,   story = null
  ,   collision = null
  ;

  self.id = function() { return 'world'; }

  self.loadLevel = function(path) {
    loadedLevel = new Level('main');
    scene.addEntity(loadedLevel);
    loadedLevel.on('loaded', onLevelLoaded);
  };

  self.unloadLevel = function() {
    if(loadedLevel) {
      scene.removeEntity(loadedLevel);
      loadedLevel = null;
    }
    removePlayer();    
    removeControls();
    removeScroller();
    removeStoryTeller();
    removeCollision();
  };

  var onLevelLoaded = function() {
    addPlayer();
    addControls();
    addScroller();
    addStoryTeller();
    addCollision();
    self.raise('ready');
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

  var addStoryTeller = function() {
    story = new StoryTeller();
    scene.addEntity(story);
  };

  var removeStoryTeller = function() {
    scene.removeEntity(story);
    story = null;
  };

  var addCollision = function() {
    collision = new Collision();
    scene.addEntity(collision);
  };

  var removeCollision = function() {
    scene.removeEntity(collision);
    collision = null;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    scene.addLayer(8.0);
  };

  self.on('addedToScene', onAddedToScene); 
};

}); 

define(function(require) {

var MessageDisplay = require('./messagedisplay');
var Entity = require('../libs/layers/scene/entity');
var Rabbit = require('./rabbit');

var PLAYER_AVATAR = "img/playeravatar.png";
var RABBIT_AVATAR = "img/rabbitavatar.png";

return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   world = null
  ,   messages = []
  ,   currentMessage = null
  ,   messageDisplay = null
  ,   currentWaiter = null
  ,   currentHooks = {}
  ;

  self.id = function() { return 'storyteller' };
  self.tick = function() {
    for(var i in currentHooks)
      currentHooks[i]();
  };

  var onWorldReady = function() {
    addMessageDisplay();
    showMessage("I have been in this room since I can remember", PLAYER_AVATAR );
    showMessage("I am fed, I have somewhere to sleep and it is warm", PLAYER_AVATAR );
    showMessage("There is no exit, this is all I know", PLAYER_AVATAR );
    showMessage("I am... alone");
    onMessagesFinished(addRabbitToScene);
  };

  var rabbit = null;
  var addRabbitToScene = function() {
    rabbit = new Rabbit(8.0);
    rabbit.setPosition(90, 100);
    scene.addEntity(rabbit);
    setTimeout(tellPlayerHereToRescueHim, 2000);
  };

  var tellPlayerHereToRescueHim = function() {
    showMessage("Hi, I am here to get you out", RABBIT_AVATAR);
    showMessage("What... what.... who are you?", PLAYER_AVATAR);
    showMessage("That doesn't matter, just come down here when I open the door", RABBIT_AVATAR);
    onMessagesFinished(openCellDoor);
  };

  var openCellDoor = function() {
    removeEntity("first_door");
    updateEntityState("first_lever", "open");
    whenPlayerReaches(rabbit, tellHimAboutThePlan);
  };  

  var tellHimAboutThePlan = function() {
    showMessage("Hi, my name is rabbit", RABBIT_AVATAR);
    showMessage("Will.. will you be my friend?", PLAYER_AVATAR);
    showMessage("Er.. sure, if you give me a carrot", RABBIT_AVATAR);
    
  };

  var whenPlayerReaches = function(entity, callback) {
    currentHooks["player_reached_target"] = function() {
      var player = scene.getEntity('player');
      if(distanceBetweenEntities(entity, player) > 30) return;
      delete currentHooks["player_reached_target"];
      callback();
    };
  };

  var distanceBetweenEntities = function(one, two) {
    if(!one.bounds || !two.bounds) { console.warn("Distance between entities without bounds"); return 0; }

    var boundsOne = one.bounds();
    var boundsTwo = two.bounds();
    
    var pOne = vec3.create([boundsOne.x + boundsOne.width / 2.0, boundsOne.y + boundsOne.height / 2.0, 0]);
    var pTwo = vec3.create([boundsTwo.x + boundsTwo.width / 2.0, boundsTwo.y + boundsTwo.height / 2.0, 0]);
    
    vec3.subtract(pTwo, pOne);
    return vec3.length(pTwo);
  };

  var updateEntityState = function(entity, newState) {
    console.warn("Not implemented");
  };

  var removeEntity = function(id) {
    var entity = scene.getEntity(id);
    scene.removeEntity(entity);
  };

  var onMessagesFinished = function(callback) {
    currentWaiter = callback;
  };

  var onAddedToScene = function(data) {
    scene = data.scene;
    world = scene.getEntity('world');
    world.on('ready', onWorldReady);
  };

  var addMessageDisplay = function() {
    messageDisplay = new MessageDisplay();
    messageDisplay.on('messageclosed', onMessageClosed);
  };

  var showMessage = function(text) {
    messages.push({text: text});
    tryShowNextMessage();
  };

  var tryShowNextMessage = function() {
    if(currentMessage) return;
    if(messages.length === 0) return;

    currentMessage = messages.shift();
    messageDisplay.setMessage(currentMessage.text);
  };

  var onMessageClosed = function() {
    currentMessage = null;
    if(messages.length === 0) {
      if(currentWaiter) {
        var callback = currentWaiter;
        currentWaiter = null;
        callback();
      }  
    } else {
      tryShowNextMessage();
    }
  };
  
  self.on('addedToScene', onAddedToScene);
};

});










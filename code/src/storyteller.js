define(function(require) {

var MessageDisplay = require('./messagedisplay');
var Entity = require('../libs/layers/scene/entity');
var Rabbit = require('./rabbit');

return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   world = null
  ,   messages = []
  ,   currentMessage = null
  ,   messageDisplay = null
  ,   currentWaiter = null
  ;

  self.id = function() { return 'storyteller' };

  var onWorldReady = function() {
    addMessageDisplay();
    showMessage("I have been in this room since I can remember");
    showMessage("I am fed, I have somewhere to sleep and it is warm");
    showMessage("There is no exit, this is all I know");
    showMessage("I am... alone");
    onMessagesFinished(addRabbitToScene);
  };

  var rabbit = null;
  var addRabbitToScene = function() {
    rabbit = new Rabbit(8.0);
    rabbit.setPosition(90, 100);
    scene.addEntity(rabbit);
  };

  











  onMessagesFinished = function(callback) {
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










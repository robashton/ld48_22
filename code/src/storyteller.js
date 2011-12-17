define(function(require) {

var MessageDisplay = require('./messagedisplay');
var Entity = require('../libs/layers/scene/entity');

return function() {
  Entity.call(this);

  var self = this
  ,   scene = null
  ,   world = null
  ,   messages = []
  ,   currentMessage = null
  ,   messageDisplay = null
  ;

  self.id = function() { return 'storyteller' };

  var onWorldReady = function() {
    addMessageDisplay();
    showMessage("I have been in this room since I can remember");
    showMessage("I am fed, I have somewhere to sleep and it is warm");
    showMessage("There is no exit, this is all I know");
    showMessage("I am");
    showMessage("alone");
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
    tryShowNextMessage();
  };
  
  self.on('addedToScene', onAddedToScene);
};

});










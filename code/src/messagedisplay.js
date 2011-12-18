define(function(require) {

var Eventable = require('../libs/layers/shared/eventable');

return function() {
  Eventable.call(this);

  var self = this;

  self.setMessage = function(text, avatar) {
    $('#messagebox').fadeIn("slow");
    $('#messagebox-avatar').attr('src', avatar);
    $('#messagebox-text').text(text);
  };
 
  var hideMessage = function(text) {
    $('#messagebox').fadeOut("fast", function(){
      self.raise('messageclosed');
    });
  };

  $('#messagebox-accept').click(hideMessage);

};

});

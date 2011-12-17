define(function(require) {

var Eventable = require('../libs/layers/shared/eventable');

// In case you're wondering.. BREAKFAST #2
return function() {
  Eventable.call(this);

  var self = this;

  self.setMessage = function(text) {
    $('#messagebox').fadeIn("slow");
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

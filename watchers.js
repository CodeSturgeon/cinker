var fs = require('fs');
var Step = require('step');

// state: couchdb doc
// cfg: dict of running cfg
var fileCink = function(state, cfg){
  return function(curr, prev){
    Step(
      // Make lock
      function (){
        console.log(['file updated: ',
                    JSON.stringify(state['path']),
                    ' ',
                    JSON.stringify(curr['mtime'])].join('')
        );
      }
      // Import file
      // Update status
      // Clear lock
    );
  }
}

exports.fileCink = fileCink;

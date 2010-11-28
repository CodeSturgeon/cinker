var fs = require('fs');
var Step = require('step');

var cdie = function(err, message){
  console.log(message+' '+JSON.stringify(err));
  return null;
}

// state: couchdb doc
// cfg: dict of running cfg
var fileCink = function(db, state, cfg){
  return function(curr, prev){
    Step(
      // Make lock
      function make_lock(){
        console.log('file updated: '+state['path']+' '+curr['mtime']);
        console.log(state.locked);
        state['locked'] = true;
        console.log(state.locked);
        console.log('state: '+JSON.stringify(state));
        db.save(state['_id'], state['_rev'], state, this);
      },
      // Import file
      function import_file(err, res){
        if(err)cdie(err,'bummer');
        console.log('woot');
      }
      // Update status
      // Clear lock
    );
  }
}

exports.fileCink = fileCink;

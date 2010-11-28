var crypto = require('crypto');
var fs = require('fs');
var Step = require('step');

var cdie = function(err, message){
  console.log(message+' '+JSON.stringify(err));
  return null;
}

// state: couchdb doc
// cfg: dict of running cfg
var fileCink = function(watch_path, cfg){
  var state = {};
  var md5 = crypto.createHash('md5');
  md5.update(cfg.profile);
  md5.update(watch_path);
  var state_id = 'cinker-state-'+md5.digest('hex');
  return function(curr, prev){
    Step(
      // Get state
      function req_state(){
        cfg.db.get(state_id, this);
      },
      // Use either the found state, or make a new state then save it
      function lock_state(err, ret){
        // Yeah this is broken but the couch-client lib screws up errors
        if(err){
          // No state yet! Lets make some...
          state = { _id: state_id, locked: true,
                    profile: cfg.profile, path: watch_path };
          console.log('making new cfg for: '+watch_path);
          var callback = this;
          cfg.db.request('PUT', '/play/'+state_id, state, function(err, ret){
            // FIXME needs error checking
            state._rev = ret.rev;
            callback(null, state);
          });
          return;
        }
        //else if (err.stack) {console.log(err.stack);return;}
        //else if (err) cdie(err, 'could not get state');
        else {
          // We got state from couch... update!
          state = ret;
          state.locked = true;
        }
        cfg.db.save(state, this);
      },
      // Import file
      function import_file(err, res){
        state = res;
        if(err){console.log(err.stack);cdie(err,'bummer');};
        console.log('locked '+state['path']);
        console.log('state: '+JSON.stringify(res));
      }
      // Update status
      // Clear lock
    );
  }
}

exports.fileCink = fileCink;

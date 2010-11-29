var crypto = require('crypto');
var fs = require('fs');
var Step = require('step');

var cdie = function(err, message){
  // FIXME detect and use stack trace
  if(err.stack) console.log(message+'\n'+err.stack)
  else console.log(message+' '+JSON.stringify(err));
  return 'done';
}

// state: couchdb doc
// cfg: dict of running cfg
var fileCink = function(watch_path, cfg){
  var state = {};
  var cink_cfg = {};
  var md5 = crypto.createHash('md5');
  md5.update(cfg.profile);
  md5.update(watch_path);
  var state_id = 'cinker-state-'+md5.digest('hex');
  var memo = 0;
  return function(curr, prev){

    // Not sure why I have to do this, or why it works so well
    if (curr.mtime.toString() == memo) return console.log('killing rerun');
    memo = curr.mtime.toString();

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
          // We got state from couch... check & update!
          state = ret;
          //cdie(state, 's: ');
          if (state.locked){
            console.log('already locked: '+watch_path);
            return;
          }
          state.locked = true;
        }
        cfg.db.save(state, this);
      },
      // Import file and cfg
      function import_file(err, res){
        state = res;
        if(err){console.log(err.stack);cdie(err,'bummer');};
        console.log('locked '+state['path']);
        console.log('state: '+JSON.stringify(res));
        fs.readFile(state.path, this.parallel());
        var callback = this.parallel();
        var json_key = JSON.stringify([cfg.profile,watch_path]);
        var req_uri = cfg.profiles_uri+'&startkey='+json_key+'&endkey='+json_key;
        cfg.db.request('GET', req_uri, function(err, ret){
          if(err)cdie(err, 'yowzer');
          console.log('got cfg for: '+watch_path);
          cink_cfg = ret['rows'][0]['value']['cfg'];
          // FIXME we will also need to create this if it's not there
          cfg.db.get(cink_cfg.doc_id, callback);
        });
      },
      // sort file and cfg kick off 
      function push(err, text, dest){
        if(err) return cdie(err,'crikey');
        console.log('got update and destination');
        dest[cink_cfg.property_path] = text.toString();
        console.log('kicking off save');
        cdie(dest, 'dest: ');
        cfg.db.save(dest, this);
        console.log('save sent');
      },
      // Clear lock
      function something(err, ret){
        if(err) return cdie(err,'zoinks');
        console.log('dest has been saved');
        state.locked = false;
        cfg.db.save(state, this);
      },
      function arg(err, ret){
        if(err) return cdie(err,'dang!');
        console.log('wooty mc woot-woot');
      }
    );
  }
}

exports.fileCink = fileCink;

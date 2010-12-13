var crypto = require('crypto');
var fs = require('fs');
var util = require('util');
var Step = require('step');
var mmh = require('./ddoc/lib/murmurhash2');

var cdie = function(err, message){
  if(err.stack) console.log(message+'\n'+err.stack)
  else console.log(message+' '+JSON.stringify(err));
  return 'done';
}

var cinkWatch= function(_id, path, cfg){
  var memo = 0;
  var hash = '';
  // FIXME upd_url should be encoded too
  var upd_url = '/play/_design/cinker/_update/cink_up/'+_id;
  //upd_url += '?profile='+cfg.profile+'&path='+escape(path);
  upd_url += '?profile=test1&path='+escape(path);
  console.log(upd_url);
  return function(curr, prev){
    // check that the mtime is updated, not just the atime
    if (curr.mtime.toString() == memo){
      console.log('killing rerun');
      //console.log(util.inspect(curr));
      //console.log(util.inspect(prev));
      return;
    }
    memo = curr.mtime.toString();

    console.log('go! '+path);
    var ret = '';

    Step(
      // get new content
      function(){
        console.log('step0');
        fs.readFile(path, 'utf8', this);
      },
      // send up content
      function(err, content){
        console.log('step1');
        //console.log(content);

        var new_hash = mmh.doHash(_id, content);
        if (new_hash === hash) return console.log('nothing to do');
        hash = new_hash;

        var req = cfg.cnx.request('PUT',upd_url);
        
        // the response event has no err, so we have to inject one for Step
        var callback = this;
        req.on('response', function(resp){ callback(undefined, resp); });
        req.end(content);
      },
      // process return
      function(err, resp){
        console.log('step2');
        // Check for errors resp.statusCode
        if (err) {
          console.log('poo');
          console.log(util.inspect(err));
          console.log(err.message);
        }
        console.log(resp.statusCode);
        console.log(util.inspect(resp));
        resp.on('data', function(chunk){ret += chunk;});
        resp.on('end', this)
      },
      // deal with output
      function(err){
        console.log('step3');
        if (err) console.log(err.message);
        console.log(ret);
      }
    );
  }
}

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

exports.cinkWatch = cinkWatch;
exports.fileCink = fileCink;

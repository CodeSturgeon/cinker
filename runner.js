#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var crypto = require('crypto');

var Step = require('step');
var cradle = require('cradle');

var cfg = require('./config');
var watchers = require('./watchers');

// Compile cfg a litte for use elsewhere
cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
cfg.profiles_uri = cfg.ddoc_uri + '_view/profiles?group=true'
cfg.couchdb = http.createClient(5984, cfg.db_host);

var c = new(cradle.Connection)('localhost',5984,{cached:false,raw:true});
var db = c.database('play');

var cdie = function(err, message){
  console.log(message+' '+JSON.stringify(err));
  return null;
}

// FIXME set profile start and end keys
db.view('cinker/profiles', {group:true}, function(err, body) {
  // doing this in a function for an isolated namespace
  for (ri in body['rows']) {var x = function(){
    var watch_path = body['rows'][ri]['key'][1];
    var watch_cfg = body['rows'][ri]['value']; // unused
    console.log('Setting up for: '+watch_path);
    var md5 = crypto.createHash('md5');
    md5.update(cfg.profile);
    md5.update(watch_path);
    var state_uri = 'cinker-state-'+md5.digest('hex');
    db.get(state_uri, function(err, state){
      if (err){
        if(err['error']==='not_found'){
          // No state yet! Lets make some...
          var state = { locked: false, profile: cfg.profile, path: watch_path };
          db.put(state_uri, state, function(err, res){
            if(err) cdie(err, 'could not create state');
            console.log('Making state for '+watch_path);
            state._rev = res['rev'];
            fs.watchFile(watch_path, watchers.fileCink(db, state, cfg));
          }
          );
        } else cdie(err, 'could not get state');
      } else fs.watchFile(watch_path, watchers.fileCink(db, state, cfg));
    });
  }();}
});

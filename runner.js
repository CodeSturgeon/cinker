#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var util = require('util');

var Step = require('step');
var CouchClient = require('couch-client');

var cfg = require('./config');
var watchers = require('./watchers');

// Compile cfg a litte for use elsewhere
cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
// FIXME set profile start and end keys
cfg.profiles_uri = cfg.ddoc_uri + '_view/profiles?group=true'
cfg.db = CouchClient('http://localhost:5984/play');
cfg.cnx = http.createClient(5984, 'localhost');

var cdie = function(err, message){
  console.log(message+' '+JSON.stringify(err));
  return null;
}



var req = cfg.cnx.request(cfg.profiles_uri);
req.on('response', function(resp){
  //console.log(util.inspect(resp));
  var ret = '';
  resp.on('data',function(chunk){ret += chunk;});
  resp.on('end',function(){
    var view = JSON.parse(ret);
    watch_defs = view['rows'][0]['value'];
    console.log(util.inspect(watch_defs));
    for (wi in watch_defs) {
      var _id = watch_defs[wi][0];
      var path = watch_defs[wi][1];
      console.log('Setting up for: '+path);
      fs.watchFile(path, watchers.cinkWatch(_id, path, cfg));
    }
  });
})
req.end();

/*
var req_uri = cfg.profiles_uri+'&startkey='+JSON.stringify([cfg.profile])
req_uri +='&endkey='+JSON.stringify([cfg.profile,{}]);

cfg.db.request('GET', req_uri, function(err, body) {
  // doing this in a function for an isolated namespace
  for (ri in body['rows']) {
    var watch_path = body['rows'][ri]['key'][1];
    var watch_cfg = body['rows'][ri]['value']; // unused
    console.log('Setting up for: '+watch_path);
    fs.watchFile(watch_path, watchers.fileCink(watch_path, cfg));
  }
});
*/

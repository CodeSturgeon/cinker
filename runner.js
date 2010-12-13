#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var util = require('util');

var Step = require('step');

var cfg = require('./config');
var watchers = require('./watchers');

cfg.host = cfg.host || 'localhost'
cfg.port = cfg.port || 5984

// Compile cfg a litte for use elsewhere
cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
// FIXME set profile start and end keys
cfg.profiles_uri = cfg.ddoc_uri + '_view/profiles?group=true'
cfg.cnx = http.createClient(cfg.port, cfg.host);

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

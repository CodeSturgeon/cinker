#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');

var Step = require('step');
var CouchClient = require('couch-client');

var cfg = require('./config');
var watchers = require('./watchers');

// Compile cfg a litte for use elsewhere
cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
// FIXME set profile start and end keys
cfg.profiles_uri = cfg.ddoc_uri + '_view/profiles?group=true'
cfg.db = CouchClient('http://localhost:5984/play');

var cdie = function(err, message){
  console.log(message+' '+JSON.stringify(err));
  return null;
}

cfg.db.request('GET', cfg.profiles_uri, function(err, body) {
  // doing this in a function for an isolated namespace
  for (ri in body['rows']) {
    var watch_path = body['rows'][ri]['key'][1];
    var watch_cfg = body['rows'][ri]['value']; // unused
    console.log('Setting up for: '+watch_path);
    fs.watchFile(watch_path, watchers.fileCink(watch_path, cfg));
  }
});

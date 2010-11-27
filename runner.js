#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var Step = require('step');

var cfg = require('./config');
var watchers = require('./watchers');

// Compile cfg a litte for use elsewhere
cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
cfg.profiles_uri = cfg.ddoc_uri + '_view/profiles?group=true'
cfg.couchdb = http.createClient(5984, cfg.db_host);

var cget = function(uri, callback) {
  var req = cfg.couchdb.request('GET', uri);
  req.end();
  req.on('response', function(response) {
    response.setEncoding('utf8');
    var body = '';
    response.on('data', function (chunk) { body += chunk; });
    response.on('end', function (){
      var result = JSON.parse(body);
      var err = 'poop';
      callback(err, result);
    });
  });
}

cget(cfg.profiles_uri, function(err, body) {
  // doing this in a function for an isolated namespace
  for (ri in body['rows']) {var x = function(){
    var watch_path = body['rows'][ri]['key'][1];
    var watch_cfg = body['rows'][ri]['value'];
    console.log('w: '+watch_path);
    var state_uri = '/'; // cinker-state-md5(profile+path)
    var callback = watchers.fileCink(watch_path, cfg); // should be state
    // FIXME cget will need to create a blank state sometimes
    cget(state_uri, function(err, state){fs.watchFile(watch_path, callback);});
  }();}
});

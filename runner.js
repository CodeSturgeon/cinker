#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var Step = require('step');

var cfg = require('./config');

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

Step(
  function loadcfg() {
    cget(cfg.profiles_uri, this);
  },
  function launchread(err, body) {
    var group = this.group();
    for (ri in body['rows']) {
      fs.readFile(body['rows'][ri]['key'][1], group());
    }
  },
  function splat(err, buffers) {
    for (bi in buffers) {
      console.log(buffers[bi].toString('utf8'));
    }
  }
);

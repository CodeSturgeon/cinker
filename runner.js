#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var util = require('util');

var Step = require('step');

var watchers = require('./watchers');

// Keeps track of the watchers already setup
var watched_paths = [];

var launchWatchers = function(cfg_path){
  var cfg = require(cfg_path);

  cfg.host = cfg.host || 'localhost';
  cfg.port = cfg.port || 5984;

  // Compile cfg a litte for use elsewhere
  cfg.ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';
  cfg.profiles_uri = [cfg.ddoc_uri, '_view/profiles',
                      '?startkey="', escape(cfg.profile), '"',
                      '&endkey="', escape(cfg.profile), '"'
                      ].join('');
  cfg.cnx = http.createClient(cfg.port, cfg.host);

  // FIXME validate connection

  var req = cfg.cnx.request(cfg.profiles_uri);
  req.on('response', function(resp){
    if (resp.statusCode != 200){
      util.log(resp.statusCode+' response when looking for profile view:');
      util.log(cfg.profiles_uri);
      util.log('exiting');
      return;
    }
    var ret = '';
    resp.on('data',function(chunk){ret += chunk;});
    resp.on('end',function(){
      var view = JSON.parse(ret);
      watch_defs = view['rows'];
      for (wi in watch_defs) {
        var _id = watch_defs[wi]['value'][0];
        var path = watch_defs[wi]['value'][1];
        if (watched_paths.indexOf(path) !== -1) continue;
        util.log('Setting watch for: '+path);
        var cinkUp = watchers.cinkWatch(_id, path, cfg);
        fs.watchFile(path, cinkUp);
        watched_paths.push(path);
      }
      if (cfg.autoadd){
        watchers.cinkAutoAdd(watched_paths,cfg);
        setInterval(watchers.cinkAutoAdd(watched_paths,cfg), 10000);
      }
    });
  })
  req.end();
}

if (!process.argv[2]) throw 'missing config arg :(';
var configs = process.argv.slice(2,99);
for (ci in configs) launchWatchers(fs.realpathSync(configs[ci]));

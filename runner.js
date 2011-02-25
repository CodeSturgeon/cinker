#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var cli = require('cli');

var watchers = require('./watchers');

var args = [];
var options = {};

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
      cli.error(resp.statusCode+' response when looking for profile view:');
      cli.error(cfg.profiles_uri);
      cli.error('exiting');
      return;
    }
    var ret = '';
    resp.on('data',function(chunk){ret += chunk;});
    resp.on('end',function(){
      var view = JSON.parse(ret);
      watch_defs = view['rows'];
      for (var wi in watch_defs) {
        var _id = watch_defs[wi]['value'][0];
        var path = watch_defs[wi]['value'][1];
        if (watched_paths.indexOf(path) !== -1) continue;
        cli.info('Setting watch for: '+path);
        var cinkUp = watchers.cinkWatch(_id, path, cfg);
        fs.watchFile(path, cinkUp);
        watched_paths.push(path);
      }
      if (cfg.autoadd){
        watchers.cinkAutoAdd(watched_paths,cfg);
        setInterval(watchers.cinkAutoAdd(watched_paths,cfg), 10000);
      }
    });
  });
  req.end();
}

cli.enable('daemon', 'status');
cli.parse({
  ham:  ['e', 'and eggs']
});

cli.main(function(args, options){
  if (args.length === 0) cli.error('No configs supplied... exiting');
  for (var ai in args) launchWatchers(fs.realpathSync(args[ai]));
});

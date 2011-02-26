#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var cli = require('cli');

var watchers = require('./watchers');

// Keeps track of the watchers already setup
var watched_paths = [];

var cfgLauncher = function(cfg_path){
  cli.info('cfg: '+cfg_path);
  var cfg = require(cfg_path);

  cfg.host = cfg.host || 'localhost';
  cfg.port = cfg.port || 5984;

  // Compile cfg a little for use elsewhere
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
      watch_defs = view.rows;
      for (var wi in watch_defs) {
        var _id = watch_defs[wi].value[0];
        var path = watch_defs[wi].value[1];
        var hash = watch_defs[wi].value[2];
        if (watched_paths.indexOf(path) !== -1) continue;
        watched_paths.push(path);
        if (cli.options.oneshot) {
          watchers.cinkUp(_id,path,hash,cfg)({mtime:0});
          continue;
        }
        var cinkUp = watchers.cinkWatch(_id, path, hash, cfg);
        cli.debug('setting watch for: '+path);
        fs.watchFile(path, cinkUp);
      }
      if (cfg.autoadd){
        watchers.cinkAutoAdd(watched_paths,cfg)();
        if (!cli.options.oneshot){
          setInterval(watchers.cinkAutoAdd(watched_paths,cfg), 10000);
        }
      }
    });
  });
  req.end();
}

cli.enable('daemon', 'status');
cli.parse({
  oneshot:      ['o', 'dont watch']
});

cli.main(function(args){
  if (args.length === 0) cli.error('No configs supplied... exiting');
  for (var ai in args) cfgLauncher(fs.realpathSync(args[ai]));
});

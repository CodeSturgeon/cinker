var fs = require('fs');
var util = require('util');
var Step = require('step');
var mmh = require('../ddoc/lib/murmurhash2');
var cli = require('cli');

// Callback factory for the file changed function
var cinkWatch= function(doc_id, path, hash, cfg){
  var memo = 0;
  var cinker = cinkUp(doc_id, path, hash, cfg);
  return function(curr, prev){
    // check that the mtime is updated, not just the atime
    if (curr.mtime.toString() == memo) return;
    memo = curr.mtime.toString();
    cinker();
  };
};

exports.cinkWatch = cinkWatch;

// Callback factory for dir changed function
var cinkAutoAdd = function(watch_paths, cfg){
  watch_regex = new RegExp(cfg.autoadd.pattern);
  return function(){
    fs.readdir(cfg.autoadd.path, function(err, files){
      for(var fi in files){
        var fn = files[fi];
        var path = cfg.autoadd.path+fn;
        if (fn[0] === '.') continue;
        if (watch_paths.indexOf(path) !== -1) continue;
        if (!watch_regex.test(fn)) continue;
        cinkNew(path, cfg);
        watch_paths.push(path);
      }
    });
  };
};

exports.cinkAutoAdd = cinkAutoAdd;

// Create new couchdb doc for housing a new file
var cinkNew = function(path, cfg){
  cli.info('new file: '+path);
  Step(
    // read content
    function(){
      fs.readFile(path, 'utf-8', this);
    },
    // send request
    function(err, content){
      var cfg_url = '/'+escape(cfg.db_name)+'/_design/cinker/_update/cink_cfg';
      cfg_url += '?profile='+escape(cfg.profile)+'&path='+escape(path);
      cfg_url += '&target_attr='+escape(cfg.autoadd.target_attr);

      var req = cfg.cnx.request('POST', cfg_url,{
              'Content-Type': 'text/plain; charset=utf-8',
              'Content-Length': content.length
            });
    
      // the response event has no err, so we have to inject one for Step
      var callback = this;
      req.on('response', function(resp){ callback(undefined, resp); });
      req.end(content);
    },
    // process result
    function(err, resp){
      if (err) cli.error(err.message);
      var ret = '';
      resp.on('data', function(chunk){ret += chunk;});
      resp.on('end', function(){
        if (cli.options.oneshot) return;
        cli.info('Setting watch for: '+path);
        var _id = JSON.parse(ret).doc_id;
        var hash = JSON.parse(ret).hash;
        var cinkUp = cinkWatch(_id, path, hash, cfg);
        fs.watchFile(path, cinkUp);
      });
    }
  );
};
exports.cinkNew = cinkNew;

// Factory function
// Returned function uploads it's doc when called
var cinkUp = function(doc_id, path, hash, cfg){
  var upd_url = '/'+escape(cfg.db_name)+'/_design/cinker/_update/cink_up/'+doc_id;
  upd_url += '?profile='+escape(cfg.profile)+'&path='+escape(path);
  return function(){
    Step(
      // get new content
      function(){
        fs.readFile(path, 'utf8', this);
      },
      // send up content
      function(err, content){
        var new_hash = mmh.doHash(content, doc_id);
        if (new_hash === hash) {cli.debug('nothing to do'); return;}
        hash = new_hash;

        var req = cfg.cnx.request('PUT',upd_url);
        
        // the response event has no err, so we have to inject one for Step
        var callback = this;
        req.on('response', function(resp){ callback(undefined, resp); });
        req.end(content);
      },
      // process return
      function(err, resp){
        if (err) {
          cli.error('error with upload!');
          cli.error(util.inspect(err));
          cli.error(err.message);
          return;
        }
        var ret = '';
        resp.on('data', function(chunk){ret += chunk;});
        resp.on('end', function(){
          if (resp.statusCode !== 201 && resp.statusCode !== 200){
            cli.error('bad update code '+resp.statusCode);
            cli.error(upd_url);
            cli.error(ret);
            return;
          }
          var pret = JSON.parse(ret);
          if (pret.code === 304){
            cli.info('no update: '+path);
            return;
          }
          cli.info('uploaded: '+path);
        });
      }
    );
  };
};
exports.cinkUp = cinkUp;

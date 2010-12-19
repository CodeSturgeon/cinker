var fs = require('fs');
var util = require('util');
var Step = require('step');
var mmh = require('./ddoc/lib/murmurhash2');

var cinkWatch= function(doc_id, path, cfg){
  var memo = 0;
  var cinker = cinkUp(doc_id, path, cfg);
  return function(curr, prev){
    // check that the mtime is updated, not just the atime
    if (curr.mtime.toString() == memo){
      console.log('killing rerun');
      //console.log(util.inspect(curr));
      //console.log(util.inspect(prev));
      return;
    }
    memo = curr.mtime.toString();

    cinker();
  }
}

var cinkUp = function(doc_id, path, cfg){
  var hash = '';
  var upd_url = '/play/_design/cinker/_update/cink_up/'+doc_id;
  upd_url += '?profile='+escape(cfg.profile)+'&path='+escape(path);
  return function(){
    console.log('go! '+path);
    var ret = '';

    Step(
      // get new content
      function(){
        console.log('step0');
        fs.readFile(path, 'utf8', this);
      },
      // send up content
      function(err, content){
        console.log('step1');

        var new_hash = mmh.doHash(content, doc_id);
        if (new_hash === hash) return console.log('nothing to do');
        hash = new_hash;

        var req = cfg.cnx.request('PUT',upd_url);
        
        // the response event has no err, so we have to inject one for Step
        var callback = this;
        req.on('response', function(resp){ callback(undefined, resp); });
        req.end(content);
      },
      // process return
      function(err, resp){
        console.log('step2');
        // Check for errors resp.statusCode
        if (err) {
          console.log('poo');
          console.log(util.inspect(err));
          console.log(err.message);
        }
        console.log(resp.statusCode);
        //console.log(util.inspect(resp));
        resp.on('data', function(chunk){ret += chunk;});
        resp.on('end', this)
      },
      // deal with output
      function(err){
        console.log('step3');
        if (err) console.log(err.message);
        console.log(ret);
      }
    );
  }
}

exports.cinkWatch = cinkWatch;

var fs = require('fs');
var util = require('util');
var Step = require('step');
var mmh = require('./ddoc/lib/murmurhash2');

var cinkWatch= function(_id, path, cfg){
  var memo = 0;
  var hash = '';
  // FIXME upd_url should be encoded too
  var upd_url = '/play/_design/cinker/_update/cink_up/'+_id;
  //upd_url += '?profile='+cfg.profile+'&path='+escape(path);
  upd_url += '?profile=test1&path='+escape(path);
  console.log(upd_url);
  return function(curr, prev){
    // check that the mtime is updated, not just the atime
    if (curr.mtime.toString() == memo){
      console.log('killing rerun');
      //console.log(util.inspect(curr));
      //console.log(util.inspect(prev));
      return;
    }
    memo = curr.mtime.toString();

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
        //console.log(content);

        var new_hash = mmh.doHash(_id, content);
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
        console.log(util.inspect(resp));
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

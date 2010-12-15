// !code lib/murmurhash2.js
// !code lib/error_helper.js

function (doc, req){
  //return [null, {code:405, body:JSON.stringify(req)+'\n'}];
  // *** Check if we have everything we need ***

  // Check method and reject all but PUT and POST
  if (!(req.method === 'POST' || req.method === 'PUT')) return bail('PUT or POST');

  // Check we have profile, path and doc
  if (!doc) return bail('Must be used against a doc');
  if (!req.query.profile) return bail('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) return bail('Must be used with a path');
  var path = req.query.path;

  // Check there is a body
  if (req.body === "undefined") return bail('Must supply a body');

  // Find the cfg for this profile and path
  if (!doc.cinker.cfg) return bail('No config found!');
  if (!doc.cinker.cfg[profile]) return bail('No config found for this profile');
  if (!doc.cinker.cfg[profile][path])
    return bail('No config found for this profile+path');
  var cfg = doc.cinker.cfg[profile][path];

  // FIXME target_attr really should be multi-dimensional
  if (!doc.cinker.cfg[profile][path]['target_attr'])
    return bail('No target_attr found for this profile+path');
  var target_attr = cfg['target_attr'];

  // *** Setup ***

  // Sanitize logs
  if (!doc.cinker.logs) doc.cinker.logs = {};
  if (!doc.cinker.logs[profile]) doc.cinker.logs[profile] = {};
  if (!doc.cinker.logs[profile][path]) doc.cinker.logs[profile][path] = [];

  // Init current hash
  var now_hash;

  // *** Check if the update should be done ***

  // If the target prop isn't there yet, go right to the update
  if (doc[target_attr]){ 
    // Make current hash now we know there is content
    var now_hash = doHash(doc[target_attr],doc._id);

    // Find the last hash recorded for this profile+path
    if (!doc.cinker.logs[profile].length == 0)
      return bail('Empty logs found for profile');
    var logs = doc.cinker.logs[profile][path];
    var last_hash = logs[logs.length-1]['hash'];
    
    // Fail if last interaction was not with the current content
    if (now_hash != last_hash) return bail('Source needs update');
  }

  // *** Do the update ***

  // Make the hash of the update
  var new_hash = doHash(req.body,doc._id);

  // Bail if there if the content matches
  if (now_hash === new_hash) return bail('No update');

  // Make log of this action
  doc.cinker.logs[profile][path].push({
                         direction: 'up',
                         hash: new_hash,
                         prev: doc[target_attr],
                         timestamp: date2iso(new Date())
                       });

  // Overwite the the content with the new
  doc[target_attr] = req.body;

  return [doc, {body:'\nhappy pants\n'}];
}

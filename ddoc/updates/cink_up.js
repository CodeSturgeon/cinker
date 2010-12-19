// !code lib/murmurhash2.js
// !code lib/error_helper.js
// !code lib/isodate.js

function (doc, req){ try{
  //return [null, {code:405, body:JSON.stringify(req)+'\n'}];
  // *** Check if we have everything we need ***

  // Check method and reject all but PUT and POST
  if (!(req.method === 'POST' || req.method === 'PUT'))
    throw new MethodError('PUT or POST');

  // Check we have profile, path and doc
  if (!doc) throw new ClientError('Must be used against a doc');
  if (!req.query.profile) throw new ClientError('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) throw new ClientError('Must be used with a path');
  var path = req.query.path;

  // Check there is a body
  if (req.body === "undefined") throw new ClientError('Must supply a body');

  // Find the cfg for this profile and path
  if (!doc.cinker.cfg) throw new ClientError('No config found!');
  if (!doc.cinker.cfg[profile])
    throw new ClientError('No config found for this profile');
  if (!doc.cinker.cfg[profile][path])
    throw new ClientError('No config found for this profile+path');
  var cfg = doc.cinker.cfg[profile][path];

  // FIXME target_attr really should be multi-dimensional
  if (!doc.cinker.cfg[profile][path]['target_attr'])
    throw new ClientError('No target_attr found for this profile+path');
  var target_attr = cfg['target_attr'];

  // *** Setup ***

  // Sanitize logs
  if (!doc.cinker.logs) doc.cinker.logs = {};
  if (!doc.cinker.logs[profile]) doc.cinker.logs[profile] = {};
  if (!doc.cinker.logs[profile][path]) doc.cinker.logs[profile][path] = [];

  // Init current hash
  var now_hash;

  // *** Check if the update should be done ***

  // If there is already a target attr there, ensure this is an update
  if (doc[target_attr]){ 
    // Make current hash now we know there is content
    var now_hash = doHash(doc[target_attr],doc._id);

    // Find the last hash recorded for this profile+path
    if (!doc.cinker.logs[profile].length == 0)
      throw new ClientError('Empty logs found for profile');
    var logs = doc.cinker.logs[profile][path];
    var last_hash = logs[logs.length-1]['hash'];
    
    // Fail if last interaction was not with the current content
    if (now_hash != last_hash) throw new ConflictError('Source needs update');
  }

  // *** Do the update ***

  // Make the hash of the update
  var new_hash = doHash(req.body,doc._id);

  // Bail if there if the content matches
  if (now_hash === new_hash) throw new NotModifiedError('No update');

  // Make log of this action
  doc.cinker.logs[profile][path].push({
                         direction: 'up',
                         hash: new_hash,
                         prev: doc[target_attr],
                         timestamp: date2iso(new Date())
                       });

  // Overwite the the content with the new
  doc[target_attr] = req.body;

  var ret = {new_hash:new_hash, doc_id: doc._id};
  ret.code = 200;
  return [doc, {body:JSON.stringify(ret)+'\n'}];

  // Exception handling
  }catch(err){return bail(err);}
}

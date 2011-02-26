// !code lib/murmurhash2.js
// !code lib/error_helper.js
// !code lib/isodate.js

function (doc, req){ try{
  // Check method and reject all but PUT and POST
  if (!(req.method === 'POST' || req.method === 'PUT'))
    throw new MethodError('PUT with _id or POST');
  if (req.method === 'POST'){
    if (doc) throw new MethodError('No POST to docs');
    doc = {_id: req.uuid};
  }
  if (req.method === 'PUT'){
    if (!req.id) throw new MethodError('PUT must be to named doc');
    if (!doc) doc = {_id: req.id};
  }


  // Check we have profile, path and target_attr
  // FIXME should look for form values too
  if (!req.query.profile) throw new ClientError('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) throw new ClientError('Must be used with a path');
  var path = req.query.path;
  if (!req.query.target_attr)
    throw new ClientError('Must be used with a target_attr');
  var target_attr = req.query.target_attr;

  var ret = {profile: profile, path: path, target_attr: target_attr,
             doc_id: doc._id, logged: false};

  // Make sure we have a cfg for this profile and path
  if (!doc.cinker) doc.cinker = {};
  if (!doc.cinker.profiles) doc.cinker.profiles = {};
  if (!doc.cinker.profiles[profile]) doc.cinker.profiles[profile] = {};
  if (!doc.cinker.profiles[profile][path]) doc.cinker.profiles[profile][path] = {cfg: {}, logs: {}};
  if (!doc.cinker.profiles[profile][path]['cfg']) doc.cinker.profiles[profile][path]['cfg'] = {};

  // Set the target attr
  doc.cinker.profiles[profile][path]['cfg']['target_attr'] = target_attr;

  // Clear the history if set and init if not
  doc.cinker.profiles[profile][path]['logs'] = [];

  // Make sure we have logs for this attr
  if(!doc.cinker.logs) doc.cinker.logs={};
  if(!doc.cinker.logs[target_attr]) doc.cinker.logs[target_attr]=[];
  
  // Make sure we have hash store
  if(!doc.cinker.hashes) doc.cinker.hashes = {};

  // Use of a body is optional
  // FIXME should be !== ?
  if (req.body != 'undefined'){
    // If body and target attr are both set, they must be the same
    if (doc[target_attr] && (req.body != doc[target_attr]))
      throw new ConflictError('supplied content does not match current content');
    // If target is not set, set it
    else if (!doc[target_attr]) {// If there is a target attr, already the same
      doc[target_attr] = req.body;
    }
    // Make the hash of the update
    var new_hash = doHash(doc[target_attr],doc._id);
    // Logs
    var ts = date2iso(new Date());
    doc.cinker.profiles[profile][path]['logs'].push({
        direction: 'up',
        hash: new_hash,
        timestamp: ts
    });
    doc.cinker.hashes[new_hash] = {
        timestamp: ts,
        body: doc[target_attr]
    };
    doc.cinker.logs[target_attr].push({
        timestamp: ts,
        hash: new_hash,
        profile: profile,
        path: path
    });
    ret.hash = new_hash;
    ret.logged = true;
  }

  // FIXME this is wrong... code should be 201 for new docs
  ret.code = 200;
  return [doc, {body:JSON.stringify(ret, null, 2)+'\n'}];

  // Exception handling
  }catch(err){return bail(err);}
}

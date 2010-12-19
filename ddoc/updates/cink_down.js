// !code lib/murmurhash2.js
// !code lib/error_helper.js
// !code lib/isodate.js

function (doc, req){ try{
  // Check method and reject all but POST
  if (req.method != 'POST') throw new MethodError('POST only');
  if (!doc) throw new ClientError('Must be used against a doc');
  if (!req.query.profile) throw new ClientError('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) throw new ClientError('Must be used with a path');
  var path = req.query.path;

  // Find the cfg for this profile and path
  if (!doc.cinker.cfg) throw new ClientError('No config found!');
  if (!doc.cinker.cfg[profile])
    throw new ClientError('No config found for this profile');
  if (!doc.cinker.cfg[profile][path])
    throw new ClientError('No config found for this profile+path');
  var cfg = doc.cinker.cfg[profile][path];

  if (!doc.cinker.cfg[profile][path]['target_attr'])
    throw new ClientError('No target_attr found for this profile+path');
  var target_attr = cfg['target_attr'];
  var hash = doHash(doc[target_attr],doc._id);

  if (req.hash && (req.hash == hash)) throw new NotModifiedError('no update')

  var ret = {logged:false, content:target_attr};

  // Sanitize logs
  if (!doc.cinker.logs) doc.cinker.logs = {};
  if (!doc.cinker.logs[profile]) doc.cinker.logs[profile] = {};
  if (!doc.cinker.logs[profile][path]) doc.cinker.logs[profile][path] = [];

  if (req.query.log){
    ret.logged = true;
    doc.cinker.logs[profile][path].push({
        direction: 'down',
        hash: doHash(doc[target_attr],doc._id),
        timestamp: date2iso(new Date())
    });
  }
  else doc = null; // Skip the update as the doc is unchanged

  ret.code = 200;
  return [doc, {body:JSON.stringify(ret)+'\n'}];

  // Exception handling
}catch(err){return bail(err);}}

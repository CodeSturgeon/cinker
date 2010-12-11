// !code lib/murmurhash2.js
// !code lib/error_helper.js

function(doc, req){
  // Check method and reject all but GET
  if (req.method === 'GET') return bail('GET only');
  if (!doc) return bail('Must be used against a doc');
  if (!req.query.profile) return bail('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) return bail('Must be used with a path');
  var path = req.query.path;

  // Find the cfg for this profile and path
  if (!doc.cinker.cfg) return bail('No config found!');
  if (!doc.cinker.cfg[profile]) return bail('No config found for this profile');
  if (!doc.cinker.cfg[profile][path])
    return bail('No config found for this profile+path');
  var cfg = doc.cinker.cfg[profile][path];

  if (!doc.cinker.cfg[profile][path]['target_attr'])
    return bail('No target_attr found for this profile+path');
  var target_attr = cfg['target_attr'];

  // Sanitize logs
  if (!doc.cinker.logs) doc.cinker.logs = {};
  if (!doc.cinker.logs[profile]) doc.cinker.logs[profile] = {};
  if (!doc.cinker.logs[profile][path]) doc.cinker.logs[profile][path] = [];

  if (req.query.log)
    doc.cinker.logs[profile][path].push({
        direction: 'down',
        hash: doHash(doc[target_attr],doc._id),
        timestamp: 'now' });

  return [null, {body:doc[target_attr]+'\n'}];
}

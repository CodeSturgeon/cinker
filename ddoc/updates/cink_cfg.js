// !code lib/murmurhash2.js
// !code lib/error_helper.js

function(doc, req){
  // Check method and reject all but PUT and POST
  if (!(req.method === 'POST' || req.method === 'PUT'))
    return bail('PUT with _id or POST');
  if (req.method === 'POST'){
    if (doc) return bail('No POST to docs');
    // FIXME this makes docs with a blank _id
    doc = {};
  }
  if (req.method === 'PUT' && !doc) return bail('PUT must be to exsisting docs');

  // Check we have profile, path and target_attr
  // FIXME should look for form values too
  if (!req.query.profile) return bail('Must be used with a profile');
  var profile = req.query.profile;
  if (!req.query.path) return bail('Must be used with a path');
  var path = req.query.path;
  if (!req.query.target_attr) return bail('Must be used with a target_attr');
  var target_attr = req.query.target_attr;

  // Make sure we have a cfg for this profile and path
  if (!doc.cinker) doc.cinker = {cfg:{},logs:{}};
  if (!doc.cinker.cfg[profile]) doc.cinker.cfg[profile] = {};
  if (!doc.cinker.cfg[profile][path]) doc.cinker.cfg[profile][path] = {};

  // Set the target attr
  doc.cinker.cfg[profile][path]['target_attr'] = target_attr;

  // Make sure we have a log for this profile
  if (!doc.cinker.logs[profile]) doc.cinker.logs[profile] = {};

  // Clear the history if set and init if not
  doc.cinker.logs[profile][path] = [];

  // Use of a body is optional
  if (req.body != 'undefined'){
    // If body and target attr are both set, they must be the same
    if (doc[target_attr] && (req.body != doc[target_attr]))
      return bail('supplied content does not match what is already there');
    // If target is not set, set it
    else if (!doc[target_attr]) // If there is a target attr, already the same
      doc[target_attr] = req.body;
    // Make the hash of the update
    var new_hash = doHash(doc[target_attr],doc._id);
    doc.cinker.logs[profile][path].push({
                           direction: 'up',
                           hash: new_hash,
                           prev: doc[target_attr],
                           timestamp: 'now' //FIXME
                         });
  }

  return [doc, {body:'\nw00ty pants\n'}];
}

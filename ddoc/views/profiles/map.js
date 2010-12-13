// profiles map

function(doc) {
  if (doc.cinker && doc.cinker.cfg) {
    for (profile in doc.cinker.cfg) {
      for (path in doc.cinker.cfg[profile]){
        emit(profile, [doc._id, path]);
      }
    }
  }
};

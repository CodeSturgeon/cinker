// profiles map

function(doc) {
  if (doc.cinker_cfg) {
    for (profile in doc.cinker_cfg) {
      for (path in doc.cinker_cfg[profile]){
        emit(profile, [doc._id, path]);
      }
    }
  }
};

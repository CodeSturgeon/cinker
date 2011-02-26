// profiles map

function(doc) {
  if (doc.cinker) {
    for (var profile in doc.cinker.profiles) {
      for (var path in doc.cinker.profiles[profile]){
        log(doc.cinker.profiles[profile][path]);
        var attr = doc.cinker.profiles[profile][path].cfg.target_attr;
        var ll_id = doc.cinker.logs[attr].length-1;
        var hash = doc.cinker.logs[attr][ll_id].hash;
        emit(profile, [doc._id, path, hash]);
      }
    }
  }
};

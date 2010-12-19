// profiles map

function(doc) {
  if (doc.cinker) {
    for (profile in doc.cinker) {
      for (path in doc.cinker[profile]){
        emit(profile, [doc._id, path]);
      }
    }
  }
};

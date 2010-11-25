// profiles map

function(doc) {
  if (doc.implements) {
    if (doc.implements.cinker_config){
        emit([doc.profile, doc.path], {cfg:doc.cfg});
    }
    if (doc.implements.cinker_cink){
      emit([doc.profile, doc.path], {cink:doc.cink});
    }
  }
};

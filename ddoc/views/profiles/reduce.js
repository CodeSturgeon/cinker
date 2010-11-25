//profiles reduce

  var obj_merge = function(o1, o2){
    if (o1.timestamp > o2.timestamp) {
      for (attr in o1) o2[attr] = o1[attr];
      return o2;
    }
    for (attr in o2) o1[attr] = o2[attr];
    return o1;
  }

function (key, values, rereduce) {
  var merge = {cfg:{timestamp:'0'}, cink:{timestamp:'0'}};
  for (vi in values) {
    if (values[vi].cink)
      merge.cink = obj_merge(merge.cink, values[vi].cink);
    if (values[vi].cfg)
      merge.cfg = obj_merge(merge.cfg, values[vi].cfg);
  }
  return merge;
}

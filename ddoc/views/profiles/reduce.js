//profiles reduce

/*
var obj_merge = function(o1, o2){
  if (o1.timestamp > o2.timestamp) {
    for (attr in o1) o2[attr] = o1[attr];
    return o2;
  }
  for (attr in o2) o1[attr] = o2[attr];
  return o1;
}
*/

function (key, values, rereduce) {
  if (rereduce){
    var redux = [];
    for (vi in values){
      redux = redux.concat(values[vi]);
    }
    return redux;
  } else {
    return values;
  }
}

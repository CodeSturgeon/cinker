// Error helper
var bail = function(msg){
    var body = JSON.stringify({error:'update_fail', reason:msg});
    return [null, { code:405, body: body+'\n' }];
}


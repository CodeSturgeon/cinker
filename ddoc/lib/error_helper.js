// Error helper

// Something from the client is missing or invalid
var UserError = function(msg){
  this.name = 'user error';
  this.code = 400;
  this.message = msg;
}

// Unsupported/Invalid HTTP method used
var MethodError = function(msg){
  this.name = 'method error';
  this.code = 405;
  this.message = msg;
}

// Something from the client is conflicting with exsisting data
var ConflictError = function(msg){
  this.name = 'user error';
  this.code = 409;
  this.message = msg;
}

// Generic exception handler for updates
var bail = function(e){
    var body = JSON.stringify({error:e.name, reason:e.message});
    var code = e.code || 500;
    return [null, { code:code, body: body+'\n' }];
}

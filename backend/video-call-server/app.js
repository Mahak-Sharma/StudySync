var app = require('./config/routes');
var server = require('http').createServer(app);
var config = require('./config/config');

server.on('error', function(err){
  console.log('ERROR', err);
});

module.exports = {
  listen: function(){
  	server.listen(config.port, function(){
      console.log('listening on port:', config.port);
    });
  }
};
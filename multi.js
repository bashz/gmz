mutli = function (server) {
  var colors = ["bdeeff","efbdff","cdffbd","ffcebd"]
  inQueue = 0;
  inRoom = 0;
  var Sperma = function(id, socket, name){
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.score = 0;
    this.color = "ffffff";
    this.vx = 0;
    this.vy = 0;
    this.x = 0;
    this.y = 0;
    this.vulnerable = false;
  }
  var Germ = function(type, position){
    this.type = type;
    this.position = position;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }
  var Egg = function(x, y, r){
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = r;
  }
  var egg = new Egg(50, 50, 6);
  var germs = [];
  var sperms = [];
  var globalId = 0;
  var io = require('socket.io')(server);
  io.on('connection', function (socket) {
    var id = ++globalId;
    var currentUser;
    console.log('new player connected, id : ' + id);
    socket.emit('ask name');
    socket.on('answer name', function (name) {
      currentUser = new Sperma(id, socket.id, name);
      console.log('player ' + id + ' is now known as ' + name);
      console.log((sperms.push(currentUser)) + ' regitred players');
      socket.emit('user registred', name, id);
    });
    socket.on('ready', function () {
      inQueue++;
      console.log(currentUser.name + ' is now Ready');
      if(inRoom === 0 && inQueue === 1){
        io.emit('wait', 'Waiting for more players');
      }else if (inRoom > 3){
        io.emit('wait', 'Server is full, Please wait');
      }else{
        io.emit('new game');
        socket.on('playing', function(){
          inQueue--;
          inRoom++;
          currentUser.color = colors[inRoom];
        });
        socket.on('loaded', function(){
          socket.emit('init', sperms, germs, egg);
          socket.emit('start', currentUser);
          sperms.push(currentUser);
        });
      }
    });
    socket.on('disconnect', function () {
      index = sperms.map(function (e) {
        return e.id;
      }).indexOf(id);
      if (index !== -1)
        var left = sperms.splice(index, 1)[0];
      console.log((left ? left.name : 'user : ' + id) + ' disconnected');
    });
  });

};
module.exports = mutli;
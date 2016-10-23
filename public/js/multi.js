var width = document.getElementById("game").offsetWidth,
        height = document.getElementById("game").offsetHeight;

var rx = (width / 20);
var ry = Math.min((height / 20), (width / 30));
var effectiveHeight = height;
var fontSize = 15;

var degrees = 180 / Math.PI;

var germsByType = d3.map();
var vetaminByName = d3.map();
var particules;

var Sperma = function (x, y) {
  this.rx = 8;
  this.ry = 5;
  this.vx = 0;
  this.vy = 0;
  this.head;
  this.tail;
  this.path = d3.range(12).map(function () {
    return [x, y];
  });
  this.count = 0;
  this.init = function (selection) {
    var g = selection.append("g");

    this.head = g.append("ellipse")
            .attr("rx", this.rx)
            .attr("ry", this.ry);

    g.append("path")
            .datum(this.path.slice(0, 3))
            .attr("class", "mid");

    g.append("path")
            .datum(this.path)
            .attr("class", "tail");

    this.tail = g.selectAll("path");
    return g;
  };
  this.launch = function (vx, vy) {
    this.vx = vx;
    this.vy = vy;
  };
};

var Germ = function (position, type) {
  this.type = type;
  this.position = position;
  this.x = 0;
  this.y = 0;
  this.vx = 0;
  this.vy = 0;
  this.graph;
  this.positionate = function (x, y) {
    this.y = y;
    this.x = x;
  };
  this.init = function (selection) {
    this.graph = selection.append("path")
            .attr("d", particules.germs[this.type].shape)
            .attr("fill", "#cf4");
  };
  this.launch = function (vx, vy) {
    this.vx = vx;
    this.vy = vy;
  };
  this.collision = function (point) {
    if (Math.sqrt((this.x - point[0]) * (this.x - point[0]) + (this.y - point[1]) * (this.y - point[1])) <= 15)
      return true;
  };
  this.destroy = function () {
    this.graph.remove();
    delete this;
  };
};

var Egg = function (x, y, r) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.r = r;
  this.percent = 0;
  this.graph;
  this.init = function (selection) {
    this.graph = selection.append("path")
            .attr("d", particules.ovum.shape)
            .attr("transform", "translate(" + this.x + "," + this.y + ")")
            .style("fill", "#e568e4");
  };
  this.fertelization = function (point) {
    var distance = Math.sqrt((this.x - point[0]) * (this.x - point[0]) + (this.y - point[1]) * (this.y - point[1]));
    if (distance < r) {
      this.percent = this.percent + (r - distance);
    } else {
      this.percent <= 0 ? this.percent = 0 : this.percent--;
    }
  };
};

appbox = d3.select('#game');
var isReady = false;
var socket = io();

socket.on('ask name', function () {
  var ask = appbox.append('div').attr('id', 'ask-name');
  ask.append('p').text('Please provide a nickname');
  ask.append('input').attr('type', 'text').attr('id', 'name-answer');
  document.getElementById('name-answer').focus();
  ask.on('keypress', function () {
    if (d3.event.keyCode === 13)
      socket.emit('answer name', document.getElementById('name-answer').value);
    else
      return false;
  });
});

socket.on('user registred', function (name, id) {
  appbox.select('#ask-name').remove();
  var welcome = appbox.append('h1').text('Get Ready ' + name)
          .transition()
          .delay(2250)
          .duration(750)
          .style('opacity', 0)
          .each('end', function () {
            d3.select(this).remove();
            ready(id);
          });
});

function ready(id) {
  var totalScore = 0;
  isReady = true;
  socket.emit('ready');
  socket.on('wait', function (msg) {
    appbox.append('h1').attr('id', 'msg').text(msg);
  });
  socket.on('new game', function () {
    appbox.select('#msg').transition()
            .delay(250)
            .duration(750)
            .style('opacity', 0)
            .each('end', function () {
              d3.select(this).remove();
              start(id);
            });
  })
}

function start(id) {
  socket.emit('playing');
  var germs = new Array();
  d3.select("#game svg").remove();
  d3.selectAll("#game img").remove();
  d3.json("json/particules.json", function (data) {
    particules = data;
    socket.emit('loaded');
    soncket.on('init', function(state){
      var svg = d3.select("#game").append("svg")
            .attr("width", width)
            .attr("height", height);

      var egg = new Egg(width / 2, height / 2, 25);
      egg.init(svg);

      var sperma = new Sperma(width / 2, height - 30);
      sperma.init(svg);
      sperma.launch(0, -0.2);
    });
    

    var score = svg.append("text")
            .text(Math.floor(egg.percent / 100) + " %")
            .attr("x", 12)
            .attr("y", 24)
            .attr("class", "score")
            .style("font-size", "24px");

    var i = 0;
    var collision = false, fertelized = false, notPaused = true;
    socket.on('launch-germ', function () {
      germs.push(new Germ(germsByTime.get(i).start, germsByTime.get(i).type));
    });
    var Timer = d3.timer(function Timer() {
        i++;
        germs.forEach(function (d) {
          d.x += d.vx;
          d.y += d.vy;
          d.graph.attr("transform", germTransform(d));
          for (var j = 0; ++j < 12; )
            if (d.collision(sperma.path[j]))
              collision = true;
          if (d.x > width + 20 || d.y > height + 20)
            d.destroy();
        });
        egg.fertelization(sperma.path[0]);
        score.text(Math.floor(egg.percent / 100) + " %");
        if (egg.percent >= 10000) {
          fertelized = true;
        }
        if (collision) {
          window.navigator.vibrate(200);
          midMenu();
          return true;
        }
        if (fertelized) {
          localStorage.level = level + 1;
          endMenu();
          return true;
        }
        var path = sperma.path,
                dx = sperma.vx,
                dy = sperma.vy,
                x = path[0][0] += dx,
                y = path[0][1] += dy,
                speed = Math.sqrt(dx * dx + dy * dy),
                count = speed * 10,
                k1 = -5 - speed / 3;

        // Bounce off the walls.
        if (x < 0 || x > width)
          sperma.vx *= -1;
        if (y < 0 || y > height)
          sperma.vy *= -1;
        // Deceleration
        sperma.vx = sperma.vx / 1.01;
        sperma.vy = sperma.vy / 1.01;
        // Swim!
        for (var j = 0; ++j < 12; ) {
          var vx = x - path[j][0],
                  vy = y - path[j][1],
                  k2 = Math.sin(((sperma.count += count) + j * 3) / 300) / speed;
          path[j][0] = (x += dx / speed * k1) - dy * k2;
          path[j][1] = (y += dy / speed * k1) + dx * k2;
          speed = Math.sqrt((dx = vx) * dx + (dy = vy) * dy);
        }

        sperma.head.attr("transform", headTransform);
        sperma.tail.attr("d", tailPath);
    });

    function move() {
      var mouse = d3.touches(svg.node());
      var sx = 0.03 * (mouse[0][0] - sperma.path[0][0]);
      var sy = 0.03 * (mouse[0][1] - sperma.path[0][1]);
      sperma.launch(sx, sy);
    }
    function mouseMove() {
      var mouse = d3.mouse(svg.node());
      var sx = 0.03 * (mouse[0] - sperma.path[0][0]);
      var sy = 0.03 * (mouse[1] - sperma.path[0][1]);
      sperma.launch(sx, sy);
    }
    svg.on("touchmove", move);
    svg.on("touchstart", move);
    svg.on("click", mouseMove);
    svg.on("mousemove", mouseMove);
    function germTransform(germ) {
      return "translate(" + germ.x + "," + germ.y + ")rotate(" + Math.atan2(germ.y, germ.x) * degrees + ")";
    }
    function headTransform() {
      return "translate(" + sperma.path[0] + ")rotate(" + Math.atan2(sperma.vy, sperma.vx) * degrees + ")";
    }
    function tailPath(d) {
      return "M" + d.join("L");
    }
  });
}
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
  this.positionate = function () {
    if (this.position === "top") {
      this.y = -20;
      this.x = Math.random() * (width / 2) + width / 4;
    } else if (this.position === "bot") {
      this.y = height + 20;
      this.x = Math.random() * (width / 2) + width / 4;
    } else if (this.position === "left") {
      this.y = Math.random() * (height / 2) + height / 4;
      this.x = -20;
    } else {
      this.y = Math.random() * (height / 2) + height / 4;
      this.x = width + 20;
    }
  };
  this.init = function (selection) {
    this.graph = selection.append("path")
            .attr("d", particules.germs[this.type].shape)
            .attr("fill", "#cf4");
  };
  this.launch = function (speedMin, speedRange) {
    speed = Math.random() * speedRange + speedMin;
    if (this.position === "top") {
      this.vy = speed;
      min = this.x / (height / speed);
      max = (width - this.x) / (height / speed);
      this.vx = Math.random() * (max + min) - min;
    } else if (this.position === "bot") {
      this.vy = -speed;
      min = this.x / (height / speed);
      max = (width - this.x) / (height / speed);
      this.vx = Math.random() * (max + min) - min;
    } else if (this.position === "left") {
      this.vx = speed;
      min = this.y / (width / speed);
      max = (height - this.y) / (width / speed);
      this.vy = Math.random() * (max + min) - min;
    } else {
      this.vx = -speed;
      min = this.y / (width / speed);
      max = (height - this.y) / (width / speed);
      this.vy = 0 * (max + min) - min;
    }
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
            .style("fill", "url(#grad1)");
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

function start(level) {
  var germsByTime = d3.map();
  var germs = new Array();
  d3.select("#game svg").remove();
  d3.selectAll("#game img").remove();
  d3.json("json/" + level + ".json", function (data) {
    data.forEach(function (d) {
      germsByTime.set(d.time, d);
    });
  });
  d3.json("json/particules.json", function (data) {
    particules = data;

    var svg = d3.select("#game").append("svg")
            .attr("width", width)
            .attr("height", height);
    var def = svg.append("defs").append("radialGradient")
            .attr("id", "grad1")
            .attr("cx", "50%")
            .attr("cy", "50%")
            .attr("r", "100%")
            .attr("fx", "50%")
            .attr("fy", "50%");
    def.append("stop")
            .attr("offset", "50%")
            .style("stop-color", "rgb(130,70,150)");
    def.append("stop")
            .attr("offset", "100%")
            .style("stop-color", "rgb(255,0,255)");
    var egg = new Egg(width / 2, height / 2, 25);
    egg.init(svg);

    var sperma = new Sperma(width / 2, height - 30);
    sperma.init(svg);
    sperma.launch(0, -0.2);

    var menu = d3.select("#game").append("img")
            .style("position", "absolute")
            .style("height", "32px")
            .attr("width", "32px")
            .attr("height", "32px")
            .style("top", 0)
            .style("right", 0)
            .attr("src", "images/pause.png");

    var score = svg.append("text")
            .text(Math.floor(egg.percent / 100) + " %")
            .attr("x", 12)
            .attr("y", 24)
            .attr("class", "score")
            .style("font-size", "24px");

    menu.on("click", function () {
      notPaused = !notPaused;
    });



    var i = 0;
    var collision = false, fertelized = false, notPaused = true;

    var Timer = d3.timer(function Timer() {
      if (notPaused) {
        i++;
        if (germsByTime.get(i)) {
          germsByTime.set(i + 300, germsByTime.get(i));
          germs.push(new Germ(germsByTime.get(i).start, germsByTime.get(i).type));
          germs[germs.length - 1].positionate();
          germs[germs.length - 1].init(svg);
          germs[germs.length - 1].launch(germsByTime.get(i).speedMin, germsByTime.get(i).speedRange);
        }
        germs.forEach(function (d) {
          if (particules.germs[d.type].behavior === "chaser") {
            if (Math.sqrt((sperma.path[0][0] - d.x) * (sperma.path[0][0] - d.x) + (sperma.path[0][1] - d.y) * (sperma.path[0][1] - d.y)) < 240) {
              d.x += d.vx + 0.015 * (sperma.path[0][0] - d.x);
              d.y += d.vy + 0.015 * (sperma.path[0][1] - d.y);
            } else {
              d.x += d.vx;
              d.y += d.vy;
            }
          } else if (particules.germs[d.type].behavior === "sprinter") {
            d.vx += d.start === 'left' ? .004 : -.004;
            d.vy += d.start === 'top' ? .002 : -.002;
            d.x += d.vx;
            d.y += d.vy;
          } else if (particules.germs[d.type].behavior === "agitated") {
              d.vx += 0.12 * Math.sin(2 * Math.PI * d.x/width);
              d.vy += 0.08 * Math.sin(2 * Math.PI * d.y/height);
              d.x += d.vx;
              d.y += d.vy;
          } else if (particules.germs[d.type].behavior === "curved") {
            if (Math.sqrt((width/2 - d.x) * (width/2 - d.x) + (height/2 - d.y) * (height/2 - d.y)) < 160) {
              d.vx += 0.006 * (width/2 - d.x);
              d.vy += 0.002 * (height/2 - d.y);
              d.x += d.vx;
              d.y += d.vy;
            }else{
              d.x += d.vx;
              d.y += d.vy;
            }
          } else {
            d.x += d.vx;
            d.y += d.vy;
          }
          d.graph.attr("transform", germTransform(d));
          for (var j = 0; ++j < 12; )
            if (d.collision(sperma.path[j]))
              collision = true;
          if (d.x > width + 20 || d.y > height + 20)
            d.destroy();
        });
        egg.fertelization(sperma.path[0]);
        score.text(Math.floor(egg.percent / 100) + " %");
        def.attr("r", 100 - Math.floor(egg.percent / 100) + "%");
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
      } else {
        midMenu();
      }
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
    function midMenu() {
      var back = d3.select("#game").append("img")
              .attr("class", "button")
              .style("top", height / 2 - 32 + "px")
              .style("left", width / 3 - 32 + "px")
              .attr("src", "images/back.png");
      var restart = d3.select("#game").append("img")
              .attr("class", "button")
              .style("top", height / 2 - 32 + "px")
              .style("left", 2 * width / 3 - 32 + "px")
              .attr("src", "images/restart.png");
      restart.on("click", function () {
        start(level);
      });
      back.on("click", function () {
        window.location.reload();
      });
    }
    function endMenu() {
      var back = d3.select("#game").append("img")
              .attr("class", "button")
              .style("top", height / 2 - 32 + "px")
              .style("left", width / 4 - 32 + "px")
              .attr("src", "images/back.png");
      var restart = d3.select("#game").append("img")
              .attr("class", "button")
              .style("top", height / 2 - 32 + "px")
              .style("left", 2 * width / 4 - 32 + "px")
              .attr("src", "images/restart.png");
      var next = d3.select("#game").append("img")
              .attr("class", "button")
              .style("top", height / 2 - 32 + "px")
              .style("left", 3 * width / 4 - 32 + "px")
              .attr("src", "images/next.png");
      restart.on("click", function () {
        start(level);
      });
      back.on("click", function () {
        window.location.reload();
      });
      next.on("click", function () {
        start(++level);
      });
    }
  });
}

if (!localStorage.level)
  localStorage.level = 1;
d3.json("json/levels.json", function (datas) {
  data = [];
  datas.forEach(function (d, i) {
    if (effectiveHeight < (20 + d.y) * height / 100) {
      effectiveHeight = parseInt((20 + d.y) * height / 100);
    }
    if (i < localStorage.level) {
      data.push(d);
    }
  });
  var svg = d3.select("#game").append("svg")
          .attr("width", width)
          .attr("height", effectiveHeight);

  var map = svg.append("g");

  var line = d3.svg.line()
          .x(function (d) {
            return d.x * width / 100;
          })
          .y(function (d) {
            return d.y * height / 100;
          })
          .interpolate("cardinal");

  var poly = map.append("path")
          .attr("d", line(data))
          .attr("class", "poly");
  var levels = map.selectAll(".levels")
          .data(data)
          .enter().append("g");
  levels.append("ellipse")
          .attr("cx", function (d) {
            return d.x * width / 100;
          })
          .attr("cy", function (d) {
            return d.y * height / 100;
          })
          .attr("rx", rx)
          .attr("ry", ry)
          .attr("class", "eclevel");
  levels.append("text")
          .text(function (d, i) {
            return ++i;
          })
          .attr("x", function (d) {
            return d.x * width / 100;
          })
          .attr("y", function (d) {
            return fontSize / 3 + d.y * height / 100;
          })
          .attr("class", "level")
          .attr("text-anchor", "middle")
          .style("font-size", fontSize);
  levels.on("click", function (d, i) {
    start(++i);
  });
});
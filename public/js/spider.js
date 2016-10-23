var gWidth = document.getElementById("main").offsetWidth,
        gHeight = document.getElementById("main").offsetHeight;
var wScale = gWidth / 600;
var hScale = gHeight / 400;
var degrees = 180 / Math.PI;
var score = 0;
var scMenu, scGame, scAchiv, scCredit, scLevel;
var main = d3.select("#main");
var spiderShape, netShape, background;
var spiders, nets, backgrounds, achivements, stageAchivements = [];
var Levels;

init(true);
function init(starting) {
  defaultConfig = {
    speed: 3,
    gap: 210,
    bar: 50,
    linkStrength: .9,
    charge: 50,
    friction: .999,
    gravity: .1,
    alpha: .1,
    isLevel: false,
    cooper: -1,
    silver: -1,
    gold: -1
  };
  if (!localStorage.sound) {
    localStorage.sound = "images/sfxon48.png";
    localStorage.vib = "images/vibon48.png";
  }
  if (!localStorage.jumps) {
    localStorage.totalJumps = 0;
    localStorage.backward = 0;
    localStorage.stationary = 0;
    localStorage.leap = 0;
    localStorage.suvive = 0;
    localStorage.dive = 0;
    localStorage.accurency = 0;
    localStorage.jumps = 0;
    localStorage.rewardActive = false;
    localStorage.newAchivement = false;
    localStorage.stars = new Array();
  }
  var config = d3.select("#main").append("div").attr("class", "config");
  var sound = config.append("img")
          .attr("src", localStorage.sound);
  sound.on("click", function () {
    localStorage.sound = localStorage.sound === "images/sfxon48.png" ? "images/sfxoff48.png" : "images/sfxon48.png";
    d3.select(this).attr("src", localStorage.sound);
  });
  var vibs = config.append("img")
          .attr("src", localStorage.vib);
  vibs.on("click", function () {
    localStorage.vib = localStorage.vib === "images/vibon48.png" ? "images/viboff48.png" : "images/vibon48.png";
    d3.select(this).attr("src", localStorage.vib);
  });
  if (!localStorage.spider)
    localStorage.spider = 0;
  if (!localStorage.net)
    localStorage.net = 0;
  if (!localStorage.background)
    localStorage.background = 0;
  d3.json("json/shapes.json", function (datas) {
    spiders = datas.spiders;
    nets = datas.nets;
    backgrounds = datas.bgs;
    achivements = datas.achivements;
    for (var achivement in achivements) {
      achivements[achivement].forEach(function (d) {
        if (d.required > localStorage[achivement] && localStorage[achivement] >= d.min) {
          d.state = 'active';
        } else if (localStorage[achivement] < d.min) {
          d.state = 'locked';
        } else {
          d.state = 'unlocked';
        }
      });
    }
    spiderShape = datas.spiders[localStorage.spider];
    netShape = datas.nets[localStorage.net];
    background = datas.bgs[localStorage.background];
    if (starting)
      menu();
  });
}
function reset() {
  stageAchivements = [];
  main.classed('scrollable', false);
  score = 0;
  scGame = d3.select("#game").remove();
  scAchiv = d3.select("#achivements").remove();
  scCredit = d3.select("#credit").remove();
  scMenu = d3.select("#menu").remove();
  scLevel = d3.select("#levels").remove();
}
function menu() {
  reset();
  scMenu = main.append("div")
          .attr({"class": "bg " + background, "id": "menu"})
          .style({"width": gWidth + "px", "height": gHeight + "px"});
  var container = scMenu.append("div").attr("class", "buttons");
  var startButton = container.append("button")
          .text('Infinit Mode');
  var levelButton = container.append("button")
          .text('Arcade Mode');
  if (localStorage.newAchivement === 'true')
    container.append('i').style({float: 'right', top: '20px', position: 'relative', 'margin-top': '-64px'}).append('img').attr("src", "images/crown.png");
  var progressButton = container.append("button")
          .text("Progress");
  var creditButton = container.append("button")
          .text('Credits');
  if (localStorage.jumps) {
    container.append("span").attr("id", "best").text("Best Score : " + localStorage.jumps);
    container.append("div").attr("id", "share").attr("class", "share");
  }
  startButton.on("click", function () {
    start(defaultConfig);
  });
  levelButton.on("click", levels);
  creditButton.on("click", credit);
  progressButton.on("click", progress);
}
function start(config) {
  var tries = 0;
  var dispatch = d3.dispatch("bind", "progress", "loses", "star");
  dispatch.on("bind", function (from, to, bx, by, tried) {
    if (localStorage.sound === "images/sfxon48.png")
      document.getElementById("sfxJump").play();
    tries = 0;
    score++;
    if (score === config.cooper) {
      dispatch.star(0);
    } else if (score === config.silver) {
      dispatch.star(1);
    }
    if (localStorage.jumps < score)
      localStorage.jumps = score;
    scoreText.text(score);
    localStorage.totalJumps++;
    if (to - from < 0) {
      localStorage.backward++;
    } else if (to - from === 0) {
      localStorage.stationary++;
    } else if (to - from > 1) {
      localStorage.leap++;
    }
    if (bx < 0)
      localStorage.suvive++;
    if (by >= 400)
      localStorage.dive++;
    if (tried === 1)
      localStorage.accurency++;
    for (var achivement in achivements) {
      achivements[achivement].forEach(function (d, i, arr) {
        if (localStorage[achivement] == d.required && d.state === 'active') {
          d.state = 'unlocked';
          if (arr[i + 1])
            arr[i + 1].state = 'active';
          dispatch.progress(d);
        }
      });
    }
  });
  dispatch.on("progress", function (achivement) {
    if (localStorage.sound === "images/sfxon48.png")
      document.getElementById("sfxAchivement").play();
    stageAchivements.push(achivement);
    localStorage.newAchivement = true;
    var achvMenu = d3.select("#game").append("div")
            .attr("id", "achvHolder")
            .style("opacity", 0);
    achvMenu.append('p').text("Unlocked : " + achivement.name);
    achvMenu.transition()
            .duration(650)
            .style("opacity", 0.9)
            .each("end", function () {
              achvMenu.transition()
                      .duration(1500)
                      .delay(4500)
                      .ease("quad")
                      .style("opacity", 0)
                      .each("end", function () {
                        d3.select("#achvHolder").remove();
                      });
            });

  });
  dispatch.on("star", function (stars) {
    if (localStorage.sound === "images/sfxon48.png")
      document.getElementById("sfxCoin").play();
    var star = d3.select("#game").append("div")
            .attr("id", "starHolder")
            .style("opacity", 0);
    console.log(getStoredStar(config.level));
    if (getStoredStar(config.level) < stars || !getStoredStar(config.level)) {
      console.log(getStoredStar(config.level));
      storeStar(config.level, stars);
    }
    star.append('img').attr("src", "images/star-filled48.png");
    star.append('img').attr("src", stars >= 1 ? "images/star-filled48.png" : "images/star-empty48.png");
    star.append('img').attr("src", stars === 2 ? "images/star-filled48.png" : "images/star-empty48.png");
    star.transition()
            .duration(650)
            .style("opacity", 0.9)
            .each("end", function () {
              star.transition()
                      .duration(1000)
                      .delay(1500)
                      .ease("quad")
                      .style("opacity", 0)
                      .each("end", function () {
                        d3.select("#starHolder").remove();
                      });
            });

  });
  dispatch.on("loses", function (wins) {
    tries = 0;
    force.stop();
    if (localStorage.sound === "images/sfxon48.png")
      if (wins) {
        document.getElementById("sfxWin").play();
      } else {
        document.getElementById("sfxLose").play();
      }
    if (localStorage.vib === "images/vibon48.png")
      window.navigator.vibrate(200);
    midMenu.append("div").attr("id", "startappContainer");
    var controles = midMenu.append("div").attr("id", "controles");
    var back = controles.append("img")
            .attr("class", "controle")
            .attr("title", "back")
            .attr("src", "images/back48.png")
            .style("cursor", "pointer");
    back.on("click", function () {
      menu();
    });
    var retry = controles.append("img")
            .attr("class", "controle")
            .attr("title", "restart")
            .attr("src", "images/restart48.png")
            .style("cursor", "pointer");
    retry.on("click", function () {
      start(config);
    });
    if (score >= config.cooper && config.isLevel) {
      var next = controles.append("img")
              .attr("class", "controle")
              .attr("title", "next")
              .attr("src", "images/next48.png")
              .style("cursor", "pointer");
      next.on("click", function () {
        start(Levels[config.level]);
      });
    }
    midMenu.append("div").attr("id", "score").append("span").text("Score : " + score);
    midMenu.append("div").attr("id", "best").append("span").text("Best Score : " + localStorage.jumps);
    midMenu.append("div").attr("id", "share").attr("class", "share");
    if (navigator.onLine) {
      adsStartApp();
    }
    stageAchivements.forEach(function (d, i) {
      midMenu.append("div").attr('class', 'stageAchivements')
              .style('opacity', 0)
              .text(d.name)
              .transition()
              .delay(500 * i)
              .duration(1500)
              .style('opacity', 1);
    });
  });
  reset();
  scGame = d3.select("#main")
          .append("div")
          .attr("class", background)
          .attr("id", "game")
          .append("svg")
          .attr("width", gWidth)
          .attr("height", gHeight)
          .on("mousedown", mousedown)
          .on("mouseup", mouseup)
          .on("touchstart", touchstart)
          .on("touchend", touchend);

  var svg = scGame.append("g");
  var midMenu = d3.select("#game").append("div")
          .attr("id", "menuHolder")
          .append("div")
          .attr("id", "midMenu");

  var scoreText = d3.select("#game svg").append("text")
          .text(score)
          .attr("x", 40)
          .attr("y", gHeight - 40)
          .attr("id", "score")
          .style("font-size", "24px");

  var force = d3.layout.force()
          .size([gWidth * 2 - 20, 2 * gHeight])
          .nodes([{x: 600 - 10, y: gHeight / 2, fixed: false}, {x: 600 - 10, y: 20, fixed: true}])
          .linkStrength(config.linkStrength)
          .charge(config.charge)
          .friction(config.friction)
          .gravity(config.gravity)
          .alpha(config.alpha)
          .on("tick", tick);

  var nodes = force.nodes();

  force.links([{source: nodes[0], target: nodes[1]}]);

  var links = force.links(),
          node = svg.selectAll(".node"),
          link = svg.selectAll(".link");

  restart(80);
  var lineEnd, moving = false, dx, dy, j = 0;
  var touchAccelerate = {timeDelta: 1, xDelta: 0, yDelta: 0};
  function touchstart() {
    touchAccelerate = {
      timeDelta: d3.event.timeStamp,
      xDelta: d3.event.targetTouches[0].pageX,
      yDelta: d3.event.targetTouches[0].pageY
    };
  }
  function touchend() {
    touchAccelerate.timeDelta = d3.event.timeStamp - touchAccelerate.timeDelta;
    touchAccelerate.xDelta = d3.event.changedTouches[0].pageX - touchAccelerate.xDelta;
    touchAccelerate.yDelta = d3.event.changedTouches[0].pageY - touchAccelerate.yDelta;
    dx = touchAccelerate.xDelta * 250 / touchAccelerate.timeDelta;
    dy = touchAccelerate.yDelta * 250 / touchAccelerate.timeDelta;
    svg.selectAll(".string").remove();
    lineEnd = svg.append("line")
            .attr("x1", nodes[0].x)
            .attr("y1", nodes[0].y)
            .attr("x2", nodes[0].x)
            .attr("y2", nodes[0].y)
            .attr("class", "string");
    moving = true;
    j = 0;
    tries++;
  }
  function mousedown() {
    d3.event.preventDefault();
    touchAccelerate = {
      timeDelta: d3.event.timeStamp,
      xDelta: d3.event.pageX,
      yDelta: d3.event.pageY
    };
  }
  function mouseup() {
    touchAccelerate.timeDelta = d3.event.timeStamp - touchAccelerate.timeDelta;
    touchAccelerate.xDelta = d3.event.pageX - touchAccelerate.xDelta;
    touchAccelerate.yDelta = d3.event.pageY - touchAccelerate.yDelta;
    dx = (touchAccelerate.xDelta * 250) / touchAccelerate.timeDelta;
    dy = (touchAccelerate.yDelta * 250) / touchAccelerate.timeDelta;
    svg.selectAll(".string").remove();
    lineEnd = svg.append("line")
            .attr("x1", nodes[0].x)
            .attr("y1", nodes[0].y)
            .attr("x2", nodes[0].x)
            .attr("y2", nodes[0].y)
            .attr("class", "string");
    moving = true;
    j = 0;
    tries++;
  }
  var i = 0;
  var commingNodes = [];
  var ox = 0, oy = 0;
  var k = 1;
  var attached = 0;
  function tick() {
    link.attr("x1", function (d) {
      return d.source.x;
    })
            .attr("y1", function (d) {
              return d.source.y;
            })
            .attr("x2", function (d) {
              return d.target.x;
            })
            .attr("y2", function (d) {
              return d.target.y;
            });

    node.attr("transform", function (d, i) {
      var transformation;
      if (i) {
        transformation = "translate(" + d.x + "," + d.y + ")skewX(" + (90 - Math.atan2(d.y - oy, d.x - ox) * degrees) + ")";
      } else {
        transformation = "translate(" + d.x + "," + d.y + ")rotate(" + (90 - Math.atan2(d.y - oy, d.x - ox) * degrees) + ")";
      }
      ox = d.x;
      oy = d.y;
      return transformation;
    });

    if (moving) {
      d3.select("#game svg")
              .on("mousedown", null)
              .on("mouseup", null)
              .on("touchstart", null)
              .on("touchend", null);
      j++;
      var adx = dx * j / 15;
      var ady = dy * j / 15;
      lineEnd.attr("x1", nodes[0].x)
              .attr("y1", nodes[0].y)
              .attr("x2", nodes[0].x + adx)
              .attr("y2", nodes[0].y + ady);
      commingNodes.forEach(function (d, index) {
        if (nodes[0].y + ady < d.y && d.y < nodes[0].y) {
          var K = ady / adx;
          var X = (d.y - nodes[0].y) / K + nodes[0].x;
          if (d.x < X && X < (d.x + config.bar)) {
            dispatch.bind(attached, d.id, nodes[0].x + i, nodes[0].y, tries);
            attached = d.id;
            d3.select("#game svg")
                    .on("mousedown", mousedown)
                    .on("mouseup", mouseup)
                    .on("touchstart", touchstart)
                    .on("touchend", touchend);
            svg.selectAll(".string").remove();
            moving = false;
            j = 0;
            nodes[1] = {x: X, y: d.y, fixed: true};
            links[0] = {source: nodes[0], target: nodes[1]};
            l = Math.sqrt((nodes[0].x - nodes[1].x) * (nodes[0].x - nodes[1].x) + (nodes[0].y - nodes[1].y) * (nodes[0].y - nodes[1].y));
            restart(l / 2);
          }
        }
        if (d.x + 50 + i < 0) {
          commingNodes.splice(index, 1);
          svg.select("#line" + d.x).remove();
        }
      });
      if (j === 15) {
        d3.select("#game svg")
                .on("mousedown", mousedown)
                .on("mouseup", mouseup)
                .on("touchstart", touchstart)
                .on("touchend", touchend);
        svg.selectAll(".string").remove();
        moving = false;
        j = 0;
      }
    }
    svg.attr("transform", "matrix(" + wScale + ",0,0," + hScale + "," + (wScale * i) + "," + 0 + ")");
    d3.select("#game").style("background-position", i / 4 + "px center");
    if (!(-i % config.gap)) {
      var o = {fixed: true};
      o.x = parseInt(600 + 30 - i);
      o.y = Math.round(Math.random() * gHeight / 3);
      o.id = k;
      k++;
      commingNodes.push(o);
      svg.append("line")
              .attr("x1", o.x)
              .attr("y1", o.y)
              .attr("x2", o.x + config.bar)
              .attr("y2", o.y)
              .attr("class", "platform")
              .attr("id", "line" + o.id);
    }
    if (nodes[1].x + 50 + i < 0) {
      dispatch.loses(0);
    } else if (score === config.gold) {
      dispatch.star(2);
      dispatch.loses(1);
    } else {
      i = i - config.speed;
      force.alpha(.1);
    }
  }
  function restart(l) {
    link = link.data(links);

    link.enter().insert("line", ".node")
            .attr("class", "link");

    node = node.data(nodes);

    node.enter().insert("path", ".cursor")
            .attr("class", "node")
            .attr("d", function (d, i) {
              if (i) {
                return netShape;
              } else {
                return spiderShape;
              }
            });
    force.size([2 * nodes[1].x, 2 * gHeight]).linkDistance(l).start();
  }
}
function credit() {
  reset();
  main.classed('scrollable', true);
  scCredit = main.append("div").attr("id", "credit");
  back = scCredit.append("img")
          .attr("class", "button")
          .attr("title", "back")
          .attr("src", "images/back48.png")
          .style("cursor", "pointer");
  back.on("click", function () {
    menu();
  });
  var content = scCredit.append('div').attr("class", "content");
  content.append('h1').text('Credits :');
  var credits = content.append('ul').attr('class', 'creditList');
  d3.json('json/cc.json', function (data) {
    data.images.forEach(function (d) {
      var item = credits.append('li').attr('class', "creditItem");
      item.append('img').attr({'src': d.file, 'class': "creditImage creditMedia"});
      item.append('a').attr('href', d.source).text(d.name);
      item.append('span').text(' by ');
      item.append('a').attr('href', d.url).text(d.artist);
      item.append('span').text(' is licensed under ');
      item.append('a').attr('href', data.licenses[d.copyright]).text(d.copyright);
    });
    data.sounds.forEach(function (d) {
      var item = credits.append('li').attr('class', "creditItem");
      item.append('audio').attr({'src': d.file, 'type': "audio/ogg", 'controls': "controls", 'class': "creditMedia"});//.append('source').attr({'src': d.file, 'type':"audio/ogg"});
      item.append('a').attr('href', d.source).text(d.name);
      item.append('span').text(' by ');
      item.append('a').attr('href', d.url).text(d.artist);
      item.append('span').text(' is licensed under ');
      item.append('a').attr('href', data.licenses[d.copyright]).text(d.copyright);
    });
  });
}
function progress() {
  reset();
  localStorage.newAchivement = false;
  main.classed('scrollable', true);
  scAchiv = main.append("div").attr("id", "achivements");
  back = scAchiv.append("img")
          .attr("class", "button")
          .attr("title", "back")
          .attr("src", "images/back48.png")
          .style("cursor", "pointer");
  back.on("click", function () {
    menu();
  });
  scAchiv.append('div').attr('class', 'achivementCollapser')
          .text("Achivements ").on('click', function () {
    collapse = !activeAchs.classed('hidden');
    activeAchs.classed('hidden', collapse);
    d3.select(this).select('img')
            .attr('src', collapse ? 'images/arrow-up.png' : 'images/arrow-down.png')
            .classed('collapsible-active', !collapse);
  }).append('img').attr('src', 'images/arrow-up.png').attr('class', 'collapsible');
  var activeAchs = scAchiv.append('div').attr("id", "actives").attr('class', 'hidden');
  scAchiv.append('div').attr('class', 'achivementCollapser')
          .text("Rewards ").on('click', function () {
    collapse = !unlockedAchs.classed('hidden');
    unlockedAchs.classed('hidden', collapse);
    d3.select(this).select('img')
            .attr('src', collapse ? 'images/arrow-up.png' : 'images/arrow-down.png')
            .classed('collapsible-active', !collapse);
  }).append('img').attr('src', 'images/arrow-up.png').attr('class', 'collapsible');
  var unlockedAchs = scAchiv.append('div').attr("id", "unlockedAchs").attr('class', 'hidden');
  for (var achivement in achivements) {
    achivements[achivement].forEach(function (d) {
      if (d.state === 'active') {
        var achivementDiv = activeAchs.append('div')
                .attr('class', 'achivement');
        achivementDiv.append('div')
                .attr('class', 'achivementHeader')
                .text(d.name);
        achivementDiv.append('div')
                .attr('class', 'achivementImage')
                .append("img")
                .attr("src", function () {
                  return "images/achivements/" + d.image;
                });
        achivementDiv.append('div')
                .attr('class', 'achivementMeter')
                .append('meter')
                .attr({value: localStorage[achivement], max: d.required});
        achivementDiv.append('div').attr('class', 'achivementProgress').text((localStorage[achivement] > d.required ? d.required : localStorage[achivement]) + '/' + d.required);
        var tooltip = achivementDiv.append("div").attr("class", "tooltip hidden");
        achivementDiv.on("click", function () {
          hidden = tooltip.classed("hidden");
          tooltip.classed("hidden", !hidden);
          if (hidden) {
            tooltip.append('p').text(d.discription);
          } else {
            tooltip.selectAll('p').remove();
          }
        });
      } else if (d.state === 'unlocked') {
        var achivementDiv = unlockedAchs.append('div')
                .attr('class', 'achivement');
        var reward = achivementDiv.append("div").attr("class", "reward").text('Get Reward');
        reward.append("svg").attr("class", "reward-svg").append("g")
                .attr("transform", "matrix(" + wScale + ",0,0," + hScale + "," + (66 * wScale) + "," + (33 * hScale) + ")")
                .append("path").attr("d", function(){
                  if(d.reward.type === "spider")
                    return spiders[d.reward.index];
                  else if(d.reward.type === "net")
                    return nets[d.reward.index];
                  else return backgrounds[d.reward.index];
                });
        reward.on("click", function () {
          localStorage[d.reward.type] = d.reward.index;
          init(false);
        });
      }
    });
  }
}

function levels(config) {
  reset();
  main.classed('scrollable', true);
  scLevel = main.append("div").attr("id", "levels");
  back = scLevel.append("img")
          .attr("class", "button")
          .attr("title", "back")
          .attr("src", "images/back48.png")
          .style("cursor", "pointer");
  back.on("click", function () {
    menu();
  });
  d3.json('json/slevels.json', function (data) {
    Levels = data.levels;
    var levels = scLevel.append('div').attr('class', 'levelContainer');
    Levels.forEach(function (d, i) {
      var level = levels.append('div').attr('class', 'level');
      level.append('p').text("Level " + (d.level));
      level.append('img').attr("src", getStoredStar(i + 1) >= 0 ? "images/star-filled48.png" : "images/star-empty48.png");
      level.append('img').attr("src", getStoredStar(i + 1) >= 1 ? "images/star-filled48.png" : "images/star-empty48.png");
      level.append('img').attr("src", getStoredStar(i + 1) == 2 ? "images/star-filled48.png" : "images/star-empty48.png");
      level.on("click", function () {
        start(d);
      });
    });
  });
}

function storeStar(index, stars) {
  var t = localStorage.stars.split(",");
  t[index] = stars;
  t.join(",");
  localStorage.stars = t;
}
function getStoredStar(index) {
  var t = localStorage.stars.split(",");
  return t[index];
}
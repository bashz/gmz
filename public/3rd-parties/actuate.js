scoreFacebookButton = function () {
    var fbPost = document.createElement("a");
    fbPost.classList.add("feed");
    fbPost.textContent = "Facebook";
    var share = document.getElementById("share");
    share.appendChild(fbPost);
    var myScore = score;
    if (typeof (myScore) == 'undefined')
        myScore = 0;
    fbPost.onclick = function () {
        var textMessage = "Spider - a game where you have to keep jumping to save the Spider";
        FB.ui({
            method: 'feed',
            link: 'http://pvpcalculator.com/spider',
            name: 'Spider - Reflex Game',
            picture: 'http://pvpcalculator.com/wp-content/uploads/2015/08/spider.png',
            caption: "I jumped " + myScore + " times",
            description: textMessage,
            ref: "spider_fbFeed"
        }, function (response) {
        });
    }
    return fbPost;
};
scoreTweetButton = function () {
    var tweet = document.createElement("a");
    var text = "I jumped " + score + " times on Spider - a game where you have to keep jumping to save the #Spider";
    tweet.classList.add("feed");
    tweet.setAttribute("data-via", "PvPCalculator");
    tweet.textContent = "Tweet it";
    var share = document.getElementById("share");
    share.appendChild(tweet);
    tweet.onclick = function () {
        var tWidth = 575,
                tHeight = 400,
                tLeft = (gWidth - tWidth) / 2,
                tTop = (gHeight - tHeight) / 2,
                url = "https://twitter.com/share?text=" + text,
                opts = 'status=1' +
                ',width=' + tWidth +
                ',height=' + tHeight +
                ',top=' + tTop +
                ',left=' + tLeft;

        window.open(url, 'twitter', opts);

        return false;
    };
    tweet.setAttribute("data-text", text);
    return tweet;
};
var width, height;
adsStartApp = function () {
    if (gWidth >= 1024 && gHeight >= 836) {
        width = 1024;
        height = 768;
    } else if (gWidth >= 768 && gHeight >= 1092) {
        width = 768;
        height = 1024;
    } else if (gWidth >= 480 && gHeight >= 388) {
        width = 480;
        height = 320;
    } else if (gWidth >= 320 && gHeight >= 548) {
        width = 320;
        height = 480;
    } else if (gWidth >= 1024 &&  gHeight >= 158) {
        width = 1024;
        height = 90;
    } else if (gWidth >= 768 && gHeight >= 158) {
        width = 728;
        height = 90;
    } else if (gWidth >= 320 && gHeight >= 118) {
        width = 320;
        height = 50;
    } else if (gWidth < 320 && gHeight >= 316) {
        width = 300;
        height = 250;
    } else {
        width = 300;
        height = 50;
    }
    d3.select("#game").append("script")
            .attr('type', 'text/javascript')
            .attr('src', 'http://www.startappexchange.com/js/startapp-tag.js');
};
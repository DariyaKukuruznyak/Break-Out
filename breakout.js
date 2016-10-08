window.onload = function () {
    init();
};
var isMovePlatformToRight = false;
var isMovePlatformToLeft = false;
var isExit = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
var mousePositionX = 0;
var isMouseMotion = false;

var documentBorder = 20;
var canvasWidth = document.documentElement.clientWidth - documentBorder;
var canvasHeight = document.documentElement.clientHeight - documentBorder;

var ballRadius = 15;
var platformWidth = 150;
var platformHeight = 30;
var level = 3;
var brickWidth = 70;
var brickHeight = 30;
var brickPadding = 5;
var playfieldColor = "#8FE3C8";
var elementsColor = "blue";
var speed = 8;

var scoreboardHeight = 50;
var scoreboardColor = "blue";
var score = 0;
var brickCount = "unknown";

function init() {
    var canvas = document.getElementById('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    var context = canvas.getContext("2d");

    score = 0;
    var playfield = new Rectangle(0, scoreboardHeight, canvasWidth, canvasHeight - scoreboardHeight, playfieldColor, context);
    playfield.background = new Image();
    playfield.background.src = "background/background.jpg";
    playfield.draw = function () {
        context.drawImage(playfield.background, playfield.x, playfield.y, playfield.width, playfield.height);
    };

    var platform = new Rectangle((playfield.width - platformWidth) / 2, playfield.height - platformHeight,
        platformWidth, platformHeight, elementsColor, context);
    //the speed of platform in 1.5 more then balls speed
    platform.speedX = 1.5 * speed;

    var ball = new Circle(playfield.width / 2, playfield.height - platformHeight - ballRadius,
        ballRadius, elementsColor, context);
    ball.speedX = speed;
    ball.speedY = speed;

    var brickTemplate = new Rectangle(playfield.x, playfield.y, brickWidth, brickHeight, elementsColor, context);
    brickTemplate.padding = brickPadding;
    brickTemplate.rowCount = level;
    var brickCeiling = BrickCeilingBuilder(brickTemplate, playfield);

    var scoreboard = new Rectangle(0, 0, canvasWidth, scoreboardHeight, scoreboardColor, context);
    scoreboard.draw = function () {
        context.beginPath();
        context.clearRect(this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.closePath();

        context.font = "bold 28px sans-serif";
        context.fillText("<< Break Out >>", 5 * brickPadding, 2 * scoreboardHeight / 3);
        //    context.strokeText("<< Break Out >>", 5 * brickPadding, 2 * scoreboardHeight / 3);
        context.fillText("Your score:  " + score + " / " + brickCount, canvasWidth - canvasWidth / 4, 2 * scoreboardHeight / 3);

        context.font = "bold 20px sans-serif";
        context.fillText("To stop press ESC", canvasWidth / 4, 2 * scoreboardHeight / 3);
    };

    var move = setInterval(function () {
        draw(playfield, platform, ball, brickCeiling, scoreboard);
        coordinatesRecalculation(playfield, platform, ball, brickCeiling, move);
    }, 1000 / 50);
}

function coordinatesRecalculation(playfield, platform, ball, brickCeiling, move) {
    console.log(ball.y);
    //if exit
    if (isExit) {
        if (confirm("Do you really want to stop the game?")) {
            clearInterval(move);
        }
    }
    // if ball touch left or right wall of playfield
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= playfield.width) {
        ball.speedX = -ball.speedX;
    }
    // if ball touch top of playfield
    if (ball.y - ball.radius <= playfield.y) {
        ball.speedY = -ball.speedY;
    }
    // if ball touch brickCeiling
    for (var i = brickCeiling.bricks.length - 1; i >= 0; i--) {
        if (!brickCeiling.bricks[i].isBroken) {
            if (ball.y - ball.radius <= brickCeiling.bricks[i].y + brickCeiling.bricks[i].height &&
                ball.x + ball.radius > brickCeiling.bricks[i].x &&
                ball.x - ball.radius < brickCeiling.bricks[i].x + brickCeiling.bricks[i].width) {
                ball.speedY = -ball.speedY;
                brickCeiling.bricks[i].isBroken = true;
                score++;
                soundBump();
                if (score == brickCount) {
                    clearInterval(move);
                    if (confirm("You win!!!!!!!!!! Do you want to start next level?")) {
                        level++;
                        init();
                    }
                }
                break;
            }
        }
    }
// if ball touch platform
    if (ball.y + ball.radius > platform.y) {
        if (ball.x + 2 * ball.radius / 3 >= platform.x && ball.x - 2 * ball.radius / 3 <= platform.x + platform.width) {
            ball.speedY = -ball.speedY;
        } else {
            clearInterval(move);
            if (confirm("You lose... :( Do you want to try again?")) {
                init();
            }
        }
    }

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    if (isMovePlatformToLeft) {
        platform.x += -platform.speedX;
    }
    if (isMovePlatformToRight) {
        platform.x += platform.speedX;
    }
    if (!isMovePlatformToRight && !isMovePlatformToLeft) {
        if (isMouseMotion) {
            if (mousePositionX < platform.x + platform.width / 3) {
                platform.x += -platform.speedX;
            } else if (mousePositionX > platform.x + 3 * platform.width / 4) {
                platform.x += platform.speedX;
            }
        }
    }
//correction
    if (platform.x < 0) {
        platform.x = 0;
    }
    if (platform.x + platform.width > playfield.width) {
        platform.x = playfield.width - platform.width;
    }
}

function draw(playfield, platform, ball, brickCeiling, scoreboard) {
    playfield.draw();
    platform.draw();
    ball.draw();
    scoreboard.draw();
    for (var i = 0; i < brickCeiling.bricks.length; i++) {
        if (!brickCeiling.bricks[i].isBroken) {
            brickCeiling.bricks[i].draw();
        }
    }
}

function Rectangle(x, y, width, height, color, context) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.context = context;
    this.draw = function () {
        context.beginPath();
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.closePath();
    }
}

function Circle(x, y, r, color, context) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = color;
    this.context = context;
    this.draw = function () {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }
}

function BrickCeilingBuilder(template, playfield) {
    var restPixels = playfield.width % (template.width + template.padding);
    var brickCountInRow = (playfield.width - restPixels) / (template.width + template.padding);
    var brickArray = {};
    brickArray.bricks = [brickCountInRow * template.rowCount];
    var brickNumber = 0;
    for (var i = 0; i < brickCountInRow; i++) {
        for (var j = 0; j < template.rowCount; j++) {
            brickArray.bricks[brickNumber] = new Rectangle(
                restPixels / 2 + i * (template.width + template.padding), playfield.y + j * (template.height + template.padding),
                template.width, template.height, template.color, template.context);
            brickArray.bricks[brickNumber++].isBroken = false;
        }
    }
    brickCount = brickArray.bricks.length;
    return brickArray;
}

function keyDownHandler(e) {
    switch (e.keyCode) {
        case 39:
            isMovePlatformToRight = true;
            break;
        case 37:
            isMovePlatformToLeft = true;
            break;
        case 27:
            isExit = true;
            break;
    }
}

function keyUpHandler(e) {
    switch (e.keyCode) {
        case 39:
            isMovePlatformToRight = false;
            break;
        case 37:
            isMovePlatformToLeft = false;
            break;
        case 27:
            isExit = true;
            break;
    }
}

function mouseMoveHandler(e) {
    if (mousePositionX === e.clientX) {
        isMouseMotion = false;
    }
    else {
        mousePositionX = e.clientX;
        isMouseMotion = true;
    }
}

function soundBump() {
    var audio = new Audio();
    audio.src = "sound/bump.wav";
    audio.autoplay = true;
    audio.volume = 0.5;
}

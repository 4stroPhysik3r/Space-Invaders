const scoreContainer = document.getElementById('score-container');
const livesContainer = document.getElementById('lives-container');
const uptimeContainer = document.getElementById('uptime-container');
const fpsContainer = document.getElementById('fps-container');
const finalScoreElement = document.getElementById('finalScore');
const body = document.querySelector('body')

let shipDOM;
let enemiesDivDOM;
let enemyDOMs = [];
let obstDivDOM;
let obstDOMs = [];
let enemyInterval;
let enemiesAlive = 0;

// create elements - set attributes
let ship = {
    xPos: 0,
    yPos: 0,
    speed: 7,
    bulletSpeed: 15,
};

let enemies = {
    direction: 'right',
    xSpeed: 12,
    ySpeed: 20,
    delay: 100,
    xPos: 0,
    yPos: 0,
}

let obst = {
    xPos: 0,
    yPos: 0,
}

let score = 0;
let lives = 3;
let gamePaused = false
let enemiesFrozen = false;
let gameOverBool = false;
let Pressed = {
    a: false,
    d: false,
    space: false,
    escape: false,
    enter: false
}

const startTime = new Date();
const endTime = new Date();
const timeDifference = endTime - startTime;

const seconds = Math.floor(timeDifference / 1000);
const minutes = Math.floor(seconds / 60);
const hours = Math.floor(minutes / 60);

const formattedTime = `${hours}:${(minutes % 60)}:${(seconds % 60)}`;

let minutesTimer = 0;
let secondsTimer = 0;

const times = [];
let fps;


function preformAnimation() {
    requestAnimationFrame(preformAnimation);
    if (!gamePaused) {
        move();
        animationShip();
    }
}

function createAnimationShip() {
    let frames = 1;
    let img = 1;

    return function () {
        frames += 1;
        if (frames > 6) {
            frames = 1;
            img++;
            if (img > 4) {
                img = 1;
            }
            shipDOM.src = "assets/space_ship/space_ship" + img + ".png";
        }
    };
}
const animationShip = createAnimationShip();

function drawShip() {
    shipDOM = document.createElement('img')
    shipDOM.id = 'ship'
    shipDOM.src = 'assets/space_ship/space_ship1.png'
    shipDOM.className = 'ship'

    body.appendChild(shipDOM)

    // starting position for the ship
    ship.xPos = (window.innerWidth - shipDOM.offsetWidth) / 2
    ship.yPos = window.innerHeight - 100
    positionElement(shipDOM, ship.xPos, ship.yPos);
}

function drawEnemies() {// Draw the enemies for the first time - to remove enemies, select enemy img and set src to ''
    enemies.direction = 'right'
    enemiesDivDOM = document.createElement('div')
    enemiesDivDOM.id = 'enemies'
    enemiesDivDOM.className = 'enemies'
    body.appendChild(enemiesDivDOM)

    enemies.xPos = ((window.innerWidth / 2) - enemiesDivDOM.offsetWidth * 3)
    enemies.yPos = 50

    positionElement(enemiesDivDOM, enemies.xPos, enemies.yPos)

    for (let x = 0; x < 55; x++) {
        let enemy = document.createElement('img')
        enemy.id = '' + x
        enemy.className = 'enemy'
        enemy.src = 'assets/enemies/enemy.png'
        enemiesDivDOM.appendChild(enemy)
        enemyDOMs.push(enemy)
        enemiesAlive++;
    }
}

function drawObstacles() {
    obstDivDOM = document.createElement('div')
    obstDivDOM.id = 'obst'
    obstDivDOM.className = 'obst'
    body.appendChild(obstDivDOM)

    obst.xPos = ((window.innerWidth / 2) - obstDivDOM.offsetWidth * 3)
    obst.yPos = 750

    positionElement(obstDivDOM, obst.xPos, obst.yPos)

    for (let x = 0; x < 200; x++) {
        let obst = document.createElement('img')
        obst.id = '' + x
        obst.className = 'obst'
        obst.src = 'assets/obstacles/wall.png'
        obstDivDOM.appendChild(obst)
        obstDOMs.push(obst)
    }
}

function positionElement(element, x, y) {   // sets element position
    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
}

function controller() { // track pressed keys
    document.addEventListener('keydown', function (event) {
        switch (event.key) {
            case "a":
                Pressed.a = true;
                break;
            case "d":
                Pressed.d = true;
                break;
            case " ":
                if (Pressed.space == false) {
                    playerShoot()
                }
                Pressed.space = true;
                break;
            case "Escape":
                if (Pressed.escape === false) {
                    togglePause();
                }
                Pressed.escape = true;
                break;
        }
    });

    document.addEventListener('keyup', function (event) { // track released keys
        switch (event.key) {
            case "a":
                Pressed.a = false;
                break;
            case "d":
                Pressed.d = false;
                break;
            case " ":
                Pressed.space = false;
                break;
            case "Escape":
                Pressed.escape = false;
                break;
        }
    });
}

function move() {   // move of the ship and bullets
    if (Pressed.a) {
        if (ship.xPos - ship.speed > 0) {
            ship.xPos -= ship.speed;
        }
        positionElement(shipDOM, ship.xPos, ship.yPos);
    }

    if (Pressed.d) {
        if (ship.xPos + ship.speed < window.innerWidth - shipDOM.offsetWidth) {
            ship.xPos += ship.speed;
        }
        positionElement(shipDOM, ship.xPos, ship.yPos);
    }

    checkBulletCollision();
}

function createEnemyBullet(x, y) {
    let bullet = document.createElement('img');
    bullet.src = 'assets/bullets/laser_bullet.png';
    bullet.className = "enemy-bullets";
    body.appendChild(bullet);

    positionElement(bullet, x, y);

    return bullet;
}

function enemyShoot(enemyX, enemyY) {
    const bullet = createEnemyBullet(enemyX, enemyY);

    const enemyBulletSpeed = 10;
    const interval = setInterval(() => {
        if (gameOverBool) {
            clearInterval(interval);
            bullet.remove();
            return;
        }
        if (gamePaused || enemiesFrozen) {
            return;
        }

        const bulletY = parseInt(bullet.style.top, 10);
        if (bulletY > window.innerHeight) {
            clearInterval(interval);
            bullet.remove();
        } else {
            bullet.style.top = bulletY + enemyBulletSpeed + "px";

            let enemyCollision = checkEnemyBulletCollision(bullet.getBoundingClientRect())
            let [obstCollision, obst] = checkObstacleBulletCollision(bullet.getBoundingClientRect());

            if (enemyCollision) {
                clearInterval(interval);
                bullet.remove();
                lives--;
                livesContainer.textContent = `Lives: ${lives}`;
                if (lives === 0) {
                    gameOver()
                }
            }

            if (obstCollision) {
                bullet.remove();
                let obstIndex = obstDOMs.indexOf(obst);
                obstDOMs.splice(obstIndex, 1);
                obst.src = '';
            }
        }
    }, 1000 / 60); // 60fps
}

function checkPlayerBulletCollision(bullet) {
    for (let enemyDOM of enemyDOMs) {
        let enemy = enemyDOM.getBoundingClientRect();
        if (bullet.top <= enemy.top + enemy.height &&
            bullet.top + bullet.height >= enemy.top &&
            bullet.left <= enemy.left + enemy.width &&
            bullet.left + bullet.width >= enemy.left) {
            enemiesAlive--;
            return [true, enemyDOM];
        }
    }
    return [false, null];
}

function checkEnemyBulletCollision(bullet) {
    let ship = shipDOM.getBoundingClientRect();
    return bullet.top <= ship.top + ship.height &&
        bullet.top + bullet.height >= ship.top &&
        bullet.left <= ship.left + ship.width &&
        bullet.left + bullet.width >= ship.left;
}

function checkObstacleBulletCollision(bullet) {
    for (let obstDOM of obstDOMs) {
        let obst = obstDOM.getBoundingClientRect();
        if (bullet.top <= obst.top + obst.height &&
            bullet.top + bullet.height >= obst.top &&
            bullet.left <= obst.left + obst.width &&
            bullet.left + bullet.width >= obst.left) {
            return [true, obstDOM];
        }
    }
    return [false, null];
}

function checkBulletCollision() {
    const bullets = document.querySelectorAll('.bullets');
    if (bullets.length !== 0) {
        bullets.forEach(bullet => {
            let yPos = Number((bullet.style.top).slice(0, -2));
            let [enemyCollision, enemy] = checkPlayerBulletCollision(bullet.getBoundingClientRect());
            let [obstCollision, obst] = checkObstacleBulletCollision(bullet.getBoundingClientRect());

            if (enemyCollision) {
                bullet.remove();
                let enemyIndex = enemyDOMs.indexOf(enemy);
                enemyDOMs.splice(enemyIndex, 1);
                enemy.src = '';
                score += 100;
                scoreContainer.textContent = `Score: ${score}`;

                if (enemiesAlive === 0) {
                    startNewWave();
                }
            } else {
                if (yPos > 0) {
                    yPos -= ship.bulletSpeed;
                    bullet.style.top = yPos + "px";
                } else {
                    bullet.remove();
                }
            }

            if (obstCollision) {
                bullet.remove();
                let obstIndex = obstDOMs.indexOf(obst);
                obstDOMs.splice(obstIndex, 1);
                obst.src = '';
            }
        });
    }
}

function moveEnemies() { // enemy move on screen
    if (gamePaused || enemiesFrozen) { // freeze enemies in place when game is paused
        return;
    }

    for (let enemyDOM of enemyDOMs) {
        let enemy = enemyDOM.getBoundingClientRect();

        if (
            (enemies.direction === 'right' && window.innerWidth - (enemy.left + enemy.width) < enemies.xSpeed) ||
            (enemies.direction === 'left' && enemy.left < enemies.xSpeed)
        ) {
            enemies.direction = enemies.direction === 'right' ? 'left' : 'right';
            enemies.yPos += enemies.ySpeed;
            break;
        }
        if (Math.random() < 0.005) { // Adjust the probability of shooting
            const enemyX = enemy.left + enemy.width / 2;
            const enemyY = enemy.bottom;
            enemyShoot(enemyX, enemyY);
        }
    }

    if (enemies.direction === 'right') {
        enemies.xPos += enemies.xSpeed;
    } else {
        enemies.xPos -= enemies.xSpeed;
    }

    if ((enemies.yPos + enemiesDivDOM.offsetHeight) > window.innerHeight - (shipDOM.offsetHeight * 2)) {
        gameOver()
    }

    positionElement(enemiesDivDOM, enemies.xPos, enemies.yPos)
}

function playerShoot() {  // helping function for creating bullets on screen
    if (gamePaused) {
        return
    }
    let bullet = document.createElement('img');
    bullet.src = 'assets/bullets/laser_bullet.png';
    bullet.className = "bullets"
    body.appendChild(bullet);

    let bulletX = ship.xPos + (shipDOM.offsetWidth * 0.35);
    let bulletY = ship.yPos;

    positionElement(bullet, bulletX, bulletY);
}

function startScreen() {   // press enter to start
    const startOverlay = document.getElementById('startOverlay');
    startOverlay.style.display = 'block';

    score = 0;
    finalScoreElement.textContent = score;
    scoreContainer.style.display = 'none';
    scoreContainer.textContent = `Score: ${score}`;

    lives = 3;
    livesContainer.textContent = `Lives: ${lives}`;
    livesContainer.style.display = 'none';
    fpsContainer.style.display = 'none';

    document.addEventListener('keydown', function startCallback(event) {
        if (event.key === 'Enter') {
            document.removeEventListener('keydown', this)
            startOverlay.style.display = 'none';
            scoreContainer.style.display = 'block';
            uptimeContainer.style.display = 'block';
            livesContainer.style.display = 'block';
            fpsContainer.style.display = 'block';
            fpsContainer.textContent = `FPS: ${fps}`;

            setInterval(upTime, 1000);

            controller();
            drawEnemies();
            drawShip();
            drawObstacles();
            enemyInterval = setInterval(moveEnemies, enemies.delay)
            gamePaused = false;

            requestAnimationFrame(preformAnimation);

            this.removeEventListener('keydown', startCallback)
        }
    });
}
startScreen()

function togglePause() {
    if (!gameOverBool) {
        if (!gamePaused) {
            gamePaused = true;
            enemiesFrozen = true;
            document.getElementById('pauseMenu').style.display = 'block';

            document.addEventListener('keydown', function restart(event) {
                if (event.key === 'Enter') {
                    gameOver();
                    document.getElementById('pauseMenu').style.display = 'none';
                    this.removeEventListener('keydown', restart)
                    gamePaused = false;
                    enemiesFrozen = false;
                }
            });
        } else {
            gamePaused = false;
            enemiesFrozen = false;
            document.getElementById('pauseMenu').style.display = 'none';
        }
    }
}

function startNewWave() {
    for (let enemyDOM of enemyDOMs) {
        enemyDOM.remove();
    }

    enemyDOMs = [];
    enemiesDivDOM.remove();
    enemiesAlive = 0;

    // Create new wave of enemies
    drawEnemies();
}

function gameOver() {
    gamePaused = true;
    gameOverBool = true;
    enemiesDivDOM.remove();
    enemyDOMs = [];
    shipDOM.remove();
    obstDivDOM.remove();
    obstDOMs = [];

    clearInterval(enemyInterval);

    const bullets = document.querySelectorAll('.bullets');
    bullets.forEach(function (bullet) {
        bullet.remove()
    })

    scoreContainer.style.display = 'none';
    livesContainer.style.display = 'none';
    uptimeContainer.style.display = 'none';
    fpsContainer.style.display = 'none';

    // Get the final score and update the end screen
    finalScoreElement.textContent = score;

    const endOverlay = document.getElementById('endOverlay');
    endOverlay.style.display = 'block';

    document.addEventListener('keydown', function gameOverCallback(event) {
        if (event.key === 'Enter') {
            score = 0;
            finalScoreElement.textContent = score;

            scoreContainer.style.display = 'block';
            livesContainer.style.display = 'block';
            uptimeContainer.style.display = 'block';
            fpsContainer.style.display = 'block';

            scoreContainer.textContent = `Score: 0`
            livesContainer.textContent = `Lives: 3`
            lives = 3;
            minutesTimer = 0;
            secondsTimer = 0;
            uptimeContainer.textContent = `Time: 00:00`

            endOverlay.style.display = 'none';
            drawEnemies();
            drawShip();
            drawObstacles();
            enemyInterval = setInterval(moveEnemies, enemies.delay);
            gamePaused = false;
            gameOverBool = false;
            this.removeEventListener('keydown', gameOverCallback)
        }
    });
}

function upTime() { // displays the current in-game time
    if (!gamePaused) {
        secondsTimer++;
        if (secondsTimer === 60) {
            secondsTimer = 0;
            minutesTimer++;
        }
    }

    const formattedMinutes = minutesTimer < 10 ? `0${minutesTimer}` : minutesTimer;
    const formattedSeconds = secondsTimer < 10 ? `0${secondsTimer}` : secondsTimer;

    uptimeContainer.textContent = `time: ${formattedMinutes}:${formattedSeconds}`;
}

function refreshFPS() { // displays frames per second
    window.requestAnimationFrame(() => {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps = times.length;

        // rounding the fps with 2 frames to 60
        const roundedFps = (Math.abs(fps - 60) <= 2) ? 60 : fps;
        fpsContainer.textContent = `FPS: ${roundedFps}`;

        refreshFPS();
    });
}
refreshFPS();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar tamanho do canvas internamente
function resizeCanvas() {
    canvas.width = 480;
    canvas.height = 720;
}
resizeCanvas();

// Variáveis de Jogo
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let gameSpeed = 5;
let roadLineOffset = 0;

// Jogador
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 120,
    width: 50,
    height: 90,
    speed: 6,
    dx: 0
};

// Inimigos e Itens
let obstacles = [];
let spawnTimer = 0;

// Controles Teclado
const keys = {
    left: false,
    right: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Controles Touch / Mobile
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });

// Mouse support for mobile buttons on desktop simulation
leftBtn.addEventListener('mousedown', () => keys.left = true);
leftBtn.addEventListener('mouseup', () => keys.left = false);
rightBtn.addEventListener('mousedown', () => keys.right = true);
rightBtn.addEventListener('mouseup', () => keys.right = false);

// Funções de UI
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuScreen = document.getElementById('menu-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const speedEl = document.getElementById('speed');

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    player.x = canvas.width / 2 - player.width / 2;
    menuScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = Math.floor(score);
    gameoverScreen.classList.remove('hidden');
    hud.classList.add('hidden');
}

// Desenhar Estrada
function drawRoad() {
    // Asfalto
    ctx.fillStyle = '#444';
    ctx.fillRect(40, 0, canvas.width - 80, canvas.height);

    // Bordas da pista (Acostamento)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 40, canvas.height);
    ctx.fillRect(canvas.width - 40, 0, 40, canvas.height);

    // Linhas laterais vermelhas e brancas
    ctx.fillStyle = '#fff';
    ctx.fillRect(35, 0, 5, canvas.height);
    ctx.fillRect(canvas.width - 40, 0, 5, canvas.height);

    // Linhas centrais tracejadas animadas
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -roadLineOffset;
    
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
}

// Desenhar Carro
function drawCar(x, y, color, isPlayer = false) {
    ctx.save();
    ctx.translate(x, y);

    // Corpo do carro
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(0, 0, 50, 90, 10);
    ctx.fill();

    // Vidros / Para-brisas
    ctx.fillStyle = '#111';
    ctx.fillRect(8, 20, 34, 20); // Para-brisa dianteiro
    ctx.fillRect(10, 60, 30, 15); // Vidro traseiro

    // Faróis
    if (isPlayer) {
        ctx.fillStyle = '#fffa65';
        ctx.fillRect(5, 2, 8, 4);
        ctx.fillRect(37, 2, 8, 4);
    } else {
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(5, 84, 8, 4);
        ctx.fillRect(37, 84, 8, 4);
    }

    // Rodas
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, 15, 6, 18);
    ctx.fillRect(49, 15, 6, 18);
    ctx.fillRect(-5, 65, 6, 18);
    ctx.fillRect(49, 65, 6, 18);

    ctx.restore();
}

// Lógica de Atualização
function update() {
    if (gameState !== 'PLAYING') return;

    // Movimento da estrada
    roadLineOffset += gameSpeed;
    if (roadLineOffset > 60) roadLineOffset = 0;

    // Movimento do Jogador
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    // Limites da pista
    const minX = 45;
    const maxX = canvas.width - 45 - player.width;
    if (player.x < minX) player.x = minX;
    if (player.x > maxX) player.x = maxX;

    // Gerar Obstáculos
    spawnTimer++;
    if (spawnTimer > Math.max(30, 90 - Math.floor(gameSpeed * 3))) {
        spawnTimer = 0;
        const laneWidth = (canvas.width - 100) / 3;
        const lane = Math.floor(Math.random() * 3);
        const spawnX = 50 + lane * laneWidth + (laneWidth - 50) / 2;
        
        const colors = ['#ff3838', '#ff9f1a', '#32ff7e', '#18dcff', '#706fd3'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        obstacles.push({
            x: spawnX,
            y: -100,
            width: 50,
            height: 90,
            color: randomColor,
            speed: gameSpeed + (Math.random() * 2 - 1)
        });
    }

    // Atualizar Obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += gameSpeed;

        // Colisão (AABB simples)
        if (
            player.x < obstacles[i].x + obstacles[i].width - 10 &&
            player.x + player.width > obstacles[i].x + 10 &&
            player.y < obstacles[i].y + obstacles[i].height - 10 &&
            player.y + player.height > obstacles[i].y + 10
        ) {
            gameOver();
        }

        // Remover se passar da tela
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    // Aumentar dificuldade gradualmente
    gameSpeed += 0.001;
    score += 0.05;

    // Atualizar HUD
    scoreEl.innerText = Math.floor(score);
    speedEl.innerText = (gameSpeed).toFixed(1);
}

// Renderização Visual
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();

    // Desenhar Obstáculos
    obstacles.forEach(obs => {
        drawCar(obs.x, obs.y, obs.color, false);
    });

    // Desenhar Jogador
    drawCar(player.x, player.y, '#00d2d3', true);
}

// Loop Principal
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
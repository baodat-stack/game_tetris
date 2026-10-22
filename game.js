// --- 1. CONFIG & SETUP ---
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

// Scale để 1 ô có kích thước 24x24 px (Bảng 10 cột x 20 hàng = 240x480)
context.scale(24, 24); 
nextContext.scale(20, 20); // Scale nhỏ hơn cho khung Next

const COLORS = [
    null,
    '#0ea5e9', // 1: I (Cyan)
    '#3b82f6', // 2: J (Blue)
    '#f97316', // 3: L (Orange)
    '#eab308', // 4: O (Yellow)
    '#22c55e', // 5: S (Green)
    '#a855f7', // 6: T (Purple)
    '#ef4444', // 7: Z (Red)
    '#6b7280'  // 8: Garbage (Gray)
];

// Các hình khối (Matrix)
const PIECES = {
    'I': [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
    'J': [[0,2,0], [0,2,0], [2,2,0]],
    'L': [[0,3,0], [0,3,0], [0,3,3]],
    'O': [[4,4], [4,4]],
    'S': [[0,5,5], [5,5,0], [0,0,0]],
    'T': [[0,0,0], [6,6,6], [0,6,0]],
    'Z': [[7,7,0], [0,7,7], [0,0,0]]
};
const PIECE_TYPES = 'IJLOSTZ';

// --- 2. TRẠNG THÁI GAME (GAME STATE) ---
let arena = createMatrix(10, 20);
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    nextMatrix: null,
    score: 0,
    lines: 0,
    level: 1,
    piecesPlaced: 0 // Đếm số khối đã đặt (cho Level 4)
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;
let isPaused = false;
let isGameOver = false;
let lastQuakeTime = 0; // Cho Level 5

// --- 3. LÕI TETRIS (CORE LOGIC) ---
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    return PIECES[type];
}

function drawMatrix(matrix, offset, ctx = context, isGhost = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                if (isGhost) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Bóng mờ
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Tạo bóng mờ (Ghost Piece)
function getGhostPos() {
    let ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--; // Lùi lại 1 bước trước khi va chạm
    return ghost.pos;
}

function draw() {
    // Xóa Canvas chính
    context.fillStyle = '#1f2937';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0}); // Vẽ bàn cờ

    // Xóa Canvas Next
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    // Level 2 (Blind): Ẩn bóng mờ và Next Piece
    if (player.level !== 2) {
        drawMatrix(player.matrix, getGhostPos(), context, true); // Vẽ bóng mờ
        
        // Vẽ Next Piece canh giữa nhỏ nhỏ
        if (player.nextMatrix) {
            let offset = {
                x: 2 - player.nextMatrix[0].length / 2, 
                y: 2 - player.nextMatrix.length / 2
            };
            drawMatrix(player.nextMatrix, offset, nextContext);
        }
    }

    drawMatrix(player.matrix, player.pos); // Vẽ khối hiện tại
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function hardDrop() {
    player.score += 10; // Bonus nhỏ
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerRotate() {
    // Level 6 cấm xoay
    if (player.level === 6) return;

    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    // Xử lý đá tường (Wall kick) nếu xoay bị vướng
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1); // Vướng quá không xoay được thì hoàn tác
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir = 1) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerReset() {
    player.piecesPlaced++;
    
    if (!player.nextMatrix) {
        player.nextMatrix = createPiece(PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]);
    }
    player.matrix = player.nextMatrix;
    player.nextMatrix = createPiece(PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]);
    
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
    
    // Xử lý Level 4 (Trời Sập): Cứ thả 5 khối đẩy 1 hàng rác lên
    if (player.level === 4 && player.piecesPlaced > 0 && player.piecesPlaced % 5 === 0) {
        addGarbageRow();
    }

    // GAME OVER CHECK
    if (collide(arena, player)) {
        handleGameOver();
    }
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    outer: for (let y = arena.length -1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0 || arena[y][x] === 8) { // Không xóa nếu có lỗ hổng hoặc là hàng rác rỗng? Rác vẫn xóa được nếu lấp đầy
                if (arena[y][x] === 0) continue outer; 
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        
        linesCleared++;
        player.score += rowCount * 100 * player.level;
        rowCount *= 2; // Xóa nhiều hàng x2 điểm
    }
    
    if (linesCleared > 0) {
        player.lines += linesCleared;
        checkLevelUp();
    }
}

// --- 4. HỆ THỐNG LEVEL & HIỆU ỨNG ĐẶC BIỆT ---
function setLevelSettings(lvl) {
    player.level = lvl;
    const titles = ["Classic", "Blind Mode", "Obstacle", "Garbage Attack", "Earthquake", "Sudden Death"];
    document.getElementById('level-title').innerText = `LEVEL ${lvl}: ${titles[lvl-1].toUpperCase()}`;
    document.getElementById('level-val').innerText = lvl;
    
    // Tốc độ mặc định giảm dần (nhanh hơn) khi level tăng
    dropInterval = 1000 - (lvl * 100); 
    
    if (lvl === 6) dropInterval = 250; // Level 6 rớt cực nhanh
    
    // Level 3: Khởi tạo rác
    if (lvl === 3 && player.piecesPlaced === 0) {
        arena = createMatrix(10, 20); // Xóa bảng cũ
        addGarbageRow(3);
    }
    
    if(lvl === 5) lastQuakeTime = Date.now();
}

function checkLevelUp() {
    // Thăng cấp khi đủ (Level * 1000) điểm
    let threshold = player.level * 1000;
    if (player.score >= threshold && player.level < 6) {
        setLevelSettings(player.level + 1);
    }
}

// Thêm hàng rác từ dưới lên
function addGarbageRow(lines = 1) {
    for(let i=0; i<lines; i++) {
        arena.shift(); // Vứt hàng trên cùng
        const row = new Array(10).fill(8); // Màu số 8 là rác xám
        row[Math.floor(Math.random() * 10)] = 0; // Tạo 1 lỗ hổng
        arena.push(row);
    }
}

// Hiệu ứng Động đất (Shift ngang)
function triggerEarthquake() {
    for (let y = 0; y < arena.length; ++y) {
        // Kiểm tra xem dòng đó có chứa block nào > 0 không
        let hasBlock = arena[y].some(v => v > 0);
        if(hasBlock && Math.random() > 0.5) {
            let shiftLeft = Math.random() > 0.5;
            if(shiftLeft) {
                let first = arena[y].shift();
                arena[y].push(first === 0 ? 0 : 8); // Nếu dồn block qua mép, nó thành rác/mất
            } else {
                let last = arena[y].pop();
                arena[y].unshift(last === 0 ? 0 : 8);
            }
        }
    }
}

// --- 5. GAME LOOP & EVENT HANDLERS ---
function update(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    // Xử lý Level 5: Động đất mỗi 10s
    if (player.level === 5 && Date.now() - lastQuakeTime > 10000) {
        triggerEarthquake();
        lastQuakeTime = Date.now();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score-val').innerText = player.score;
    document.getElementById('lines-val').innerText = player.lines;
}

function handleGameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    document.getElementById('overlay-title').innerText = "GAME OVER";
    document.getElementById('overlay-desc').innerText = `Level đạt được: ${player.level} | Điểm: ${player.score}`;
    document.getElementById('resume-btn').classList.add('hidden');
    document.getElementById('overlay').classList.add('active');
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(animationId);
        document.getElementById('overlay-title').innerText = "TẠM DỪNG";
        document.getElementById('overlay-desc').innerText = "";
        document.getElementById('resume-btn').classList.remove('hidden');
        document.getElementById('overlay').classList.add('active');
    } else {
        document.getElementById('overlay').classList.remove('active');
        lastTime = performance.now();
        update();
    }
}

// UI Chuyển màn hình
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startGame(level) {
    arena = createMatrix(10, 20); // Xóa bảng
    player.score = 0;
    player.lines = 0;
    player.piecesPlaced = 0;
    player.nextMatrix = null;
    
    setLevelSettings(level);
    updateScore();
    playerReset();
    
    isGameOver = false;
    isPaused = false;
    document.getElementById('overlay').classList.remove('active');
    
    switchScreen('game-screen');
    lastTime = performance.now();
    update();
}

function exitGame() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    switchScreen('menu-screen');
    document.getElementById('overlay').classList.remove('active');
}

// Lắng nghe bàn phím
document.addEventListener('keydown', event => {
    if (isGameOver && event.keyCode !== 80) return; // Nếu game over chỉ cho phép vài nút, tạm bỏ qua hết trừ P
    
    if (event.keyCode === 80) { // P - Pause
        if(document.getElementById('game-screen').classList.contains('active')) togglePause();
        return;
    }

    if (isPaused) return;

    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1); draw(); break;
        case 39: // Right
            playerMove(1); draw(); break;
        case 40: // Down
            playerDrop(); draw(); break;
        case 38: // Up
            playerRotate(); draw(); break;
        case 32: // Space
            hardDrop(); draw(); break;
    }
});
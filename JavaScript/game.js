document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas和上下文
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('nextPiece');
    const nextCtx = nextCanvas.getContext('2d');
    
    // 获取UI元素
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    
    // 获取音频元素
    const moveSound = document.getElementById('moveSound');
    const rotateSound = document.getElementById('rotateSound');
    const dropSound = document.getElementById('dropSound');
    const clearSound = document.getElementById('clearSound');
    const gameOverSound = document.getElementById('gameOverSound');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    // 游戏设置
    const scale = 30;
    const rows = canvas.height / scale;
    const columns = canvas.width / scale;
    
    // 游戏状态
    let score = 0;
    let gameOver = true;
    let gameStarted = false;
    let gamePaused = false;
    let soundOn = true;
    let musicOn = true;
    let startTime = 0;
    let timerInterval = null;
    let speed = 1000; // 初始下落速度(毫秒)
    let lastDropTime = 0;
    
    // 方块定义
    const pieces = [
        // I
        [[1, 1, 1, 1]],
        // J
        [[1, 0, 0],
         [1, 1, 1]],
        // L
        [[0, 0, 1],
         [1, 1, 1]],
        // O
        [[1, 1],
         [1, 1]],
        // S
        [[0, 1, 1],
         [1, 1, 0]],
        // T
        [[0, 1, 0],
         [1, 1, 1]],
        // Z
        [[1, 1, 0],
         [0, 1, 1]]
    ];
    
    // 颜色定义
    const colors = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
    ];
    
    // 游戏板
    let board = createBoard();
    let piece = null;
    let nextPiece = null;
    
    // 初始化游戏板
    function createBoard() {
        return Array.from(Array(rows), () => Array(columns).fill(0));
    }
    
    // 创建新方块
    function createPiece() {
        if (nextPiece === null) {
            nextPiece = {
                shape: pieces[Math.floor(Math.random() * pieces.length)],
                color: Math.floor(Math.random() * (colors.length - 1)) + 1,
                pos: {x: Math.floor(columns / 2) - 1, y: 0}
            };
        }
        
        piece = nextPiece;
        drawNextPiece();
        
        nextPiece = {
            shape: pieces[Math.floor(Math.random() * pieces.length)],
            color: Math.floor(Math.random() * (colors.length - 1)) + 1,
            pos: {x: Math.floor(columns / 2) - 1, y: 0}
        };
    }
    
    // 绘制下一个方块预览
    function drawNextPiece() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (nextPiece) {
            const shape = nextPiece.shape;
            const color = colors[nextPiece.color];
            
            // 计算居中位置
            const offsetX = (nextCanvas.width - shape[0].length * scale / 2) / 2;
            const offsetY = (nextCanvas.height - shape.length * scale / 2) / 2;
            
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        nextCtx.fillStyle = color;
                        nextCtx.fillRect(
                            offsetX + x * scale / 2, 
                            offsetY + y * scale / 2, 
                            scale / 2 - 1, 
                            scale / 2 - 1
                        );
                    }
                });
            });
        }
    }
    
    // 绘制游戏
    function draw() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制已落下的方块
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
                }
            });
        });
        
        // 绘制当前方块
        if (piece) {
            piece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillStyle = colors[piece.color];
                        ctx.fillRect(
                            (piece.pos.x + x) * scale,
                            (piece.pos.y + y) * scale,
                            scale - 1,
                            scale - 1
                        );
                    }
                });
            });
        }
    }
    
    // 碰撞检测
    function collide() {
        if (!piece) return false;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0 &&
                    (board[y + piece.pos.y] === undefined ||
                     board[y + piece.pos.y][x + piece.pos.x] === undefined ||
                     board[y + piece.pos.y][x + piece.pos.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 合并方块到游戏板
    function merge() {
        if (!piece) return;
        
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[y + piece.pos.y][x + piece.pos.x] = piece.color;
                }
            });
        });
    }
    
    // 旋转方块
    function rotate() {
        if (!piece) return;
        
        const originalShape = piece.shape;
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        
        // 创建新的旋转后的形状
        const newShape = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                newShape[x][rows - 1 - y] = piece.shape[y][x];
            }
        }
        
        piece.shape = newShape;
        
        // 如果旋转后发生碰撞，则恢复原状
        if (collide()) {
            piece.shape = originalShape;
        } else {
            if (soundOn) rotateSound.play();
        }
    }
    
    // 移动方块
    function movePiece(dir) {
        if (!piece) return;
        
        piece.pos.x += dir;
        if (collide()) {
            piece.pos.x -= dir;
        } else {
            if (soundOn) moveSound.play();
        }
    }
    
    // 方块下落
    function dropPiece() {
        if (!piece) return;
        
        piece.pos.y++;
        if (collide()) {
            piece.pos.y--;
            merge();
            checkDiagonalClears();
            createPiece();
            
            // 检查游戏结束
            if (collide()) {
                gameOver = true;
                if (soundOn) gameOverSound.play();
                backgroundMusic.pause();
                clearInterval(timerInterval);
                alert(`游戏结束! 你的分数: ${score}`);
            }
        }
        
        lastDropTime = Date.now();
        if (soundOn) dropSound.play();
    }
    
    // 硬降落（直接落到底部）
    function hardDrop() {
        if (!piece || gameOver || gamePaused) return;
        
        while (!collide()) {
            piece.pos.y++;
        }
        piece.pos.y--;
        merge();
        checkDiagonalClears();
        createPiece();
        
        if (collide()) {
            gameOver = true;
            if (soundOn) gameOverSound.play();
            backgroundMusic.pause();
            clearInterval(timerInterval);
            alert(`游戏结束! 你的分数: ${score}`);
        }
        
        lastDropTime = Date.now();
        if (soundOn) dropSound.play();
    }
    
    // 检查对角线消除
    function checkDiagonalClears() {
        let clearedAny = false;
        const marked = Array.from(Array(rows), () => Array(columns).fill(false));
        
        // 检查从左上到右下的对角线
        for (let d = 0; d < rows + columns - 1; d++) {
            let startX = Math.max(0, d - rows + 1);
            let count = 0;
            let x = startX;
            let y = Math.max(0, rows - 1 - d + x);
            
            // 先统计这条对角线上有多少方块
            while (x < columns && y < rows) {
                if (board[y][x] !== 0) count++;
                x++;
                y++;
            }
            
            // 如果填满则标记
            if (count === Math.min(columns - startX, rows - Math.max(0, rows - 1 - d + startX))) {
                clearedAny = true;
                x = startX;
                y = Math.max(0, rows - 1 - d + x);
                
                while (x < columns && y < rows) {
                    marked[y][x] = true;
                    x++;
                    y++;
                }
            }
        }
        
        // 检查从右上到左下的对角线
        for (let d = 0; d < rows + columns - 1; d++) {
            let startX = Math.min(columns - 1, d);
            let count = 0;
            let x = startX;
            let y = Math.max(0, d - x);
            
            // 先统计这条对角线上有多少方块
            while (x >= 0 && y < rows) {
                if (board[y][x] !== 0) count++;
                x--;
                y++;
            }
            
            // 如果填满则标记
            if (count === Math.min(startX + 1, rows - (d - startX))) {
                clearedAny = true;
                x = startX;
                y = Math.max(0, d - x);
                
                while (x >= 0 && y < rows) {
                    marked[y][x] = true;
                    x--;
                    y++;
                }
            }
        }
        
        if (clearedAny) {
            if (soundOn) clearSound.play();
            
            // 显示被消除的方块
            draw();
            
            // 高亮显示被消除的方块
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < columns; x++) {
                    if (marked[y][x]) {
                        ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
                    }
                }
            }
            
            // 等待1秒后实际消除
            setTimeout(() => {
                // 实际消除标记的方块
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < columns; x++) {
                        if (marked[y][x]) {
                            board[y][x] = 0;
                        }
                    }
                }
                
                // 计算分数 (每条消除的对角线加100分)
                let clearCount = 0;
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < columns; x++) {
                        if (marked[y][x]) clearCount++;
                    }
                }
                
                score += clearCount * 10;
                scoreElement.textContent = score;
                
                // 方块下落填补空缺
                dropBlocks();
            }, 1000);
        }
    }
    
    // 方块下落填补空缺
    function dropBlocks() {
        for (let x = 0; x < columns; x++) {
            let emptyY = rows - 1;
            
            for (let y = rows - 1; y >= 0; y--) {
                if (board[y][x] !== 0) {
                    if (emptyY !== y) {
                        board[emptyY][x] = board[y][x];
                        board[y][x] = 0;
                    }
                    emptyY--;
                }
            }
        }
    }
    
    // 更新计时器显示
    function updateTimer() {
        const currentTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 每30秒增加下落速度
        if (currentTime > 0 && currentTime % 30 === 0) {
            speed = Math.max(100, speed - 50); // 最快不低于100ms
        }
    }
    
    // 游戏循环
    function gameLoop() {
        if (gamePaused || gameOver) return;
        
        const now = Date.now();
        const delta = now - lastDropTime;
        
        if (delta > speed) {
            dropPiece();
        }
        
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // 暂停/继续游戏功能
    pauseBtn.addEventListener('click', togglePause);
    
    function togglePause() {
        if (!gameStarted || gameOver) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            pauseBtn.textContent = "继续游戏";
            backgroundMusic.pause();
            clearInterval(timerInterval);
        } else {
            pauseBtn.textContent = "暂停游戏";
            if (musicOn) backgroundMusic.play().catch(e => console.log("播放被阻止:", e));
            timerInterval = setInterval(updateTimer, 1000);
            lastDropTime = Date.now(); // 重置下落计时
            gameLoop(); // 重新启动游戏循环
        }
    }
    
    // 键盘控制
    document.addEventListener('keydown', event => {
        if (gameOver || gamePaused) return;
        
        switch (event.keyCode) {
            case 37: // 左箭头
                movePiece(-1);
                break;
            case 39: // 右箭头
                movePiece(1);
                break;
            case 40: // 下箭头
                dropPiece();
                break;
            case 38: // 上箭头
                rotate();
                break;
            case 32: // 空格
                hardDrop();
                break;
            case 80: // P键暂停/继续
                togglePause();
                break;
        }
    });
    
    // 开始游戏
    startBtn.addEventListener('click', () => {
        if (gameStarted && !gameOver) {
            // 如果游戏正在进行中，点击按钮无效
            return;
        }
        
        // 重置游戏状态
        board = createBoard();
        score = 0;
        scoreElement.textContent = score;
        gameOver = false;
        gameStarted = true;
        gamePaused = false;
        pauseBtn.textContent = "暂停游戏";
        speed = 1000;
        lastDropTime = Date.now();
        
        // 开始计时
        startTime = Date.now();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        
        // 播放背景音乐
        if (musicOn) {
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(e => console.log("自动播放被阻止:", e));
        }
        
        // 创建第一个方块
        createPiece();
        
        // 开始游戏循环
        gameLoop();
    });
    
    // 音效开关
    soundToggle.addEventListener('click', () => {
        soundOn = !soundOn;
        soundToggle.textContent = `音效: ${soundOn ? '开' : '关'}`;
    });
    
    // 音乐开关
    musicToggle.addEventListener('click', () => {
        musicOn = !musicOn;
        musicToggle.textContent = `音乐: ${musicOn ? '开' : '关'}`;
        
        if (musicOn && gameStarted && !gameOver && !gamePaused) {
            backgroundMusic.play().catch(e => console.log("播放被阻止:", e));
        } else {
            backgroundMusic.pause();
        }
    });
    
    // 初始绘制下一个方块
    drawNextPiece();
});
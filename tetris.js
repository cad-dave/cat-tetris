document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME CONFIGURATION - EASY TO TWEAK!
    // ═══════════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        // 🏆 WIN CONDITION
        WIN_SCORE: 6000,  // Points needed to win
        
        // 📊 SCORING SYSTEM
        POINTS: {
            SINGLE: 50,    // 1 line cleared
            DOUBLE: 100,   // 2 lines cleared
            TRIPLE: 500,   // 3 lines cleared
            TETRIS: 1500   // 4 lines cleared (Tetris!)
        },
        
        // 📈 LEVEL PROGRESSION
        LINES_PER_LEVEL: 10,  // Lines needed to level up (was 4, now 10)
        
        // ⚡ SCORE MULTIPLIER PER LEVEL
        // Formula: points × (1 + (level - 1) × LEVEL_MULTIPLIER)
        // Example with 0.2:
        //   Level 1: ×1.0
        //   Level 2: ×1.2  
        //   Level 3: ×1.4
        //   Level 4: ×1.6
        LEVEL_MULTIPLIER: 0.2,  // Increase for faster scoring, decrease for slower
        
        // ⏱️ GAME SPEED
        BASE_DROP_INTERVAL: 1000,  // Milliseconds between automatic drops at level 1
        
        // 🎨 VISUAL EFFECTS
        ENABLE_SCREEN_SHAKE: true,
        ENABLE_LINE_CLEAR_ANIMATION: true,
        ENABLE_PARTICLE_EFFECTS: true
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME SETUP
    // ═══════════════════════════════════════════════════════════════════════
    
    const canvas = document.getElementById('tetris');
    if (!canvas) {
        console.error("Tetris canvas element not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    ctx.scale(20, 20);

    const effectsCanvas = document.getElementById('effects');
    const effectsCtx = effectsCanvas ? effectsCanvas.getContext('2d') : null;
    if (effectsCtx) effectsCtx.scale(20, 20);

    const nextCanvas = document.getElementById('next');
    const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;
    if (nextCtx) nextCtx.scale(20, 20);

    const startBtn = document.getElementById('startBtn');
    const timerEl = document.getElementById('timer');
    const bestTimeEl = document.getElementById('bestTime');
    const progressBarEl = document.getElementById('progressBar');

    // Audio elements
    const gameMusic = document.getElementById('gameMusic');
    const clearSound = document.getElementById('clearSound');
    const roarSound = document.getElementById('roarSound');
    
    // Mobile controls
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRotate = document.getElementById('btn-rotate');
    const btnPause = document.getElementById('btn-pause');
    const btnLeaderboard = document.getElementById('viewLeaderboard');
    const btnLeaderboardMobile = document.getElementById('btn-leaderboard-mobile');

    // ═══════════════════════════════════════════════════════════════════════
    // 🔊 IMPROVED AUDIO MANAGEMENT (Fixes audio interruption bugs)
    // ═══════════════════════════════════════════════════════════════════════
    
    const audioManager = {
        clearQueue: [],
        isClearPlaying: false,
        lastMoveTime: 0,
        MOVE_SOUND_THROTTLE: 50, // ms between move sounds
        
        playSound(audio, canInterrupt = true) {
            if (!audio) return;
            
            // Prevent audio interruption during continuous inputs
            if (!canInterrupt && audio.currentTime > 0 && !audio.paused) {
                return; // Don't interrupt if sound is playing
            }
            
            audio.currentTime = 0;
            audio.play().catch(err => console.warn("Audio play failed:", err));
        },
        
        queueClearSound() {
            this.clearQueue.push(true);
            this.playNextClearSound();
        },
        
        playNextClearSound() {
            if (this.clearQueue.length === 0 || this.isClearPlaying) return;
            
            this.isClearPlaying = true;
            this.clearQueue.shift();
            
            if (clearSound) {
                clearSound.currentTime = 0;
                
                const onSoundEnd = () => {
                    clearSound.removeEventListener('ended', onSoundEnd);
                    this.isClearPlaying = false;
                    this.playNextClearSound();
                };
                
                clearSound.addEventListener('ended', onSoundEnd);
                clearSound.play().catch(error => {
                    console.warn("Clear sound playback failed:", error);
                    this.isClearPlaying = false;
                    this.playNextClearSound();
                });
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 🏆 LEADERBOARD SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    
    const leaderboard = {
        load() {
            const data = localStorage.getItem('tetrisLeaderboard');
            return data ? JSON.parse(data) : [];
        },
        
        save(records) {
            localStorage.setItem('tetrisLeaderboard', JSON.stringify(records));
        },
        
        add(timeMs) {
            const records = this.load();
            records.push({
                time: timeMs,
                date: new Date().toISOString()
            });
            records.sort((a, b) => a.time - b.time);
            records.splice(10); // Keep only top 10
            this.save(records);
            return records;
        },
        
        getBest() {
            const records = this.load();
            return records.length > 0 ? records[0].time : null;
        },
        
        clear() {
            localStorage.removeItem('tetrisLeaderboard');
        },
        
        formatTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const deciseconds = Math.floor((ms % 1000) / 100);
            return `${minutes}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 VISUAL EFFECTS SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    
    const effects = {
        particles: [],
        
        createLineClearParticles(y) {
            if (!CONFIG.ENABLE_PARTICLE_EFFECTS || !effectsCtx) return;
            
            for (let x = 0; x < 10; x++) {
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: x + Math.random(),
                        y: y + Math.random(),
                        vx: (Math.random() - 0.5) * 0.1,
                        vy: (Math.random() - 0.5) * 0.1,
                        life: 1,
                        color: `hsl(${Math.random() * 360}, 100%, 70%)`
                    });
                }
            }
        },
        
        update() {
            if (!effectsCtx) return;
            
            effectsCtx.clearRect(0, 0, canvas.width / 20, canvas.height / 20);
            
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                
                if (p.life > 0) {
                    effectsCtx.globalAlpha = p.life;
                    effectsCtx.fillStyle = p.color;
                    effectsCtx.fillRect(p.x, p.y, 0.15, 0.15);
                    effectsCtx.globalAlpha = 1;
                    return true;
                }
                return false;
            });
        },
        
        screenShake() {
            if (!CONFIG.ENABLE_SCREEN_SHAKE) return;
            
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.classList.add('shake');
                setTimeout(() => gameArea.classList.remove('shake'), 300);
            }
        },
        
        flashScreen() {
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.classList.add('flash');
                setTimeout(() => gameArea.classList.remove('flash'), 200);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const COLORS = [
        null,
        '#FF0D72', '#0DC2FF', '#0DFF72',
        '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
    ];

    const pieces = 'TJLOSZI';
    function createPiece(type) {
        if (type === 'T') return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
        if (type === 'O') return [[2, 2], [2, 2]];
        if (type === 'L') return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
        if (type === 'J') return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
        if (type === 'I') return [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]];
        if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
        if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
        return [[0]];
    }

    function createMatrix(w, h) {
        const m = [];
        while (h--) m.push(new Array(w).fill(0));
        return m;
    }
    
    const arena = createMatrix(10, 20);

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        next: null,
        score: 0,
        level: 1,
        lines: 0
    };

    let dropCounter = 0;
    let lastTime = 0;
    let paused = false;
    let started = false;
    let gameWon = false;
    let animationId = null;
    
    // Timer state
    let gameStartTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    
    // Mobile control state
    let activeInterval = null;
    let initialTimeout = null;

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 DRAWING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    function drawMatrix(matrix, offset, context = ctx) {
        matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (!val) return;
                context.fillStyle = COLORS[val];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.strokeStyle = '#222';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            });
        });
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width / 20, canvas.height / 20);
        
        drawMatrix(arena, { x: 0, y: 0 });
        if (player.matrix) drawMatrix(player.matrix, player.pos);
    }

    function drawNext() {
        if (!nextCtx) return;
        nextCtx.clearRect(0, 0, nextCanvas.width / 20, nextCanvas.height / 20);
        if (!player.next) return;

        const m = player.next;
        const cols = nextCanvas.width / 20;
        const rows = nextCanvas.height / 20;
        const w = m[0].length, h = m.length;
        const offsetX = Math.floor((cols - w) / 2);
        const shiftDown = 1;
        const offsetY = Math.floor((rows - h) / 2) + shiftDown;

        drawMatrix(m, { x: offsetX, y: offsetY }, nextCtx);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ⏱️ TIMER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    function startTimer() {
        gameStartTime = Date.now();
        elapsedTime = 0;
        updateTimer();
        timerInterval = setInterval(updateTimer, 100); // Update every 0.1s
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        return elapsedTime;
    }
    
    function updateTimer() {
        if (!started || paused) return;
        elapsedTime = Date.now() - gameStartTime;
        const timeStr = leaderboard.formatTime(elapsedTime);
        if (timerEl) timerEl.textContent = timeStr;
    }
    
    function updateBestTime() {
        const best = leaderboard.getBest();
        if (bestTimeEl) {
            bestTimeEl.textContent = best ? leaderboard.formatTime(best) : '--:--.-';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME LOGIC
    // ═══════════════════════════════════════════════════════════════════════
    
    function merge(arena, pl) {
        pl.matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) arena[y + pl.pos.y][x + pl.pos.x] = val;
            });
        });
    }

    function collide(arena, pl) {
        const m = pl.matrix, o = pl.pos;
        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m[y].length; x++) {
                if (m[y][x] &&
                    (!arena[y + o.y] || arena[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    function updateNextBackground() {
        if (!nextCanvas) return;
        nextCanvas.className = '';
        if (player.level > 1) {
            nextCanvas.classList.add(`next-level-${player.level}`);
        }
    }

    function calculateScore(linesCleared) {
        // Use CONFIG values for easy tweaking
        const basePoints = [
            0,
            CONFIG.POINTS.SINGLE,
            CONFIG.POINTS.DOUBLE,
            CONFIG.POINTS.TRIPLE,
            CONFIG.POINTS.TETRIS
        ][linesCleared];
        
        // New multiplier formula: 1 + (level - 1) × LEVEL_MULTIPLIER
        const multiplier = 1 + (player.level - 1) * CONFIG.LEVEL_MULTIPLIER;
        
        return Math.floor(basePoints * multiplier);
    }

    function arenaSweep() {
        let rowCount = 0;
        const clearedRows = [];
        const previousLevel = player.level;

        // Find and clear filled rows
        for (let y = arena.length - 1; y >= 0; y--) {
            if (arena[y].every(v => v > 0)) {
                clearedRows.push(y);
                arena.splice(y, 1);
                arena.unshift(new Array(arena[0].length).fill(0));
                
                audioManager.queueClearSound();
                rowCount++;
                y++;
            }
        }

        if (rowCount > 0) {
            // Create particles for cleared lines
            clearedRows.forEach(y => {
                effects.createLineClearParticles(y);
            });
            
            // Calculate score using new system
            const points = calculateScore(rowCount);
            player.score += points;
            player.lines += rowCount;
            
            // Check for win
            if (player.score >= CONFIG.WIN_SCORE) {
                player.score = CONFIG.WIN_SCORE;
                gameWon = true;
                started = false;
                
                const finalTime = stopTimer();
                leaderboard.add(finalTime);
                updateBestTime();
                
                if (animationId !== null) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }

                drawWinScreen();
                
                if (gameMusic) {
                    gameMusic.pause();
                    gameMusic.currentTime = 0;
                }
                
                return;
            }
            
            // Level up logic (using CONFIG.LINES_PER_LEVEL)
            player.level = Math.floor(player.lines / CONFIG.LINES_PER_LEVEL) + 1;
            
            if (player.level > previousLevel) {
                audioManager.playSound(roarSound, false);
                updateNextBackground();
            }
            
            // Visual effects for big clears
            if (rowCount === 4) {
                effects.screenShake();
                effects.flashScreen();
            }
            
            updateScore();
        }
    }

    function drawWinScreen() {
        draw();

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width / 20, canvas.height / 20);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 1.5px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEOW WIN!', 5, 8);
        
        ctx.font = '0.8px Arial, sans-serif';
        ctx.fillStyle = '#0DC2FF';
        const timeStr = leaderboard.formatTime(elapsedTime);
        ctx.fillText(`Time: ${timeStr}`, 5, 10);
        
        ctx.textAlign = 'left';

        setTimeout(() => {
            if (startBtn) startBtn.style.display = 'block';
            showLeaderboard();
        }, 1000);
    }

    function playerMove(dir) {
        if (gameWon) return;
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    function playerDrop() {
        if (gameWon) return;

        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
        }
        dropCounter = 0;
    }

    function playerRotate(dir) {
        if (gameWon) return;
        
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    }

    function handlePauseToggle() {
        if (!started || gameWon) return;
        
        paused = !paused;
        
        if (gameMusic) {
            if (paused) {
                gameMusic.pause();
            } else {
                audioManager.playSound(gameMusic, false);
            }
        }
    }

    function playerReset() {
        if (!player.matrix) {
            player.matrix = createPiece(pieces[Math.random() * pieces.length | 0]);
            player.next = createPiece(pieces[Math.random() * pieces.length | 0]);
        } else {
            player.matrix = player.next;
            player.next = createPiece(pieces[Math.random() * pieces.length | 0]);
        }

        const matrixWidth = player.matrix[0].length;
        player.pos.y = 0;
        player.pos.x = ((arena[0].length / 2) | 0) - ((matrixWidth / 2) | 0);

        if (collide(arena, player)) {
            // Game over
            arena.forEach(row => row.fill(0));
            started = false;
            paused = false;
            
            stopTimer();

            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            if (startBtn) startBtn.style.display = 'block';
            if (gameMusic) {
                gameMusic.pause();
                gameMusic.currentTime = 0;
            }
            audioManager.playSound(roarSound, false);
            
            return;
        }
        drawNext();
    }

    function updateScore() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const linesEl = document.getElementById('lines');
        const mobileScoreEl = document.getElementById('mobileScore');

        if (scoreEl) scoreEl.innerText = player.score;
        if (levelEl) levelEl.innerText = player.level;
        if (linesEl) linesEl.innerText = player.lines;
        if (mobileScoreEl) mobileScoreEl.innerText = player.score;
        
        // Update progress bar
        if (progressBarEl) {
            const progress = (player.score / CONFIG.WIN_SCORE) * 100;
            progressBarEl.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    function update(time = 0) {
        if (gameWon) return;
        
        if (!started) {
            draw();
            animationId = requestAnimationFrame(update);
            return;
        }
        
        if (paused) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width / 20, canvas.height / 20);
            ctx.fillStyle = '#0DC2FF';
            ctx.font = 'bold 1px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Taking a Cat Nap', 5, 10);
            ctx.textAlign = 'left';
            animationId = requestAnimationFrame(update);
            return;
        }

        const delta = time - lastTime;
        lastTime = time;
        dropCounter += delta;

        const dropInterval = CONFIG.BASE_DROP_INTERVAL / player.level;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        if (gameWon) return;

        draw();
        effects.update();
        animationId = requestAnimationFrame(update);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 INPUT HANDLING
    // ═══════════════════════════════════════════════════════════════════════
    
    document.addEventListener('keydown', e => {
        const tetrisKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyQ', 'KeyW', 'Space', 'KeyP'];
        if (tetrisKeys.includes(e.code)) {
            e.preventDefault();
        }

        if (!started || gameWon) return;

        switch (e.code) {
            case 'ArrowLeft':
                if (!paused) playerMove(-1);
                break;
            case 'ArrowRight':
                if (!paused) playerMove(1);
                break;
            case 'ArrowDown':
                if (!paused) playerDrop();
                break;
            case 'KeyQ':
                if (!paused) playerRotate(-1);
                break;
            case 'KeyW':
                if (!paused) playerRotate(1);
                break;
            case 'Space':
            case 'KeyP':
                handlePauseToggle();
                break;
        }
    });

    // Mobile control helpers - IMPROVED for better touch handling
    function handlePressStart(actionFunction) {
        if (!started || paused || gameWon) return;
        
        // Clear any existing intervals first
        handlePressEnd();
        
        // Execute action immediately
        actionFunction();

        // Set up continuous execution after short delay
        initialTimeout = setTimeout(() => {
            activeInterval = setInterval(actionFunction, 80); // Slightly faster for better feel
        }, 120); // Shorter delay for more responsive feel
    }

    function handlePressEnd() {
        if (initialTimeout) {
            clearTimeout(initialTimeout);
            initialTimeout = null;
        }
        if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
        }
    }

    function setupContinuousControl(button, actionFunction) {
        if (!button) return;

        // Touchstart handler
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePressStart(actionFunction);
        }, { passive: false });

        // Touchend handler
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePressEnd();
        }, { passive: false });

        // Touchcancel handler (for when touch is interrupted)
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            handlePressEnd();
        }, { passive: false });

        // Mouse events for desktop
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handlePressStart(actionFunction);
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            handlePressEnd();
        });

        button.addEventListener('mouseleave', (e) => {
            handlePressEnd();
        });
        
        // Global blur event to stop all intervals
        document.addEventListener('blur', handlePressEnd);
    }
    
    function setupTapControl(button, actionFunction) {
        if (!button) return;
        
        let touchHandled = false;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!paused && !gameWon && started) {
                touchHandled = true;
                actionFunction();
            }
        }, { passive: false });
        
        // Prevent click from firing after touchstart
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (touchHandled) {
                touchHandled = false;
                return;
            }
            if (!paused && !gameWon && started) {
                actionFunction();
            }
        });
        
        // Reset flag on touchend
        button.addEventListener('touchend', () => {
            setTimeout(() => { touchHandled = false; }, 100);
        });
    }

    // Setup mobile controls
    setupContinuousControl(btnLeft, () => playerMove(-1));
    setupContinuousControl(btnRight, () => playerMove(1));
    setupContinuousControl(btnDown, playerDrop);
    setupTapControl(btnRotate, () => playerRotate(1));
    
    // Prevent page scrolling on mobile when touching game area
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    // Prevent scrolling on game canvas
    if (canvas) {
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    if (btnPause) {
        btnPause.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameWon) handlePauseToggle();
        }, { passive: false });
        btnPause.addEventListener('click', (e) => {
            e.preventDefault();
            if (!gameWon) handlePauseToggle();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🏆 LEADERBOARD UI
    // ═══════════════════════════════════════════════════════════════════════
    
    function showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        const list = document.getElementById('leaderboardList');
        
        if (!modal || !list) return;
        
        const records = leaderboard.load();
        
        if (records.length === 0) {
            list.innerHTML = '<div class="leaderboard-empty">No records yet!<br>Be the first to set a time!</div>';
        } else {
            list.innerHTML = records.map((record, index) => {
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                const isRecord = index === 0;
                const date = new Date(record.date).toLocaleDateString();
                
                return `
                    <div class="leaderboard-item ${isRecord ? 'record' : ''}">
                        <span class="leaderboard-rank ${rankClass}">#${index + 1}</span>
                        <div style="flex: 1;">
                            <div class="leaderboard-time">${leaderboard.formatTime(record.time)}</div>
                            <div class="leaderboard-date">${date}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        modal.classList.add('show');
    }
    
    function hideLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.remove('show');
    }
    
    // Leaderboard button handlers
    if (btnLeaderboard) {
        btnLeaderboard.addEventListener('click', showLeaderboard);
    }
    
    if (btnLeaderboardMobile) {
        btnLeaderboardMobile.addEventListener('click', showLeaderboard);
    }
    
    const closeLeaderboard = document.getElementById('closeLeaderboard');
    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', hideLeaderboard);
    }
    
    const clearLeaderboardBtn = document.getElementById('clearLeaderboard');
    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', () => {
            if (confirm('Clear all records? This cannot be undone!')) {
                leaderboard.clear();
                updateBestTime();
                hideLeaderboard();
            }
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('leaderboardModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideLeaderboard();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME START
    // ═══════════════════════════════════════════════════════════════════════
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            
            // Reset game state
            arena.forEach(row => row.fill(0));
            player.matrix = null;
            player.next = null;
            player.score = 0;
            player.level = 1;
            player.lines = 0;
            paused = false;
            started = true;
            gameWon = false;
            effects.particles = [];
            
            // Prime audio elements for mobile playback
            if (clearSound) {
                clearSound.load();
                clearSound.muted = true;
                clearSound.play().then(() => {
                    clearSound.pause();
                    clearSound.muted = false;
                    clearSound.currentTime = 0;
                }).catch(e => console.log("Clear sound priming failed:", e));
            }
            if (roarSound) {
                roarSound.load();
            }

            updateNextBackground();
            audioManager.playSound(gameMusic, false);
            updateScore();
            updateBestTime();
            playerReset();
            
            lastTime = 0;
            dropCounter = 0;
            
            startTimer();
            draw();
            
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
            }
            animationId = requestAnimationFrame(update);
        });
    }

    // Initialize
    updateBestTime();
    update();
});

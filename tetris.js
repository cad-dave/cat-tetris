document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 GAME CONFIGURATION - EASY TO TWEAK!
    // ═══════════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        // 🏆 WIN CONDITION
        WIN_SCORE: 4500,  // Points needed to win
        
        // 📊 SCORING SYSTEM
        POINTS: {
            SINGLE: 100,    // 1 line cleared
            DOUBLE: 200,   // 2 lines cleared
            TRIPLE: 500,   // 3 lines cleared
            TETRIS: 1500   // 4 lines cleared (Tetris!)
        },
        
        // 📈 LEVEL PROGRESSION
        LINES_PER_LEVEL: 8,  // Lines needed to level up (was 4, now 10)
        
        // ⚡ SCORE MULTIPLIER PER LEVEL
        // Formula: points × (1 + (level - 1) × LEVEL_MULTIPLIER)
        // Example with 0.2:
        //   Level 1: ×1.0
        //   Level 2: ×1.2  
        //   Level 3: ×1.4
        //   Level 4: ×1.6
        LEVEL_MULTIPLIER: 0.3,  // Increase for faster scoring, decrease for slower
        
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
    
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRotate = document.getElementById('btn-rotate');
    const btnLeaderboard = document.getElementById('viewLeaderboard');

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
    
    // ═══════════════════════════════════════════════════════════════════════
    // 🔥 FIREBASE HELPERS — imported via window.firebaseLeaderboard
    // ═══════════════════════════════════════════════════════════════════════

    const leaderboard = {
        async add(timeMs, playerName) {
            try {
                const { addDoc, collection } = window.firebaseLeaderboard;
                await addDoc(collection, {
                    name: playerName || 'Anonymous Cat',
                    time_ms: timeMs
                });
            } catch (e) {
                console.warn('Firebase write failed, falling back to localStorage', e);
                // Graceful fallback
                const records = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
                records.push({ name: playerName || 'Anonymous Cat', time_ms: timeMs });
                records.sort((a, b) => a.time_ms - b.time_ms);
                records.splice(10);
                localStorage.setItem('tetrisLeaderboard', JSON.stringify(records));
            }
        },

        async loadTop10() {
            try {
                const { getDocs, query, orderBy, limit, collection, db } = window.firebaseLeaderboard;
                const q = query(collection, orderBy('time_ms', 'asc'), limit(10));
                const snap = await getDocs(q);
                return snap.docs.map(d => d.data());
            } catch (e) {
                console.warn('Firebase read failed, using localStorage', e);
                return JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]')
                    .map(r => ({ name: r.name, time_ms: r.time_ms || r.time }));
            }
        },

        async getBest() {
            try {
                const { getDocs, query, orderBy, limit } = window.firebaseLeaderboard;
                const q = query(window.firebaseLeaderboard.collection, orderBy('time_ms', 'asc'), limit(1));
                const snap = await getDocs(q);
                if (snap.empty) return null;
                return snap.docs[0].data().time_ms;
            } catch (e) {
                console.warn('Firebase getBest failed', e);
                const records = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
                return records.length > 0 ? (records[0].time_ms || records[0].time) : null;
            }
        },

        async clear() {
            // Note: Firestore records can only be cleared from the Firebase Console.
            // We clear localStorage fallback here.
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
    
    async function updateBestTime() {
        try {
            const { getDocs, query, orderBy, limit } = window.firebaseLeaderboard;
            const q = query(window.firebaseLeaderboard.collection, orderBy('time_ms', 'asc'), limit(1));
            const snap = await getDocs(q);

            const holderEl = document.getElementById('recordHolder');
            const holderNameEl = document.getElementById('recordHolderName');

            if (!snap.empty) {
                const best = snap.docs[0].data();
                if (bestTimeEl) bestTimeEl.textContent = leaderboard.formatTime(best.time_ms);
                if (holderEl && holderNameEl) {
                    holderNameEl.textContent = best.name || 'Anonymous Cat';
                    holderEl.style.display = 'block';
                }
            } else {
                if (bestTimeEl) bestTimeEl.textContent = '--:--.-';
                if (holderEl) holderEl.style.display = 'none';
            }
        } catch (e) {
            // Fallback to localStorage
            const records = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
            const holderEl = document.getElementById('recordHolder');
            const holderNameEl = document.getElementById('recordHolderName');
            if (records.length > 0) {
                if (bestTimeEl) bestTimeEl.textContent = leaderboard.formatTime(records[0].time_ms || records[0].time);
                if (holderEl && holderNameEl) {
                    holderNameEl.textContent = records[0].name || 'Anonymous Cat';
                    holderEl.style.display = 'block';
                }
            } else {
                if (bestTimeEl) bestTimeEl.textContent = '--:--.-';
                if (holderEl) holderEl.style.display = 'none';
            }
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
                
                stopTimer(); // Stop the timer
                
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
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 200]);
                }
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

        // Show name input modal after short delay
        setTimeout(() => {
            showNameInputModal();
        }, 500);
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
        const scoreMobileEl = document.getElementById('scoreMobile');
        const levelMobileEl = document.getElementById('levelMobile');
        const progressBarMobileEl = document.getElementById('progressBarMobile');

        if (scoreEl) scoreEl.innerText = player.score;
        if (levelEl) levelEl.innerText = player.level;
        if (linesEl) linesEl.innerText = player.lines;
        if (scoreMobileEl) scoreMobileEl.innerText = player.score;
        if (levelMobileEl) levelMobileEl.innerText = player.level;
        
        // Update progress bars
        if (progressBarEl) {
            const progress = (player.score / CONFIG.WIN_SCORE) * 100;
            progressBarEl.style.width = `${Math.min(progress, 100)}%`;
        }
        if (progressBarMobileEl) {
            const progress = (player.score / CONFIG.WIN_SCORE) * 100;
            progressBarMobileEl.style.width = `${Math.min(progress, 100)}%`;
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
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, canvas.width / 20, canvas.height / 20);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 1.4px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('😺 Pawsed', 5, 9);
            ctx.fillStyle = '#0DC2FF';
            ctx.font = '0.75px Arial, sans-serif';
            ctx.fillText('Taking a cat nap...', 5, 11);
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
        const input = document.getElementById('playerName');
        const inputFocused = input && document.activeElement === input;
        
        const tetrisKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyQ', 'KeyW', 'Space', 'KeyP'];
        if (tetrisKeys.includes(e.code) && !inputFocused) {
            e.preventDefault();
        }

        if (!started || gameWon || inputFocused) return;

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

    // ═══════════════════════════════════════════════════════════════════════
    // 📱 MOBILE CONTROL SYSTEM - COMPLETELY REWRITTEN
    // ═══════════════════════════════════════════════════════════════════════
    
    let activeControlInterval = null;
    let activeControlTimeout = null;
    
    function startContinuousControl(actionFn) {
        if (!started || paused || gameWon) return;
        
        // Stop any existing actions
        stopContinuousControl();
        
        // Execute immediately
        actionFn();
        
        // Start continuous execution after brief delay
        activeControlTimeout = setTimeout(() => {
            activeControlInterval = setInterval(() => {
                if (!paused && !gameWon && started) {
                    actionFn();
                }
            }, 70); // Faster repeat for smooth movement
        }, 100); // Shorter initial delay
    }
    
    function stopContinuousControl() {
        if (activeControlTimeout) {
            clearTimeout(activeControlTimeout);
            activeControlTimeout = null;
        }
        if (activeControlInterval) {
            clearInterval(activeControlInterval);
            activeControlInterval = null;
        }
    }
    
    // Global cleanup to prevent stuck buttons
    window.addEventListener('blur', stopContinuousControl);
    window.addEventListener('visibilitychange', () => {
        if (document.hidden) stopContinuousControl();
    });
    
    function setupMobileButton(button, action, isContinuous = true) {
        if (!button) return;
        
        if (isContinuous) {
            // For movement buttons (Left, Right, Down)
            let isTouching = false;
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                isTouching = true;
                startContinuousControl(action);
            }, { passive: false, capture: true });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                isTouching = false;
                stopContinuousControl();
            }, { passive: false, capture: true });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                isTouching = false;
                stopContinuousControl();
            }, { passive: false, capture: true });
            
            // Desktop mouse support
            button.addEventListener('mousedown', (e) => {
                if (!isTouching) {
                    e.preventDefault();
                    startContinuousControl(action);
                }
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                stopContinuousControl();
            });
            
            button.addEventListener('mouseleave', () => {
                stopContinuousControl();
            });
            
        } else {
            // For tap buttons (Rotate, Pause)
            let lastAction = 0;
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                const now = Date.now();
                if (now - lastAction > 100) { // Debounce
                    lastAction = now;
                    action();
                }
            }, { passive: false, capture: true });
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - lastAction > 100) {
                    action();
                }
            });
        }
    }
    
    // Setup all controls
    setupMobileButton(btnLeft, () => playerMove(-1), true);
    setupMobileButton(btnRight, () => playerMove(1), true);
    setupMobileButton(btnDown, () => playerDrop(), true);
    setupMobileButton(btnRotate, () => {
        if (!paused && !gameWon && started) playerRotate(1);
    }, false);

    // PAWS button (mobile, below the canvas)
    const btnPaws = document.getElementById('btn-paws');
    if (btnPaws) {
        let pawsLastTap = 0;
        const doPause = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - pawsLastTap < 200) return; // debounce
            pawsLastTap = now;
            if (!gameWon) handlePauseToggle();
        };
        btnPaws.addEventListener('touchstart', doPause, { passive: false });
        btnPaws.addEventListener('click', doPause);
    }
    
    // Leaderboard buttons
    if (btnLeaderboard) {
        btnLeaderboard.addEventListener('click', showLeaderboard);
    }
    const btnLeaderboardMobile = document.getElementById('viewLeaderboardMobile');
    if (btnLeaderboardMobile) {
        btnLeaderboardMobile.addEventListener('click', showLeaderboard);
    }
    
    // Prevent page scrolling during gameplay
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        mobileControls.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: false });
    }
    
    // Prevent canvas scrolling
    if (canvas) {
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🐱 NAME INPUT MODAL
    // ═══════════════════════════════════════════════════════════════════════
    
    function showNameInputModal() {
        const modal = document.getElementById('nameModal');
        const input = document.getElementById('playerName');
        const finalTimeDisplay = document.getElementById('finalTimeDisplay');
        
        if (!modal || !input || !finalTimeDisplay) return;
        
        // Display the final time
        finalTimeDisplay.textContent = leaderboard.formatTime(elapsedTime);
        
        // Clear any previous input
        input.value = '';
        
        // Show modal
        modal.classList.add('show');
        
        // Focus input after animation
        setTimeout(() => {
            input.focus();
        }, 300);
    }
    
    function hideNameInputModal() {
        const modal = document.getElementById('nameModal');
        if (modal) modal.classList.remove('show');
    }
    
    let isSavingScore = false;

    async function savePlayerName() {
        if (isSavingScore) return; // prevent double submit
        isSavingScore = true;

        const input = document.getElementById('playerName');
        let playerName = input ? input.value.trim() : '';
        
        if (!playerName) {
            playerName = 'Anonymous Cat';
        }
        
        // Disable button immediately
        const saveBtn = document.getElementById('saveName');
        if (saveBtn) { 
            saveBtn.textContent = '⏳ Saving...'; 
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.7';
        }

        await leaderboard.add(elapsedTime, playerName);
        await updateBestTime();
        
        hideNameInputModal();
        isSavingScore = false;
        
        setTimeout(() => {
            if (startBtn) startBtn.style.display = 'block';
            showLeaderboard();
        }, 300);
    }
    
    // Name input modal handlers
    const saveNameBtn = document.getElementById('saveName');
    const playerNameInput = document.getElementById('playerName');
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', savePlayerName);
    }
    
    if (playerNameInput) {
        // Save on Enter key
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                savePlayerName();
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 🏆 LEADERBOARD UI
    // ═══════════════════════════════════════════════════════════════════════
    
    async function showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        const list = document.getElementById('leaderboardList');
        
        if (!modal || !list) return;
        
        modal.classList.add('show');
        list.innerHTML = '<div class="leaderboard-empty">Loading records... 🐱</div>';

        const records = await leaderboard.loadTop10();
        
        if (records.length === 0) {
            list.innerHTML = '<div class="leaderboard-empty">No records yet!<br>Be the first to set a time!</div>';
        } else {
            list.innerHTML = records.map((record, index) => {
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                const isRecord = index === 0;
                const playerName = record.name || 'Anonymous Cat';
                
                return `
                    <div class="leaderboard-item ${isRecord ? 'record' : ''}">
                        <span class="leaderboard-rank ${rankClass}">#${index + 1}</span>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${playerName}</div>
                            <div class="leaderboard-time">${leaderboard.formatTime(record.time_ms)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    function hideLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.remove('show');
    }
    
    const closeLeaderboard = document.getElementById('closeLeaderboard');
    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', hideLeaderboard);
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
            isSavingScore = false;
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

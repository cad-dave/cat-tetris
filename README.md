# 🐱 Meow-tris - Competitive Speed Run Tetris

An improved cat-themed Tetris game with competitive speed-run features, smooth animations, and a leaderboard system.

## 🎯 Game Objective

Race to **6000 points** as fast as possible! Your time is tracked and compared against your best runs in the local leaderboard.

## ✨ New Features

### 🏆 Competitive Features
- **Speed Run Timer** - Count-up timer tracking your run from start to finish
- **Local Leaderboard** - Top 10 fastest times saved locally
- **Best Time Display** - See your personal record during gameplay
- **Progress Bar** - Visual indicator of your progress to 6000 points

### 🎨 Visual Improvements
- **Particle Effects** - Line clears create colorful particle explosions
- **Screen Shake** - Dramatic feedback on Tetris (4-line) clears
- **Smooth Animations** - Polished movement and rotation
- **Enhanced UI** - Modern dark neon aesthetic with better readability
- **Progress Tracking** - Real-time score visualization

### 🔧 Technical Fixes
- **Fixed Audio Bugs** - No more sound interruptions during held inputs
- **Better Sound Queue** - Proper handling of duplicate/overlapping sounds
- **Improved Mobile Controls** - Better touch responsiveness
- **Optimized Performance** - Smoother gameplay overall

### ⚖️ Rebalanced Scoring System
The scoring has been completely rebalanced to make speed runs more challenging:

**Old System:**
- Level up every 4 lines
- Multiplier: points × level
- Could win in just 3 Tetrises (12 lines)!

**New System:**
- Level up every **10 lines** (configurable)
- Multiplier: `points × (1 + (level - 1) × 0.2)` (configurable)
- Requires **minimum 16 lines** with perfect Tetris play
- More consistent, skill-based progression

## 🎮 Controls

### Desktop
- **Arrow Left/Right** - Move piece
- **Arrow Down** - Soft drop
- **Q / W** - Rotate piece
- **SPACE or P** - Pause/Resume
- **🏆 Button** - View leaderboard

### Mobile
- Touch controls automatically appear on small screens
- Responsive buttons for all actions
- Timer display in mobile controls

## 🛠️ Easy Configuration

All game parameters are clearly defined at the top of `tetris.js` for easy tweaking:

```javascript
const CONFIG = {
    // 🏆 WIN CONDITION
    WIN_SCORE: 6000,
    
    // 📊 SCORING SYSTEM  
    POINTS: {
        SINGLE: 50,
        DOUBLE: 100,
        TRIPLE: 500,
        TETRIS: 1500
    },
    
    // 📈 LEVEL PROGRESSION
    LINES_PER_LEVEL: 10,  // ⬅️ Change this to adjust difficulty
    
    // ⚡ SCORE MULTIPLIER
    LEVEL_MULTIPLIER: 0.2,  // ⬅️ Change this to adjust scoring speed
    
    // Other settings...
};
```

### How to Adjust Difficulty

**Make it EASIER:**
- Decrease `LINES_PER_LEVEL` (try 8)
- Increase `LEVEL_MULTIPLIER` (try 0.25 or 0.3)

**Make it HARDER:**
- Increase `LINES_PER_LEVEL` (try 12 or 15)
- Decrease `LEVEL_MULTIPLIER` (try 0.15 or 0.1)
- Increase `WIN_SCORE` (try 8000 or 10000)

## 📁 File Structure

```
meow-tris/
├── index.html          # Main HTML structure
├── style.css           # Styles and animations
├── tetris.js           # Game logic and features
├── Music.mp3          # Background music (your file)
├── clear.mp3          # Line clear sound (your file)
├── roar.mp3           # Level up/game over sound (your file)
├── background.jpg     # Background image (your file)
├── petstart.jpg       # Start button image (your file)
└── level1-10.jpg      # Level background images (your files)
```

## 🚀 GitHub Setup Instructions

### Option 1: Create New Repository from Existing

1. **Navigate to your original repository** on GitHub
   
2. **Create a new repository:**
   ```bash
   # Go to github.com and click "New Repository"
   # Name it something like: meow-tris-speedrun or tetris-v2
   # DON'T initialize with README (we'll push existing code)
   ```

3. **Clone your original repo to a new folder:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-ORIGINAL-TETRIS.git meow-tris-speedrun
   cd meow-tris-speedrun
   ```

4. **Replace the files:**
   - Copy the new `index.html`, `style.css`, and `tetris.js` into this folder
   - Keep all your existing asset files (images, sounds)

5. **Change the remote URL:**
   ```bash
   git remote set-url origin https://github.com/YOUR-USERNAME/meow-tris-speedrun.git
   ```

6. **Commit and push:**
   ```bash
   git add .
   git commit -m "✨ Major upgrade: competitive speed-run features, fixed audio bugs, rebalanced scoring"
   git push -u origin main
   ```

### Option 2: Fork Your Own Repository

1. **On GitHub**, go to your original Tetris repository
   
2. Click the **Fork** button (top right)
   - This creates a copy under your account
   - Rename it to something like `meow-tris-speedrun`

3. **Clone the forked repo:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/meow-tris-speedrun.git
   cd meow-tris-speedrun
   ```

4. **Replace the files** with the new versions

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "✨ Major upgrade: competitive speed-run features"
   git push
   ```

### Option 3: New Branch in Existing Repo

If you want to keep both versions in the same repository:

1. **Clone your existing repo (if not already):**
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-TETRIS-REPO.git
   cd YOUR-TETRIS-REPO
   ```

2. **Create a new branch:**
   ```bash
   git checkout -b speedrun-version
   ```

3. **Replace the files** with new versions

4. **Commit and push the branch:**
   ```bash
   git add .
   git commit -m "✨ Speedrun version with competitive features"
   git push -u origin speedrun-version
   ```

5. **On GitHub**, you can now switch between branches to see both versions!

## 🎨 Asset Requirements

Make sure you have these files in the same directory:

### Audio Files
- `Music.mp3` - Background music (loops)
- `clear.mp3` - Line clear sound effect
- `roar.mp3` - Level up / game over sound

### Image Files
- `background.jpg` - Main background
- `petstart.jpg` - Start button background
- `level1.jpg` through `level10.jpg` - Next piece preview backgrounds (changes with level)

## 🐛 Bug Fixes in This Version

1. **Audio Interruption Bug** - Sounds no longer cut out when holding move buttons
2. **Duplicate Sound Bug** - Multiple simultaneous line clears now queue properly
3. **Mobile Audio** - Better audio priming for iOS/Android devices
4. **Scoring Balance** - Fixed exponential scoring that allowed 3-Tetris wins

## 📊 Scoring Formula

```
Base Points:
- 1 line:  50 points
- 2 lines: 100 points
- 3 lines: 500 points
- 4 lines: 1500 points (Tetris!)

Multiplier Formula:
final_score = base_points × (1 + (level - 1) × LEVEL_MULTIPLIER)

Example (with LEVEL_MULTIPLIER = 0.2):
- Level 1: 1500 × 1.0 = 1500
- Level 2: 1500 × 1.2 = 1800
- Level 3: 1500 × 1.4 = 2100
- Level 4: 1500 × 1.6 = 2400
```

## 🎯 Strategy Tips

- **Go for Tetrises!** - 4-line clears give the most points
- **Level up strategically** - Higher levels give better multipliers
- **Speed matters** - Every second counts in the leaderboard
- **Practice consistency** - Avoiding mistakes is key to fast times

## 📝 Future Enhancement Ideas

- Online leaderboard integration
- Replay system
- Multiple game modes (sprint, ultra, marathon)
- Customizable themes
- Achievement system
- Ghost piece preview
- Hard drop feature

## 🙏 Credits

Original game by [Your Name]
Enhanced features and rebalancing by Claude & [Your Name]

---

**Enjoy the speed run challenge! 🏁🐱**

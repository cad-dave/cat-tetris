# ⚙️ Configuration Guide - Easy Tweaking

This guide shows you exactly where and how to adjust the game balance.

## 📍 Location

All configurable settings are at the **top of `tetris.js`** (lines 7-36).

Look for this section:

```javascript
// ═══════════════════════════════════════════════════════════════════════
// 🎮 GAME CONFIGURATION - EASY TO TWEAK!
// ═══════════════════════════════════════════════════════════════════════

const CONFIG = {
    // ... settings here ...
};
```

## 🎯 Key Settings to Tweak

### 1. Win Score Target

```javascript
WIN_SCORE: 6000,  // ⬅️ CHANGE THIS
```

**What it does:** Points needed to win the game

**Suggested values:**
- Easy mode: `4000`
- Normal (current): `6000`
- Hard mode: `8000` or `10000`
- Extreme: `15000`

---

### 2. Lines Per Level

```javascript
LINES_PER_LEVEL: 10,  // ⬅️ CHANGE THIS
```

**What it does:** How many lines you need to clear to level up

**Suggested values:**
- Fast progression: `6` or `8`
- Normal (current): `10`
- Slow progression: `12` or `15`

**Effect:**
- Lower = faster leveling = higher multipliers sooner
- Higher = slower leveling = more consistent scoring

---

### 3. Level Multiplier

```javascript
LEVEL_MULTIPLIER: 0.2,  // ⬅️ CHANGE THIS
```

**What it does:** How much the multiplier increases per level

**Formula:** `multiplier = 1 + (level - 1) × LEVEL_MULTIPLIER`

**Example with 0.2:**
- Level 1: ×1.0
- Level 2: ×1.2
- Level 3: ×1.4
- Level 4: ×1.6

**Suggested values:**
- Minimal growth: `0.1` (very linear scoring)
- Moderate (current): `0.2`
- Faster growth: `0.3` or `0.4`
- Exponential: `0.5` or higher

**Effect:**
- Lower = more consistent scoring across levels
- Higher = bigger rewards for reaching high levels

---

### 4. Base Points

```javascript
POINTS: {
    SINGLE: 50,    // ⬅️ 1 line cleared
    DOUBLE: 100,   // ⬅️ 2 lines cleared
    TRIPLE: 500,   // ⬅️ 3 lines cleared
    TETRIS: 1500   // ⬅️ 4 lines cleared
},
```

**What it does:** Base points before multiplier is applied

**Suggested adjustments:**
- Make Tetrises more valuable: `TETRIS: 2000`
- Reward doubles more: `DOUBLE: 150`
- Discourage singles: `SINGLE: 25`

---

### 5. Drop Speed

```javascript
BASE_DROP_INTERVAL: 1000,  // ⬅️ CHANGE THIS
```

**What it does:** Milliseconds between automatic drops at Level 1

**Formula:** `actual_speed = BASE_DROP_INTERVAL / level`

**Suggested values:**
- Slower (easier): `1200` or `1500`
- Normal (current): `1000`
- Faster (harder): `800` or `600`

**Effect:**
- Higher = slower initial speed = easier
- Lower = faster initial speed = harder

---

### 6. Visual Effects

```javascript
ENABLE_SCREEN_SHAKE: true,        // ⬅️ Toggle screen shake
ENABLE_LINE_CLEAR_ANIMATION: true, // ⬅️ Toggle line animations  
ENABLE_PARTICLE_EFFECTS: true     // ⬅️ Toggle particles
```

**What it does:** Turn visual effects on/off

Set to `false` to disable if you want:
- Better performance on slow devices
- Distraction-free gameplay
- Minimal aesthetic

---

## 🎮 Difficulty Presets

### Easy Mode
```javascript
const CONFIG = {
    WIN_SCORE: 4000,
    LINES_PER_LEVEL: 8,
    LEVEL_MULTIPLIER: 0.3,
    BASE_DROP_INTERVAL: 1200,
    // ... rest stays same
};
```

### Normal Mode (Current)
```javascript
const CONFIG = {
    WIN_SCORE: 6000,
    LINES_PER_LEVEL: 10,
    LEVEL_MULTIPLIER: 0.2,
    BASE_DROP_INTERVAL: 1000,
    // ... rest stays same
};
```

### Hard Mode
```javascript
const CONFIG = {
    WIN_SCORE: 8000,
    LINES_PER_LEVEL: 12,
    LEVEL_MULTIPLIER: 0.15,
    BASE_DROP_INTERVAL: 800,
    // ... rest stays same
};
```

### Extreme Speed Run Mode
```javascript
const CONFIG = {
    WIN_SCORE: 10000,
    LINES_PER_LEVEL: 15,
    LEVEL_MULTIPLIER: 0.1,
    BASE_DROP_INTERVAL: 600,
    // ... rest stays same
};
```

---

## 🧪 Testing Your Changes

1. **Edit the CONFIG object** in `tetris.js`
2. **Save the file**
3. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R to clear cache)
4. **Play a test game** to see how it feels
5. **Adjust and repeat** until you're happy

## 📊 Calculating Win Requirements

Want to know how many lines/Tetrises you need to win?

### Formula for Tetris-only strategy:

```
Tetrises needed = WIN_SCORE / average_tetris_value

Where average_tetris_value depends on:
- Base Tetris points
- How quickly you level up
- Level multiplier
```

### Quick Reference (Current Settings):

With `WIN_SCORE: 6000`, `LINES_PER_LEVEL: 10`, `LEVEL_MULTIPLIER: 0.2`:

- **Perfect Tetris play:** ~16 lines (4 Tetrises)
- **Mixed strategy:** 18-24 lines
- **Inefficient play:** 30+ lines

### Faster Settings Example:

With `WIN_SCORE: 6000`, `LINES_PER_LEVEL: 6`, `LEVEL_MULTIPLIER: 0.3`:

- **Perfect Tetris play:** ~12 lines (3 Tetrises)
- Feels closer to original difficulty

---

## 💡 Tips for Balancing

1. **Test multiple runs** - One game isn't enough to judge balance
2. **Consider your goal:**
   - Speed runs: Lower WIN_SCORE, keep multiplier low
   - Endurance: Higher WIN_SCORE, faster leveling
   - Skill test: High WIN_SCORE, slow leveling, low multiplier

3. **The sweet spot:** Most competitive games take 2-5 minutes with current settings

4. **Watch the math:**
   ```
   If LEVEL_MULTIPLIER is too high + LINES_PER_LEVEL is too low:
   → Late game becomes too easy (exponential growth)
   
   If LEVEL_MULTIPLIER is too low + LINES_PER_LEVEL is too high:
   → Game becomes a grind (linear, boring)
   ```

---

## 🔄 Quick Changes Cheat Sheet

**Want faster games?**
→ Decrease `WIN_SCORE`

**Want more challenging scoring?**
→ Increase `LINES_PER_LEVEL` and decrease `LEVEL_MULTIPLIER`

**Want old-style explosive scoring?**
→ Decrease `LINES_PER_LEVEL` to `4` and set `LEVEL_MULTIPLIER` to `1.0`

**Want pure skill test?**
→ Set `LEVEL_MULTIPLIER` to `0` (no multiplier at all!)

**Want arcade-style progression?**
→ Increase `LEVEL_MULTIPLIER` to `0.4-0.5`

---

## 📝 After Changing Settings

Remember to update your leaderboard if scoring changes significantly:

1. Click the "Clear Records" button in the leaderboard
2. Or manually clear in browser console: `localStorage.removeItem('tetrisLeaderboard')`

This ensures fair comparison with the new scoring system!

---

**Happy tweaking! 🎮⚙️**

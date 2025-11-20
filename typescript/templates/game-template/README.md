# Game Template

## Overview
Complete game boilerplate with game loop, state management, HUD, input handling, and game over screen.

## Features
- **Game Loop:** requestAnimationFrame-based loop
- **State Management:** Menu, playing, paused, game over states
- **HUD:** Score, level, lives, timer
- **Input Handling:** Keyboard and mouse ready
- **Game Over Screen:** With restart and menu options
- **Controls:** Start, pause, restart buttons

## Game States
1. **Menu:** Initial state, shows title
2. **Playing:** Active gameplay
3. **Paused:** Game paused, can resume
4. **Game Over:** End state with final score

## Structure
```javascript
game = {
    state: 'menu',
    score: 0,
    level: 1,
    lives: 3,
    time: 0,
    entities: [],

    start() { },
    pause() { },
    restart() { },
    gameOver() { },
    update() { },
    render() { }
}
```

## Adding Your Game Logic

### 1. Create Entity Classes
```javascript
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // ... properties
    }

    update() {
        // Update logic
    }

    render(ctx) {
        // Render logic
    }
}
```

### 2. Initialize Entities
```javascript
initEntities() {
    this.entities.push(new Player(100, 100));
    this.entities.push(new Enemy(300, 200));
}
```

### 3. Add Game Logic
```javascript
update() {
    // Check collisions
    // Update score
    // Check win/lose conditions
}
```

### 4. Handle Input
```javascript
window.addEventListener('keydown', e => {
    if (keys['ArrowLeft']) player.moveLeft();
    if (keys['Space']) player.jump();
});
```

## Perfect For
- Platform games
- Arcade games
- Puzzle games
- Shooter games
- Any real-time game

## Code Statistics
- **Lines:** ~250 (boilerplate)
- **Setup Time:** 10 minutes
- **Difficulty:** Intermediate

## Next Steps
1. Define your entity classes
2. Implement game mechanics
3. Add collision detection
4. Create levels
5. Add sound effects
6. Polish and test

## Example Games
- See `examples-new/10-game-platformer/` for a complete example

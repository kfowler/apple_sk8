# Example 03: Animation Basics

## Overview
Master animation fundamentals: position, scale, rotation, opacity, easing functions, and animation sequencing.

## What You'll Learn
1. **Property Animation** - Animate any numeric property
2. **Easing Functions** - Control animation timing and feel
3. **Chaining** - Run animations in sequence
4. **Parallel Animation** - Multiple simultaneous animations

## Key Concepts

### Basic Animation
```typescript
animations.animate(actor, 'left', 500, 1000, {
    easing: Easing.easeInOutQuad,
    onComplete: () => console.log('Done!')
});
```

### Easing Functions
- **Linear**: Constant speed
- **Ease In/Out**: Smooth acceleration and deceleration
- **Bounce**: Bouncing effect at the end
- **Elastic**: Spring-like overshoot

### Animation Chaining
```typescript
animate(actor, 'x', 400, 500, easing, () => {
    animate(actor, 'y', 300, 500, easing, () => {
        // Next animation...
    });
});
```

## How to Run
Open `index.html` in your browser.

## Challenges
- Create a figure-8 motion path
- Implement a "wobble" effect
- Add color animation
- Create a loading spinner animation

## Code Statistics
- **Lines:** ~200
- **Time:** 45 minutes
- **Difficulty:** Beginner

## Next Steps
- **04-ui-components** - Build interactive UIs
- **10-game-platformer** - Apply animations in a game

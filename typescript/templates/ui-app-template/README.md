# UI Application Template

## Overview
Full-featured application template with menu bar, toolbar, sidebar, properties panel, and status bar.

## Features
- **Menu Bar:** File, Edit, View, Tools, Help menus
- **Toolbar:** Common actions as buttons
- **Sidebar:** Navigation or tool palette
- **Canvas Area:** Main SK8 stage
- **Properties Panel:** Actor property editing
- **Status Bar:** Application status and info

## Perfect For
- Drawing applications
- Content editors
- Design tools
- Data visualization apps
- Any app needing a professional UI

## Layout Structure
```
┌─────────────────────────────────────┐
│          Menu Bar                    │
├─────────────────────────────────────┤
│          Toolbar                     │
├──────┬────────────────┬─────────────┤
│      │                │             │
│ Side │   Canvas Area  │ Properties  │
│ bar  │                │   Panel     │
│      │                │             │
├──────┴────────────────┴─────────────┤
│          Status Bar                  │
└─────────────────────────────────────┘
```

## Customization
- Modify menu items in `.menubar`
- Add/remove toolbar buttons in `.toolbar`
- Customize sidebar content in `.sidebar`
- Adjust properties panel fields in `.properties`
- Change layout widths/heights in CSS

## Code Statistics
- **Lines:** ~200 (HTML/CSS)
- **Setup Time:** 5 minutes
- **Difficulty:** Beginner-Intermediate

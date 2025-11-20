# UI Components Guide

Complete guide to using SK8's UI components to build interactive interfaces.

## Table of Contents

- [Overview](#overview)
- [Buttons and Controls](#buttons-and-controls)
- [Layout Containers](#layout-containers)
- [Advanced Widgets](#advanced-widgets)
- [Event Handling](#event-handling)
- [Styling](#styling)
- [Complete Examples](#complete-examples)

---

## Overview

SK8 provides a rich set of UI components for building interactive applications. All UI components inherit from `SK8Actor` and share common properties.

### Available Components

**Basic Controls:**
- Button - Clickable button with label
- CheckBox - Toggle checkbox
- RadioButton - Mutually exclusive selection
- Slider - Value selection slider
- EditText - Text input field
- Label - Static text display
- ProgressBar - Progress indicator

**Layout:**
- Panel - Container with background
- Container - Generic actor container
- Scroller - Scrollable container

**Advanced:**
- Dialog - Modal dialog boxes
- MenuButton - Dropdown menu button
- ListView - Scrollable item list
- TreeView - Hierarchical tree view (planned)
- TabPanel - Tabbed interface (planned)
- Toolbar - Tool button bar (planned)
- ColorPicker - Color selection widget
- FileDialog - File selection (browser-based)

---

## Buttons and Controls

### Button

Interactive button with click handling and visual states.

**Creating a Button:**
```javascript
import { SK8Button } from './dist/sk8.js';

const button = new SK8Button();
button.set('left', 100);
button.set('top', 50);
button.set('width', 100);
button.set('height', 30);
button.set('label', 'Click Me');

// Add click handler
button.addHandler('click', function() {
    console.log('Button clicked!');
    alert('You clicked the button');
});

stage.addActor(button);
```

**Button States:**
- `normal` - Default appearance
- `hover` - Mouse over button
- `pressed` - Mouse button down
- `disabled` - Button inactive

**Button Properties:**
```javascript
button.set('label', 'New Label');
button.set('enabled', false);  // Disable button
button.set('cornerRadius', 10);  // Rounded corners
button.set('fontSize', 16);

// Colors for different states
button.set('normalColor', { r: 240, g: 240, b: 240, a: 1.0 });
button.set('hoverColor', { r: 230, g: 230, b: 230, a: 1.0 });
button.set('pressedColor', { r: 200, g: 200, b: 200, a: 1.0 });
```

**Button Example:**
```javascript
// Create action buttons
const saveBtn = new SK8Button();
saveBtn.set('label', 'Save');
saveBtn.set('fillColor', 'green');
saveBtn.addHandler('click', () => saveDocument());

const cancelBtn = new SK8Button();
cancelBtn.set('label', 'Cancel');
cancelBtn.set('fillColor', 'red');
cancelBtn.addHandler('click', () => closeDialog());
```

### CheckBox

Toggle checkbox for boolean values.

```javascript
import { SK8CheckBox } from './dist/sk8.js';

const checkbox = new SK8CheckBox();
checkbox.set('left', 100);
checkbox.set('top', 100);
checkbox.set('label', 'Enable notifications');
checkbox.set('checked', false);

checkbox.addHandler('change', function() {
    const isChecked = this.get('checked');
    console.log('Checkbox is now:', isChecked);
});

stage.addActor(checkbox);
```

**CheckBox Properties:**
```javascript
checkbox.set('checked', true);  // Check the box
checkbox.set('label', 'Accept terms');
checkbox.set('enabled', false);  // Disable
```

**Practical Example:**
```javascript
// Settings panel with checkboxes
const settings = [
    { label: 'Show notifications', key: 'notifications' },
    { label: 'Play sound effects', key: 'sounds' },
    { label: 'Auto-save', key: 'autosave' }
];

settings.forEach((setting, index) => {
    const cb = new SK8CheckBox();
    cb.set('left', 50);
    cb.set('top', 50 + index * 40);
    cb.set('label', setting.label);
    cb.set('checked', config[setting.key]);

    cb.addHandler('change', function() {
        config[setting.key] = this.get('checked');
        saveConfig(config);
    });

    stage.addActor(cb);
});
```

### RadioButton

Mutually exclusive selection (only one selected at a time).

```javascript
import { SK8RadioButton } from './dist/sk8.js';

// Create radio button group
const group = 'sizeGroup';

const smallRadio = new SK8RadioButton();
smallRadio.set('left', 100);
smallRadio.set('top', 100);
smallRadio.set('label', 'Small');
smallRadio.set('group', group);
smallRadio.set('selected', true);

const mediumRadio = new SK8RadioButton();
mediumRadio.set('left', 100);
mediumRadio.set('top', 130);
mediumRadio.set('label', 'Medium');
mediumRadio.set('group', group);

const largeRadio = new SK8RadioButton();
largeRadio.set('left', 100);
largeRadio.set('top', 160);
largeRadio.set('label', 'Large');
largeRadio.set('group', group);

// Handle selection
[smallRadio, mediumRadio, largeRadio].forEach(radio => {
    radio.addHandler('select', function() {
        const size = this.get('label').toLowerCase();
        applySize(size);
    });
    stage.addActor(radio);
});
```

### Slider

Numeric value selection with visual slider.

```javascript
import { SK8Slider } from './dist/sk8.js';

const slider = new SK8Slider();
slider.set('left', 100);
slider.set('top', 200);
slider.set('width', 200);
slider.set('minimum', 0);
slider.set('maximum', 100);
slider.set('value', 50);

slider.addHandler('change', function() {
    const value = this.get('value');
    console.log('Slider value:', value);
    updateVolume(value);
});

stage.addActor(slider);
```

**Slider Properties:**
```javascript
slider.set('minimum', 0);
slider.set('maximum', 100);
slider.set('value', 50);
slider.set('step', 1);  // Increment size
slider.set('showValue', true);  // Display numeric value
```

**Volume Control Example:**
```javascript
// Volume slider with label
const volumeLabel = new SK8Label();
volumeLabel.set('text', 'Volume: 50%');
volumeLabel.set('left', 100);
volumeLabel.set('top', 180);

const volumeSlider = new SK8Slider();
volumeSlider.set('left', 100);
volumeSlider.set('top', 200);
volumeSlider.set('minimum', 0);
volumeSlider.set('maximum', 100);
volumeSlider.set('value', 50);

volumeSlider.addHandler('change', function() {
    const vol = this.get('value');
    volumeLabel.set('text', `Volume: ${vol}%`);
    audio.volume = vol / 100;
    stage.render();
});
```

### EditText

Single-line or multi-line text input.

```javascript
import { SK8EditText } from './dist/sk8.js';

const textField = new SK8EditText();
textField.set('left', 100);
textField.set('top', 100);
textField.set('width', 200);
textField.set('height', 30);
textField.set('placeholder', 'Enter your name');

textField.addHandler('change', function() {
    const text = this.get('text');
    console.log('Text changed:', text);
});

textField.addHandler('submit', function() {
    const text = this.get('text');
    console.log('Text submitted:', text);
});

stage.addActor(textField);
```

**EditText Properties:**
```javascript
textField.set('text', 'Initial text');
textField.set('placeholder', 'Hint text');
textField.set('multiline', true);  // Allow multiple lines
textField.set('maxLength', 100);  // Character limit
textField.set('password', true);  // Hide text (password field)
textField.set('editable', false);  // Read-only
```

**Form Example:**
```javascript
// Create a form
const nameField = new SK8EditText();
nameField.set('placeholder', 'Name');

const emailField = new SK8EditText();
emailField.set('placeholder', 'Email');

const passwordField = new SK8EditText();
passwordField.set('placeholder', 'Password');
passwordField.set('password', true);

const submitBtn = new SK8Button();
submitBtn.set('label', 'Submit');
submitBtn.addHandler('click', () => {
    const data = {
        name: nameField.get('text'),
        email: emailField.get('text'),
        password: passwordField.get('text')
    };
    submitForm(data);
});
```

### ProgressBar

Visual progress indicator.

```javascript
import { SK8ProgressBar } from './dist/sk8.js';

const progress = new SK8ProgressBar();
progress.set('left', 100);
progress.set('top', 300);
progress.set('width', 300);
progress.set('height', 20);
progress.set('minimum', 0);
progress.set('maximum', 100);
progress.set('value', 0);

// Animate progress
let currentValue = 0;
const interval = setInterval(() => {
    currentValue += 1;
    progress.set('value', currentValue);
    stage.render();

    if (currentValue >= 100) {
        clearInterval(interval);
        console.log('Progress complete!');
    }
}, 50);
```

---

## Layout Containers

### Panel

Container with background and border.

```javascript
import { SK8Panel } from './dist/sk8.js';

const panel = new SK8Panel();
panel.set('left', 50);
panel.set('top', 50);
panel.set('width', 300);
panel.set('height', 200);
panel.set('fillColor', { r: 240, g: 240, b: 240, a: 1.0 });
panel.set('frameColor', { r: 100, g: 100, b: 100, a: 1.0 });
panel.set('cornerRadius', 8);

stage.addActor(panel);

// Add child actors to the panel
const title = new SK8Label();
title.set('text', 'Panel Title');
title.set('left', 60);
title.set('top', 60);
stage.addActor(title);
```

**Panel Properties:**
```javascript
panel.set('fillColor', 'white');
panel.set('frameColor', 'gray');
panel.set('cornerRadius', 10);
panel.set('padding', 10);  // Internal padding
```

### Container

Generic container for grouping actors.

```javascript
import { SK8Container } from './dist/sk8.js';

const container = new SK8Container();
container.set('left', 100);
container.set('top', 100);
container.set('width', 400);
container.set('height', 300);

// Add children
container.addChild(button1);
container.addChild(button2);
container.addChild(label);

stage.addActor(container);

// Move container (children move with it)
container.set('left', 200);
```

**Container Layout Options:**
```javascript
// Manual positioning
container.addChild(actor);
actor.set('left', 10);  // Relative to container

// Future: Automatic layout
container.set('layout', 'vertical');  // Stack vertically
container.set('spacing', 10);  // Space between children
```

### Scroller

Scrollable container for overflow content.

```javascript
import { SK8Scroller } from './dist/sk8.js';

const scroller = new SK8Scroller();
scroller.set('left', 50);
scroller.set('top', 50);
scroller.set('width', 300);
scroller.set('height', 200);
scroller.set('contentHeight', 800);  // Content is taller than viewport

// Add content
for (let i = 0; i < 20; i++) {
    const item = new SK8Label();
    item.set('text', `Item ${i + 1}`);
    item.set('top', i * 40);
    scroller.addChild(item);
}

stage.addActor(scroller);
```

---

## Advanced Widgets

### Dialog

Modal dialog boxes.

```javascript
import { SK8Dialog } from './dist/sk8.js';

// Create a dialog
const dialog = new SK8Dialog();
dialog.set('title', 'Confirm Action');
dialog.set('message', 'Are you sure you want to delete this item?');
dialog.set('width', 400);
dialog.set('height', 200);

// Add buttons
dialog.addButton('OK', () => {
    console.log('OK clicked');
    performDelete();
    dialog.close();
});

dialog.addButton('Cancel', () => {
    console.log('Cancelled');
    dialog.close();
});

// Show dialog
dialog.show();
```

**Dialog Types:**
```javascript
// Alert dialog
SK8Dialog.alert('Important Message', 'This is an alert!');

// Confirm dialog
SK8Dialog.confirm('Are you sure?', (confirmed) => {
    if (confirmed) {
        deleteItem();
    }
});

// Input dialog
SK8Dialog.prompt('Enter your name:', 'Default Name', (name) => {
    if (name) {
        greetUser(name);
    }
});
```

### MenuButton

Dropdown menu button.

```javascript
import { SK8MenuButton } from './dist/sk8.js';

const menuBtn = new SK8MenuButton();
menuBtn.set('label', 'File');
menuBtn.set('left', 50);
menuBtn.set('top', 50);

// Add menu items
menuBtn.addItem('New', () => createNew());
menuBtn.addItem('Open', () => openFile());
menuBtn.addItem('Save', () => saveFile());
menuBtn.addSeparator();
menuBtn.addItem('Exit', () => exitApp());

stage.addActor(menuBtn);
```

### ListView

Scrollable list of items.

```javascript
import { SK8ListView } from './dist/sk8.js';

const listView = new SK8ListView();
listView.set('left', 50);
listView.set('top', 50);
listView.set('width', 300);
listView.set('height', 400);

// Add items
const items = ['Apple', 'Banana', 'Orange', 'Grape', 'Mango'];
items.forEach(item => {
    listView.addItem(item);
});

// Handle selection
listView.addHandler('select', function(item, index) {
    console.log('Selected:', item, 'at index', index);
});

stage.addActor(listView);
```

### ColorPicker

Color selection widget.

```javascript
import { SK8ColorPicker } from './dist/sk8.js';

const colorPicker = new SK8ColorPicker();
colorPicker.set('left', 100);
colorPicker.set('top', 100);

colorPicker.addHandler('change', function(color) {
    console.log('Selected color:', color);
    rect.set('fillColor', color);
    stage.render();
});

stage.addActor(colorPicker);
```

---

## Event Handling

### Common Events

All UI components support these events:

```javascript
// Click events
widget.addHandler('click', function(x, y) {
    console.log('Clicked at', x, y);
});

// Mouse events
widget.addHandler('mouseDown', function(x, y) { });
widget.addHandler('mouseUp', function(x, y) { });
widget.addHandler('mouseMove', function(x, y) { });
widget.addHandler('mouseEnter', function() { });
widget.addHandler('mouseLeave', function() { });

// Component-specific events
button.addHandler('click', function() { });
checkbox.addHandler('change', function() { });
slider.addHandler('change', function() { });
textField.addHandler('change', function() { });
textField.addHandler('submit', function() { });
```

### Form Submission

```javascript
// Create a form with submit button
const form = {
    name: new SK8EditText(),
    email: new SK8EditText(),
    submit: new SK8Button()
};

form.submit.set('label', 'Submit');
form.submit.addHandler('click', () => {
    const data = {
        name: form.name.get('text'),
        email: form.email.get('text')
    };

    if (validateForm(data)) {
        submitToServer(data);
    }
});

// Submit on Enter key in text field
form.email.addHandler('submit', () => {
    form.submit.callHandler('click');
});
```

---

## Styling

### Appearance Properties

Common styling properties for all UI components:

```javascript
// Colors
widget.set('fillColor', { r: 255, g: 200, b: 100, a: 1.0 });
widget.set('frameColor', 'black');
widget.set('textColor', 'white');

// Transparency
widget.set('opacity', 0.8);

// Borders
widget.set('frameWidth', 2);
widget.set('cornerRadius', 8);

// Text
widget.set('fontSize', 14);
widget.set('fontFamily', 'Arial, sans-serif');
widget.set('fontWeight', 'bold');
widget.set('textAlign', 'center');
```

### Custom Rendering

Extend components for custom appearance:

```javascript
class CustomButton extends SK8Button {
    render(ctx) {
        const bounds = this.getBoundsRect();

        // Custom gradient background
        const gradient = ctx.createLinearGradient(
            bounds.left, bounds.top,
            bounds.left, bounds.bottom
        );
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#45a049');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            bounds.left, bounds.top,
            bounds.right - bounds.left,
            bounds.bottom - bounds.top
        );

        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.get('label'),
            (bounds.left + bounds.right) / 2,
            (bounds.top + bounds.bottom) / 2
        );
    }
}
```

---

## Complete Examples

### Login Form

```javascript
// Create login form
function createLoginForm() {
    const panel = new SK8Panel();
    panel.set('left', 200);
    panel.set('top', 100);
    panel.set('width', 300);
    panel.set('height', 250);
    panel.set('fillColor', 'white');
    panel.set('cornerRadius', 10);

    const title = new SK8Label();
    title.set('text', 'Login');
    title.set('fontSize', 24);
    title.set('left', 250);
    title.set('top', 120);

    const usernameField = new SK8EditText();
    usernameField.set('left', 220);
    usernameField.set('top', 160);
    usernameField.set('width', 260);
    usernameField.set('placeholder', 'Username');

    const passwordField = new SK8EditText();
    passwordField.set('left', 220);
    passwordField.set('top', 200);
    passwordField.set('width', 260);
    passwordField.set('placeholder', 'Password');
    passwordField.set('password', true);

    const loginBtn = new SK8Button();
    loginBtn.set('left', 220);
    loginBtn.set('top', 250);
    loginBtn.set('width', 100);
    loginBtn.set('label', 'Login');

    const cancelBtn = new SK8Button();
    cancelBtn.set('left', 330);
    cancelBtn.set('top', 250);
    cancelBtn.set('width', 100);
    cancelBtn.set('label', 'Cancel');

    // Handle login
    loginBtn.addHandler('click', () => {
        const username = usernameField.get('text');
        const password = passwordField.get('text');

        if (authenticate(username, password)) {
            alert('Login successful!');
            hideLoginForm();
        } else {
            alert('Invalid credentials');
        }
    });

    cancelBtn.addHandler('click', () => {
        hideLoginForm();
    });

    [panel, title, usernameField, passwordField, loginBtn, cancelBtn]
        .forEach(actor => stage.addActor(actor));
}
```

### Settings Dialog

```javascript
function createSettingsDialog() {
    const dialog = new SK8Dialog();
    dialog.set('title', 'Settings');
    dialog.set('width', 400);
    dialog.set('height', 400);

    // Notification checkbox
    const notifyCheck = new SK8CheckBox();
    notifyCheck.set('label', 'Enable notifications');
    notifyCheck.set('checked', settings.notifications);
    dialog.addChild(notifyCheck);

    // Volume slider
    const volumeLabel = new SK8Label();
    volumeLabel.set('text', 'Volume');
    dialog.addChild(volumeLabel);

    const volumeSlider = new SK8Slider();
    volumeSlider.set('minimum', 0);
    volumeSlider.set('maximum', 100);
    volumeSlider.set('value', settings.volume);
    dialog.addChild(volumeSlider);

    // Theme selection
    const themeLabel = new SK8Label();
    themeLabel.set('text', 'Theme');
    dialog.addChild(themeLabel);

    const lightRadio = new SK8RadioButton();
    lightRadio.set('label', 'Light');
    lightRadio.set('group', 'theme');
    lightRadio.set('selected', settings.theme === 'light');

    const darkRadio = new SK8RadioButton();
    darkRadio.set('label', 'Dark');
    darkRadio.set('group', 'theme');
    darkRadio.set('selected', settings.theme === 'dark');

    // Save button
    dialog.addButton('Save', () => {
        settings.notifications = notifyCheck.get('checked');
        settings.volume = volumeSlider.get('value');
        settings.theme = lightRadio.get('selected') ? 'light' : 'dark';

        saveSettings(settings);
        applySettings(settings);
        dialog.close();
    });

    dialog.addButton('Cancel', () => {
        dialog.close();
    });

    dialog.show();
}
```

### File Browser

```javascript
function createFileBrowser(path) {
    const listView = new SK8ListView();
    listView.set('left', 50);
    listView.set('top', 100);
    listView.set('width', 500);
    listView.set('height', 400);

    // Load files
    const files = loadDirectory(path);
    files.forEach(file => {
        const icon = file.isDirectory ? '📁' : '📄';
        listView.addItem(`${icon} ${file.name}`);
    });

    listView.addHandler('select', (item, index) => {
        const file = files[index];

        if (file.isDirectory) {
            // Navigate into directory
            createFileBrowser(file.path);
        } else {
            // Open file
            openFile(file.path);
        }
    });

    stage.addActor(listView);
}
```

---

## Next Steps

- **[Animation Tutorial](ANIMATION_TUTORIAL.md)** - Animate UI components
- **[Recipe Book](RECIPES.md)** - More UI examples
- **[Visual IDE Guide](VISUAL_IDE.md)** - Build UIs visually

Build amazing interfaces with SK8's UI components!

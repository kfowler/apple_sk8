/**
 * Test suite for interactive actors (widgets)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SK8Button,
  SK8CheckBox,
  SK8RadioButton,
  SK8Slider,
  SK8EditText,
  SK8Label,
  SK8Container,
  SK8Panel,
  SK8Scroller,
  SK8MenuButton,
} from '../src/sk8.js';

describe('SK8Button', () => {
  let button: SK8Button;

  beforeEach(() => {
    button = new SK8Button();
  });

  it('should create a button with default properties', () => {
    expect(button.getLabel()).toBe('Button');
    expect(button.getEnabled()).toBe(true);
    expect(button.getState()).toBe('normal');
  });

  it('should set and get label', () => {
    button.setLabel('Click Me');
    expect(button.getLabel()).toBe('Click Me');
  });

  it('should enable and disable', () => {
    button.setEnabled(false);
    expect(button.getEnabled()).toBe(false);
    expect(button.getState()).toBe('disabled');
  });

  it('should change state', () => {
    button.setState('hover');
    expect(button.getState()).toBe('hover');

    button.setState('pressed');
    expect(button.getState()).toBe('pressed');
  });

  it('should not change state when disabled', () => {
    button.setEnabled(false);
    button.setState('hover');
    expect(button.getState()).toBe('disabled');
  });

  it('should handle click events when enabled', () => {
    let clicked = false;
    button.addHandler('click', () => {
      clicked = true;
    });

    button.onClick(50, 15);
    expect(clicked).toBe(true);
  });

  it('should not call handler when disabled', () => {
    let clicked = false;
    button.setEnabled(false);
    button.addHandler('click', () => {
      clicked = true;
    });

    button.onClick(50, 15);
    expect(clicked).toBe(false);
  });
});

describe('SK8CheckBox', () => {
  let checkbox: SK8CheckBox;

  beforeEach(() => {
    checkbox = new SK8CheckBox();
  });

  it('should create a checkbox with default properties', () => {
    expect(checkbox.getChecked()).toBe(false);
    expect(checkbox.getLabel()).toBe('CheckBox');
    expect(checkbox.getEnabled()).toBe(true);
  });

  it('should toggle checked state', () => {
    checkbox.toggle();
    expect(checkbox.getChecked()).toBe(true);

    checkbox.toggle();
    expect(checkbox.getChecked()).toBe(false);
  });

  it('should set checked state directly', () => {
    checkbox.setChecked(true);
    expect(checkbox.getChecked()).toBe(true);

    checkbox.setChecked(false);
    expect(checkbox.getChecked()).toBe(false);
  });

  it('should call toggle handler', () => {
    let toggledValue = false;
    checkbox.addHandler('toggle', (value: boolean) => {
      toggledValue = value;
    });

    checkbox.toggle();
    expect(toggledValue).toBe(true);
  });

  it('should not toggle when disabled', () => {
    checkbox.setEnabled(false);
    checkbox.onClick(10, 10);
    expect(checkbox.getChecked()).toBe(false);
  });
});

describe('SK8RadioButton', () => {
  let radio1: SK8RadioButton;
  let radio2: SK8RadioButton;
  let radio3: SK8RadioButton;

  beforeEach(() => {
    radio1 = new SK8RadioButton();
    radio1.setGroup('test-group');
    radio1.setLabel('Option 1');

    radio2 = new SK8RadioButton();
    radio2.setGroup('test-group');
    radio2.setLabel('Option 2');

    radio3 = new SK8RadioButton();
    radio3.setGroup('test-group');
    radio3.setLabel('Option 3');
  });

  it('should create a radio button with default properties', () => {
    expect(radio1.getSelected()).toBe(false);
    expect(radio1.getLabel()).toBe('Option 1');
    expect(radio1.getEnabled()).toBe(true);
  });

  it('should select a radio button', () => {
    radio1.setSelected(true);
    expect(radio1.getSelected()).toBe(true);
  });

  it('should deselect other radio buttons in the same group', () => {
    radio1.setSelected(true);
    expect(radio1.getSelected()).toBe(true);
    expect(radio2.getSelected()).toBe(false);
    expect(radio3.getSelected()).toBe(false);

    radio2.setSelected(true);
    expect(radio1.getSelected()).toBe(false);
    expect(radio2.getSelected()).toBe(true);
    expect(radio3.getSelected()).toBe(false);
  });

  it('should allow different groups to have independent selections', () => {
    const radioA = new SK8RadioButton();
    radioA.setGroup('group-a');
    radioA.setSelected(true);

    const radioB = new SK8RadioButton();
    radioB.setGroup('group-b');
    radioB.setSelected(true);

    expect(radioA.getSelected()).toBe(true);
    expect(radioB.getSelected()).toBe(true);
  });
});

describe('SK8Slider', () => {
  let slider: SK8Slider;

  beforeEach(() => {
    slider = new SK8Slider();
  });

  it('should create a slider with default properties', () => {
    expect(slider.getValue()).toBe(50);
    expect(slider.getMin()).toBe(0);
    expect(slider.getMax()).toBe(100);
    expect(slider.getStep()).toBe(1);
    expect(slider.getOrientation()).toBe('horizontal');
  });

  it('should set and get value', () => {
    slider.setValue(75);
    expect(slider.getValue()).toBe(75);
  });

  it('should constrain value to min/max', () => {
    slider.setValue(-10);
    expect(slider.getValue()).toBe(0);

    slider.setValue(150);
    expect(slider.getValue()).toBe(100);
  });

  it('should apply step to value', () => {
    slider.setStep(10);
    slider.setValue(23);
    expect(slider.getValue()).toBe(20);

    slider.setValue(27);
    expect(slider.getValue()).toBe(30);
  });

  it('should update min/max', () => {
    slider.setMin(10);
    slider.setMax(90);
    expect(slider.getMin()).toBe(10);
    expect(slider.getMax()).toBe(90);

    // Value should be constrained
    slider.setValue(5);
    expect(slider.getValue()).toBe(10);
  });

  it('should change orientation', () => {
    slider.setOrientation('vertical');
    expect(slider.getOrientation()).toBe('vertical');
  });

  it('should call change handler', () => {
    let changedValue = 0;
    slider.addHandler('change', (value: number) => {
      changedValue = value;
    });

    slider.setValue(80);
    expect(changedValue).toBe(80);
  });
});

describe('SK8EditText', () => {
  let editText: SK8EditText;

  beforeEach(() => {
    editText = new SK8EditText();
  });

  it('should create an edit text with default properties', () => {
    expect(editText.getText()).toBe('');
    expect(editText.getPlaceholder()).toBe('Enter text...');
    expect(editText.getReadonly()).toBe(false);
    expect(editText.getFocused()).toBe(false);
  });

  it('should set and get text', () => {
    editText.setText('Hello World');
    expect(editText.getText()).toBe('Hello World');
  });

  it('should enforce max length', () => {
    editText.setMaxLength(5);
    editText.setText('Hello World');
    expect(editText.getText()).toBe('Hello');
  });

  it('should set placeholder', () => {
    editText.setPlaceholder('Type here...');
    expect(editText.getPlaceholder()).toBe('Type here...');
  });

  it('should focus and unfocus', () => {
    editText.setFocused(true);
    expect(editText.getFocused()).toBe(true);

    editText.setFocused(false);
    expect(editText.getFocused()).toBe(false);
  });

  it('should set readonly mode', () => {
    editText.setReadonly(true);
    expect(editText.getReadonly()).toBe(true);
  });
});

describe('SK8Label', () => {
  let label: SK8Label;

  beforeEach(() => {
    label = new SK8Label();
  });

  it('should create a label with default properties', () => {
    expect(label.getText()).toBe('Label');
    expect(label.getFontSize()).toBe(14);
    expect(label.getTextAlign()).toBe('left');
    expect(label.getVerticalAlign()).toBe('top');
  });

  it('should set and get text', () => {
    label.setText('Hello World');
    expect(label.getText()).toBe('Hello World');
  });

  it('should set font properties', () => {
    label.setFontSize(20);
    expect(label.getFontSize()).toBe(20);

    label.setFontFamily('Arial');
    expect(label.getFontFamily()).toBe('Arial');

    label.setFontWeight('bold');
    expect(label.getFontWeight()).toBe('bold');

    label.setFontStyle('italic');
    expect(label.getFontStyle()).toBe('italic');
  });

  it('should set text alignment', () => {
    label.setTextAlign('center');
    expect(label.getTextAlign()).toBe('center');

    label.setVerticalAlign('middle');
    expect(label.getVerticalAlign()).toBe('middle');
  });

  it('should enable word wrap', () => {
    label.setWordWrap(true);
    expect(label.getWordWrap()).toBe(true);
  });
});

describe('SK8Container', () => {
  let container: SK8Container;

  beforeEach(() => {
    container = new SK8Container();
  });

  it('should create a container with default properties', () => {
    expect(container.getChildren()).toHaveLength(0);
    expect(container.getLayoutMode()).toBe('none');
    expect(container.getPadding()).toBe(10);
    expect(container.getSpacing()).toBe(5);
  });

  it('should add and remove children', () => {
    const child1 = new SK8Button();
    const child2 = new SK8Button();

    container.addChild(child1);
    expect(container.getChildren()).toHaveLength(1);

    container.addChild(child2);
    expect(container.getChildren()).toHaveLength(2);

    container.removeChild(child1);
    expect(container.getChildren()).toHaveLength(1);
  });

  it('should clear all children', () => {
    container.addChild(new SK8Button());
    container.addChild(new SK8Button());
    expect(container.getChildren()).toHaveLength(2);

    container.clearChildren();
    expect(container.getChildren()).toHaveLength(0);
  });

  it('should set layout mode', () => {
    container.setLayoutMode('horizontal');
    expect(container.getLayoutMode()).toBe('horizontal');

    container.setLayoutMode('vertical');
    expect(container.getLayoutMode()).toBe('vertical');

    container.setLayoutMode('grid');
    expect(container.getLayoutMode()).toBe('grid');
  });

  it('should set padding and spacing', () => {
    container.setPadding(20);
    expect(container.getPadding()).toBe(20);

    container.setSpacing(10);
    expect(container.getSpacing()).toBe(10);
  });

  it('should set grid columns', () => {
    container.setGridColumns(3);
    expect(container.getGridColumns()).toBe(3);
  });
});

describe('SK8Panel', () => {
  let panel: SK8Panel;

  beforeEach(() => {
    panel = new SK8Panel();
  });

  it('should create a panel with default properties', () => {
    expect(panel.getTitle()).toBe('Panel');
    expect(panel.getShowCloseButton()).toBe(true);
    expect(panel.getCollapsible()).toBe(false);
    expect(panel.getCollapsed()).toBe(false);
  });

  it('should set and get title', () => {
    panel.setTitle('My Panel');
    expect(panel.getTitle()).toBe('My Panel');
  });

  it('should show and hide close button', () => {
    panel.setShowCloseButton(false);
    expect(panel.getShowCloseButton()).toBe(false);
  });

  it('should collapse and expand when collapsible', () => {
    panel.setCollapsible(true);
    expect(panel.getCollapsible()).toBe(true);

    panel.setCollapsed(true);
    expect(panel.getCollapsed()).toBe(true);

    panel.setCollapsed(false);
    expect(panel.getCollapsed()).toBe(false);
  });

  it('should not collapse when not collapsible', () => {
    panel.setCollapsible(false);
    panel.setCollapsed(true);
    expect(panel.getCollapsed()).toBe(false);
  });

  it('should add and remove children', () => {
    const child = new SK8Button();
    panel.addChild(child);
    expect(panel.getChildren()).toHaveLength(1);

    panel.removeChild(child);
    expect(panel.getChildren()).toHaveLength(0);
  });
});

describe('SK8Scroller', () => {
  let scroller: SK8Scroller;

  beforeEach(() => {
    scroller = new SK8Scroller();
  });

  it('should create a scroller with default properties', () => {
    expect(scroller.getScrollX()).toBe(0);
    expect(scroller.getScrollY()).toBe(0);
    expect(scroller.getShowHorizontalScrollbar()).toBe(true);
    expect(scroller.getShowVerticalScrollbar()).toBe(true);
  });

  it('should set content dimensions', () => {
    scroller.setContentWidth(500);
    scroller.setContentHeight(400);
    expect(scroller.getContentWidth()).toBe(500);
    expect(scroller.getContentHeight()).toBe(400);
  });

  it('should set scroll position', () => {
    scroller.setContentWidth(500);
    scroller.setContentHeight(400);

    scroller.setScrollX(50);
    expect(scroller.getScrollX()).toBe(50);

    scroller.setScrollY(75);
    expect(scroller.getScrollY()).toBe(75);
  });

  it('should constrain scroll position to content bounds', () => {
    scroller.setContentWidth(500);
    scroller.setContentHeight(400);
    scroller.setBoundsRect({ left: 0, top: 0, right: 300, bottom: 200 });

    // Try to scroll beyond content
    scroller.setScrollX(1000);
    expect(scroller.getScrollX()).toBeLessThanOrEqual(500 - 300);

    scroller.setScrollY(1000);
    expect(scroller.getScrollY()).toBeLessThanOrEqual(400 - 200);
  });

  it('should show and hide scrollbars', () => {
    scroller.setShowHorizontalScrollbar(false);
    expect(scroller.getShowHorizontalScrollbar()).toBe(false);

    scroller.setShowVerticalScrollbar(false);
    expect(scroller.getShowVerticalScrollbar()).toBe(false);
  });
});

describe('SK8MenuButton', () => {
  let menuButton: SK8MenuButton;

  beforeEach(() => {
    menuButton = new SK8MenuButton();
  });

  it('should create a menu button with default properties', () => {
    expect(menuButton.getLabel()).toBe('Menu');
    expect(menuButton.getEnabled()).toBe(true);
    expect(menuButton.getMenuOpen()).toBe(false);
    expect(menuButton.getMenuItems()).toHaveLength(0);
  });

  it('should set and get label', () => {
    menuButton.setLabel('Options');
    expect(menuButton.getLabel()).toBe('Options');
  });

  it('should open and close menu', () => {
    menuButton.setMenuOpen(true);
    expect(menuButton.getMenuOpen()).toBe(true);

    menuButton.setMenuOpen(false);
    expect(menuButton.getMenuOpen()).toBe(false);
  });

  it('should not open menu when disabled', () => {
    menuButton.setEnabled(false);
    menuButton.setMenuOpen(true);
    expect(menuButton.getMenuOpen()).toBe(false);
  });

  it('should add menu items', () => {
    menuButton.addMenuItem({ label: 'Item 1', value: 'item1' });
    menuButton.addMenuItem({ label: 'Item 2', value: 'item2' });
    expect(menuButton.getMenuItems()).toHaveLength(2);
  });

  it('should set menu items', () => {
    const items = [
      { label: 'New', value: 'new' },
      { label: 'Open', value: 'open' },
      { label: 'Save', value: 'save' },
    ];
    menuButton.setMenuItems(items);
    expect(menuButton.getMenuItems()).toHaveLength(3);
  });

  it('should clear menu items', () => {
    menuButton.addMenuItem({ label: 'Item 1', value: 'item1' });
    menuButton.clearMenuItems();
    expect(menuButton.getMenuItems()).toHaveLength(0);
  });

  it('should support disabled menu items', () => {
    menuButton.addMenuItem({ label: 'Enabled', value: 'enabled', enabled: true });
    menuButton.addMenuItem({ label: 'Disabled', value: 'disabled', enabled: false });
    const items = menuButton.getMenuItems();
    expect(items[0].enabled).toBe(true);
    expect(items[1].enabled).toBe(false);
  });

  it('should support separator items', () => {
    menuButton.addMenuItem({ label: 'Item 1', value: 'item1' });
    menuButton.addMenuItem({ label: '', value: '', separator: true });
    menuButton.addMenuItem({ label: 'Item 2', value: 'item2' });
    const items = menuButton.getMenuItems();
    expect(items[1].separator).toBe(true);
  });
});

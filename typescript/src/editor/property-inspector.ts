/**
 * SK8PropertyInspector - UI for viewing and editing actor properties
 *
 * Features:
 * - Display properties of selected actor(s)
 * - Editable fields for different property types
 * - Live updates to actor as you type
 * - Property grouping (appearance, layout, behavior)
 * - Handle multi-select (show common properties)
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { PropertyValue } from '../core/SK8Object.js';
import { SK8Editor, SetPropertyCommand } from './editor.js';
import { Color, ColorUtils } from '../graphics/types.js';

/**
 * Property type definitions
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'enum'
  | 'rect'
  | 'point';

/**
 * Property definition for inspector
 */
export interface PropertyDefinition {
  name: string;
  displayName: string;
  type: PropertyType;
  group: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For enum type
  readonly?: boolean;
}

/**
 * Property group
 */
export interface PropertyGroup {
  name: string;
  displayName: string;
  expanded: boolean;
}

/**
 * Property inspector
 */
export class SK8PropertyInspector {
  private container: HTMLElement;
  private editor: SK8Editor;
  private currentActors: SK8Actor[] = [];
  private groups: Map<string, PropertyGroup> = new Map();
  private propertyDefinitions: PropertyDefinition[] = [];

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.container = container;
    this.initializePropertyDefinitions();
    this.initializeGroups();
    this.setupEventListeners();
    this.render();
  }

  /**
   * Initialize property definitions
   */
  private initializePropertyDefinitions(): void {
    this.propertyDefinitions = [
      // Appearance
      {
        name: 'fillColor',
        displayName: 'Fill Color',
        type: 'color',
        group: 'appearance',
      },
      {
        name: 'frameColor',
        displayName: 'Frame Color',
        type: 'color',
        group: 'appearance',
      },
      {
        name: 'opacity',
        displayName: 'Opacity',
        type: 'number',
        group: 'appearance',
        min: 0,
        max: 1,
        step: 0.1,
      },
      {
        name: 'visible',
        displayName: 'Visible',
        type: 'boolean',
        group: 'appearance',
      },

      // Layout
      {
        name: 'left',
        displayName: 'Left',
        type: 'number',
        group: 'layout',
      },
      {
        name: 'top',
        displayName: 'Top',
        type: 'number',
        group: 'layout',
      },
      {
        name: 'width',
        displayName: 'Width',
        type: 'number',
        group: 'layout',
        min: 0,
      },
      {
        name: 'height',
        displayName: 'Height',
        type: 'number',
        group: 'layout',
        min: 0,
      },

      // Transform
      {
        name: 'rotation',
        displayName: 'Rotation',
        type: 'number',
        group: 'transform',
        min: -180,
        max: 180,
      },

      // Behavior
      {
        name: 'draggable',
        displayName: 'Draggable',
        type: 'boolean',
        group: 'behavior',
      },
      {
        name: 'droppable',
        displayName: 'Droppable',
        type: 'boolean',
        group: 'behavior',
      },

      // Identity
      {
        name: 'name',
        displayName: 'Name',
        type: 'string',
        group: 'identity',
      },
    ];
  }

  /**
   * Initialize property groups
   */
  private initializeGroups(): void {
    this.groups.set('identity', {
      name: 'identity',
      displayName: 'Identity',
      expanded: true,
    });
    this.groups.set('appearance', {
      name: 'appearance',
      displayName: 'Appearance',
      expanded: true,
    });
    this.groups.set('layout', {
      name: 'layout',
      displayName: 'Layout',
      expanded: true,
    });
    this.groups.set('transform', {
      name: 'transform',
      displayName: 'Transform',
      expanded: false,
    });
    this.groups.set('behavior', {
      name: 'behavior',
      displayName: 'Behavior',
      expanded: false,
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.editor.on('selection-change', (actors: SK8Actor[]) => {
      this.showProperties(actors);
    });
  }

  /**
   * Show properties for actors
   */
  showProperties(actors: SK8Actor[]): void {
    this.currentActors = actors;
    this.render();
  }

  /**
   * Render the property inspector
   */
  private render(): void {
    this.container.innerHTML = '';

    if (this.currentActors.length === 0) {
      this.renderNoSelection();
      return;
    }

    if (this.currentActors.length === 1) {
      this.renderSingleSelection();
    } else {
      this.renderMultiSelection();
    }
  }

  /**
   * Render no selection message
   */
  private renderNoSelection(): void {
    const message = document.createElement('div');
    message.className = 'sk8-inspector-empty';
    message.textContent = 'No selection';
    this.container.appendChild(message);
  }

  /**
   * Render single selection properties
   */
  private renderSingleSelection(): void {
    const actor = this.currentActors[0];

    // Actor type header
    const header = document.createElement('div');
    header.className = 'sk8-inspector-header';
    header.textContent = actor.constructor.name;
    this.container.appendChild(header);

    // Render groups
    for (const group of this.groups.values()) {
      this.renderGroup(group, actor);
    }
  }

  /**
   * Render multi-selection properties (common properties only)
   */
  private renderMultiSelection(): void {
    // Multi-selection header
    const header = document.createElement('div');
    header.className = 'sk8-inspector-header';
    header.textContent = `${this.currentActors.length} actors selected`;
    this.container.appendChild(header);

    // Show common properties
    for (const group of this.groups.values()) {
      this.renderGroup(group, this.currentActors[0], true);
    }
  }

  /**
   * Render a property group
   */
  private renderGroup(
    group: PropertyGroup,
    actor: SK8Actor,
    multiSelect = false
  ): void {
    const groupEl = document.createElement('div');
    groupEl.className = 'sk8-inspector-group';

    // Group header
    const headerEl = document.createElement('div');
    headerEl.className = 'sk8-inspector-group-header';
    headerEl.textContent = group.displayName;
    headerEl.onclick = () => {
      group.expanded = !group.expanded;
      this.render();
    };
    groupEl.appendChild(headerEl);

    // Group content
    if (group.expanded) {
      const contentEl = document.createElement('div');
      contentEl.className = 'sk8-inspector-group-content';

      // Filter properties for this group
      const groupProps = this.propertyDefinitions.filter((p) => p.group === group.name);

      for (const propDef of groupProps) {
        // Check if property exists on actor
        if (!this.hasProperty(actor, propDef.name)) continue;

        const propEl = this.renderProperty(propDef, actor, multiSelect);
        if (propEl) {
          contentEl.appendChild(propEl);
        }
      }

      groupEl.appendChild(contentEl);
    }

    this.container.appendChild(groupEl);
  }

  /**
   * Check if actor has a property
   */
  private hasProperty(actor: SK8Actor, propertyName: string): boolean {
    try {
      // Try to get the property
      if (propertyName === 'width') {
        actor.getWidth();
        return true;
      } else if (propertyName === 'height') {
        actor.getHeight();
        return true;
      } else if (propertyName === 'left') {
        actor.getLeft();
        return true;
      } else if (propertyName === 'top') {
        actor.getTop();
        return true;
      } else if (propertyName === 'rotation') {
        actor.getRotation();
        return true;
      }
      actor.get(propertyName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get property value from actor
   */
  private getPropertyValue(actor: SK8Actor, propertyName: string): PropertyValue {
    // Handle special properties with direct getters
    if (propertyName === 'width') return actor.getWidth();
    if (propertyName === 'height') return actor.getHeight();
    if (propertyName === 'left') return actor.getLeft();
    if (propertyName === 'top') return actor.getTop();
    if (propertyName === 'rotation') return actor.getRotation();

    return actor.get(propertyName);
  }

  /**
   * Set property value on actor (not used directly, commands are used instead)
   */
  // private setPropertyValue(
  //   actor: SK8Actor,
  //   propertyName: string,
  //   value: PropertyValue
  // ): void {
  //   // Handle special properties with direct setters
  //   if (propertyName === 'width') {
  //     actor.setWidth(value as number);
  //   } else if (propertyName === 'height') {
  //     actor.setHeight(value as number);
  //   } else if (propertyName === 'left') {
  //     actor.setLeft(value as number);
  //   } else if (propertyName === 'top') {
  //     actor.setTop(value as number);
  //   } else if (propertyName === 'rotation') {
  //     actor.rotate(value as number);
  //   } else {
  //     actor.set(propertyName, value);
  //   }
  // }

  /**
   * Render a property field
   */
  private renderProperty(
    propDef: PropertyDefinition,
    actor: SK8Actor,
    multiSelect = false
  ): HTMLElement | null {
    const rowEl = document.createElement('div');
    rowEl.className = 'sk8-inspector-property';

    // Label
    const labelEl = document.createElement('label');
    labelEl.className = 'sk8-inspector-property-label';
    labelEl.textContent = propDef.displayName;
    rowEl.appendChild(labelEl);

    // Value editor
    const value = this.getPropertyValue(actor, propDef.name);
    const editorEl = this.createPropertyEditor(propDef, value, multiSelect);

    if (editorEl) {
      rowEl.appendChild(editorEl);
    }

    return rowEl;
  }

  /**
   * Create property editor based on type
   */
  private createPropertyEditor(
    propDef: PropertyDefinition,
    value: PropertyValue,
    multiSelect = false
  ): HTMLElement | null {
    switch (propDef.type) {
      case 'string':
        return this.createStringEditor(propDef, value as string, multiSelect);
      case 'number':
        return this.createNumberEditor(propDef, value as number, multiSelect);
      case 'boolean':
        return this.createBooleanEditor(propDef, value as boolean, multiSelect);
      case 'color':
        return this.createColorEditor(propDef, value as Color, multiSelect);
      case 'enum':
        return this.createEnumEditor(propDef, value as string, multiSelect);
      default:
        return null;
    }
  }

  /**
   * Create string editor
   */
  private createStringEditor(
    propDef: PropertyDefinition,
    value: string,
    multiSelect: boolean
  ): HTMLElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sk8-inspector-input';
    input.value = value || '';
    input.disabled = propDef.readonly || false;

    if (!propDef.readonly) {
      input.addEventListener('change', () => {
        this.updateProperty(propDef.name, input.value, multiSelect);
      });
    }

    return input;
  }

  /**
   * Create number editor
   */
  private createNumberEditor(
    propDef: PropertyDefinition,
    value: number,
    multiSelect: boolean
  ): HTMLElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'sk8-inspector-input';
    input.value = value?.toString() || '0';
    input.disabled = propDef.readonly || false;

    if (propDef.min !== undefined) input.min = propDef.min.toString();
    if (propDef.max !== undefined) input.max = propDef.max.toString();
    if (propDef.step !== undefined) input.step = propDef.step.toString();

    if (!propDef.readonly) {
      input.addEventListener('change', () => {
        const numValue = parseFloat(input.value);
        this.updateProperty(propDef.name, numValue, multiSelect);
      });
    }

    return input;
  }

  /**
   * Create boolean editor
   */
  private createBooleanEditor(
    propDef: PropertyDefinition,
    value: boolean,
    multiSelect: boolean
  ): HTMLElement {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sk8-inspector-checkbox';
    checkbox.checked = value || false;
    checkbox.disabled = propDef.readonly || false;

    if (!propDef.readonly) {
      checkbox.addEventListener('change', () => {
        this.updateProperty(propDef.name, checkbox.checked, multiSelect);
      });
    }

    return checkbox;
  }

  /**
   * Create color editor
   */
  private createColorEditor(
    propDef: PropertyDefinition,
    value: Color,
    multiSelect: boolean
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sk8-inspector-color-editor';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'sk8-inspector-color-input';
    colorInput.disabled = propDef.readonly || false;

    if (value) {
      colorInput.value = ColorUtils.toHex(value);
    }

    if (!propDef.readonly) {
      colorInput.addEventListener('change', () => {
        const color = ColorUtils.fromHex(colorInput.value);
        this.updateProperty(propDef.name, color, multiSelect);
      });
    }

    container.appendChild(colorInput);

    return container;
  }

  /**
   * Create enum editor
   */
  private createEnumEditor(
    propDef: PropertyDefinition,
    value: string,
    multiSelect: boolean
  ): HTMLElement {
    const select = document.createElement('select');
    select.className = 'sk8-inspector-select';
    select.disabled = propDef.readonly || false;

    if (propDef.options) {
      for (const option of propDef.options) {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        optionEl.selected = option === value;
        select.appendChild(optionEl);
      }
    }

    if (!propDef.readonly) {
      select.addEventListener('change', () => {
        this.updateProperty(propDef.name, select.value, multiSelect);
      });
    }

    return select;
  }

  /**
   * Update property value
   */
  private updateProperty(
    propertyName: string,
    value: PropertyValue,
    multiSelect: boolean
  ): void {
    if (multiSelect) {
      // Update all selected actors
      for (const actor of this.currentActors) {
        const command = new SetPropertyCommand(actor, propertyName, value);
        this.editor.executeCommand(command);
      }
    } else {
      // Update single actor
      const actor = this.currentActors[0];
      const command = new SetPropertyCommand(actor, propertyName, value);
      this.editor.executeCommand(command);
    }
  }

  /**
   * Add custom property definition
   */
  addPropertyDefinition(propDef: PropertyDefinition): void {
    this.propertyDefinitions.push(propDef);
    this.render();
  }

  /**
   * Remove property definition
   */
  removePropertyDefinition(propertyName: string): void {
    this.propertyDefinitions = this.propertyDefinitions.filter(
      (p) => p.name !== propertyName
    );
    this.render();
  }

  /**
   * Refresh the inspector
   */
  refresh(): void {
    this.render();
  }
}

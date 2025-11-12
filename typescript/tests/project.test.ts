/**
 * Tests for SK8 Project System
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  SK8Project,
  createProject,
  createProjectFromTemplate,
} from '../src/project/project.js';
import {
  serializeProject,
  serializeProjectToObject,
  validateSerializedProject,
} from '../src/project/serializer.js';
import {
  deserializeProject,
  validateProject,
} from '../src/project/deserializer.js';
import {
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
  hasAutoSave,
  clearAutoSave,
  getRecentProjects,
  clearRecentProjects,
  isLocalStorageAvailable,
} from '../src/project/file-io.js';
import { ProjectManager, createProjectManager } from '../src/project/project-manager.js';
import { SK8Stage } from '../src/graphics/SK8Stage.js';
import { SK8Rectangle, SK8Circle } from '../src/graphics/shapes.js';

describe('SK8Project', () => {
  describe('Project Creation', () => {
    it('should create a new project', () => {
      const project = createProject('Test Project', '1.0.0');

      expect(project).toBeDefined();
      expect(project.getName()).toBe('Test Project');
      expect(project.getVersion()).toBe('1.0.0');
    });

    it('should create project with metadata', () => {
      const project = createProject('Test Project');
      const metadata = project.getMetadata();

      expect(metadata.name).toBe('Test Project');
      expect(metadata.version).toBeDefined();
      expect(metadata.created).toBeDefined();
      expect(metadata.modified).toBeDefined();
      expect(metadata.sk8Version).toBe('0.3.0');
    });

    it('should create project from template', () => {
      const empty = createProjectFromTemplate('empty');
      expect(empty.getName()).toBe('Untitled Project');

      const basic = createProjectFromTemplate('basic');
      expect(basic.getName()).toBe('Basic Project');

      const demo = createProjectFromTemplate('demo');
      expect(demo.getName()).toBe('Demo Project');
    });
  });

  describe('Project Metadata', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should set and get metadata', () => {
      project.setMetadata('author', 'Test Author');
      const metadata = project.getMetadata();

      expect(metadata.author).toBe('Test Author');
    });

    it('should update multiple metadata fields', () => {
      project.updateMetadata({
        author: 'Test Author',
        description: 'A test project',
      });

      const metadata = project.getMetadata();
      expect(metadata.author).toBe('Test Author');
      expect(metadata.description).toBe('A test project');
    });

    it('should update modified timestamp on changes', () => {
      const originalModified = project.getMetadata().modified;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        project.setName('New Name');
        const newModified = project.getMetadata().modified;
        expect(newModified).not.toBe(originalModified);
      }, 10);
    });
  });

  describe('Stage Management', () => {
    let project: SK8Project;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
      project = createProject('Test Project');
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    });

    it('should add a stage to project', () => {
      const stage = new SK8Stage(canvas, 'MainStage');
      project.addStage('stage1', stage, 'Main Stage');

      expect(project.getStageIds()).toContain('stage1');
      const stageDef = project.getStage('stage1');
      expect(stageDef).toBeDefined();
      expect(stageDef?.name).toBe('Main Stage');
    });

    it('should remove a stage from project', () => {
      const stage = new SK8Stage(canvas, 'MainStage');
      project.addStage('stage1', stage);

      project.removeStage('stage1');
      expect(project.getStageIds()).not.toContain('stage1');
    });

    it('should get all stages', () => {
      const stage1 = new SK8Stage(canvas, 'Stage1');
      const stage2 = new SK8Stage(canvas, 'Stage2');

      project.addStage('stage1', stage1);
      project.addStage('stage2', stage2);

      const stages = project.getStages();
      expect(stages.length).toBe(2);
    });
  });

  describe('Actor Management', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should add actors to project', () => {
      const rect = new SK8Rectangle();
      rect.setName('TestRect');

      project.addActor('rect1', rect);

      expect(project.getActorIds()).toContain('rect1');
      expect(project.getActor('rect1')).toBe(rect);
    });

    it('should remove actors from project', () => {
      const rect = new SK8Rectangle();
      project.addActor('rect1', rect);

      project.removeActor('rect1');
      expect(project.getActorIds()).not.toContain('rect1');
    });

    it('should get all actors', () => {
      const rect = new SK8Rectangle();
      const circle = new SK8Circle();

      project.addActor('rect1', rect);
      project.addActor('circle1', circle);

      const actors = project.getActors();
      expect(actors.size).toBe(2);
    });
  });

  describe('Asset Management', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should add assets to project', () => {
      const asset = {
        id: 'img1',
        type: 'image',
        name: 'test.png',
        url: 'data:image/png;base64,iVBORw0KGgo=',
      };

      project.addAsset(asset);

      expect(project.getAsset('img1')).toEqual(asset);
    });

    it('should remove assets from project', () => {
      const asset = {
        id: 'img1',
        type: 'image',
        name: 'test.png',
        url: 'data:image/png;base64,iVBORw0KGgo=',
      };

      project.addAsset(asset);
      project.removeAsset('img1');

      expect(project.getAsset('img1')).toBeUndefined();
    });
  });

  describe('Script Management', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should add scripts to project', () => {
      const script = {
        objectId: 'rect1',
        handlerName: 'onClick',
        source: 'function onClick() { console.log("clicked"); }',
      };

      project.addScript(script);

      const scripts = project.getScripts('rect1');
      expect(scripts.length).toBe(1);
      expect(scripts[0]).toEqual(script);
    });

    it('should remove scripts for an object', () => {
      const script = {
        objectId: 'rect1',
        handlerName: 'onClick',
        source: 'function onClick() { console.log("clicked"); }',
      };

      project.addScript(script);
      project.removeScripts('rect1');

      expect(project.getScripts('rect1').length).toBe(0);
    });
  });

  describe('Dirty State', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should track dirty state', () => {
      expect(project.isDirtyState()).toBe(false);

      project.markDirty();
      expect(project.isDirtyState()).toBe(true);

      project.markClean();
      expect(project.isDirtyState()).toBe(false);
    });

    it('should mark dirty on changes', () => {
      project.markClean();
      project.setName('New Name');
      expect(project.isDirtyState()).toBe(true);
    });
  });

  describe('Project Statistics', () => {
    let project: SK8Project;

    beforeEach(() => {
      project = createProject('Test Project');
    });

    it('should return project statistics', () => {
      const rect = new SK8Rectangle();
      project.addActor('rect1', rect);

      const asset = {
        id: 'img1',
        type: 'image',
        name: 'test.png',
        url: 'data:image/png;base64,iVBORw0KGgo=',
      };
      project.addAsset(asset);

      const stats = project.getStats();
      expect(stats.actorCount).toBe(1);
      expect(stats.assetCount).toBe(1);
    });
  });
});

describe('Project Serialization', () => {
  let project: SK8Project;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    project = createProject('Test Project', '1.0.0');
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  it('should serialize empty project', () => {
    const json = serializeProject(project);
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');

    const parsed = JSON.parse(json);
    expect(parsed.metadata.name).toBe('Test Project');
    expect(parsed.formatVersion).toBe('1.0.0');
  });

  it('should serialize project with actors', () => {
    const rect = new SK8Rectangle();
    rect.setName('TestRect');
    rect.setBoundsRect({ left: 10, top: 20, right: 110, bottom: 120 });
    rect.setFillColor({ r: 255, g: 0, b: 0, a: 1 });

    project.addActor('rect1', rect);

    const serialized = serializeProjectToObject(project);
    expect(serialized.actors.length).toBe(1);
    expect(serialized.actors[0].name).toBe('TestRect');
    expect(serialized.actors[0].className).toBe('SK8Rectangle');
  });

  it('should serialize project with stage', () => {
    const stage = new SK8Stage(canvas, 'MainStage');
    const rect = new SK8Rectangle();
    stage.addActor(rect);

    project.addStage('stage1', stage, 'Main Stage');

    const serialized = serializeProjectToObject(project);
    expect(serialized.stages.length).toBe(1);
    expect(serialized.stages[0].name).toBe('Main Stage');
  });

  it('should pretty print JSON', () => {
    const json = serializeProject(project, { prettyPrint: true });
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });

  it('should validate serialized project', () => {
    const serialized = serializeProjectToObject(project);
    expect(validateSerializedProject(serialized)).toBe(true);
  });

  it('should reject invalid project structure', () => {
    const invalid = { invalid: 'data' };
    expect(validateSerializedProject(invalid)).toBe(false);
  });
});

describe('Project Deserialization', () => {
  let project: SK8Project;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    project = createProject('Test Project', '1.0.0');
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  it('should deserialize empty project', () => {
    const json = serializeProject(project);
    const restored = deserializeProject(json);

    expect(restored.getName()).toBe('Test Project');
    expect(restored.getVersion()).toBe('1.0.0');
  });

  it('should deserialize project with actors', () => {
    const rect = new SK8Rectangle();
    rect.setName('TestRect');
    rect.setBoundsRect({ left: 10, top: 20, right: 110, bottom: 120 });

    project.addActor('rect1', rect);

    const json = serializeProject(project);
    const restored = deserializeProject(json);

    expect(restored.getActorIds()).toContain('rect1');
    const restoredRect = restored.getActor('rect1');
    expect(restoredRect?.getName()).toBe('TestRect');
  });

  it('should handle serialization round-trip', () => {
    // Add various elements
    const rect = new SK8Rectangle();
    rect.setName('Rect1');
    project.addActor('rect1', rect);

    const circle = new SK8Circle();
    circle.setName('Circle1');
    project.addActor('circle1', circle);

    // Serialize and deserialize
    const json = serializeProject(project);
    const restored = deserializeProject(json);

    // Verify
    expect(restored.getName()).toBe(project.getName());
    expect(restored.getActorIds().length).toBe(2);
  });

  it('should validate deserialized project', () => {
    const json = serializeProject(project);
    const restored = deserializeProject(json);

    expect(validateProject(restored)).toBe(true);
  });

  it('should handle corrupted JSON gracefully', () => {
    const corrupted = '{ invalid json }';

    expect(() => {
      deserializeProject(corrupted);
    }).toThrow();
  });
});

describe('File I/O', () => {
  let project: SK8Project;

  beforeEach(() => {
    project = createProject('Test Project');
    // Clear localStorage before each test
    if (isLocalStorageAvailable()) {
      localStorage.clear();
      clearRecentProjects();
      clearAutoSave();
    }
  });

  afterEach(() => {
    if (isLocalStorageAvailable()) {
      localStorage.clear();
    }
  });

  it('should save and load from localStorage', () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, skipping test');
      return;
    }

    const key = 'test_project';
    saveProjectToLocalStorage(project, key);

    const loaded = loadProjectFromLocalStorage(key);
    expect(loaded.getName()).toBe('Test Project');
  });

  it('should check for auto-save', () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, skipping test');
      return;
    }

    expect(hasAutoSave()).toBe(false);

    saveProjectToLocalStorage(project, 'sk8_autosave');
    expect(hasAutoSave()).toBe(true);
  });

  it('should track recent projects', () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, skipping test');
      return;
    }

    const recent = getRecentProjects();
    expect(Array.isArray(recent)).toBe(true);
  });
});

describe('Project Manager', () => {
  let manager: ProjectManager;

  beforeEach(() => {
    manager = createProjectManager({ warnOnUnsaved: false });
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should create project manager', () => {
    expect(manager).toBeDefined();
  });

  it('should manage current project', () => {
    expect(manager.getCurrentProject()).toBeNull();

    manager.newProject('Test Project');
    expect(manager.getCurrentProject()).not.toBeNull();
  });

  it('should track dirty state', () => {
    manager.newProject('Test Project');

    expect(manager.isDirty()).toBe(false);

    manager.markDirty();
    expect(manager.isDirty()).toBe(true);

    manager.markClean();
    expect(manager.isDirty()).toBe(false);
  });

  it('should notify on project change', (done) => {
    const unsubscribe = manager.onProjectChange((_project) => {
      expect(_project?.getName()).toBe('Test Project');
      unsubscribe();
      done();
    });

    manager.newProject('Test Project');
  });

  it('should notify on dirty state change', (done) => {
    manager.newProject('Test Project');

    const unsubscribe = manager.onDirtyStateChange((isDirty) => {
      expect(isDirty).toBe(true);
      unsubscribe();
      done();
    });

    manager.markDirty();
  });

  it('should close project', () => {
    manager.newProject('Test Project');
    expect(manager.getCurrentProject()).not.toBeNull();

    manager.closeProject();
    expect(manager.getCurrentProject()).toBeNull();
  });

  it('should clone project', () => {
    const original = manager.newProject('Original Project');
    const cloned = manager.cloneProject('Cloned Project');

    expect(cloned.getName()).toBe('Cloned Project');
    expect(cloned).not.toBe(original);
  });

  it('should create project from template', () => {
    const project = manager.newProjectFromTemplate('basic');
    expect(project.getName()).toBe('Basic Project');
  });
});

describe('Complex Project Scenarios', () => {
  it('should handle complex project with many actors', () => {
    const project = createProject('Complex Project');

    // Add 100 actors
    for (let i = 0; i < 100; i++) {
      const rect = new SK8Rectangle();
      rect.setName(`Rect${i}`);
      rect.setBoundsRect({ left: i * 10, top: i * 10, right: i * 10 + 50, bottom: i * 10 + 50 });
      project.addActor(`rect${i}`, rect);
    }

    // Serialize and deserialize
    const json = serializeProject(project);
    const restored = deserializeProject(json);

    expect(restored.getActorIds().length).toBe(100);
  });

  it('should handle project with multiple stages', () => {
    const project = createProject('Multi-Stage Project');

    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      const stage = new SK8Stage(canvas, `Stage${i}`);
      project.addStage(`stage${i}`, stage, `Stage ${i}`);
    }

    const json = serializeProject(project);
    const restored = deserializeProject(json);

    expect(restored.getStageIds().length).toBe(5);
  });

  it('should preserve actor properties through serialization', () => {
    const project = createProject('Property Test');

    const rect = new SK8Rectangle();
    rect.setName('PropertyRect');
    rect.setBoundsRect({ left: 10, top: 20, right: 110, bottom: 120 });
    rect.setFillColor({ r: 255, g: 0, b: 0, a: 1 });
    rect.setFrameColor({ r: 0, g: 0, b: 255, a: 1 });
    rect.setVisible(true);

    // Set custom properties
    rect.set('customProp', 'customValue');

    project.addActor('rect1', rect);

    const json = serializeProject(project);
    const restored = deserializeProject(json);

    const restoredRect = restored.getActor('rect1');
    expect(restoredRect?.get('customProp')).toBe('customValue');
  });
});

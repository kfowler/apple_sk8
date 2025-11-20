/**
 * Project Integration Tests
 * Tests saving, loading, and project integrity across all subsystems
 */

import { Project } from '../../src/project/project';
import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle, Oval } from '../../src/graphics/shapes';
import { Timeline } from '../../src/editor/timeline/timeline-model';
import { createMockCanvas, createTestActor } from '../utils/test-helpers';
import { SAMPLE_PROJECT } from '../utils/test-assets';

describe('Project Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let project: Project;

  beforeEach(() => {
    canvas = createMockCanvas();
    stage = new SK8Stage(canvas);
    project = new Project();
  });

  describe('Save and Load', () => {
    it('should save project with all actors', async () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setFillColor('#ff0000');
      rect.setProperty('objectName', 'MyRect');

      const oval = new Oval();
      oval.setBounds({ left: 300, top: 200, width: 150, height: 100 });
      oval.setFillColor('#00ff00');
      oval.setProperty('objectName', 'MyOval');

      stage.addActor(rect);
      stage.addActor(oval);

      const saved = await project.save(stage);

      expect(saved).toBeDefined();
      expect(saved.actors).toHaveLength(2);
      expect(saved.version).toBeDefined();
    });

    it('should load project and restore actors', async () => {
      const projectData = {
        version: '0.2.0',
        name: 'Test Project',
        actors: [
          {
            type: 'Rectangle',
            objectName: 'Rect1',
            bounds: { left: 100, top: 100, width: 200, height: 150 },
            fillColor: '#ff0000',
            strokeColor: '#000000',
            strokeWidth: 2,
          },
          {
            type: 'Oval',
            objectName: 'Oval1',
            bounds: { left: 300, top: 200, width: 150, height: 100 },
            fillColor: '#00ff00',
          },
        ],
        assets: [],
        scripts: [],
      };

      await project.load(projectData, stage);

      const actors = stage.getActors();
      expect(actors).toHaveLength(2);

      const rect = actors.find((a) => a.getProperty('objectName') === 'Rect1');
      expect(rect).toBeDefined();
      expect(rect?.getLeft()).toBe(100);
      expect(rect?.getFillColor()).toBe('#ff0000');

      const oval = actors.find((a) => a.getProperty('objectName') === 'Oval1');
      expect(oval).toBeDefined();
      expect(oval?.getLeft()).toBe(300);
    });

    it('should preserve actor hierarchy', async () => {
      const container = new Rectangle();
      container.setProperty('objectName', 'Container');

      const child1 = new Rectangle();
      child1.setProperty('objectName', 'Child1');
      child1.setProperty('parent', container);

      const child2 = new Oval();
      child2.setProperty('objectName', 'Child2');
      child2.setProperty('parent', container);

      stage.addActor(container);
      stage.addActor(child1);
      stage.addActor(child2);

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restoredContainer = stage.getActors().find(
        (a) => a.getProperty('objectName') === 'Container'
      );
      const restoredChild1 = stage.getActors().find(
        (a) => a.getProperty('objectName') === 'Child1'
      );
      const restoredChild2 = stage.getActors().find(
        (a) => a.getProperty('objectName') === 'Child2'
      );

      expect(restoredChild1?.getProperty('parent')).toBe(restoredContainer);
      expect(restoredChild2?.getProperty('parent')).toBe(restoredContainer);
    });

    it('should preserve custom properties', async () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'CustomRect');
      rect.setProperty('customData', { foo: 'bar', baz: 123 });
      rect.setProperty('userData', 'some user data');

      stage.addActor(rect);

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      expect(restored.getProperty('customData')).toEqual({ foo: 'bar', baz: 123 });
      expect(restored.getProperty('userData')).toBe('some user data');
    });
  });

  describe('Asset Management', () => {
    it('should save and restore asset references', async () => {
      // This would test image/video/audio asset references
      // For now, test the structure

      const projectData = {
        version: '0.2.0',
        name: 'Test Project',
        actors: [],
        assets: [
          {
            id: 'img1',
            type: 'image',
            name: 'test.png',
            url: 'data:image/png;base64,iVBORw0KGg...',
          },
        ],
        scripts: [],
      };

      await project.load(projectData, stage);

      const savedAgain = await project.save(stage);
      expect(savedAgain.assets).toHaveLength(1);
      expect(savedAgain.assets[0].id).toBe('img1');
    });

    it('should handle missing assets gracefully', async () => {
      const projectData = {
        version: '0.2.0',
        name: 'Test Project',
        actors: [
          {
            type: 'Picture',
            objectName: 'Pic1',
            imageAssetId: 'missing-asset',
            bounds: { left: 0, top: 0, width: 100, height: 100 },
          },
        ],
        assets: [],
        scripts: [],
      };

      // Should not throw, should create actor with missing asset
      await expect(project.load(projectData, stage)).resolves.not.toThrow();
    });
  });

  describe('Animation Preservation', () => {
    it('should save and restore animations', async () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'AnimatedRect');
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 500, easing: 'linear' });

      rect.setProperty('animation', timeline.export());

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      const restoredAnimation = restored.getProperty('animation');

      expect(restoredAnimation).toBeDefined();
      expect(restoredAnimation.keyframes).toBeDefined();
      expect(restoredAnimation.duration).toBe(1000);
    });

    it('should restore animation timelines correctly', async () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'easeInOut' });
      timeline.addKeyframe({ time: 500, property: 'left', value: 250, easing: 'easeInOut' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 500, easing: 'easeInOut' });

      rect.setProperty('animation', timeline.export());

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      const restoredTimeline = new Timeline(restored);
      restoredTimeline.import(restored.getProperty('animation'));

      restoredTimeline.play();
      restoredTimeline.setTime(500);

      expect(restored.getLeft()).toBeCloseTo(250, 0);
    });
  });

  describe('Event Handler Preservation', () => {
    it('should save and restore event handlers', async () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'InteractiveRect');

      const clickHandler = 'function onClick() { this.fillColor = "#ff0000"; }';
      rect.setProperty('onClick', clickHandler);

      stage.addActor(rect);

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      expect(restored.getProperty('onClick')).toBe(clickHandler);
    });

    it('should restore multiple event handlers', async () => {
      const rect = new Rectangle();

      rect.setProperty('onClick', 'function onClick() { /* click */ }');
      rect.setProperty('onMouseEnter', 'function onMouseEnter() { /* enter */ }');
      rect.setProperty('onMouseLeave', 'function onMouseLeave() { /* leave */ }');

      stage.addActor(rect);

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      expect(restored.getProperty('onClick')).toBeDefined();
      expect(restored.getProperty('onMouseEnter')).toBeDefined();
      expect(restored.getProperty('onMouseLeave')).toBeDefined();
    });
  });

  describe('Project Metadata', () => {
    it('should save project metadata', async () => {
      project.setName('My SK8 Project');
      project.setAuthor('Test User');
      project.setDescription('A test project');
      project.setVersion('1.0.0');

      const saved = await project.save(stage);

      expect(saved.name).toBe('My SK8 Project');
      expect(saved.author).toBe('Test User');
      expect(saved.description).toBe('A test project');
      expect(saved.projectVersion).toBe('1.0.0');
    });

    it('should preserve modification timestamps', async () => {
      const saved1 = await project.save(stage);
      const timestamp1 = saved1.modified;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const saved2 = await project.save(stage);
      const timestamp2 = saved2.modified;

      expect(timestamp2).toBeGreaterThan(timestamp1);
    });
  });

  describe('Project Validation', () => {
    it('should validate project before loading', async () => {
      const invalidProject = {
        // Missing version
        name: 'Invalid',
        actors: [],
      };

      await expect(project.load(invalidProject as any, stage)).rejects.toThrow();
    });

    it('should validate actor types', async () => {
      const projectWithInvalidActor = {
        version: '0.2.0',
        name: 'Test',
        actors: [
          {
            type: 'NonExistentActorType',
            bounds: { left: 0, top: 0, width: 100, height: 100 },
          },
        ],
        assets: [],
        scripts: [],
      };

      await expect(
        project.load(projectWithInvalidActor, stage)
      ).rejects.toThrow();
    });

    it('should handle version mismatches gracefully', async () => {
      const oldVersionProject = {
        version: '0.1.0',
        name: 'Old Project',
        actors: [],
        assets: [],
        scripts: [],
      };

      // Should either convert or warn, but not crash
      await expect(project.load(oldVersionProject, stage)).resolves.not.toThrow();
    });
  });

  describe('Large Projects', () => {
    it('should handle projects with many actors', async () => {
      const actorCount = 100;
      for (let i = 0; i < actorCount; i++) {
        const rect = new Rectangle();
        rect.setBounds({
          left: (i % 10) * 80,
          top: Math.floor(i / 10) * 80,
          width: 70,
          height: 70,
        });
        rect.setProperty('objectName', `Rect${i}`);
        stage.addActor(rect);
      }

      const startTime = performance.now();
      const saved = await project.save(stage);
      const saveTime = performance.now() - startTime;

      expect(saved.actors).toHaveLength(actorCount);
      expect(saveTime).toBeLessThan(1000); // Should save in < 1 second

      stage.removeAllActors();

      const loadStartTime = performance.now();
      await project.load(saved, stage);
      const loadTime = performance.now() - loadStartTime;

      expect(stage.getActors()).toHaveLength(actorCount);
      expect(loadTime).toBeLessThan(1000); // Should load in < 1 second
    });

    it('should handle deeply nested hierarchies', async () => {
      let parent = null;
      const depth = 20;

      for (let i = 0; i < depth; i++) {
        const rect = new Rectangle();
        rect.setProperty('objectName', `Level${i}`);
        rect.setBounds({ left: i * 10, top: i * 10, width: 50, height: 50 });

        if (parent) {
          rect.setProperty('parent', parent);
        }

        stage.addActor(rect);
        parent = rect;
      }

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      expect(stage.getActors()).toHaveLength(depth);

      // Verify hierarchy is preserved
      const level10 = stage.getActors().find((a) => a.getProperty('objectName') === 'Level10');
      const level9 = stage.getActors().find((a) => a.getProperty('objectName') === 'Level9');

      expect(level10?.getProperty('parent')).toBe(level9);
    });
  });

  describe('Project Integrity', () => {
    it('should maintain actor IDs across save/load', async () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'TestRect');
      stage.addActor(rect);

      const originalId = rect.getId?.() || rect.getProperty('id');

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restored = stage.getActors()[0];
      const restoredId = restored.getId?.() || restored.getProperty('id');

      expect(restoredId).toBe(originalId);
    });

    it('should preserve actor references between actors', async () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();

      rect1.setProperty('objectName', 'Rect1');
      rect2.setProperty('objectName', 'Rect2');
      rect2.setProperty('linkedTo', rect1);

      stage.addActor(rect1);
      stage.addActor(rect2);

      const saved = await project.save(stage);
      stage.removeAllActors();
      await project.load(saved, stage);

      const restoredRect1 = stage.getActors().find(
        (a) => a.getProperty('objectName') === 'Rect1'
      );
      const restoredRect2 = stage.getActors().find(
        (a) => a.getProperty('objectName') === 'Rect2'
      );

      expect(restoredRect2?.getProperty('linkedTo')).toBe(restoredRect1);
    });

    it('should detect and repair circular references', async () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();

      rect1.setProperty('objectName', 'Rect1');
      rect2.setProperty('objectName', 'Rect2');

      // Create circular reference
      rect1.setProperty('linkedTo', rect2);
      rect2.setProperty('linkedTo', rect1);

      stage.addActor(rect1);
      stage.addActor(rect2);

      // Should handle circular reference gracefully
      await expect(project.save(stage)).resolves.not.toThrow();
    });
  });

  describe('Incremental Save', () => {
    it('should support incremental/auto-save', async () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      project.enableAutoSave(1000); // Auto-save every second

      const rect2 = new Rectangle();
      stage.addActor(rect2);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const lastSave = project.getLastAutoSave();
      expect(lastSave).toBeDefined();
      expect(lastSave.actors).toHaveLength(2);

      project.disableAutoSave();
    });

    it('should track unsaved changes', async () => {
      const saved = await project.save(stage);

      expect(project.hasUnsavedChanges()).toBe(false);

      const rect = new Rectangle();
      stage.addActor(rect);

      expect(project.hasUnsavedChanges()).toBe(true);

      await project.save(stage);

      expect(project.hasUnsavedChanges()).toBe(false);
    });
  });
});

/**
 * SK8 Project System Showcase
 *
 * This example demonstrates the complete project persistence workflow:
 * 1. Create a project
 * 2. Add stages and actors
 * 3. Serialize to JSON
 * 4. Save to file
 * 5. Load from file
 * 6. Deserialize back to project
 */

import {
  createProject,
  SK8Stage,
  SK8Rectangle,
  SK8Circle,
  SK8Button,
  serializeProject,
  deserializeProject,
  saveProjectToFile,
  getProjectManager,
  enableAutoSave,
  type SK8Project,
} from '../src/sk8.js';

/**
 * Example 1: Create and serialize a simple project
 */
function example1_CreateAndSerialize(): string {
  console.log('=== Example 1: Create and Serialize ===\n');

  // Create a new project
  const project = createProject('My First SK8 Project', '1.0.0');
  project.setMetadata('author', 'SK8 Developer');
  project.setMetadata('description', 'A simple SK8 project with shapes');

  // Create a canvas and stage
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const stage = new SK8Stage(canvas, 'MainStage');

  // Create some actors
  const rect = new SK8Rectangle();
  rect.setName('RedRectangle');
  rect.setBoundsRect({ left: 100, top: 100, right: 200, bottom: 200 });
  rect.setFillColor({ r: 255, g: 0, b: 0, a: 1 });
  stage.addActor(rect);
  project.addActor('rect1', rect);

  const circle = new SK8Circle();
  circle.setName('BlueCircle');
  circle.setBoundsRect({ left: 300, top: 150, right: 400, bottom: 250 });
  circle.setFillColor({ r: 0, g: 0, b: 255, a: 1 });
  stage.addActor(circle);
  project.addActor('circle1', circle);

  // Add stage to project
  project.addStage('main', stage, 'Main Stage');

  // Serialize to JSON
  const json = serializeProject(project, { prettyPrint: true });

  console.log('Project created with:');
  console.log(`- Name: ${project.getName()}`);
  console.log(`- Stages: ${project.getStageIds().length}`);
  console.log(`- Actors: ${project.getActorIds().length}`);
  console.log(`\nSerialized JSON (first 500 chars):\n${json.substring(0, 500)}...\n`);

  return json;
}

/**
 * Example 2: Deserialize and verify
 */
function example2_DeserializeAndVerify(json: string): SK8Project {
  console.log('=== Example 2: Deserialize and Verify ===\n');

  // Deserialize from JSON
  const restored = deserializeProject(json);

  console.log('Project restored:');
  console.log(`- Name: ${restored.getName()}`);
  console.log(`- Version: ${restored.getVersion()}`);
  console.log(`- Stages: ${restored.getStageIds().length}`);
  console.log(`- Actors: ${restored.getActorIds().length}`);

  // Verify actors were restored
  const rect = restored.getActor('rect1');
  const circle = restored.getActor('circle1');

  console.log(`\nActor 1: ${rect?.getName()}`);
  console.log(`Actor 2: ${circle?.getName()}`);

  // Check stats
  const stats = restored.getStats();
  console.log(`\nProject Stats:`);
  console.log(`- Stages: ${stats.stageCount}`);
  console.log(`- Actors: ${stats.actorCount}`);
  console.log(`- Assets: ${stats.assetCount}`);
  console.log(`- Scripts: ${stats.scriptCount}\n`);

  return restored;
}

/**
 * Example 3: Use Project Manager
 */
function example3_ProjectManager(project: SK8Project): void {
  console.log('=== Example 3: Project Manager ===\n');

  const manager = getProjectManager();

  // Set current project
  manager.setCurrentProject(project);

  // Track dirty state
  let dirtyStateChanges = 0;
  manager.onDirtyStateChange((isDirty) => {
    dirtyStateChanges++;
    console.log(`Dirty state changed: ${isDirty ? 'UNSAVED' : 'CLEAN'}`);
  });

  // Make some changes
  console.log('Making changes to project...');
  manager.markDirty();

  // Check if dirty
  console.log(`Has unsaved changes: ${manager.isDirty()}`);

  // Save (would save to file in browser)
  console.log('Simulating save...');
  manager.markClean();

  console.log(`Has unsaved changes: ${manager.isDirty()}`);
  console.log(`Total dirty state changes: ${dirtyStateChanges}\n`);
}

/**
 * Example 4: Auto-save demonstration
 */
function example4_AutoSave(project: SK8Project): void {
  console.log('=== Example 4: Auto-Save ===\n');

  // Enable auto-save with 5 second interval
  console.log('Enabling auto-save (5 second interval)...');

  const cleanup = enableAutoSave(project, {
    enabled: true,
    interval: 5000,
    storageKey: 'sk8_demo_autosave',
  });

  console.log('Auto-save enabled!');
  console.log('In a real application, the project would be automatically saved');
  console.log('to localStorage every 5 seconds when there are unsaved changes.\n');

  // Clean up after demo
  cleanup();
  console.log('Auto-save cleanup complete.\n');
}

/**
 * Example 5: Complex project with scripts
 */
function example5_ComplexProject(): SK8Project {
  console.log('=== Example 5: Complex Project with Scripts ===\n');

  const project = createProject('Interactive Project', '2.0.0');
  project.setMetadata('description', 'A project with interactive elements and scripts');

  // Create canvas and stage
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const stage = new SK8Stage(canvas, 'InteractiveStage');

  // Create a button with a click handler
  const button = new SK8Button();
  button.setName('ClickMeButton');
  button.setBoundsRect({ left: 300, top: 250, right: 500, bottom: 300 });
  button.set('text', 'Click Me!');

  // Add a handler
  button.addHandler('click', function (x: number, y: number) {
    console.log(`Button clicked at (${x}, ${y})`);
  });

  stage.addActor(button);
  project.addActor('button1', button);

  // Add the stage
  project.addStage('main', stage, 'Interactive Stage');

  // Add a script to the project
  project.addScript({
    objectId: 'button1',
    handlerName: 'click',
    source: 'function(x, y) { console.log("Clicked at", x, y); }',
    parameters: ['x', 'y'],
  });

  // Add an asset
  project.addAsset({
    id: 'icon1',
    type: 'image',
    name: 'button-icon.png',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
  });

  console.log('Complex project created with:');
  console.log(`- Interactive button with click handler`);
  console.log(`- Script storage`);
  console.log(`- Asset management`);

  const stats = project.getStats();
  console.log(`\nProject Stats:`);
  console.log(`- Actors: ${stats.actorCount}`);
  console.log(`- Scripts: ${stats.scriptCount}`);
  console.log(`- Assets: ${stats.assetCount}\n`);

  return project;
}

/**
 * Example 6: Project cloning
 */
function example6_ProjectCloning(project: SK8Project): void {
  console.log('=== Example 6: Project Cloning ===\n');

  // Clone the project
  const cloned = project.clone('Cloned Project');

  console.log(`Original: ${project.getName()}`);
  console.log(`Clone: ${cloned.getName()}`);
  console.log(`\nClone has same content but different identity.`);
  console.log(`Original actors: ${project.getActorIds().length}`);
  console.log(`Cloned actors: ${cloned.getActorIds().length}\n`);
}

/**
 * Run all examples
 */
export function runShowcase(): void {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  SK8 Project System Showcase               ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Example 1: Create and serialize
    const json = example1_CreateAndSerialize();

    // Example 2: Deserialize
    const restored = example2_DeserializeAndVerify(json);

    // Example 3: Project Manager
    example3_ProjectManager(restored);

    // Example 4: Auto-save
    example4_AutoSave(restored);

    // Example 5: Complex project
    const complex = example5_ComplexProject();

    // Example 6: Cloning
    example6_ProjectCloning(complex);

    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Showcase Complete!                        ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('Error in showcase:', error);
  }
}

// Run if executed directly
if (typeof window !== 'undefined') {
  (window as any).runSK8Showcase = runShowcase;
  console.log('SK8 Project Showcase loaded!');
  console.log('Run: runSK8Showcase() to see the demonstration.');
}

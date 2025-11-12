/**
 * SK8 Project Manager
 *
 * Manages the current project state:
 * - Current project tracking
 * - Dirty state management
 * - Project lifecycle (new, open, save, close)
 * - Undo/redo support (future)
 * - Change notifications
 */

import { SK8Project, createProject, createProjectFromTemplate } from './project.js';
import {
  saveProjectToFile,
  saveProjectToLocalStorage,
  loadProjectFromFile,
  openProjectFromFilePicker,
  enableAutoSave,
  recoverProjectFromAutoSave,
  hasAutoSave,
  clearAutoSave,
  getRecentProjects,
  RecentProjectEntry,
  AutoSaveConfig,
  FileIOOptions,
} from './file-io.js';
import { DeserializationOptions } from './deserializer.js';

/**
 * Project change listener
 */
export type ProjectChangeListener = (project: SK8Project | null) => void;

/**
 * Dirty state change listener
 */
export type DirtyStateListener = (isDirty: boolean) => void;

/**
 * Project manager options
 */
export interface ProjectManagerOptions {
  /** Auto-save configuration */
  autoSave?: AutoSaveConfig;
  /** Warn before closing unsaved projects */
  warnOnUnsaved?: boolean;
  /** Maximum undo history */
  maxUndoHistory?: number;
}

/**
 * Project Manager - Singleton class
 */
export class ProjectManager {
  private static instance: ProjectManager | null = null;

  private currentProject: SK8Project | null = null;
  private projectListeners: Set<ProjectChangeListener> = new Set();
  private dirtyListeners: Set<DirtyStateListener> = new Set();
  private autoSaveCleanup: (() => void) | null = null;
  private options: ProjectManagerOptions;

  // Undo/redo support (future feature)
  private undoStack: any[] = [];
  private redoStack: any[] = [];

  private constructor(options: ProjectManagerOptions = {}) {
    this.options = {
      autoSave: { enabled: true, interval: 30000 },
      warnOnUnsaved: true,
      maxUndoHistory: 50,
      ...options,
    };

    // Set up beforeunload handler for unsaved changes warning
    if (this.options.warnOnUnsaved) {
      window.addEventListener('beforeunload', (e) => {
        if (this.currentProject?.isDirtyState()) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      });
    }
  }

  /**
   * Get the singleton instance
   */
  static getInstance(options?: ProjectManagerOptions): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager(options);
    }
    return ProjectManager.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    ProjectManager.instance = null;
  }

  /**
   * Get the current project
   */
  getCurrentProject(): SK8Project | null {
    return this.currentProject;
  }

  /**
   * Set the current project
   */
  setCurrentProject(project: SK8Project | null): void {
    // Stop auto-save for previous project
    if (this.autoSaveCleanup) {
      this.autoSaveCleanup();
      this.autoSaveCleanup = null;
    }

    // Update current project
    this.currentProject = project;

    // Start auto-save for new project
    if (project && this.options.autoSave?.enabled) {
      this.autoSaveCleanup = enableAutoSave(project, this.options.autoSave);
    }

    // Notify listeners
    this.notifyProjectChange();
  }

  /**
   * Create a new project
   */
  newProject(name: string, version?: string): SK8Project {
    // Warn if current project has unsaved changes
    if (this.options.warnOnUnsaved && this.currentProject?.isDirtyState()) {
      const confirmed = confirm('You have unsaved changes. Create new project anyway?');
      if (!confirmed) {
        throw new Error('Cancelled by user');
      }
    }

    const project = createProject(name, version);
    this.setCurrentProject(project);
    return project;
  }

  /**
   * Create a new project from template
   */
  newProjectFromTemplate(template: 'empty' | 'basic' | 'demo'): SK8Project {
    // Warn if current project has unsaved changes
    if (this.options.warnOnUnsaved && this.currentProject?.isDirtyState()) {
      const confirmed = confirm('You have unsaved changes. Create new project anyway?');
      if (!confirmed) {
        throw new Error('Cancelled by user');
      }
    }

    const project = createProjectFromTemplate(template);
    this.setCurrentProject(project);
    return project;
  }

  /**
   * Open a project from file
   */
  async openProject(file: File, options?: DeserializationOptions): Promise<SK8Project> {
    // Warn if current project has unsaved changes
    if (this.options.warnOnUnsaved && this.currentProject?.isDirtyState()) {
      const confirmed = confirm('You have unsaved changes. Open new project anyway?');
      if (!confirmed) {
        throw new Error('Cancelled by user');
      }
    }

    const project = await loadProjectFromFile(file, options);
    this.setCurrentProject(project);
    return project;
  }

  /**
   * Open project from file picker
   */
  async openProjectFromPicker(options?: DeserializationOptions): Promise<SK8Project> {
    // Warn if current project has unsaved changes
    if (this.options.warnOnUnsaved && this.currentProject?.isDirtyState()) {
      const confirmed = confirm('You have unsaved changes. Open new project anyway?');
      if (!confirmed) {
        throw new Error('Cancelled by user');
      }
    }

    const project = await openProjectFromFilePicker(options);
    this.setCurrentProject(project);
    return project;
  }

  /**
   * Save the current project to file
   */
  saveProject(filename?: string, options?: FileIOOptions): void {
    if (!this.currentProject) {
      throw new Error('No project to save');
    }

    saveProjectToFile(this.currentProject, filename, options);
    this.notifyDirtyStateChange();
  }

  /**
   * Save project to localStorage
   */
  saveProjectToStorage(key?: string): void {
    if (!this.currentProject) {
      throw new Error('No project to save');
    }

    saveProjectToLocalStorage(this.currentProject, key);
    this.notifyDirtyStateChange();
  }

  /**
   * Close the current project
   */
  closeProject(): void {
    // Warn if project has unsaved changes
    if (this.options.warnOnUnsaved && this.currentProject?.isDirtyState()) {
      const confirmed = confirm('You have unsaved changes. Close project anyway?');
      if (!confirmed) {
        throw new Error('Cancelled by user');
      }
    }

    this.setCurrentProject(null);
  }

  /**
   * Check if auto-save is available
   */
  hasAutoSave(): boolean {
    return hasAutoSave();
  }

  /**
   * Recover project from auto-save
   */
  recoverFromAutoSave(options?: DeserializationOptions): SK8Project | null {
    const project = recoverProjectFromAutoSave(options);
    if (project) {
      this.setCurrentProject(project);
    }
    return project;
  }

  /**
   * Clear auto-save
   */
  clearAutoSave(): void {
    clearAutoSave();
  }

  /**
   * Get recent projects
   */
  getRecentProjects(): RecentProjectEntry[] {
    return getRecentProjects();
  }

  /**
   * Check if current project has unsaved changes
   */
  isDirty(): boolean {
    return this.currentProject?.isDirtyState() || false;
  }

  /**
   * Mark current project as dirty
   */
  markDirty(): void {
    if (this.currentProject) {
      this.currentProject.markDirty();
      this.notifyDirtyStateChange();
    }
  }

  /**
   * Mark current project as clean
   */
  markClean(): void {
    if (this.currentProject) {
      this.currentProject.markClean();
      this.notifyDirtyStateChange();
    }
  }

  /**
   * Add a project change listener
   */
  onProjectChange(listener: ProjectChangeListener): () => void {
    this.projectListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.projectListeners.delete(listener);
    };
  }

  /**
   * Add a dirty state change listener
   */
  onDirtyStateChange(listener: DirtyStateListener): () => void {
    this.dirtyListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.dirtyListeners.delete(listener);
    };
  }

  /**
   * Notify project change listeners
   */
  private notifyProjectChange(): void {
    for (const listener of this.projectListeners) {
      try {
        listener(this.currentProject);
      } catch (error) {
        console.error('Error in project change listener:', error);
      }
    }
  }

  /**
   * Notify dirty state listeners
   */
  private notifyDirtyStateChange(): void {
    const isDirty = this.isDirty();
    for (const listener of this.dirtyListeners) {
      try {
        listener(isDirty);
      } catch (error) {
        console.error('Error in dirty state listener:', error);
      }
    }
  }

  /**
   * Get project statistics
   */
  getProjectStats(): any {
    return this.currentProject?.getStats() || null;
  }

  /**
   * Clone current project
   */
  cloneProject(newName?: string): SK8Project {
    if (!this.currentProject) {
      throw new Error('No project to clone');
    }

    return this.currentProject.clone(newName);
  }

  /**
   * Undo last change (future feature)
   */
  undo(): void {
    // TODO: Implement undo/redo
    throw new Error('Undo not yet implemented');
  }

  /**
   * Redo last undone change (future feature)
   */
  redo(): void {
    // TODO: Implement undo/redo
    throw new Error('Redo not yet implemented');
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.autoSaveCleanup) {
      this.autoSaveCleanup();
      this.autoSaveCleanup = null;
    }

    this.currentProject = null;
    this.projectListeners.clear();
    this.dirtyListeners.clear();
    this.clearHistory();
  }
}

/**
 * Get the global project manager instance
 */
export function getProjectManager(): ProjectManager {
  return ProjectManager.getInstance();
}

/**
 * Create a new project manager with custom options
 */
export function createProjectManager(options?: ProjectManagerOptions): ProjectManager {
  ProjectManager.resetInstance();
  return ProjectManager.getInstance(options);
}

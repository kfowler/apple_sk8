/**
 * SK8 Project File I/O
 *
 * Handles saving and loading projects in the browser:
 * - File downloads (.sk8json files)
 * - File uploads (File API)
 * - LocalStorage (auto-save and recovery)
 * - Recent projects list
 */

import { SK8Project } from './project.js';
import { serializeProject, SerializationOptions } from './serializer.js';
import { deserializeProject, DeserializationOptions } from './deserializer.js';

/**
 * File I/O options
 */
export interface FileIOOptions {
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** File extension */
  extension?: string;
  /** MIME type */
  mimeType?: string;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Enable auto-save */
  enabled: boolean;
  /** Auto-save interval in milliseconds */
  interval?: number;
  /** LocalStorage key */
  storageKey?: string;
}

/**
 * Recent project entry
 */
export interface RecentProjectEntry {
  /** Project name */
  name: string;
  /** Last opened timestamp */
  timestamp: string;
  /** LocalStorage key or file path */
  key: string;
  /** Project version */
  version?: string;
}

const DEFAULT_EXTENSION = '.sk8json';
const DEFAULT_MIME_TYPE = 'application/json';
const AUTOSAVE_KEY = 'sk8_autosave';
const RECENT_PROJECTS_KEY = 'sk8_recent_projects';
const MAX_RECENT_PROJECTS = 10;

/**
 * Save project to a downloadable file
 */
export function saveProjectToFile(
  project: SK8Project,
  filename?: string,
  options: FileIOOptions = {}
): void {
  const extension = options.extension || DEFAULT_EXTENSION;
  const mimeType = options.mimeType || DEFAULT_MIME_TYPE;
  const prettyPrint = options.prettyPrint !== false;

  // Generate filename if not provided
  const name = filename || `${project.getName()}_${project.getVersion()}${extension}`;

  // Serialize project
  const json = serializeProject(project, { prettyPrint });

  // Create blob and download
  const blob = new Blob([json], { type: mimeType });
  downloadBlob(blob, name);

  // Mark project as clean
  project.markClean();

  // Add to recent projects
  addRecentProject({
    name: project.getName(),
    timestamp: new Date().toISOString(),
    key: name,
    version: project.getVersion(),
  });
}

/**
 * Load project from a file
 */
export async function loadProjectFromFile(
  file: File,
  options: DeserializationOptions = {}
): Promise<SK8Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const project = deserializeProject(json, options);

        // Add to recent projects
        addRecentProject({
          name: project.getName(),
          timestamp: new Date().toISOString(),
          key: file.name,
          version: project.getVersion(),
        });

        resolve(project);
      } catch (error) {
        reject(new Error(`Failed to load project: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Open file picker and load project
 */
export function openProjectFromFilePicker(
  options: DeserializationOptions = {}
): Promise<SK8Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sk8json,application/json';

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        try {
          const project = await loadProjectFromFile(input.files[0], options);
          resolve(project);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('No file selected'));
      }
    };

    input.click();
  });
}

/**
 * Save project to localStorage
 */
export function saveProjectToLocalStorage(
  project: SK8Project,
  key?: string,
  options: SerializationOptions = {}
): void {
  const storageKey = key || `sk8_project_${project.getName()}`;
  const json = serializeProject(project, options);

  try {
    localStorage.setItem(storageKey, json);
    project.markClean();
  } catch (error) {
    throw new Error(`Failed to save to localStorage: ${error}`);
  }
}

/**
 * Load project from localStorage
 */
export function loadProjectFromLocalStorage(
  key: string,
  options: DeserializationOptions = {}
): SK8Project {
  const json = localStorage.getItem(key);

  if (!json) {
    throw new Error(`Project not found in localStorage: ${key}`);
  }

  return deserializeProject(json, options);
}

/**
 * Auto-save project to localStorage
 */
export function enableAutoSave(
  project: SK8Project,
  config: AutoSaveConfig = { enabled: true }
): () => void {
  if (!config.enabled) {
    return () => {}; // No-op
  }

  const interval = config.interval || 30000; // Default: 30 seconds
  const key = config.storageKey || AUTOSAVE_KEY;

  const autoSaveInterval = setInterval(() => {
    if (project.isDirtyState()) {
      try {
        saveProjectToLocalStorage(project, key, { prettyPrint: false });
        console.log('Auto-saved project');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, interval);

  // Return cleanup function
  return () => {
    clearInterval(autoSaveInterval);
  };
}

/**
 * Recover project from auto-save
 */
export function recoverProjectFromAutoSave(
  options: DeserializationOptions = {}
): SK8Project | null {
  try {
    return loadProjectFromLocalStorage(AUTOSAVE_KEY, options);
  } catch (error) {
    console.warn('No auto-saved project found:', error);
    return null;
  }
}

/**
 * Check if auto-save exists
 */
export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}

/**
 * Clear auto-save
 */
export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Add project to recent projects list
 */
export function addRecentProject(entry: RecentProjectEntry): void {
  const recentProjects = getRecentProjects();

  // Remove existing entry with same key
  const filtered = recentProjects.filter((p) => p.key !== entry.key);

  // Add new entry at the beginning
  filtered.unshift(entry);

  // Limit to MAX_RECENT_PROJECTS
  const limited = filtered.slice(0, MAX_RECENT_PROJECTS);

  // Save back to localStorage
  try {
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to save recent projects:', error);
  }
}

/**
 * Get recent projects list
 */
export function getRecentProjects(): RecentProjectEntry[] {
  try {
    const json = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!json) return [];

    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to load recent projects:', error);
    return [];
  }
}

/**
 * Clear recent projects list
 */
export function clearRecentProjects(): void {
  localStorage.removeItem(RECENT_PROJECTS_KEY);
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export project as JSON string (for clipboard, etc.)
 */
export function exportProjectAsJSON(
  project: SK8Project,
  options: SerializationOptions = {}
): string {
  return serializeProject(project, { prettyPrint: true, ...options });
}

/**
 * Import project from JSON string
 */
export function importProjectFromJSON(
  json: string,
  options: DeserializationOptions = {}
): SK8Project {
  return deserializeProject(json, options);
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  used: number;
  available: number;
  percentage: number;
} {
  // Estimate localStorage usage
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const item = localStorage.getItem(key);
      if (item) {
        used += key.length + item.length;
      }
    }
  }

  // Most browsers have ~5-10MB localStorage limit
  const available = 5 * 1024 * 1024; // 5MB estimate
  const percentage = (used / available) * 100;

  return { used, available, percentage };
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__sk8_storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Backup project to IndexedDB (for larger projects)
 */
export async function backupProjectToIndexedDB(
  project: SK8Project,
  dbName: string = 'SK8Projects'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'name' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');

      const json = serializeProject(project);
      const data = {
        name: project.getName(),
        version: project.getVersion(),
        timestamp: new Date().toISOString(),
        data: json,
      };

      const putRequest = store.put(data);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));

      db.close();
    };
  });
}

/**
 * Restore project from IndexedDB
 */
export async function restoreProjectFromIndexedDB(
  projectName: string,
  dbName: string = 'SK8Projects',
  options: DeserializationOptions = {}
): Promise<SK8Project> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('projects')) {
        reject(new Error('No projects found in IndexedDB'));
        db.close();
        return;
      }

      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const getRequest = store.get(projectName);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          try {
            const project = deserializeProject(result.data, options);
            resolve(project);
          } catch (error) {
            reject(new Error(`Failed to deserialize project: ${error}`));
          }
        } else {
          reject(new Error(`Project '${projectName}' not found`));
        }
        db.close();
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to retrieve project from IndexedDB'));
        db.close();
      };
    };
  });
}

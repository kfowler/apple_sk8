/**
 * Mock assets for testing
 * Provides test images, videos, and audio files
 */

/**
 * Creates a mock image element
 */
export function createMockImage(width: number = 100, height: number = 100): HTMLImageElement {
  const img = new Image();
  img.width = width;
  img.height = height;
  // Create a minimal 1x1 transparent PNG data URL
  img.src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return img;
}

/**
 * Creates a mock video element
 */
export function createMockVideo(width: number = 640, height: number = 480): HTMLVideoElement {
  const video = document.createElement('video');
  video.width = width;
  video.height = height;
  video.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWF2YzEAAAAIZnJlZQAAAAhtZGF0AAAA';
  return video;
}

/**
 * Creates a mock audio element
 */
export function createMockAudio(): HTMLAudioElement {
  const audio = new Audio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
  return audio;
}

/**
 * Mock image data for testing
 */
export const TEST_IMAGES = {
  red: createMockImage(100, 100),
  blue: createMockImage(100, 100),
  green: createMockImage(100, 100),
  large: createMockImage(1920, 1080),
  small: createMockImage(16, 16),
  square: createMockImage(200, 200),
  wide: createMockImage(400, 200),
  tall: createMockImage(200, 400),
};

/**
 * Mock video data for testing
 */
export const TEST_VIDEOS = {
  short: createMockVideo(640, 480),
  long: createMockVideo(640, 480),
  hd: createMockVideo(1920, 1080),
  sd: createMockVideo(640, 480),
};

/**
 * Mock audio data for testing
 */
export const TEST_AUDIO = {
  short: createMockAudio(),
  long: createMockAudio(),
  music: createMockAudio(),
  effect: createMockAudio(),
};

/**
 * Creates a mock canvas with specific content
 */
export function createCanvasWithContent(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }
  return canvas;
}

/**
 * Creates a test pattern canvas (useful for visual verification)
 */
export function createTestPattern(width: number = 200, height: number = 200): HTMLCanvasElement {
  return createCanvasWithContent(width, height, (ctx) => {
    // Create a checkered pattern
    const squareSize = 20;
    for (let y = 0; y < height; y += squareSize) {
      for (let x = 0; x < width; x += squareSize) {
        ctx.fillStyle = (x / squareSize + y / squareSize) % 2 === 0 ? '#ffffff' : '#cccccc';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  });
}

/**
 * Creates a gradient canvas for testing
 */
export function createGradientCanvas(width: number = 200, height: number = 200): HTMLCanvasElement {
  return createCanvasWithContent(width, height, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

/**
 * Creates a mock file for testing file I/O
 */
export function createMockFile(name: string, content: string, type: string = 'text/plain'): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Creates a mock image file
 */
export function createMockImageFile(name: string = 'test.png'): File {
  // 1x1 transparent PNG
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], name, { type: 'image/png' });
}

/**
 * Creates a mock JSON file for projects
 */
export function createMockProjectFile(projectData: any): File {
  const content = JSON.stringify(projectData, null, 2);
  return createMockFile('test-project.sk8', content, 'application/json');
}

/**
 * Mock image bitmap for testing
 */
export function createMockImageBitmap(
  width: number = 100,
  height: number = 100
): ImageBitmap {
  return {
    width,
    height,
    close: jest.fn(),
  } as any;
}

/**
 * Loads a real image from a data URL (for integration tests)
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Sample project data for testing
 */
export const SAMPLE_PROJECT = {
  version: '0.2.0',
  name: 'Test Project',
  actors: [
    {
      type: 'Rectangle',
      objectName: 'rect1',
      bounds: { left: 100, top: 100, width: 200, height: 150 },
      fillColor: '#ff0000',
    },
    {
      type: 'Rectangle',
      objectName: 'rect2',
      bounds: { left: 200, top: 200, width: 150, height: 100 },
      fillColor: '#00ff00',
    },
  ],
  assets: [],
  scripts: [],
};

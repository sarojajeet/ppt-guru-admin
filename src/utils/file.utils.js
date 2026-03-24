/**
 * File Utility Helpers
 */

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get icon name based on file type
 */
export function getFileType(file) {
  if (!file) return 'unknown';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return 'unknown';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename) {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

/**
 * Simulate a delay (useful for demo mode)
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

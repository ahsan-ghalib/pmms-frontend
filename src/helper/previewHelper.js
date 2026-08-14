/**
 * Utility functions for file preview functionality
 */

/**
 * Determine if a file can be previewed based on its URL or type
 * @param {string} fileUrl - URL of the file
 * @returns {boolean} - Whether the file can be previewed
 */
export const canPreviewFile = (fileUrl) => {
  if (!fileUrl) return false;
  
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  const previewableExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', // Images
    'pdf' // PDFs
  ];
  
  return previewableExtensions.includes(extension);
};

/**
 * Get file type from URL
 * @param {string} fileUrl - URL of the file
 * @returns {string} - File type ('image', 'pdf', or 'unknown')
 */
export const getFileType = (fileUrl) => {
  if (!fileUrl) return 'unknown';
  
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  } else if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'unknown';
};

/**
 * Generate a download filename from a base name and ID
 * @param {string} baseName - Base name for the file
 * @param {string|number} id - ID to append
 * @param {string} extension - File extension (optional)
 * @returns {string} - Generated filename
 */
export const generateDownloadFileName = (baseName, id, extension = '') => {
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
  const ext = extension ? (extension.startsWith('.') ? extension : `.${extension}`) : '';
  return `${cleanBaseName}-${id}${ext}`;
};

/**
 * Format file name for display
 * @param {string} fileName - Original file name
 * @param {number} maxLength - Maximum length for display (default: 50)
 * @returns {string} - Formatted file name
 */
export const formatFileNameForDisplay = (fileName, maxLength = 50) => {
  if (!fileName) return 'Unknown File';
  
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
  
  return `${truncatedName}.${extension}`;
};

export default {
  canPreviewFile,
  getFileType,
  generateDownloadFileName,
  formatFileNameForDisplay,
};

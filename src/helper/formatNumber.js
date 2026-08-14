/**
 * Formats a number with comma separation and 2 decimal places.
 * Example: 10000000 -> "10,000,000.00"
 * 
 * @param {number|string} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - The formatted number
 */
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(Number(number))) {
    return '0.00';
  }
  
  return Number(number).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

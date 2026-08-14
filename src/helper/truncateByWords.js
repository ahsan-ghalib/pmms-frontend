export const truncateByWords = (text, maxWords = 10) => {
  const words = text.split(' ');
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : text;
};

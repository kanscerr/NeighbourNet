
/**
 * @returns {string} 16-digit unique identifier
 */
const generate16DigitId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return (timestamp + random).slice(-16);
};

module.exports = {
  generate16DigitId
}; 
export const formatPrice = (amount, { decimals = true } = {}) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(num)) return 'Rs. 0';
  if (decimals) {
    return `Rs. ${num.toFixed(2)}`;
  }
  return `Rs. ${num}`;
};

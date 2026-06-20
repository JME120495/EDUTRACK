export const formatCurrency = (amount, currencyCode = 'XAF', locale = 'fr-FR') => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  
  // Format based on currency code
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid or not supported
    return `${new Intl.NumberFormat(locale).format(amount)} ${currencyCode}`;
  }
};

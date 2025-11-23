export const formatTND = (value) => {
  if (value === null || value === undefined) return 'غير محدد';
  return `${new Intl.NumberFormat('en-US').format(value)} د.ت`;
};

export const formatArabicTNDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  };
  
  return date.toLocaleDateString('ar-TN', options);
};
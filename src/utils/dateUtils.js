export const normalizeDate = (date) => {
    // Create date object and set to midnight UTC
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized.toISOString().split('T')[0];
  };
  
  export const getDefaultDate = () => {
    const now = new Date();
    return normalizeDate(now);
  };
  
  export const validateDateRange = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    
    // Set all dates to midnight for comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);
    
    return {
      isValid: !isNaN(date.getTime()),
      date: normalizeDate(date),
      isWithinRange: date <= maxDate,
      isEditable: date >= today && date <= maxDate
    };
  };
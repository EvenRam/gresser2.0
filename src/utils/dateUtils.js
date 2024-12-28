
/**
 * Add one day to compensate for timezone offset
 */
const addOneDay = (date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
};

/**
 * Get current date with timezone adjustment
 */
export const getCurrentDate = () => {
    const now = new Date();
    const adjusted = addOneDay(now);
    return adjusted.toISOString().split('T')[0];
};

/**
 * Format date for display (adding one day for timezone)
 */
export const formatDateForDisplay = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const adjusted = addOneDay(date);
    return adjusted.toISOString().split('T')[0];
};

/**
 * Format date for API calls
 */
export const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

/**
 * Check if date is in allowed range
 */
export const isDateInAllowedRange = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(23, 59, 59, 999);

    const date = new Date(dateString);

    return date >= today && date <= maxDate;
};

/**
 * Check if date is editable (not in past and within allowed range)
 */
export const isDateEditable = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateString);

    return date >= today && isDateInAllowedRange(dateString);
};

/**
 * Get max allowed date (today + 7 days)
 */
export const getMaxAllowedDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
};
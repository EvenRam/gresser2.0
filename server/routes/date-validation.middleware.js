const formatLocalDate = (date) => {
    // Ensure we're working with a date object
    const d = new Date(date);
    // Return ISO date string (YYYY-MM-DD)
    return d.toISOString().split('T')[0];
};

const validateDate = (req, res, next) => {
    const date = req.params.date || req.body.date;
    if (!date) {
        return res.status(400).send('Date is required');
    }
    
    try {
        // Use consistent timezone approach - force noon Central Time for all dates
        // This ensures date comparisons work properly
        const requestDate = new Date(date + 'T12:00:00');
        
        // Get current date in Central Time
        const centralTime = new Date().toLocaleString("en-US", {
            timeZone: "America/Chicago"
        });
        const today = new Date(centralTime);
        today.setHours(12, 0, 0, 0);
        
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(12, 0, 0, 0);
        
        // Format all dates as YYYY-MM-DD for simple string comparison
        const formattedRequestDate = formatLocalDate(requestDate);
        const formattedToday = formatLocalDate(today);
        const formattedMaxDate = formatLocalDate(maxDate);
        
        // Debugging output
        console.log('Date validation:', {
            requestDate: formattedRequestDate,
            today: formattedToday,
            maxDate: formattedMaxDate,
            method: req.method
        });

        if (isNaN(requestDate.getTime())) {
            return res.status(400).send('Invalid date format');
        }

        // For modification requests
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            if (formattedRequestDate < formattedToday) {
                return res.status(403).send(`Cannot modify past dates (request: ${formattedRequestDate}, today: ${formattedToday})`);
            }
            if (formattedRequestDate > formattedMaxDate) {
                return res.status(403).send(`Cannot modify dates more than 7 days in advance (request: ${formattedRequestDate}, max: ${formattedMaxDate})`);
            }
        }

        req.validatedDate = formattedRequestDate;
        next();
    } catch (error) {
        console.error('Date validation error:', error);
        return res.status(400).send('Invalid date');
    }
};

module.exports = { validateDate };
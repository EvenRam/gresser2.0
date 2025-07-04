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
        // Create date objects with consistent time
        const requestDate = new Date(date + 'T12:00:00');
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        // Allow editing yesterday's date
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);
        
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(12, 0, 0, 0);

        // Format all dates consistently
        const formattedRequestDate = formatLocalDate(requestDate);
        const formattedYesterday = formatLocalDate(yesterday);
        const formattedMaxDate = formatLocalDate(maxDate);

        if (isNaN(requestDate.getTime())) {
            return res.status(400).send('Invalid date format');
        }

        // For modification requests
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            if (formattedRequestDate < formattedYesterday) {
                return res.status(403).send('Cannot modify dates more than 1 day in the past');
            }
            if (formattedRequestDate > formattedMaxDate) {
                return res.status(403).send('Cannot modify dates more than 7 days in advance');
            }
        }
        

        req.validatedDate = formattedRequestDate;
        next();
    } catch (error) {
        console.error('Date validation error:', error);
        return res.status(400).send('Invalid date');
    }

    
};


const isPastDate = (dateString) => {
    // Create date objects for comparison
    const checkDate = new Date(dateString + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Return true if the date is before today
    return checkDate < today;
};

module.exports = { validateDate, isPastDate };

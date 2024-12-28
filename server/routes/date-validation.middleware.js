const formatLocalDate = (date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);  // Set to noon to avoid timezone issues
    return d.toISOString().split('T')[0];
};

const validateDate = (req, res, next) => {
    const date = req.params.date || req.body.date;
    if (!date) {
        return res.status(400).send('Date is required');
    }
    
    try {
        // Add a day to compensate for timezone
        const requestDate = new Date(date);
        requestDate.setDate(requestDate.getDate() + 1);
        
        const today = new Date();
        
        // Set all times to noon for consistent comparison
        requestDate.setHours(12, 0, 0, 0);
        today.setHours(12, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(12, 0, 0, 0);

        // Format all dates consistently
        const formattedRequestDate = formatLocalDate(requestDate);
        const formattedToday = formatLocalDate(today);
        const formattedMaxDate = formatLocalDate(maxDate);

        if (isNaN(requestDate.getTime())) {
            return res.status(400).send('Invalid date format');
        }

        // For modification requests
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            if (formattedRequestDate < formattedToday) {
                return res.status(403).send('Cannot modify past dates');
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

module.exports = { validateDate };
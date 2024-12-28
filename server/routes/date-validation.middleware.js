const formatLocalDate = (date) => {
    const d = new Date(date);
    // Ensure we're working with local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const validateDate = (req, res, next) => {
    const date = req.params.date || req.body.date;
    if (!date) {
        return res.status(400).send('Date is required');
    }
    
    try {
        const requestDate = new Date(date);
        const today = new Date();
        
        // Reset hours to ensure consistent comparison
        requestDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(0, 0, 0, 0);

        // Format all dates consistently
        const formattedRequestDate = formatLocalDate(requestDate);
        const formattedToday = formatLocalDate(today);
        const formattedMaxDate = formatLocalDate(maxDate);

        if (isNaN(requestDate.getTime())) {
            return res.status(400).send('Invalid date format');
        }

        // For modification requests
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            // Allow same-day modifications
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




const PAST_DAYS_EDITABLE = 2;
const FUTURE_DAYS_EDITABLE = 7;
//add or subtract days from a date to a "string"
//uses noon UTC so time zones can never shift the day

const addDays = (dateStr, days) => {
 const d = new Date(dateStr + 'T12:00:00Z');
 d.setUTCDate(d.getUTCDate() + days);
 return d.toISOString().split('T')[0];
};

// Todays day in MN as "year-month-day", shifts by offsetDays
//Heroku runs on UTC, so new Date() alone would be wrong after 6pm central.

const getCentralDate =(OffsetDays = 0) => {
    const todayCentral = new Intl.DateTimeFormat('en-CA',{
        timeZone: 'America/Chicago'
    }).format(new Date());
    return addDays(todayCentral, OffsetDays);
};

const validateDate = (req, res, next) => {
    const date = req.params.date || req.body.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).send('Valid Date (YYYY-MM-DD)is required');
    }
    
      // Viewing GET is allowed for any date. Changes are limited to the window. 
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
          if (date < getCentralDate(-PAST_DAYS_EDITABLE)) {
              return res.status(403).send(`Can only change schedules up to ${PAST_DAYS_EDITABLE} days back`);
          }
          if (date > getCentralDate(FUTURE_DAYS_EDITABLE)) {
              return res.status(403).send('Cannot modify dates more than 7 days in advance');
          }
      }
      
      req.validatedDate = date;
      next();
    };

// "Past" means older than editable window
// These dates use the history queries; dates inside the window use the normal queries
const isPastDate = (dateString) => dateString < getCentralDate(-PAST_DAYS_EDITABLE);


module.exports = { validateDate, isPastDate };

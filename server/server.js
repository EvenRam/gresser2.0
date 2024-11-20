const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5001;

// Middleware Includes
const sessionMiddleware = require('./modules/session-middleware');
const passport = require('./strategies/user.strategy');

// Route Includes
const userRouter = require('./routes/user.router');
const addRouter = require('./routes/addemployee.router');
const jobsRouter = require('./routes/jobs.router');
const jobsHistoryRouter = require('./routes/jobshistory.router');
const projectRouter = require('./routes/project.router');
const moveRouter = require('./routes/moveemployee.router');
const scheduleRouter = require('./routes/schedule.router');




// Express Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('build'));

// Passport Session Configuration
app.use(sessionMiddleware);

// Start Passport Sessions
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/user', userRouter);
app.use('/api/addemployee', addRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/jobhistory', jobsHistoryRouter);
app.use('/api/project', projectRouter)
app.use('/api/moveemployee', moveRouter);
app.use('/api/schedule', scheduleRouter);




// Listen Server & Port
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

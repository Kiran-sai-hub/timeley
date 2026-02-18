const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    punchValidation,
    createEntry,
    getEntries,
    getDailySummary,
    getMonthlyHours,
    getYearlyHours,
    getWeeklyStatsHandler,
    getWorkingDaysHandler,
    getHoursBreakdownHandler,
    getOvertimeHandler,
} = require('../controllers/timeEntryController');

// All routes require authentication
router.use(auth);

router.post('/', punchValidation, createEntry);
router.get('/', getEntries);
router.get('/daily-summary', getDailySummary);
router.get('/monthly', getMonthlyHours);
router.get('/yearly', getYearlyHours);
router.get('/weekly-stats', getWeeklyStatsHandler);
router.get('/working-days', getWorkingDaysHandler);
router.get('/hours-breakdown', getHoursBreakdownHandler);
router.get('/overtime', getOvertimeHandler);

module.exports = router;

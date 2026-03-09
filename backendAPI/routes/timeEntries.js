import express from 'express';
import auth from '../middleware/auth.js';
import {
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
} from '../controllers/timeEntryController.js';

const router = express.Router();

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

export default router;

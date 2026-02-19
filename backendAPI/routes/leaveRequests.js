import express from 'express';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import {
    submitValidation,
    reviewValidation,
    submitLeave,
    getMyLeaves,
    getLeavesForMonth,
    getLeaveById,
    reviewLeave,
    getTeamLeaves,
} from '../controllers/leaveRequestController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Employee routes
router.post('/', submitValidation, submitLeave);
router.get('/', getMyLeaves);
router.get('/month', getLeavesForMonth);
router.get('/team', roleGuard('manager', 'admin'), getTeamLeaves);
router.get('/:id', getLeaveById);

// Manager-only route
router.patch('/:id/review', roleGuard('manager', 'admin'), reviewValidation, reviewLeave);

export default router;

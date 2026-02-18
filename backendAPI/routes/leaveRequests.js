const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
    submitValidation,
    reviewValidation,
    submitLeave,
    getMyLeaves,
    getLeavesForMonth,
    getLeaveById,
    reviewLeave,
    getTeamLeaves,
} = require('../controllers/leaveRequestController');

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

module.exports = router;

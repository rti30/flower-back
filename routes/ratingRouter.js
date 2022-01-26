const Router = require('express');
const router = new Router();
const ratingController = require('../controllers/ratingController');
const authMiddleWare = require('../middleware/authMiddleware');


//* категории
router.get('/', ratingController.getCount);
router.post('/get', authMiddleWare, ratingController.getMark);
router.post('/', authMiddleWare, ratingController.add);

module.exports = router;
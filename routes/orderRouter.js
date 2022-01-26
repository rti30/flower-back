const Router = require('express');
const router = new Router();
const orderController = require('../controllers/orderController');
const authMiddleWare = require('../middleware/authMiddleware');


router.post('/', orderController.setOrder);
router.post('/get', authMiddleWare, orderController.getOrder);



module.exports = router;
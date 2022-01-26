const Router = require('express');
const router = new Router();
const likeController = require('../controllers/likeController');
const authMiddleWare = require('../middleware/authMiddleware');


router.post('/get/', authMiddleWare, likeController.get);
router.post('/', authMiddleWare, likeController.add);
router.delete('/', authMiddleWare, likeController.remove);




module.exports = router;
const Router = require('express');
const router = new Router();
const cartController = require('../controllers/cartController');
const authMiddleWare = require('../middleware/authMiddleware');


//* категории
//router.post('/check/', authMiddleWare, cartController.checkCountProduct);
router.post('/check/', cartController.checkOrder);
router.post('/get/', authMiddleWare, cartController.get);
router.post('/', authMiddleWare, cartController.add);
router.delete('/', authMiddleWare, cartController.remove);
router.put('/', authMiddleWare, cartController.changeCount);
/* router.get('/', categoryController.getAllCategory);
router.post('/', categoryController.createCategory);
router.put('/', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory); */



module.exports = router;
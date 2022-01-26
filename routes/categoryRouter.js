const Router = require('express');
const router = new Router();
const categoryController = require('../controllers/categoryController');

//* категории
router.get('/params/', categoryController.getCategoryOnParams);
router.get('/', categoryController.getAllCategory);
router.post('/', categoryController.createCategory);
router.put('/', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);



module.exports = router;
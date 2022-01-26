const Router = require('express');
const router = new Router();
const productController = require('../controllers/productController');

//* категории
router.get('/params/', productController.getProductOnParams);
router.get('/', productController.getAllProduct);
router.post('/', productController.createProduct);
router.post('/arrId', productController.getProductsOnId);
router.put('/', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);



module.exports = router;
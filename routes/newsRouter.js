const Router = require('express');
const router = new Router();
const newsController = require('../controllers/newsController');

//* категории
router.get('/:id', newsController.getOneNews);
router.get('/', newsController.getAllNews);
router.post('/', newsController.createNews);
router.put('/', newsController.updateNews);
router.delete('/:id', newsController.deleteNews);



module.exports = router;
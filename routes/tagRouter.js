const Router = require('express');
const router = new Router();
const tagController = require('../controllers/tagController');

//* категории
router.get('/params/', tagController.getTagOnParams);
router.get('/', tagController.getAllTag);
router.post('/', tagController.createTag);
router.put('/', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);



module.exports = router;
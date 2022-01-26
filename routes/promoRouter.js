const Router = require('express');
const router = new Router();
const promoController = require('../controllers/promoController');

//* категории
router.get('/getOne', promoController.getOnePromo); //для админа
router.get('/', promoController.getAllPromo);  //для админа
router.post('/', promoController.createPromo);  //для админа
router.put('/', promoController.updatePromo);  //для админа
router.delete('/', promoController.deletePromo);  //для админа
//*=================================================================
router.post('/check', promoController.check);



module.exports = router;
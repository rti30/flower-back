const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleWare = require('../middleware/authMiddleware');
const refreshMiddleWare = require('../middleware/refreshMiddleWare');
//* Пользователь
router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.post('/auth', authMiddleWare, userController.auth);
router.post('/refreshToken', refreshMiddleWare, userController.refreshToken);
router.post('/logout', authMiddleWare, userController.logout);
router.get('/all', authMiddleWare, userController.getAllUsers);
router.post('/loginHistory', authMiddleWare, userController.getLoginHistory);



module.exports = router;
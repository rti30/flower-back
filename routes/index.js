const Router = require('express');
const router = new Router();

const category = require('./categoryRouter');
const product = require('./productRouter');
const promo = require('./promoRouter');
const tag = require('./tagRouter');
const news = require('./newsRouter');
const user = require('./userRouter');
const cart = require('./cartRouter');
const like = require('./likeRouter');
const rating = require('./ratingRouter');
const order = require('./orderRouter');

router.use('/category', category)
router.use('/product', product)
router.use('/promo', promo)
router.use('/tag', tag)
router.use('/news', news)
router.use('/user', user)
router.use('/cart', cart)
router.use('/like', like)
router.use('/rating', rating)
router.use('/order', order)
module.exports = router;
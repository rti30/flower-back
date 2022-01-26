
/* const { Categories } = require('../models/models')
const uuid = require('uuid');
*/
const path = require('path');
const ApiError = require('../error/ApiError')
const sqlErorr = require('../error/sqlErorr')
const validate = require('../error/validateErorr')
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');


hasInCart = async (id, productId) => {
    return (await db.query(`SELECT * FROM  cart  WHERE customer_id = $1 and product_id = $2`, [id, productId])).rows.length ? true : false
}

async function checkCountProduct(productCount) {

    //! Рефакторинг, каждый цикл тормозится await, возможно, нужен PromiseAll
    let checkCount = [];
    for (const element of productCount) {

        let tempResult = (await db.query(`SELECT id, count_ FROM  product  WHERE id = $1 AND count_ >= $2 `, [element.productId, element.count])).rows[0]; //! подумать не тормозит ли await процесс и нужен ли promise all
        (!tempResult) ? checkCount.push({ 'id': element.productId, "count_": false }) : checkCount.push(tempResult);
    }
    return checkCount;
}

async function checkValidPromo(productPromo) {
    //! Рефакторинг, каждый цикл тормозится await, возможно, нужен PromiseAll
    let checkPromo = [];
    for (const element of productPromo) {
        if (element.promo !== undefined && element.promo !== null) {
            let tempResult = (await db.query(`SELECT promo.promo_name, promo.promo_value, promo.promo_limit 
        FROM promo, product_promo, product
        WHERE promo.promo_name = product_promo.promo_name AND product_promo.product_id = product.id AND
        product_promo.promo_name = $1 AND product_promo.product_id = $2 AND promo.promo_limit>0`,
                [element.promo, element.productId]))?.rows[0];
            (!tempResult) ? checkPromo.push({ id: element.productId, 'promo_name': element.promo, "promo_value": false, "promo_limit": false }) : checkPromo.push(tempResult);
        }
    }
    return checkPromo;
}

async function getTotal(cart) {

    /* входные данные [
            {
                productId,
                count,
                promo,
                total,
            }
        ] */
    let result = [];
    for (const [i, element] of cart.entries()) {
        //! Рефакторинг, каждый цикл тормозится await, возможно нужен PromiseAll
        let tempResult = (await db.query(`SELECT id, price, discount, name_product 
        FROM product
        WHERE id = $1`,
            [element.productId]))?.rows[0];
        let promoValue = 0;
        if (element.promo) {
            //!Тут берется чисто значение промокода, без проверки наличия его у продукта, т.к. уже была проверка и тут повторное обращение. По сути Без этого обращения можно обойтись см. пометки красным //!
            promoValue = (await db.query(`SELECT promo_value 
            FROM promo
            WHERE promo_name = $1`,
                [element.promo]))?.rows[0].promo_value;
        }
        // (!tempResult) ? result.push({ 'id': element.productId, "has": false}) : result.push(tempResult); //? кол-во проверено, значит можно смело пушить, но пока пусть будет так
        result.push({ ...cart[i], ...tempResult, ...{ promoValue } });
        //Выборка id товара, цена дисконт
        // смешать
        /*       {
                  id,
                  count,
                  promo,
                  total,
                  price,
                  discont
              } */

        //  
    }
    // на основе выборки цена,  
    // на основе выборки скидка вместе с дисконт и промо,
    console.log(result);
    const total = result.reduce((total, item, index, array) => total + item.price * item.count, 0);
    const totalDiscount = result.reduce((total, item, index, array) => total + item.price * item.discount / 100 * item.count + item.price * item.promoValue / 100 * item.count, 0);
    const totalPrice = total - totalDiscount;

    return { totalPrice, totalDiscount, result }
}




class CartController {

    async get(req, res, next) {
        try {
            const { id } = req.user;
            return res.json((await db.query(`SELECT product_id, count_ FROM cart WHERE customer_id = $1`, [id])).rows);
            /* Замена ключей в обекте. Перенёс на фронт т.к. логичнее ситуация, когда это нужно на фронте ====================================================    
     /*             temp.forEach(element => {
                     delete Object.assign(element, { 'productId': element.product_id }).product_id;
                     delete Object.assign(element, { 'count': element.count_ }).count_;
                 }); */
            //   delete Object.assign(newObj, element, { 'productId': element.product_id }).product_id;

        } catch (e) {
            return res.json(e);

        }
    }


    /*     async checkCountProduct(req, res, next) {
            try {
                const productCount = req.body;
                if (!productCount?.length) {
                    return next(ApiError.badRequest('Входящий массив пуст'));
                }
    
                return res.json(await checkCountProduct(productCount));
    
            } catch (e) {
                return res.json(e);
    
            }
        } */
    async add(req, res, next) {
        try {
            const { productId } = req.body;
            const { id } = req.user;
            if (validate.empty(id) || validate.empty(productId)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }

            if (!(await hasInCart(id, productId))) {
                (await db.query(`INSERT INTO cart (customer_id, product_id)
        values ($1, $2)`,
                    [id, productId]));
            }
            return res.json(true);


        } catch (e) {
            console.log('тут');
            return res.json(e);
        }
    }
    async remove(req, res, next) {
        try {
            const { productId } = req.body;
            const { id } = req.user;
            if ((await hasInCart(id, productId))) {
                await db.query(`DELETE FROM cart where customer_id = $1 and product_id = $2`, [id, productId]);
            }
            return res.json(true);
        } catch (e) {
            return res.json(e);
        }

    }
    async changeCount(req, res, next) {
        try {
            const { productId, newCount } = req.body;
            const { id } = req.user;
            if (validate.empty(id) || validate.empty(productId) || validate.empty(newCount)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }
            if ((await hasInCart(id, productId))) {
                await db.query(`UPDATE cart set count_ = $1
            WHERE customer_id = $2 AND product_id = $3`,
                    [newCount, id, productId]);
                return res.json(true);
            }
            else {
                return next(ApiError.badRequest('Товар не добавлен'));
            }

        } catch (e) {
            return res.json(e);
        }
    }


    ///? ==============================================
    async checkOrder(req, res, next) {
        try {
            const { products, total, discount, id, customerInfo } = req.body;
            console.log("Входящие данные тотал", total)
            if (validate.empty(customerInfo)) {
                return next(ApiError.badRequest('Данные получателя не переданы'));
            }
            const { name, surname, telephone, adress, email } = customerInfo;
            if (validate.empty(products) || validate.empty(total) || validate.empty(discount) || validate.empty(name) || validate.empty(surname) || validate.empty(telephone)
                || validate.empty(email)) {
                return next(ApiError.badRequest('Данные не заполнены'));
            }
            const productCount = products.map((product) => { return { productId: product.productId, count: product.count }; });
            const checkCount = checkCountProduct(productCount);
            const productPromo = products.filter(product => product?.promo !== '').map((product) => { return { productId: product.productId, promo: product.promo }; });
            const checkPromo = checkValidPromo(productPromo);

            let messege = { error: false };

            const values = await Promise.all([checkCount, checkPromo]);
            //проверка
            if (values[0].some(item => item.count_ === false)) {
                messege.checkCount = values[0];
                messege.error = true;
            }
            console.log("После проверки  checkCount ", messege);
            if (values[1].some(item => item.promo_value === false)) {
                //! По сути здесь нам уже отдали значение промо, а дальше снова делаю обращение к бд при вычислении тотала
                messege.checkPromo = values[1];
                messege.error = true;
            }
            console.log("После проверки checkPromo", messege);
            if (messege.error) {
                return next(ApiError.badRequest(messege));
            }
            //пройдено:   
            // .then(() => {
            const { totalPrice, totalDiscount, result } = await getTotal(products)
            // })
            //   .then(({ totalPrice, totalDiscount, result }) => {
            console.log(totalPrice, totalDiscount);
            messege.total = (totalPrice === total) ? true : false;
            messege.discount = (totalDiscount === discount) ? true : false;


            if (!messege.total || !messege.discount) {
                messege.error = true;
                return next(ApiError.badRequest(messege));
            }
            // В отдельную функцию по-хорошему =================================================================================================================
            console.log("Вызываем функцию блокировки товаров и промо кодов", result);

            const reservationId = uuid.v4();
            const userId = (id) ? id : 1;  //! Создать системную переменную с выделенным id !
            await db.query(`INSERT INTO reservation (id, customer_id, total, discount, time_created)
                               values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                [reservationId, userId, totalPrice, totalDiscount]);

            let promise1 = db.query(`INSERT INTO reservation_adressee (reservation_id, name_, surname, telephone, adress, email)
                    values ($1, $2, $3, $4, $5, $6)`,
                [reservationId, name, surname, telephone, adress, email]);

            // .then(() => {
            let promises = result.map(product => {
                db.query(`INSERT INTO reservation_product (reservation_id, product_id, name_product, count_, promo_name, price, price_with_discount)
                                            values ($1, $2, $3, $4, $5, $6, $7)`,
                    [reservationId, product.productId, product.name_product, product.count, product.promo, product.price, product.price - product.price * product.discount / 100]);

                //name, surname, telephone, adress, email
                /*    db.query(`INSERT INTO reservation_adressee (reservation_id, name_, surname, telephone, adress, email)
                       values ($1, $2, $3, $4, $5, $6)`,
                       [reservationId, name, surname, telephone, adress, email]); */


                db.query(`UPDATE product set count_ = count_ - $1
                                        WHERE id = $2`,
                    [product.count, product.productId])
                db.query(`UPDATE promo set promo_limit = promo_limit - 1
                WHERE promo_name = $1`, [product.promo])
            })
            //  })
            //    })
            Promise.all(promises, promise1)
                .then(() => { return res.json({ result: true, reservation: reservationId }) })





            //не пройдена на ошибку с сообщением
        } catch (e) {
            console.log(e);
            return res.json(e);

        }
    }

}
module.exports = new CartController();
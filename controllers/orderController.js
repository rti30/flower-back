
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

/* async function deleteReservation(id) {

} */

class OrderController {
    async setOrder(req, res, next) {
        try {
            const { reservation } = req.body;
            console.log(reservation);
            if (validate.empty(reservation)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }

            const order = (await db.query(`SELECT customer_id, total, discount FROM reservation WHERE id = $1`, [reservation])).rows
            if (!order.length) {
                return res.json({ status: false, messege: 'Заказ не найден. Оформите снова' });
            }
            const { customer_id: userId, total, discount } = order[0];
            console.log({ customer_id: userId, total, discount });

            const orderProducts = (await db.query(`SELECT product_id, name_product, count_, promo_name, price, price_with_discount FROM reservation_product WHERE reservation_id = $1`, [reservation])).rows;
            const orderAdressee = (await db.query(`SELECT name_, surname, telephone, adress, email FROM reservation_adressee WHERE reservation_id = $1`, [reservation])).rows;
            //const { product_id: productId, name_product: poductName, count_: count, promo_name: promoName, price, price_with_discount: discountPrice } = orderProduct;
            // Удаляем бронь
            db.query(`DELETE FROM reservation WHERE id = $1`, [reservation]); // Удаляем бронь


            //ждём создания заказа
            await db.query(`INSERT INTO order_ (id, customer_id, total, discount, time_created)
                               values ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                [reservation, userId, total, discount])
            //заносим данные по заказу
            let promises = orderProducts.map(orderProduct => {
                console.log("11111111111111111  Заносим продукы");
                db.query(`INSERT INTO order_product (order_id, product_id, name_product, count_, promo_name, price, price_with_discount)
                values ($1, $2, $3, $4, $5, $6, $7)`,
                    [reservation, orderProduct.product_id, orderProduct.name_product, orderProduct.count_, orderProduct.promo_name, orderProduct.price, orderProduct.price_with_discount]);
            });


            let promises2 = orderAdressee.map(adressee => {
                console.log("11111111111111111  Заносим получателей");
                db.query(`INSERT INTO order_adressee (order_id, name_, surname, telephone, adress, email)
                    values ($1, $2, $3, $4, $5, $6)`,
                    [reservation, adressee.name_, adressee.surname, adressee.telephone, adressee.adress, adressee.email]);
            });


            await Promise.all(promises);
            await Promise.all(promises2);



            console.log("333333333333333333333     На выход");
            return res.json({ status: true, order: reservation });

        } catch (e) {
            console.log(e);
            return res.json(false);
        }
    }

    async getOrder(req, res, next) {
        try {
            const { id, login, role, deviceId } = req.user;
            const orders =
                (await db.query(`SELECT id, total, discount, time_created 
               FROM order_
               WHERE customer_id = $1`, [id])).rows;

            //    const orderId = orders.rows.map(item => item.id);
            let result = [];
            let promises = orders.map(async order => {
                //! нужно почитать о промисах, получается однопоточно
                let orderProducts = (await db.query(`SELECT product_id, name_product, count_, promo_name, price, price_with_discount
         FROM order_product 
         WHERE order_id = $1`, [order.id]))?.rows;
                let adressee = (await db.query(`SELECT name_, surname, telephone, adress, email
         FROM order_adressee
         WHERE order_id = $1`, [order.id]))?.rows[0];

                console.log(orderProducts, adressee);

                result.push({
                    id: order.id,
                    total: order.total,
                    discount: order.discount,
                    products: orderProducts,
                    adressee: adressee,

                })

            })
            await Promise.all(promises);
            return res.json(result);
        }
        catch (e) {
            console.log(e);
            return res.json(false);
        }
        /*         const orderProducts = (await db.query(`SELECT order_product.product_id, order_product.name_product, order_product.count_, order_product.promo_name, order_product.price, order_product.price_with_discount
                 FROM order_, order_product 
                 WHERE order_.id = order_product.order_id AND order_.customer_id = $1`, [id])).rows; */

    }
}


module.exports = new OrderController();
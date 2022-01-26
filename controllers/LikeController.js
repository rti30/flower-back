
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


hasLike = async (id, productId) => {
    return (await db.query(`SELECT * FROM  customer_like  WHERE customer_id = $1 and product_id = $2`, [id, productId])).rows.length ? true : false
}


class LikeController {

    async get(req, res, next) {
        try {
            const { id } = req.user;
            return res.json((await db.query(`SELECT product_id FROM customer_like WHERE customer_id = $1`, [id])).rows);

        } catch (e) {
            return res.json(false);
        }
    }

    async add(req, res, next) {
        try {
            const { productId } = req.body;
            const { id } = req.user;
            if (validate.empty(id) || validate.empty(productId)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }

            if (!(await hasLike(id, productId))) {
                (await db.query(`INSERT INTO customer_like (customer_id, product_id)
        values ($1, $2)`,
                    [id, productId]));
            }
            return res.json(true);


        } catch (e) {
            return res.json(false);
        }
    }
    async remove(req, res, next) {
        try {
            const { productId } = req.body;
            const { id } = req.user;
            if ((await hasLike(id, productId))) {
                await db.query(`DELETE FROM customer_like where customer_id = $1 and product_id = $2`, [id, productId]);
            }
            return res.json(true);
        } catch (e) {
            return res.json(false);
        }

    }


}
module.exports = new LikeController();
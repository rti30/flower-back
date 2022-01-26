
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


const minRating = 0.5;
const maxRating = 5;

hasMark = async (id, productId) => {
    return (await db.query(`SELECT * FROM  customer_rating  WHERE customer_id = $1 and product_id = $2`, [id, productId])).rows.length ? true : false
}

async function getAverage(id) {
    const marksProduct = (await db.query(`SELECT reviews FROM customer_rating WHERE product_id = $1`, [id]))?.rows.map(item => item.reviews);
    let average = null;
    if (marksProduct?.length) {
        average = marksProduct.reduce((sum, mark) => { return sum + mark; }, 0) / marksProduct.length;
    }
    return average;
}
async function setAverage(productId, average) {
    //! Число ли mark?
    if (validate.empty(productId) || validate.empty(average)) {
        return false;
    }
    //  const averageIn = Math.min(Math.max(minRating, averageIn), maxRating);
    // console.log({ productId }, markIn);
    if (average >= 0 && average <= maxRating) {
        console.log("1111111111111111111111", average);
        await db.query(`UPDATE product set rating = $1
        WHERE id = $2`,
            [average, productId]);
        return true
    }
    else return 0;

}

class RatingController {
    async getCount(req, res, next) {
        try {
            const { id } = req.query;
            if (validate.empty(id)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }
            const marksProduct = (await db.query(`SELECT reviews FROM customer_rating WHERE product_id = $1`, [id]))?.rows.map(item => item.reviews);
            //result.categories = categories.rows.map(item => item.category_name);
            let count = 0;
            let average = null; //? Есть отдельная функция, но тут экономиться запрос!
            if (marksProduct?.length) {
                count = marksProduct.length;
                average = marksProduct.reduce((sum, mark) => { return sum + mark; }, 0) / marksProduct.length;
            }

            return res.json({ count, average });
        } catch (e) {
            return res.json(false);
        }
    }

    async getMark(req, res, next) {
        try {
            const { productId } = req.body;
            const { id } = req.user;
            if (validate.empty(id) || validate.empty(productId)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }
            let mark = (await db.query(`SELECT reviews FROM customer_rating WHERE customer_id = $1 AND product_id = $2 `, [id, productId]))?.rows;
            mark = mark?.length ? mark[0].reviews : null;
            return res.json({ mark });

        } catch (e) {
            console.log(e);
            return res.json(false);
        }
    }

    async add(req, res, next) {
        try {
            const { productId, mark } = req.body;
            const { id } = req.user;
            console.log("Добавить рейтинг входящие данные", { productId, id, mark });
            //! Число ли mark?
            if (validate.empty(id) || validate.empty(productId) || validate.empty(mark)) {
                return next(ApiError.badRequest('Не заполнены данные'));
            }
            const markIn = Math.min(Math.max(minRating, mark), maxRating);
            if (!(await hasMark(id, productId))) {
                console.log({ productId }, markIn);
                (await db.query(`INSERT INTO customer_rating (customer_id, product_id, reviews) values ($1, $2, $3)`, [id, productId, markIn]));
                res.json(true);
            }
            else {
                await db.query(`UPDATE customer_rating set reviews = $1
                WHERE customer_id = $2 AND product_id = $3`,
                    [markIn, id, productId]);
                res.json(true);
            }
            setAverage(productId, await getAverage(productId))
            return;
        } catch (e) {
            console.log(e);
            return res.json(false);
        }
    }

}
module.exports = new RatingController();
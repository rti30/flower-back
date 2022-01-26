
/* const { Categories } = require('../models/models')
const uuid = require('uuid');
*/
const path = require('path');
const ApiError = require('../error/ApiError')
const sqlErorr = require('../error/sqlErorr')
const validate = require('../error/validateErorr')
const db = require('../db');
const fs = require('fs');
const { rows } = require('pg/lib/defaults');
//const { json } = require('express/lib/response'); //*?Откуда это взялось

async function getOne(name, productId) {

    if (validate.empty(name)) {
        return next(ApiError.badRequest('Параметр имени не передан!'))
    }
    let promo;
    /// const promo = (await db.query(`SELECT promo_name, promo_value, promo_limit FROM promo WHERE promo_name ILIKE '%' || $1  || '%'`, [name]))?.rows[0] //По совпадению символов
    if (productId) {
        console.log("Если передано");
        promo = (await db.query(`SELECT promo.promo_name, promo.promo_value, promo.promo_limit 
        FROM promo, product_promo, product
        WHERE promo.promo_name = product_promo.promo_name AND product_promo.product_id = product.id AND product_promo.promo_name = $1 AND product_promo.product_id = $2`, [name, productId]))?.rows[0]
    }
    else {
        console.log("Если не передано");
        promo = (await db.query(`SELECT promo_name, promo_value, promo_limit FROM promo WHERE promo_name = $1`, [name]))?.rows[0]
    }
    return (promo) ? promo : null;
}


class PromoController {

    async getOnePromo(req, res, next) {
        try {
            const { name } = req.body;
            return (getOne(name));
        }
        catch (e) {
            //  sqlErorr(e, next);
            return res.json(false);
        }
    }
    async getAllPromo(req, res, next) {

        try {
            const promoAll =
                await db.query(`SELECT promo_name, promo_value, promo_limit FROM promo`)
            res.json(promoAll.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return next(e);
        }

    }

    async createPromo(req, res, next) {
        try {
            const { name, value, limit } = req.body;
            if (validate.empty(name) || validate.empty(limit) || validate.empty(value)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }
            //! value нужна проверка, что число от 0 до 100

            if (!validate.isInt(limit)) {
                return next(ApiError.badRequest('Лимит должен быть целочисленным!'));
            }
            const newPromo =
                await db.query(`INSERT INTO promo (promo_name, promo_value, promo_limit, time_created, time_updated)
             values ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
                    [name, value, limit]);
            res.json(newPromo.rows[0]);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    async updatePromo(req, res, next) {
        try {
            const { name, value, limit } = req.body;
            if (validate.empty(name) || validate.empty(limit) || validate.empty(value)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }
            //! value нужна проверка, что число от 0 до 100
            if (!validate.isInt(limit)) {
                return next(ApiError.badRequest('Лимит должен быть целочисленным!'));
            }

            const promo =
                await db.query(`UPDATE promo set promo_value = $1, promo_limit = $2, time_updated = CURRENT_TIMESTAMP
            where promo_name = $3 RETURNING promo_name, promo_value, promo_limit`,
                    [value, limit, name]);
            res.json(promo.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    async deletePromo(req, res, next) {
        const { name } = req.body;
        if (validate.empty(name)) {
            return next(ApiError.badRequest('Заполните все данные!'));
        }
        try {
            //! По хорошему в таблицу необходимо добавить зависимость по ключу на каскадное удаление
            await db.query(`DELETE FROM product_promo WHERE promo_name = $1`, [name]);
            //!-------------------------------------------------------------------------------------
            const promo = await db.query(`DELETE FROM promo where promo_name = $1`, [name]);
            if (promo) {
                return (promo?.rowCount === 0) ? res.json("Запись уже удалена") : res.json(`Количество удаленых записей: ${promo?.rowCount}`);
            }
            else {
                return res.json(promo);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }

    async check(req, res, next) {
        try {
            console.log(req.body);
            const { productId, promo } = req.body;
            if (validate.empty(promo) || validate.empty(productId)) {
                return next(ApiError.badRequest('Не все данные переданы'))
            }
            const promoInBd = await getOne(promo, productId);
            if (promoInBd) {
                console.log({ promoInBd });
                const response = (promoInBd.promo_limit > 0) ? { name: promoInBd.promo_name, value: promoInBd.promo_value } : null
                return res.json(response);
            }
            else {
                return res.json(null);
            }
        }
        catch (e) {
            console.log(e);
            return res.json(false);
        }
        // this.gerOndePromo(req)
    }

}

module.exports = new PromoController();
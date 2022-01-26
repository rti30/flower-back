
/* const { Categories } = require('../models/models')
const uuid = require('uuid');
*/
const path = require('path');
const ApiError = require('../error/ApiError')
const sqlErorr = require('../error/sqlErorr')
const validate = require('../error/validateErorr')
const db = require('../db');
const fs = require('fs');
//const { json } = require('express/lib/response'); //*?Откуда это взялось

class TagController {

    async getTagOnParams(req, res, next) {

        try {
            const { param } = req.query;
            if (validate.empty(param)) {
                return next(ApiError.badRequest('Параметр не выбран!'));
            }
            if (param === "id") {
                if (!validate.isInt(req.query.id)) {
                    return next(ApiError.badRequest('id должен быть целочисленным!'));
                }
                //const id = parseInt(req.query.id);
                const tag =
                    await db.query(`SELECT id, tag_name FROM tag WHERE id = $1`, [id])
                res.json(tag.rows[0]);
            }
            else if (param === "name") {
                const { name } = req.query;
                if (validate.empty(name)) {
                    return next(ApiError.badRequest('Параметр имени не передан!'))
                }
                const tag =
                    await db.query(`SELECT id, tag_name FROM tag WHERE tag_name ILIKE '%' || $1  || '%'`, [name])
                return res.json(tag.rows);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }

    }
    async getAllTag(req, res, next) {

        try {
            const tags =
                await db.query(`SELECT id, tag_name FROM tag`)
            res.json(tags.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return next(e);
        }
    }

    async createTag(req, res, next) {
        try {
            const { name } = req.body;
            if (validate.empty(name)) {
                return next(ApiError.badRequest('Имя не заполнено!'));
            }
            const newTag =
                await db.query(`INSERT INTO tag (tag_name, time_created, time_updated)
             values ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, tag_name`,
                    [name]);
            return res.json(newTag.rows[0]);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    async updateTag(req, res, next) {
        try {
            const { name, id } = req.body;
            if (validate.empty(name) || validate.empty(id)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }

            const tag =
                await db.query(`UPDATE tag set tag_name = $1, time_updated = CURRENT_TIMESTAMP
            where id = $2 RETURNING id, tag_name`,
                    [name, id]);
            return res.json(tag.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    async deleteTag(req, res, next) {
        try {
            const id = req.params.id
            //! По хорошему в таблицу необходимо добавить зависимость по ключу на каскадное удаление
            await db.query(`DELETE FROM product_tag WHERE tag_id = $1`, [id]);
            //!-------------------------------------------------------------------------------------
            const tag = await db.query(`DELETE FROM tag where id = $1`, [id]);
            if (tag) {
                return (tag?.rowCount === 0) ? res.json("Запись уже удалена") : res.json(`Количество удаленых записей: ${tag?.rowCount}`);
            }
            else {
                return res.json(tag);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }

}

module.exports = new TagController();

/* const { Categories } = require('../models/models')
const uuid = require('uuid');
*/
const uuid = require('uuid');
const path = require('path');
const ApiError = require('../error/ApiError')
const sqlErorr = require('../error/sqlErorr')
const validate = require('../error/validateErorr')
const db = require('../db');
const sharp = require('sharp');
const fs = require('fs');
//const { json } = require('express/lib/response'); //*?Откуда это взялось

class CategoryController {



    async getCategoryOnParams(req, res, next) {

        try {
            const { param } = req.query;
            if (validate.empty(param)) {
                return next(ApiError.badRequest('Параметр не выбран!'));
            }
            if (param === "id") {
                if (!validate.isInt(req.query.id)) {
                    return next(ApiError.badRequest('id должен быть целочисленным!'));
                }
                // const id = parseInt(req.query.id);
                const category =
                    await db.query(`SELECT id, category_name, description_, category_img FROM category WHERE id = $1`, [id])
                res.json(category.rows[0]);
            }
            else if (param === "name") {
                const { name } = req.query;
                if (validate.empty(name)) {
                    return next(ApiError.badRequest('Параметр имени не передан!'))
                }
                const category =
                    await db.query(`SELECT id, category_name, description_, category_img FROM category WHERE category_name ILIKE '%' || $1  || '%'`, [name])
                res.json(category.rows);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }

    }
    async getAllCategory(req, res, next) {

        try {

            const categories =
                await db.query(`SELECT id, category_name, description_, category_img FROM category`)
            res.json(categories.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return next(e);
        }

    }
    async addImage(img, name) {
        //! Вспомогательная функция
        sharp(img)
            .resize(+process.env.CATEGORY_WIDTH, +process.env.CATEGORY_HEIGT)
            .toFile(path.resolve(__dirname, '..', 'static', 'categories', name))
            .then(info => { })
            .catch(err => { console.log(err); });
    }

    createCategory = async (req, res, next) => {
        try {
            const { name, description } = req.body;
            const { image } = req?.files;
            let fileName = '';
            //image.mv(path.resolve(__dirname, '..', 'static', 'categories', fileName));

            if (validate.empty(name)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }
            if (image) {
                fileName = uuid.v4() + ".jpg";
                this.addImage(image.data, fileName);
            }
            console.log(name, description, fileName);
            const newCategory =
                await db.query(`INSERT INTO category (category_name, description_, category_img, time_created, time_updated)
             values ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, category_name, description_, category_img`,
                    [name, description, fileName]);
            res.json(newCategory.rows[0]);
        }
        catch (e) {
            // sqlErorr(e, next);
            return res.json(e);
        }
    }
    updateCategory = async (req, res, next) => {

        //! Нужно удаление старых изображений!!!!!
        try {
            const { name, description, id } = req.body;
            const { image } = req.files;
            console.log(name, description, id);
            let fileName = '';

            if (validate.empty(name) || validate.empty(id)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }

            if (image) {
                fileName = uuid.v4() + ".jpg";
                console.log(fileName);
                this.addImage(image.data, fileName);
            }
            console.log(fileName);
            const category =
                await db.query(`UPDATE category set category_name = $1, description_ = $2, category_img = $3, time_updated = CURRENT_TIMESTAMP
             where id = $4 RETURNING id, category_name, description_, category_img`,
                    [name, description, fileName, id]);
            res.json(category.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    async deleteCategory(req, res, next) {
        try {
            const id = req.params.id
            const imgUrl = (await db.query(`SELECT category_img from category WHERE id = $1`, [id])).rows[0]?.category_img;
            //! По хорошему в таблицу необходимо добавить зависимость по ключу на каскадное удаление
            await db.query(`DELETE FROM product_category WHERE category_id = $1`, [id]);
            //!-------------------------------------------------------------------------------------
            const category = await db.query(`DELETE FROM category WHERE id = $1`, [id]);
            if (imgUrl) {
                console.log(path.resolve(__dirname, '..', 'static', 'categories', imgUrl));
                fs.unlink(path.resolve(__dirname, '..', 'static', 'categories', imgUrl), function (err) {
                    if (err && err.code == 'ENOENT') {
                        // file doens't exist
                        console.log("Файл не найден");
                    } else if (err) {
                        // other errors, e.g. maybe we don't have enough permission
                        console.log("Ошибка при попытке удаления файла");
                    } else {
                        console.log(`Удалено`);
                    }
                });
            }
            if (category) {
                return (category?.rowCount === 0) ? res.json("Запись уже удалена") : res.json(`Количество удаленых записей: ${category?.rowCount}`);
            }
            else {
                return res.json(category);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }

}

module.exports = new CategoryController();
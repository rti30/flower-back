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

class NewsController {



    async getOneNews(req, res, next) {

        try {
            const id = req.params.id
            if (!validate.isInt(req.query.id)) {
                return next(ApiError.badRequest('id должен быть целочисленным!'));
            }
            // const id = parseInt(req.query.id);
            const oneNews =
                await db.query(`SELECT id, parametr_name, parametr, image_ FROM news WHERE id = $1`, [id])
            res.json(oneNews.rows[0]);

        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }

    }
    async getAllNews(req, res, next) {

        try {

            const news =
                await db.query(`SELECT id, parametr_name, parametr, image_ FROM news`)
            res.json(news.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return next(e);
        }

    }
    async addImage(img, name) {
        //* Вспомогательная функция
        sharp(img)
            .toFormat('jpg')
            .jpeg({
                quality: 100,
            })
            .resize(+process.env.NEWS_WIDTH, +process.env.NEWS_HEIGT)
            .toFile(path.resolve(__dirname, '..', 'static', 'news', name))
            .then(info => { })
            .catch(err => { console.log(err); });
    }
    async deleteImage(imgName) {
        //* Вспомогательная функция
        fs.unlink(path.resolve(__dirname, '..', 'static', 'news', imgName), function (err) {
            console.log(imgName);
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

    createNews = async (req, res, next) => {
        try {
            const { name, value } = req.body;
            const { image } = req?.files;
            let fileName = '';
            //image.mv(path.resolve(__dirname, '..', 'static', 'categories', fileName));

            if (validate.empty(name) || validate.empty(value)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }
            if (image) {
                fileName = uuid.v4() + ".jpg";
                this.addImage(image.data, fileName);
            }
            const newNews =
                await db.query(`INSERT INTO news (parametr_name, parametr, image_, time_created, time_updated)
             values ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, parametr_name, parametr, image_`,
                    [name, value, fileName]);
            res.json(newNews.rows[0]);
        }
        catch (e) {
            // sqlErorr(e, next);
            return res.json(e);
        }
    }
    updateNews = async (req, res, next) => {
        try {
            const { name, value, id } = req.body;
            const { image } = req.files;
            let fileName = '';

            if (validate.empty(name) || validate.empty(id) || validate.empty(value)) {
                return next(ApiError.badRequest('Заполните все данные!'));
            }

            if (image) {
                fileName = uuid.v4() + ".jpg";
                this.addImage(image.data, fileName);
                //* Удаление картинок
                const oldImg = (await db.query(`SELECT image_ from news WHERE id = $1`, [id])).rows[0]?.image_;
                if (oldImg) {
                    this.deleteImage(oldImg);
                }
            }
            const news =
                await db.query(`UPDATE news set parametr_name = $1, parametr = $2, image_ = $3, time_updated = CURRENT_TIMESTAMP
             where id = $4 RETURNING id, parametr_name, parametr, image_`,
                    [name, value, fileName, id]);
            res.json(news.rows);
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
    deleteNews = async (req, res, next) => {
        try {
            const id = req.params.id
            const imgName = (await db.query(`SELECT image_ from news WHERE id = $1`, [id])).rows[0]?.image_;
            const delNews = await db.query(`DELETE FROM news WHERE id = $1`, [id]);
            if (imgName) {
                this.deleteImage(imgName);
            }
            if (delNews) {
                return (delNews?.rowCount === 0) ? res.json("Запись уже удалена") : res.json(`Количество удаленых записей: ${delNews?.rowCount}`);
            }
            else {
                return res.json(delNews);
            }
        }
        catch (e) {
            sqlErorr(e, next);
            return res.json(e);
        }
    }
}

module.exports = new NewsController();
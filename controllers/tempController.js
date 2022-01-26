/*
const { Categories } = require('../models/models')
const ApiError = require('../error/ApiError')
const uuid = require('uuid');
const path = require('path');

class CategoriesController {



    async changeCategory(req, res, next) {
        let { id, category_name, description } = req.body;
        let { titleImg } = req.files;
        let fileName = uuid.v4() + ".jpg";
        titleImg.mv(path.resolve(__dirname, '..', 'static', 'categories', fileName))



        try {


            const category = await Categories.update({ category_name, description, titleImg: fileName },
                { where: { id } });
            return res.json(category)
        }
        catch (e) {
            return next(ApiError.badRequest(e.message));
        }
    }

    async getCategories(req, res, next) {
        try {

            let itemsCategory = await Categories.findAll();
            return res.json(itemsCategory);
        }
        catch (e) {
            return next(ApiError.badRequest(e.message))
        }

    }

    async createCategory(req, res, next) {
        const { category_name, description } = req.body;
        const { titleImg } = req.files;
        let fileName = uuid.v4() + ".jpg";;
        //+ ".jpg";
        titleImg.mv(path.resolve(__dirname, '..', 'static', 'categories', fileName))
        try {
            const categories = await Categories.create({ category_name, description, titleImg: fileName })
            return res.json(categories)
        }
        catch (e) {
            if (e.parent.code === "23505") {
                return next(ApiError.badRequest('Такая категория уже существует!'))
            }
            else { return next(ApiError.badRequest(e.message)) }
        }
    }
}

module.exports = new CategoriesController(); */
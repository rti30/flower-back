
/* const { Categories } = require('../models/models')
const uuid = require('uuid');
*/
const uuid = require('uuid');
const path = require('path');
const ApiError = require('../error/ApiError')
const sqlErorr = require('../error/sqlErorr')
const validate = require('../error/validateErorr')
const db = require('../db');
const fs = require('fs');
const sharp = require('sharp');


class ProductController {

   async getProduct(productId) {
      //! Вспомогательная функция и нужно вытащить ее за пределы класса

      let result = {};
      const product =
         await db.query(`SELECT name_product, price, rating, discount, count_ FROM product WHERE id = $1 and product_status = $2`, [productId, 'true']);
      if (product.rowCount === 0) {
         return false;
      }

      const categories =
         await db.query(`SELECT category_name
     FROM product, product_category, category WHERE product.id = $1 AND product.product_status = $2 AND 
     product.id = product_category.product_id and product_category.category_id = category.id`, [productId, 'true']);

      const tags =
         await db.query(`SELECT tag_name
                  FROM product, product_tag, tag WHERE product.id = $1 AND product.product_status = $2 AND 
                  product.id = product_tag.product_id and product_tag.tag_id = tag.id`, [productId, 'true']);

      /*      const promo =
              await db.query(`SELECT promo.promo_name
                           FROM promo, product, product_promo WHERE product.id = $1 AND product.product_status = $2
                         AND product.id = product_promo.product_id AND product_promo.promo_name = promo.promo_name`, [productId, 'true']); */

      const url =
         await db.query(`SELECT url_img
                        FROM product, product_image WHERE product.id = $1 AND product.product_status = $2 AND 
                        product.id = product_image.product_id`, [productId, 'true']);

      result.id = productId;
      result.name = product.rows[0].name_product;
      result.price = product.rows[0].price;
      result.rating = product.rows[0].rating;
      result.discount = product.rows[0].discount;
      result.maxCount = product.rows[0].count_;

      result.categories = categories.rows.map(item => item.category_name);
      result.tags = tags.rows.map(item => item.tag_name);
      //  result.promo = promo.rows.map(item => item.promo_name);
      result.url = url.rows.map(item => item.url_img);
      //console.log(result);
      return result;
   }

   getProductsOnId = async (req, res, next) => {
      //! Метод пост, на входе массив id , чтобы получить один товар по id, есть функция getProductOnParams
      try {
         let idArr = req.body.idArr;

         if (!idArr) {
            return next(ApiError.badRequest('id не переданы'));
         }
         idArr?.forEach(id => {
            if (!validate.isInt(id)) {
               return next(ApiError.badRequest('id должен быть целочисленным!'));
            }
         })
         idArr = idArr.map(id => { return parseInt(id); });
         console.log(idArr);
         let products = [];
         for (let id of idArr) {
            let item = await this.getProduct(id)
            console.log(item);
            if (item) { // Если объект 
               console.log(item);
               if (Object.keys(item).length) {// Если объект не пустой 
                  products.push(item)
               }
            }
            else {        //item = false
               products.push({ id, has: false })  // Если объект не пустой 
            }
         }
         res.json(products);
         /*            let result = async () => {
                   idArr.forEach(async id => {
                      let item =  this.getProduct(id)
                      if (item) { // Если объект 
                         console.log(item);
                         if (Object.keys(item).length) {
                            products.push(item)        // Если объект не пустой 
                         }                                        // Если объект не пустой 
                      }
                      else {        //item = false
                         products.push({ id, has: false })  // Если объект не пустой 
                      }
                   });
                   return Promise.all(products);
                } */
         /*  res.json(await result()); */
      }
      catch (e) {
         return res.json(e);
      }
   }

   getProductOnParams = async (req, res, next) => {
      try {
         const { param } = req.query;
         if (validate.empty(param)) {
            return next(ApiError.badRequest('Параметр не выбран!'));
         }

         if (param === "id") {
            if (!validate.isInt(req.query.id)) {
               return next(ApiError.badRequest('id должен быть целочисленным!'));
            }
            const id = parseInt(req.query.id);
            //  const product = await getProduct(id)
            res.json(await this.getProduct(id));
         }


         else if (param === "name") {
            const { name } = req.query;
            if (validate.empty(name)) {
               return next(ApiError.badRequest('Параметр имени не передан!'))
            }
            const productsId =
               (await db.query(`SELECT id FROM product WHERE product_status = $1 AND name_product ILIKE '%' || $2  || '%'`, ['true', name])).rows.map(item => item.id);

            let result = async () => {
               let products = [];
               productsId.forEach(async id => {
                  products.push(this.getProduct(id))
               });
               return Promise.all(products);
            }
            res.json(await result());
         }
         else if (param === "categoryId") {
            const { category } = req.query;
            if (validate.empty(category)) {
               return next(ApiError.badRequest('Параметр категории не передан!'))
            }
            const productsId =
               (await db.query(`SELECT product.id FROM product, product_category WHERE product.id = product_category.product_id AND product_category.category_id = $1 AND product.product_status = $2`, [category, 'true'])).rows.map(item => item.id);
            let result = async () => {
               let products = [];
               productsId.forEach(async id => {
                  products.push(this.getProduct(id))
               });
               return Promise.all(products);
            }
            res.json(await result());
         }
         else if (param === "tagId") {
            const { tag } = req.query;
            if (validate.empty(tag)) {
               return next(ApiError.badRequest('Параметр тэга не передан!'))
            }
            const productsId =
               (await db.query(`SELECT product.id FROM product, product_tag WHERE product.id = product_tag.product_id AND product_tag.tag_id = $1 AND product.product_status = $2`, [tag, 'true'])).rows.map(item => item.id);
            let result = async () => {
               let products = [];
               productsId.forEach(async id => {
                  products.push(this.getProduct(id))
               });
               return Promise.all(products);
            }
            res.json(await result());
         }
         else if (param === "categoryName") {
            const { category } = req.query;
            if (validate.empty(category)) {
               return next(ApiError.badRequest('Параметр категории не передан!'))
            }
            const productsId =
               (await db.query(`SELECT product.id FROM product, category, product_category WHERE product.id = product_category.product_id AND product_category.category_id = category.id AND category.category_name = $1 AND product.product_status = $2`, [category, 'true'])).rows.map(item => item.id);
            let result = async () => {
               let products = [];
               productsId.forEach(async id => {
                  products.push(this.getProduct(id))
               });
               return Promise.all(products);
            }
            res.json(await result());
         }
         else if (param === "tagName") {
            const { tag } = req.query;
            if (validate.empty(tag)) {
               return next(ApiError.badRequest('Параметр тэга не передан!'))
            }
            console.log(tag);
            const productsId =
               (await db.query(`SELECT product.id FROM product, tag, product_tag WHERE product.id = product_tag.product_id AND product_tag.tag_id = tag.id AND tag.tag_name = $1 AND product.product_status = $2`, [tag, 'true'])).rows.map(item => item.id);
            let result = async () => {
               let products = [];
               productsId.forEach(async id => {
                  products.push(this.getProduct(id))
               });
               return Promise.all(products);
            }
            res.json(await result());
         }
      }
      catch (e) {
         sqlErorr(e, next);
         return res.json(e);
      }

   }
   getAllProduct = async (req, res, next) => {
      try {
         const productsId =
            (await db.query(`SELECT id FROM product WHERE  product_status = $1`, ['true'])).rows.map(item => item.id);
         //console.log(productsId);

         let result = async () => {
            let products = [];
            productsId.forEach(async id => {
               products.push(this.getProduct(id))
            });
            return Promise.all(products);
         }
         res.json(await result());
      }
      catch (e) {
         //   sqlErorr(e, next);
         return next(e);
      }

   }

   async addImage(img, name, productId) {
      //! Вспомогательная функция---------------------------------
      //const promises = [];

      sharp(img)
         .toFormat('jpeg')
         .resize(+process.env.ITEM_WIDTH, +process.env.ITEM_HEIGHT) //! По хорошему вывести в переменные
         .toFile(path.resolve(__dirname, '..', 'static', 'flowers', name))
         .then(info => { })
         .catch(err => { console.log(err); });
      await db.query(`INSERT INTO product_image (product_id, url_img)
            values ($1, $2) RETURNING product_id`,
         [productId, name]);

      //---------------------------------

      /* let fileName = uuid.v4() + ".jpg";
      img.mv(path.resolve(__dirname, '..', 'static', 'flowers', fileName));
      const newProduct_image = await db.query(`INSERT INTO product_image (product_id, url_img)
values ($1, $2) RETURNING product_id`,
          [productId, fileName]); */
   }

   createProduct = async (req, res, next) => {
      try {
         const { name, price, tagId, categoryId, promoCodes, discount } = req.body;
         const image = req.files?.image;
         if (validate.empty(name) || validate.empty(price)) {
            return next(ApiError.badRequest('Название и цена должны быть заполнены!'));
         }
         //const tags = (tagId === "") ? [] : tagId.split(' ');
         const tags = (tagId === "") ? [] : Array.from(new Set(tagId.split(' ')));
         //   const categories = (categoryId === "") ? [] : categoryId.split(' ');
         const categories = (categoryId === "") ? [] : Array.from(new Set(categoryId.split(' ')));
         // const promo = (promoCodes === "") ? [] : promoCodes.split(' ');
         const promo = (promoCodes === "") ? [] : Array.from(new Set(promoCodes.split(' ')));
         let fileName = '';
         //? Проверить наличие тэгов в бд tags (избыточно)
         //? Проверить наличие категорий в бд category (избыточно)

         if (!discount) {
            discount = 0;
         }
         const newProduct = await db.query(`INSERT INTO product (name_product, price, discount, time_created, time_updated)
         values ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, name_product, price, discount`,
            [name, price, discount]);
         const productId = newProduct.rows[0].id;
         //* Работа с изображениями==============================================================================================

         if (image) {
            //Когда добавляется одна картинка это один объект, когда несколько - массив обектов

            //! Способ полегче Array.isArray(image) //true/false
            if (Object.prototype.toString.call(image) === '[object Object]') {
               fileName = uuid.v4() + ".jpg";
               this.addImage(image.data, fileName, productId);
            }
            else if (Object.prototype.toString.call(image) === '[object Array]') {
               image.forEach(async imageItem => {
                  fileName = uuid.v4() + ".jpg";
                  this.addImage(imageItem.data, fileName, productId);
               });
            }
            /*  const newProduct_image = await db.query(`INSERT INTO product_image (product_id, url_img)
             values ($1, $2) RETURNING product_id`,
                 [productId, fileName]); */
         }
         //* =====================================================================================================================

         if (tags.length) {
            if (discount != 0 && !tags.includes(process.env.IDTAG_SALE.toString())) {
               tags.push(process.env.IDTAG_SALE.toString());
            }
            tags.forEach(async (tagId) => {

               /// ! целое ли число tagId

               //  const existence =
               //      await db.query(`SELECT EXISTS(SELECT * FROM product_tag WHERE product_id = $1 AND tag_id = $2)`, [productId, tagId])
               //если да:
               // if (existence) {
               const newProduct_Tag = await db.query(`INSERT INTO product_tag (product_id, tag_id, time_created, time_updated)
                  values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING tag_id`,
                  [productId, tagId]);
               // }
            });
         }

         if (categories.length) {
            categories.forEach(async (categoryId) => {
               /// ! целое ли число categoryId
               //  const existence =
               //      await db.query(`SELECT EXISTS(SELECT * FROM product_category WHERE product_id = $1 AND category_id = $2)`, [productId, categoryId])
               //если да:
               //  if (existence) {
               const newProduct_category = await db.query(`INSERT INTO product_category (product_id, category_id, time_created, time_updated)
                  values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING category_id`,
                  [productId, categoryId]);
               //   }
            });
         }

         if (promo.length) {
            promo.forEach(async (promoName) => {
               const newCategory_Promo = await db.query(`INSERT INTO product_promo (product_id, promo_name, time_created, time_updated)
                   values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING promo_name`,
                  [productId, promoName]);
            });
         }

         return res.json(newProduct.rows[0]);

      }
      catch (e) {
         //  sqlErorr(e, next);
         return res.json(e);
      }
   }
   updateProduct = async (req, res, next) => {
      try {
         const { id, name, price, tagId, categoryId, promoCodes, delImg, status, discount } = req.body;
         const image = req.files?.image;

         if (validate.empty(name) || validate.empty(price)) {
            return next(ApiError.badRequest('Название, цена, статус должны быть заполнены!'));
         }
         if (status !== 'true' && status !== 'false') {
            return next(ApiError.badRequest('статус должен быть равен строке true или false'));
         }

         //const tags = (tagId === "") ? [] : tagId.split(' ');
         const tags = (tagId === "") ? [] : Array.from(new Set(tagId.split(' ')));
         //   const categories = (categoryId === "") ? [] : categoryId.split(' ');
         const categories = (categoryId === "") ? [] : Array.from(new Set(categoryId.split(' ')));
         // const promo = (promoCodes === "") ? [] : promoCodes.split(' ');
         const promo = (promoCodes === "") ? [] : Array.from(new Set(promoCodes.split(' ')));
         const deleteImg = (delImg === "") ? [] : Array.from(new Set(delImg.split(' ')));
         let fileName = '';
         //? Проверить наличие тэгов в бд tags (избыточно)
         //? Проверить наличие категорий в бд category (избыточно)

         const product = await db.query(`UPDATE product set name_product = $1, price = $2, product_status = $3, discount = $4, time_updated = CURRENT_TIMESTAMP
        WHERE id = $5 RETURNING id, name_product, price`,
            [name, price, status, discount, id]);

         //  const productId = newProduct.rows[0].id;

         const selectOldTags = await db.query(`SELECT tag_id FROM product_tag WHERE product_id = $1`, [id]);
         const oldTags = selectOldTags.rows.map(item => item.tag_id.toString());

         const selectOldCategory = await db.query(`SELECT category_id FROM product_category WHERE product_id = $1`, [id]);
         const oldCategory = selectOldCategory.rows.map(item => item.category_id.toString());

         const selectOldPromo = await db.query(`SELECT promo_name FROM product_promo WHERE product_id = $1`, [id]);
         const oldPromo = selectOldPromo.rows.map(item => item.promo_name.toString());


         // добавляем в бд тэги, кроме совпавших со старыми
         if (tags.length) {

            if (discount != 0 && !tags.includes(process.env.IDTAG_SALE.toString())) {
               tags.push(process.env.IDTAG_SALE.toString());
            }
            tags.forEach(async tag => {
               if (!oldTags.includes(tag)) {
                  await db.query(`INSERT INTO product_tag (product_id, tag_id, time_created, time_updated)
                    values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING tag_id`,
                     [id, tag]);
               }
            });

            /// удаляем из бд старые тэги не совпадающие с обновленными
            oldTags.forEach(async tag => {
               if (!tags.includes(tag)) {
                  await db.query(`DELETE FROM product_tag WHERE product_id = $1 and tag_id = $2`, [id, tag]);
               }
            });
         }
         //Если пришла пустая строка - удалить все записи
         else {
            await db.query(`DELETE FROM product_tag WHERE product_id = $1`, [id]);
         }
         //* categories=============================================
         // добавляем в бд категории, кроме совпавших со старыми
         if (categories.length) {
            categories.forEach(async category => {
               if (!oldCategory.includes(category)) {
                  await db.query(`INSERT INTO product_category (product_id, category_id, time_created, time_updated)
                    values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING category_id`,
                     [id, category]);
               }
            });
            /// удаляем из бд старые категории не совпадающие с обновленными
            oldCategory.forEach(async category => {
               if (!categories.includes(category)) {
                  await db.query(`DELETE FROM product_category WHERE product_id = $1 and category_id = $2`, [id, category]);
               }
            });
         }
         //Если пришла пустая строка - удалить все записи
         else {
            await db.query(`DELETE FROM product_category WHERE product_id = $1`, [id]);
         }
         //*Promo=======================================================================================
         if (promo.length) {
            // добавляем в бд промокоды, кроме совпавших со старыми
            promo.forEach(async code => {
               if (!oldPromo.includes(code)) {
                  await db.query(`INSERT INTO product_promo (product_id, promo_name, time_created, time_updated)
                    values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING promo_name`,
                     [id, code]);
               }
            });
            /// удаляем из бд старые промокоды не совпадающие с обновленными
            oldPromo.forEach(async code => {
               if (!promo.includes(code)) {
                  await db.query(`DELETE FROM product_promo WHERE product_id = $1 and promo_name = $2`, [id, code]);
               }
            });
         }
         // Если в промо пришла пустая строка, то удалить все промокоды у продукта
         else {
            await db.query(`DELETE FROM product_promo WHERE product_id = $1`, [id]);
         }

         //* Работа с изображениями==============================================================================================

         /*       if (image) {
                   image.forEach(async imageItem => {
                       let fileName = uuid.v4() + ".jpg";
                       imageItem.mv(path.resolve(__dirname, '..', 'static', 'flowers', fileName));
                       const newProduct_image = await db.query(`INSERT INTO product_image (product_id, url_img)
                        values ($1, $2) RETURNING product_id`,
                           [id, fileName]);
                   });
               } */

         if (image) {
            //Когда добавляется одна картинка это один обект, когда несколько - массив обектов

            if (Object.prototype.toString.call(image) === '[object Object]') {
               fileName = uuid.v4() + ".jpg";
               this.addImage(image.data, fileName, id);
            }
            else if (Object.prototype.toString.call(image) === '[object Array]') {
               image.forEach(async imageItem => {
                  fileName = uuid.v4() + ".jpg";
                  this.addImage(imageItem.data, fileName, id);
               });
            }
            /*   const newProduct_image = await db.query(`INSERT INTO product_image (product_id, url_img)
              values ($1, $2) RETURNING product_id`,
                  [id, fileName]); */

         }

         //* =====================================================================================================================
         //* Удаление картинок
         if (deleteImg.length) {
            deleteImg.forEach(async img => {
               await db.query(`DELETE FROM product_image WHERE product_id = $1 and url_img = $2`, [id, img]);
               fs.unlink(path.resolve(__dirname, '..', 'static', 'flowers', img), function (err) {
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
            });

         }
         return res.json(oldTags);

      }
      catch (e) {
         sqlErorr(e, next);
         return res.json(e);
      }
   }

   async deleteProduct(req, res, next) {
      //? Пока удалятся полностью не будет, т.к. будет сохранятся у пользователей в истории заказов, статистика и т.д.
      //? для этого внесён столбец product_status (true или false)
      //? в изменение продута можно сделать неактивным, а в удалении:
      //? будут удалятся записи в product_promo, product_tag, product_category, product_image (вместе с изображениями)
      const id = req.params.id
      if (!validate.isInt(id)) {
         return next(ApiError.badRequest('id должен быть целочисленным!'));
      }
      try {
         const product = await db.query(`UPDATE product set product_status = $1, time_updated = CURRENT_TIMESTAMP
            WHERE id = $2 RETURNING id`,
            ['false', id]);

         const selectUrlImg = await db.query(`SELECT url_img FROM product_image WHERE product_id = $1`, [id]);
         const urlImg = selectUrlImg.rows.map(item => item.url_img);
         await db.query(`DELETE FROM product_tag WHERE product_id = $1`, [id]);
         await db.query(`DELETE FROM product_promo WHERE product_id = $1`, [id]);
         await db.query(`DELETE FROM product_category WHERE product_id = $1`, [id]);
         if (urlImg.length) {
            urlImg.forEach(async img => {
               await db.query(`DELETE FROM product_image WHERE product_id = $1 and url_img = $2`, [id, img]);
               fs.unlink(path.resolve(__dirname, '..', 'static', 'flowers', img), function (err) {
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
            });

         }
         return res.json(product);
      }
      catch (e) {
         sqlErorr(e, next);
         return res.json(e);
      }
   }

}

module.exports = new ProductController();
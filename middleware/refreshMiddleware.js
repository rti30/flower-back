const jwt = require('jsonwebtoken');
const db = require('../db');
const ApiError = require('../error/ApiError');
const validate = require('../error/validateErorr');
module.exports = async function (req, res, next) {
   if (req.method === "OPTIONS") {
      next();
   }
   try {
      console.log('КУКИ', req.cookies);
      const { refreshFlower: refreshToken } = req.cookies;
      console.log('КУКА', refreshToken);
      const { fingerPrint } = req.body;
      console.log("RefResh!!!!!", req.body);

      if (validate.empty(fingerPrint)) {
         return next(ApiError.forbiden('Дополнительные данные не переданы'));
      }
      if (!refreshToken) {
         return next(ApiError.forbiden('Ошибка авторизации'));
      }
      //! Если есть сессия у пользователя по refreshToken и записаннное там устройство отличает от устройсва с которого нам сейчас предлагают обновить acsess, значит:
      //! Взлом с подменой refreshToken
      //! или
      //! У пользователя обновилось устройство, а refreshToken остался
      //! Нужно удалить прошлую запись и выдать ошибку на повторный логин
      const deviceId = (await db.query(`SELECT id FROM customer_device WHERE finger_print = $1`, [fingerPrint])).rows[0]?.id;

      /*     if(!deviceId){
             return next(ApiError.forbiden('Устройство не распознано. Необходима авторизация'));
          } */
      let id;
      const session = (await db.query(`SELECT customer_id, device_id FROM customer_session WHERE device_id = $1 and refresh = $2`, [deviceId, refreshToken])).rows;
      console.log(session);
      if (session.length) {
         id = session[0].customer_id;
         console.log('сессия найдена');
         if (session[0].device_id === deviceId) {
            console.log('девайсы совпали');
            let userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            console.log('refresh verify userData', userData);
            userData.deviceId = deviceId;
            req.user = userData;
            next();
         }
         else {
            //! сюда практически не зайти пока висит проверка на !deviceId выше. Если ее убрать можно отследить потенциальных злоумышленников, но тогда нужно прокидываnm id пользователя
            console.log("Конфликт refresh токенов!!!");
            console.log("девайс из бд", session[0].device_id);
            console.log("девайс пользователя ", deviceId);
            await db.query(`DELETE FROM customer_session WHERE customer_id = $1 and refresh = $2`, [id, refreshToken]);
            return next(ApiError.forbiden('Конфликт. Необходима повторная авторизация'));
         }
      }
      else {
         return next(ApiError.forbiden('Нет подвержденной сессии. Необходима повторная авторизация'));
      }
   }
   catch (e) {
      console.log(e);
      return next(ApiError.forbiden('Ошибка авторизации. (Вероятнее устарел токен). Необходима повторная авторизация'));
   }
}
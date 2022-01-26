const jwt = require('jsonwebtoken');
const db = require('../db');
const validate = require('../error/validateErorr');
const ApiError = require('../error/ApiError')

module.exports = async function (req, res, next) {
   try {
      const { fingerPrint } = req.body;
      console.log('auth body:', req.body);
      const accesToken = req.headers.authorization?.split(' ')[1]; //Bearer [пробел] токен
      console.log(accesToken);
      if (validate.empty(fingerPrint) || validate.empty(accesToken)) {
         return next(ApiError.badRequest('Дополнительные данные не переданы'));
      }
      if (!accesToken) {
         //  return res.status(401).json({ messege: 'Ошибка авторизации' })
         return next(ApiError.unauthorizeError('Ошибка авторизации'));
      }

      //! При logout удаляется сессия пользователя. Если у пользователя остался accsess токен, а его разлогинили, или он сам разлогинился, также удаляется если произошёл конфликт acsessToken то нужно это проверить:
      const deviceId = (await db.query(`SELECT id FROM customer_device WHERE finger_print = $1`, [fingerPrint]))?.rows[0]?.id;
      if (!deviceId) {
         return next(ApiError.forbiden('Устройство не распознано. Необходима авторизация'));
      }
      const hasSession = (await db.query(`SELECT 1 FROM customer_session WHERE device_id = $1`, [deviceId])).rows.length ? true : false;
      if (hasSession) {
         let userData = jwt.verify(accesToken, process.env.JWT_ACCESS_SECRET);
         console.log('accsess verify userData', userData);
         if (userData) {
            userData.deviceId = deviceId;
            req.user = userData;
            next();
         }
         else {
            //res.status(401).json({ messege: 'Ошибка авторизации токена. Необходима повторная авторизация' })
            return next(ApiError.forbiden('Токен не распознан. Необходима авторизация'));
         }
      }
      else {
         // res.status(401).json({ messege: 'Ошибка авторизации. Необходима повторная авторизация' })
         return next(ApiError.unauthorizeError('Ошибка авторизации. Необходима повторная авторизация'));
      }
   }
   catch (e) {
      console.log(e);
      // res.status(401).json({ messege: 'Ошибка авторизации' })
      return next(ApiError.unauthorizeError('Токен устарел, необходим повторный запрос'));
   }
}
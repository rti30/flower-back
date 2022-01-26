
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
//const { json } = require('express');




hasDevice = async (id, fingerPrint) => {
   return (await db.query(`SELECT * FROM customer_device WHERE customer_id = $1 AND finger_print = $2`, [id, fingerPrint])).rows.length ? true : false;
}
findDevice = async (id, fingerPrint) => {
   return (await db.query(`SELECT id FROM customer_device WHERE customer_id = $1 AND finger_print = $2`, [id, fingerPrint])).rows[0].id;
}
createDevice = async (id, fingerPrint, deviceInfo) => {
   return (await db.query(`INSERT INTO customer_device (customer_id, finger_print, device_info, device_status, time_created)
   values ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
      [id, fingerPrint, deviceInfo, 'false'])).rows[0].id;
}

getDeviceIfHasOrNo = async (id, fingerPrint, deviceInfo) => {
   //* Функция для сокращения кол-ва запросов к серверу, объеденяет три функции:  hasDevice ? findDevice : createDevice (2 запроса вместо 3)
   const device = (await db.query(`SELECT * FROM customer_device WHERE customer_id = $1 AND finger_print = $2`, [id, fingerPrint])).rows;
   return (device.length) ? device[0].id : (await createDevice(id, fingerPrint, deviceInfo))

}

/* checkDevice = async (id, fingerPrint, deviceInfo) => {
   ///* вспомогательная функция 

   const device = (await db.query(`SELECT * FROM customer_device WHERE customer_id = $1 AND finger_print = $2`, [id, fingerPrint])).rows;
   const deviceHas = device.length ? true : false;
   let deviceId;
   if (!deviceHas) {
      console.log('if no device');
      //* Создаем устройство
      deviceId = (await db.query(`INSERT INTO customer_device (customer_id, finger_print, device_info, device_status, time_created)
      values ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
         [id, fingerPrint, deviceInfo, 'false'])).rows[0].id;
   }
   else {
      console.log('if device Has');
      console.log(device);
      deviceId = device[0].id;
      console.log('if device Has DeviceID', deviceId);
   }
   return {
      deviceHas,
      deviceId
   }

} */
hasSession = async (id, deviceId) => {
   return (await db.query(`SELECT 1 FROM customer_session WHERE customer_id = $1 AND device_id = $2`, [id, deviceId])).rows.length ? true : false; //! если возникнет ошибка, добавил ?
}
createSession = async (id, deviceId, refreshToken) => {
   await db.query(`INSERT INTO customer_session (customer_id, device_id, refresh, time_created)
   values ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [id, deviceId, refreshToken]);
}
updateSession = async (id, deviceId, refreshToken) => {
   await db.query(`UPDATE customer_session set refresh = $1, time_created = CURRENT_TIMESTAMP
         WHERE customer_id = $2 AND device_id = $3`,
      [refreshToken, id, deviceId])
}

createConnection = async ({ id, deviceId }) => {
   let userConnects = (await db.query(`SELECT * FROM customer_connect WHERE customer_id = $1`, [id])).rows;

   if (userConnects.length > 15) {

      db.query(`DELETE top (1) customer_connect`)

      //? Ниже не работает, наверное из-за разного приведения TIMESTAMP js и psql
      /*       db.query(`UPDATE customer_connect set device_id = $1, time_created = CURRENT_TIMESTAMP
                  WHERE time_created = $2`,
               [deviceId, userConnects[0].time_created]) */

      //? Это вроде сработал 1 раз, на этом всё. (вроде даже понял почуму)
      /*       db.query(`UPDATE customer_connect set device_id = $1, time_created = CURRENT_TIMESTAMP
               WHERE customer_id = (SELECT customer_id FROM customer_connect WHERE customer_id=$2 ORDER BY customer_id LIMIT 1)`,
               [deviceId, id]) */

   }
   //else {
   db.query(`INSERT INTO customer_connect (customer_id, device_id, time_created)
      values ($1, $2, CURRENT_TIMESTAMP)`,
      [id, deviceId])
   // }
}

/* checkSession = async (id, deviceId, refreshToken) => {
   ///* вспомогательная функция 
   const hasSession = (await db.query(`SELECT 1 FROM customer_session WHERE customer_id = $1 AND device_id = $2`, [id, deviceId])).rows.length ? true : false;
   if (hasSession) {
      //* Обновляем сессию с токеном и  устройством
      console.log('if session Has');
      await db.query(`UPDATE customer_session set refresh = $1, time_created = CURRENT_TIMESTAMP
      WHERE customer_id = $2 AND device_id = $3`,
         [refreshToken, id, deviceId]);
   }
   else {
      console.log('if no session');
      //* Создаем сессию с токеном и  устройством
      await db.query(`INSERT INTO customer_session (customer_id, device_id, refresh, time_created)
            values ($1, $2, $3, CURRENT_TIMESTAMP)`,
         [id, deviceId, refreshToken]);
   }
} */


getToken = async (payload) => {
   ///* вспомогательная функция 
   // const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1m' });
   //const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '15m' });
   const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
   const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30 days' });
   return {
      accessToken,
      refreshToken,
   }
}



class UserController {

   async getAllUsers(req, res, next) {
      console.log('Получить всех пользователей');
      try {
         const users =
            await db.query(`SELECT * FROM customer`);
         console.log(users);
         res.json(users.rows);
      }
      catch (e) {
         console.log(e);
         return res.json(e);
      }
   }
   async registration(req, res, next) {

      try {
         console.log(req.body);
         if (validate.empty(req.body.name) || validate.empty(req.body.email) || validate.empty(req.body.login) || validate.empty(req.body.phone) || validate.empty(req.body.password) || validate.empty(req.body.fingerPrint) || validate.empty(req.body.deviceInfo)) {
            return next(ApiError.badRequest('Не все данные заполнены!'));
         }
         console.log("Проверка на пустоту пройдена");
         Object.keys(req.body).map(item => {
            req.body[item] = req.body[item].trim();
         });
         const { name, email, login, phone, password, fingerPrint, deviceInfo } = req.body;
         console.log(name, email, login, phone, password, fingerPrint, deviceInfo);

         let messege = {};
         messege.name = validate.name(name) ? true : 'В имени допускаются только символы алфавита';
         messege.login = validate.login(login) ? true : 'Логин должен начинатся с буквы и состоять из кирилицы или латинцы и/или цифр';
         messege.email = validate.email(email) ? true : 'Неккоретный e-mail';
         messege.phone = validate.phone(phone) ? true : 'Неккоретный номер телефона';
         messege.password = validate.password(password) ? true : 'Пароль должен быть не менее 8 символов и сдержать спец. символы: "*, $" и т. д.';
         console.log(messege);
         if (Object.values(messege).some(item => item !== true)) {
            return next(ApiError.badRequest(messege));
         }

         messege.login = (await db.query(`SELECT 1 FROM  customer  WHERE user_login = $1`, [login])).rows.length ? 'Логин уже зарегистрирован' : true;
         messege.email = (await db.query(`SELECT 1 FROM  customer  WHERE email = $1`, [email])).rows.length ? 'e-mail уже зарегистрирован' : true;
         messege.phone = (await db.query(`SELECT 1 FROM  customer  WHERE telephone = $1`, [phone])).rows.length ? 'Номер телефона уже зарегистрирован' : true;

         if (Object.values(messege).some(item => item !== true)) {
            return next(ApiError.badRequest(messege));
         }
         console.log('Валидация пройдена');
         const role = 'user';
         const hashPassword = await bcrypt.hash(password, 5);
         console.log('hashPassword', hashPassword);
         const id = (await db.query(`INSERT INTO customer (name_user, user_login, telephone, email, user_pass, user_role)
      values ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name, login, phone, email, hashPassword, role])).rows[0].id;
         const { accessToken, refreshToken } = await getToken({ id, login, role });
         const { deviceId } = await createDevice(id, fingerPrint, deviceInfo);
         await createSession(id, deviceId, refreshToken);
         console.log('токен', accessToken, refreshToken);
         res.cookie('refreshFlower', refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
         return res.json({ accessToken });
      }
      catch (e) {
         //  sqlErorr(e, next);
         console.log(e);
         return res.json(e);
      }

   }
   async login(req, res, next) {
      //  console.log('Зашли', req.body);
      try {
         const { indentificator, password, fingerPrint, deviceInfo } = req.body;
         console.log(req.body);
         if (validate.empty(indentificator) || validate.empty(password)) {
            return next(ApiError.badRequest('Не все данные заполнены!'));
         }

         const user = (validate.email(indentificator)) ? (await db.query(`SELECT id, user_pass, user_login, user_role FROM  customer  WHERE email = $1`, [indentificator])).rows[0] : (await db.query(`SELECT id, user_pass, user_login, user_role FROM  customer  WHERE user_login = $1`, [indentificator])).rows[0];
         // console.log(user);
         if (!user) {
            return next(ApiError.badRequest('Пользователь не найден'))
         }
         const { user_pass: userPass, user_login: login, id, user_role: role } = user;
         let comparePassword = bcrypt.compareSync(password, userPass);
         if (!comparePassword) {
            return next(ApiError.badRequest('Указан неверный пароль'))
         }

         console.log('Валидация прйдена');


         const deviceId = await getDeviceIfHasOrNo(id, fingerPrint, deviceInfo);

         const { accessToken, refreshToken } = await getToken({ id, login, role });
         (await hasSession(id, deviceId)) ? (await updateSession(id, deviceId, refreshToken)) : (await createSession(id, deviceId, refreshToken));


         res.header('Access-Control-Allow-Origin', req.headers.origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
         res.cookie('refreshFlower', refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
         console.log("Токен", accessToken, refreshToken);
         createConnection({ id, deviceId }); //статистика входов пусть работает асинхроно
         return res.json({ accessToken });
      }
      catch (e) {
         return console.log(e);
      }

   }

   async logout(req, res, next) {
      try {
         const { id } = req.body;
         const { refreshFlower: refreshToken } = req.cookies;
         res.clearCookie('refreshFlower');
         await db.query(`DELETE FROM customer_session where customer_id = $1 and refresh = $2`, [id, refreshToken]);
         return res.json(true);
      }
      catch (e) {
         console.log(e);
         return res.json(fasle);
      }
   }
   async logoutForAdmin(req, res, next) {
      try {
         //const {refreshFlower: refreshToken} = req.cookies;
         await db.query(`DELETE FROM customer_session where customer_id = $1`, [id]);
         return res.json(true);
      }
      catch (e) {
         return console.log(e);
      }
   }

   async refreshToken(req, res, next) {
      try {
         //* Нужно продлять сессию access токена
         //* сначало middleWare refreshMiddleWare
         const { id, login, role, deviceId } = req.user;
         const { accessToken } = await getToken({ id, login, role });
         console.log("Токен", { accessToken });
         console.log('REFRESH успешно');
         return res.json({ accessToken });
      }
      catch (e) {
         console.log(e);
         return next(ApiError.forbiden('необходима повторная аутентификация'));
      }
   }
   async auth(req, res, next) {
      try {
         //* Нужно продлять сессию refresh токена
         //* сначало middleWare authMiddleWare
         console.log('ЗАШЛИ В auth');
         const { id, login, role, deviceId } = req.user;
         const { refreshToken } = await getToken({ id, login, role });
         //! Cессия была проверена в middleWare  await checkSession(id, deviceId, refreshToken);
         await updateSession(id, deviceId, refreshToken);
         res.header('Access-Control-Allow-Origin', req.headers.origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
         res.cookie('refreshFlower', refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
         console.log('Авторизация через access успешно');
         return res.json(true);
      }
      catch (e) {
         console.log(e);
         return next(ApiError.unauthorizeError('Ошибка авторизации. Необходим запрос'));
         ///return res.json(false);
      }
   }

   async getLoginHistory(req, res, next) {
      try {
         const { id } = req.user;
         console.log("11111111111111111", id);
         const connect = (await db.query(`SELECT device_id, time_created FROM customer_connect where customer_id = $1`, [id])).rows
         console.log(connect);
         return res.json(connect);
      }
      catch (e) {
         return console.log(e);
      }
   }

}

module.exports = new UserController();
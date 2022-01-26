const ApiError = require('./ApiError');
function sqlErorr(e, next) {
    if (e.code) {
        if (e.code === '23505') {
            return next(ApiError.badRequest('Запись должна быть уникальной!'))
        }
        if (e.code === '42703') {
            return next(ApiError.badRequest('Название одного из переданных параметров не существует (столбца)'))
        }
        if (e.code === '23502') {
            return next(ApiError.badRequest('Все строки должны быть заполнены!'))
        }
        else {
            return next(ApiError.badRequest(`Неправильно заполнены данные! ${e.code}`))
        }
    }
    return next(e);
}

module.exports = sqlErorr;
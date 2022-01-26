const ApiError = require('../error/ApiError')
module.exports = function (err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ messege: err.messege })
    }
    return res.status(500).json({ messege: "Непредвиденная ошибка!" })
}
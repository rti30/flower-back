require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const path = require('path');
const cleanReservation = require('./tasks.js/cleanReservation');



const PORT = process.env.PORT || 5000;


const app = express();
app.use(cors(
    {
        origin: true,
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'static/flowers')));
app.use(express.static(path.resolve(__dirname, 'static/categories')));
app.use(express.static(path.resolve(__dirname, 'static/news')));
app.use(fileUpload({}));
app.use('/api', router);

//! Этот обработчик должен идти последним
app.use(errorHandler);



const start = async () => {
    try {
        app.listen(PORT, () => console.log(`server started on port ${PORT}`))
        setInterval(() => { cleanReservation(); }, 1000 * 60 * 3);
    }
    catch (e) {
        console.log(e);
    }
}
start();


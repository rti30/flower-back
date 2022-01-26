const db = require('../db');


module.exports = async () => {
    try {
        let reservation = (await db.query(`SELECT id, time_created, CURRENT_TIMESTAMP FROM reservation WHERE time_created < CURRENT_TIMESTAMP - interval '1 MINUTE' `)).rows
        console.log(reservation);


        let promiseReservationReturn = reservation.map(async (reservation) => {
            let orderProduct = (await db.query(`SELECT product_id, count_, promo_name FROM reservation_product WHERE reservation_id = $1 `, [reservation.id])).rows;
            console.log(orderProduct);
            promiseReservationReturn = orderProduct.map(orderProduct => {
                console.log(orderProduct);
                console.log("Возвращаем");
                db.query(`UPDATE product set count_ = count_ + $1
            WHERE id = $2`,
                    [orderProduct.count_, orderProduct.product_id]);
                if (orderProduct.promo_name) {
                    db.query(`UPDATE promo set promo_limit = promo_limit + 1
                WHERE promo_name = $1
                `, [orderProduct.promo_name]);
                }
            })
            //ищем для кажлого order пачку (product_id, count_, promo_name)
            //проходимся по пачке и для каждого item возвращаем продукты и если есть промо то промом

        })
        console.log('Ждём');
        await Promise.all(promiseReservationReturn);
        console.log('Подождали');

        reservation.map(order => {
            console.log('Удаляем');
            db.query(`DELETE FROM reservation WHERE id = $1`, [order.id]);
        })



    }
    catch (e) {
        console.log(e);
    }
}


create TABLE customer(
    id serial PRIMARY KEY,
    name_user VARCHAR(255) NOT NULL,
    user_login VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    user_pass VARCHAR(255) NOT NULL,
    user_role VARCHAR(255)
);
create TABLE customer_device(
    id serial PRIMARY KEY,
    device_info VARCHAR(255) NOT NULL,
    finger_print VARCHAR(255) NOT NULL,
    customer_id INTEGER NOT NULL,
    device_status VARCHAR(255) NOT NULL,
    time_created TIMESTAMPTZ,
    FOREIGN KEY (customer_id) REFERENCES customer (id)
);
create TABLE customer_session(
    customer_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    refresh VARCHAR(255),
    time_created TIMESTAMPTZ,
    FOREIGN KEY (customer_id) REFERENCES customer (id),
    FOREIGN KEY (device_id) REFERENCES customer_device (id)
);

create TABLE customer_connect(
    customer_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    time_created TIMESTAMPTZ,
    FOREIGN KEY (customer_id) REFERENCES customer (id),
    FOREIGN KEY (device_id) REFERENCES customer_device (id)
);

create TABLE customer_adress(
    customer_id INTEGER NOT NULL,
    adress VARCHAR(255) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customer (id)
);

create TABLE product(
    id serial PRIMARY KEY,
    name_product VARCHAR(255) UNIQUE,
    price double precision NOT NULL,
    rating double precision DEFAULT 0,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    discount INTEGER DEFAULT 0,
    count_ INTEGER DEFAULT 5,
    initiator_ INTEGER,
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE customer_rating(
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL, 
    reviews double precision NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customer (id),
    FOREIGN KEY (product_id) REFERENCES product (id)
);
create TABLE customer_like(
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product (id),
    FOREIGN KEY (customer_id) REFERENCES customer (id)
);

create TABLE cart(
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    count_ INTEGER CHECK(count_ > 0)

    FOREIGN KEY (product_id) REFERENCES product (id),
    FOREIGN KEY (customer_id) REFERENCES customer (id)
);

create TABLE reservation(
id VARCHAR(255) UNIQUE PRIMARY KEY,
customer_id INTEGER NOT NULL,
total double precision, 
discount double precision DEFAULT 0, 
  adress VARCHAR(255) NOT NULL,
time_created TIMESTAMPTZ,
CHECK(total > 0),
CHECK(discount >= 0),
FOREIGN KEY (customer_id) REFERENCES customer (id)
);

create TABLE reservation_product(
    reservation_id VARCHAR(255) NOT NULL,
    product_id INTEGER NOT NULL,
    name_product VARCHAR(255) NOT NULL,
    count_ INTEGER,
    promo_name VARCHAR(255),
    price double precision,
    price_with_discount double precision,
    FOREIGN KEY (reservation_id) REFERENCES reservation(id) on delete cascade,
    FOREIGN KEY (product_id) REFERENCES product (id),
    FOREIGN KEY (promo_name) REFERENCES promo (promo_name),
    CHECK( price_with_discount > 0),
    CHECK(price > 0),
    CHECK(count_ > 0)
);
create TABLE reservation_adressee(
    reservation_id VARCHAR(255) NOT NULL,
    name_ VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    adress VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservation(id) on delete cascade
);


create TABLE order_(
id VARCHAR(255) UNIQUE PRIMARY KEY,
customer_id INTEGER NOT NULL,
total double precision, 
discount double precision DEFAULT 0, 
adress VARCHAR(255) NOT NULL,
time_created TIMESTAMPTZ,
CHECK(total > 0),
CHECK(discount >= 0),
FOREIGN KEY (customer_id) REFERENCES customer (id)
);
create TABLE order_adressee(
    order_id VARCHAR(255) NOT NULL,
    name_ VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    adress VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES order_(id) on delete cascade
);

create TABLE order_status(
    order_id VARCHAR(255) NOT NULL,
    status_ VARCHAR(255) NOT NULL,
    time_created TIMESTAMPTZ,
    FOREIGN KEY (order_id) REFERENCES order_ (id) on delete cascade
);
create TABLE order_product(
    order_id VARCHAR(255) NOT NULL,
    product_id INTEGER NOT NULL,
    name_product VARCHAR(255) NOT NULL,
    count_ INTEGER,
    promo_name VARCHAR(255),
    price double precision,
    price_with_discount double precision,
    FOREIGN KEY (order_id) REFERENCES order_(id) on delete cascade,
    FOREIGN KEY (product_id) REFERENCES product (id),
    FOREIGN KEY (promo_name) REFERENCES promo (promo_name),
    CHECK( price_with_discount > 0),
    CHECK(price > 0),
    CHECK(count_ > 0)
);

create TABLE promo(
    promo_name VARCHAR(255) PRIMARY KEY,
    promo_value INTEGER NOT NULL,
    promo_limit INTEGER NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE product_promo(
    product_id INTEGER NOT NULL,
    promo_name  VARCHAR(255) NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (product_id)  REFERENCES product (id),
    FOREIGN KEY (promo_name)  REFERENCES promo (promo_name),
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE product_image(
    url_img VARCHAR(510) NOT NULL,
    product_id INTEGER,
    FOREIGN KEY (product_id)  REFERENCES product (id)
);



create TABLE tag(
    id serial PRIMARY KEY,
    tag_name VARCHAR(255) UNIQUE NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE product_tag(
    product_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (product_id)  REFERENCES product (id),
    FOREIGN KEY (tag_id)  REFERENCES tag (id),
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE category(
    id serial PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    description_ VARCHAR(510),
    category_img VARCHAR(510) NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);

create TABLE product_category(
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER,
    FOREIGN KEY (product_id)  REFERENCES product (id),
    FOREIGN KEY (category_id)  REFERENCES category (id),
    FOREIGN KEY (initiator_) REFERENCES customer (id)
);


create TABLE news(
    id serial PRIMARY KEY,
    parametr_name VARCHAR(255) NOT NULL,
    parametr VARCHAR(50) NOT NULL,
    image_ VARCHAR(510) NOT NULL,
    time_created TIMESTAMPTZ,
    time_updated TIMESTAMPTZ,
    initiator_ INTEGER
);



/* SELECT product.id, product.name_product, product.price, category.category_name, tag.tag_name, product.rating, promo.promo_name
(SELECT ', '+ CAST(Values AS VARCHAR))
FROM product, category, tag, product_image, promo, product_promo, product_tag, product_category
WHERE  product.id = 66 and product.product_status = true and product.id = product_promo.product_id and product_promo.promo_name = promo.promo_name
and product.id = product_tag.product_id and product_tag.tag_id = tag.id
and product.id = product_category.product_id and product_category.category_id = category.id
GROUP BY product.id, product.name_product, product.price, category.category_name, tag.tag_name, product.rating, promo.promo_name; */
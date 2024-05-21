import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Mandatory type filter
    //評價篩選
    let baseQuery = `
      SELECT 
          product.*,
          lesson_category.name AS lesson_category_name,
          COUNT(product_review.product_id) AS review_count, 
          AVG(product_review.stars) AS average_rating, 
          teacher_info.name AS teacher_name,  
          teacher_info.img AS teacher_img,     
          teacher_info.info AS teacher_info  
      FROM 
          product
      LEFT JOIN 
          product_review ON product.id = product_review.product_id
      LEFT JOIN 
          teacher_info ON product.teacher_id = teacher_info.id
          LEFT JOIN 
            lesson_category ON product.lesson_category_id = lesson_category.id 
      WHERE 
          product.type = ?`;

    //價格篩選
    let queryParams = [2];
    // Additional filters
    const { priceLow, priceHigh } = req.query;

    if (priceLow && priceHigh) {
      baseQuery += ' AND product.price >= ? AND product.price <= ?';
      queryParams.push(priceLow, priceHigh);
    }

    baseQuery += ' GROUP BY product.id ORDER BY product.id;';
    // Execute the query
    const [results] = await db.execute(baseQuery, queryParams);

    // Response
    if (results.length > 0) {
      res.status(200).json(results);
      console.log(results);
    } else {
      res.status(404).json({ message: '沒有找到相應的資訊' });
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.status(500).json({ error: '發生錯誤' });
  }
});


//lesson_category
router.get('/categories', async (req, res) => {
  try {
    let [lesson_category] = await db.execute(
      'SELECT * FROM `lesson_category` '
    );

    if (lesson_category) {
      res.status(200).json(lesson_category);
      console.log(lesson_category);
    } else {
      res.status(404).json('沒有找到相應的資訊');
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.status(500).json('Internal server error');
  }
});

//特定分類的資料
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    let query = `
      SELECT 
          product.*,
          lesson_category.name AS lesson_category_name,
          COUNT(product_review.product_id) AS review_count, 
          AVG(product_review.stars) AS average_rating, 
          teacher_info.name AS teacher_name,  
          teacher_info.img AS teacher_img,     
          teacher_info.info AS teacher_info  
      FROM 
          product
      LEFT JOIN 
          product_review ON product.id = product_review.product_id
      LEFT JOIN 
          teacher_info ON product.teacher_id = teacher_info.id
      LEFT JOIN 
          lesson_category ON product.lesson_category_id = lesson_category.id
      WHERE 
          product.type = 2`;

    let queryParams = [];

    // 如果 category 不是空字符串或'0'，则增加类别过滤条件
    if (category !== '' && category !== '0') {
      query += ' AND product.lesson_category_id = ?';
      queryParams.push(category);
    }

    // 添加 GROUP BY 子句以便正确聚合 product_review 数据
    query += ' GROUP BY product.id';

    let [lessons] = await db.execute(query, queryParams);

    if (lessons.length > 0) {
      res.status(200).json(lessons);
    } else {
      res.status(404).send({ message: '没有找到相应的信息' });
    }
  } catch (error) {
    console.error('发生错误：', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 獲得單筆課程資料＋review
router.get('/:id', async (req, res, next) => {
  let luid = req.params.id;
  console.log(luid);
  try {
    let [data] = await db.execute(
      'SELECT' +
        '  p.*, ' +
        // '  pr.user_id AS pr_user_id, pr.content AS pr_content, pr.likes AS pr_likes, ' +
        '  lc.name AS lesson_category_name, ' +
        '  COUNT(pr.product_id) AS review_count, ' +
        '  AVG(pr.stars) AS average_rating ' +
        'FROM ' +
        '  `product` AS p ' +
        '  LEFT JOIN `product_review` AS pr ON p.id = pr.product_id ' +
        '  LEFT JOIN `lesson_category` AS lc ON p.lesson_category_id = lc.id ' +
        'WHERE ' +
        '  p.`puid` = ? ' +
        '  AND p.`lesson_category_id` IN ( ' +
        '    SELECT `lesson_category_id` FROM `product` WHERE `puid` = ? ' +
        '  ) ' +
        'GROUP BY ' +
        '  p.id;',

      [luid, luid]
    );

    //FIXME sql可以改一下

    let [product_review] = await db.execute(
      `
      SELECT pr.*, u.*
      FROM product p
      JOIN product_review pr ON p.id = pr.product_id
      JOIN user AS u ON pr.user_id = u.id
      WHERE p.puid = ?
    `,
      [luid]
    );

let [youwilllike] = await db.execute(
  'SELECT p.*, ' +
    'COUNT(pr.product_id) AS review_count, ' +
    'AVG(pr.stars) AS average_rating, ' +
    'ti.name AS teacher_name ' +
    'FROM `product` AS p ' +
    'JOIN (SELECT `lesson_category_id` FROM `product` WHERE `puid` = ?) AS sub ' +
    'ON p.`lesson_category_id` = sub.`lesson_category_id` ' +
    'JOIN `product_review` AS pr ON p.`id` = pr.`product_id` ' +
    'JOIN `teacher_info` AS ti ON p.`teacher_id` = ti.`id` ' +
    'GROUP BY p.id',
  [luid]
);


    if ({ data, product_review, youwilllike }) {
      console.log({ data });
      res.status(200).json({ data, product_review, youwilllike });
    } else {
      res.status(404).send('沒有找到相應的資訊');
    }
  } catch (error) {
    console.error('發生錯誤:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
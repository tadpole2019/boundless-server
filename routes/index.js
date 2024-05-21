import express from 'express';
import db from '../db.js';


const router = express.Router();

/* GET home page. */
router.get('/', async (req, res) => {
  const [data] = await db
    .execute('SELECT product.img, product.puid, lesson_category.name AS lesson_category_name FROM product JOIN lesson_category ON product.lesson_category_id = lesson_category.id ORDER BY product.sales ASC LIMIT 0, 4')
    .catch((error) => {
      res.json({ status: 'error', error });
      return;
    });
  if (data.length > 0) {
    res.json({ status: 'success', data });
  };
});

export default router;

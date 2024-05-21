import express, { json } from 'express';
import db from '../db.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// 取得所有樂器資料
// instrument?page=1&order=ASC&brandSelect=1&priceLow=&priceHigh=&score=all&sales=false&keyword=
router.get('/', async (req, res, next) => {
  //  console.log(req.query);
  // return
  // let priceLow = req.query.priceLow;
  // let priceHigh = req.query.priceHigh;
  let priceLow = req.query.priceLow !== undefined ? req.query.priceLow : ''; // 如果沒有提供查詢參數，則賦值為空字符串
  let priceHigh = req.query.priceHigh !== undefined ? req.query.priceHigh : '';
  console.log(priceLow);
  console.log(priceHigh);


  // 取得所有樂器分類資料
  const [category] = await db.execute(
    'SELECT `id`, `parent_id`, `name` FROM `instrument_category`'
  );


  let [instrument] = await db
    .execute(
      `SELECT product.*, instrument_category.name AS category_name 
  FROM product 
  JOIN instrument_category 
  ON product.instrument_category_id = instrument_category.id 
  WHERE type = 1`
    )
    .catch((error) => {
      console.log(error);
      return undefined;
    });
    


  let page = Number(req.query.page) || 1; // 目前頁碼
  let dataPerpage = 20; // 每頁 20 筆
  let offset = (page - 1) * dataPerpage; // 取得下一批資料
  let pageTotal = Math.ceil(instrument.length / dataPerpage); // 計算總頁數
  let pageString = ' LIMIT ' + offset + ',' + dataPerpage;


   let finalData;
   let finalInstrument=instrument;
  if (Object.keys(req.query).length !== 0) {
    // 所有篩選條件，預設條件: type=1(樂器)
    let sqlString = 'SELECT product.*, instrument_category.name AS category_name FROM `product` JOIN instrument_category ON product.instrument_category_id = instrument_category.id WHERE `type` = 1';
    const brandSelect =
      req.query.brandSelect !== ''
        ? ' AND `brand_id` = ' + parseInt(req.query.brandSelect)
        : '';

    const priceLow =
      req.query.priceLow != '' && !isNaN(parseInt(req.query.priceLow))
        ? ' AND `price` >= ' + parseInt(req.query.priceLow)
        : '';

    const priceHigh =
      req.query.priceHigh != '' && !isNaN(parseInt(req.query.priceHigh))
        ? ' AND `price` <= ' + parseInt(req.query.priceHigh)
        : '';

    const score =''
      // req.query.score !== 'all'
      // ? ' AND `score` = ' + parseInt(req.query.score)
      // : '';
     
    const promotion =
     req.query.promotion !== 'true'
     ? ""
     : " AND `discount_state` = 1"


    sqlString += brandSelect + priceLow + priceHigh + score + promotion;
    console.log(sqlString)
    const [instrument2] = await db.execute(sqlString).catch(() => {
      return [];
    })
    finalInstrument= instrument2

    page = Number(req.query.page) || 1; // 目前頁碼
    dataPerpage = 20; // 每頁 20 筆
    offset = (page - 1) * dataPerpage; // 取得下一批資料
    if (instrument2) {
    pageTotal = Math.ceil(instrument2.length / dataPerpage); // 計算總頁數
    }
    pageString = ' LIMIT ' + offset + ',' + dataPerpage;

   sqlString += pageString;
   const [data] = await db.execute(sqlString).catch(() => {
    return [];
  });
    finalData=data
  }else{
      // 沒有篩選條件
    const [data] = await db 
    .execute(
      'SELECT product.*, instrument_category.name AS category_name FROM `product` JOIN instrument_category ON product.instrument_category_id = instrument_category.id  WHERE `type` = 1 LIMIT 0, 20',
    )
    .catch(() => {
      return undefined;
    })

    finalData=data
  }
if (finalData){
// console.log(finalData);
   res.status(200).json({
    instrument: finalData,
    pageTotal,
    page,
  });

}else {
  res.status(400).send('發生錯誤');
}
});


//instrument_category
router.get('/categories', async (req, res) => {
  try {
    let [productCategory] = await db.execute(
      'SELECT `id`, `parent_id`, `name` FROM `instrument_category`'
    );

    if (productCategory) {
      res.json(productCategory);
    } else {
      res.json('沒有找到相應的資訊');
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.json('發生錯誤');
  }
});


//特定分類的資料
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    let query = 'SELECT product.*, instrument_category.name AS category_name FROM `product` JOIN instrument_category ON product.instrument_category_id = instrument_category.id WHERE product.type = 1';
    let queryParams = [];
   
      // 如果 category 不是空字串或'0'，則增加類別過濾條件
      if (category !== '' && category !== '0') {
        query += ' AND product.instrument_category_id = ?';
        queryParams = [category];
      }

      let [instrument] = await db.execute(query, queryParams);

    if (instrument.length > 0) {
      res.status(200).json(instrument);
    } else {
      res.status(404).send({ message: '沒有找到相應的資訊' });
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 檢索屬於特定 puid 的產品，並且通過左連接獲取與之相關聯的產品評論
// 檢索屬於特定 puid 的產品，並且通過左連接獲取與之相關聯的產品評論
//  router.get("/:id", async (req, res, next) => {
//   let puid = req.params.id;
//   console.log(puid);
//   let [data] = await db.execute(
//     "SELECT p.*, pr.*, ic.name AS category_name " +
//     "FROM `product` AS p " +
//     "LEFT JOIN `product_review` AS pr ON p.id = pr.product_id " +
//     "LEFT JOIN `instrument_category` AS ic ON p.instrument_category_id = ic.id " +
//     "WHERE p.`puid` = ?",
//     [puid]
//   )
//   )
//    .catch(() => {
//     return undefined;
//   });

//   if (data) {
//     console.log(data);
//     res.status(200).json(data);
//   } else {
//     res.status(400).send("發生錯誤");
//   }
// });

//獲得單筆樂器資料跟評論
router.get('/:id', async (req, res, next) => {
  let puid = req.params.id;
  console.log(puid);
  try {
    // 商品詳細資料
    // 商品詳細資料
    let [data] = await db.execute(
      'SELECT p.*, ic.name AS category_name ' +
        'FROM `product` AS p ' +
        'LEFT JOIN `instrument_category` AS ic ON p.instrument_category_id = ic.id ' +
        'WHERE p.`puid` = ?',
      [puid]
    );
    data = data[0];
    // console.log(data);

    let [reviewData] = await db.execute(
      'SELECT `product_review`.*, `user`.uid, `user`.name, `user`.nickname, `user`.img FROM `product_review` JOIN `user` ON `product_review`.user_id = `user`.id WHERE `product_review`.product_id = ?',
      [data.id]
    );
    // console.log(reviewData);

    let [youmaylike] = await db.execute(
      'SELECT p.*, instrument_category.name AS category_name FROM `product` AS p ' +
        'JOIN `instrument_category` ' +
        'ON p.`instrument_category_id` = instrument_category.id WHERE instrument_category.id =  (SELECT `instrument_category_id` FROM `product` WHERE `puid` = ?) LIMIT 0,5',
      [puid]
    );

    if ({ data, youmaylike }) {
      // console.log({ data });
      res.status(200).json({ data, reviewData, youmaylike });
    } else {
      res.status(400).send('發生錯誤');
    }
  } catch (error) {
    if ({ data, youmaylike }) {
      // console.log({ data });
      res.status(200).json({ data, reviewData, youmaylike });
    } else {
      res.status(400).send('發生錯誤');
    }
  } 
});

// function App() {
//   const [selectedBrand, setSelectedBrand] = useState(null)

//   // Input Filter
//   const [query, setQuery] = useState("")
//   const handleInputChange = event => {
//     setQuery(event.target.value)
//   }
// }
// }

export default router;
import express, { json } from "express";
import db from "../db.js";
import multer from "multer";
import moment from "moment";

//上傳檔案
import { renameSync } from "fs";
import { dirname, resolve, extname } from "path";
import { fileURLToPath } from "url";
//方法2
import formidable from "formidable";
const __dirname = dirname(fileURLToPath(import.meta.url));



// const testdirname = `/`;
// console.log(__dirname)
// console.log(testdirname)


//token相關
import jwt from "jsonwebtoken";
import "dotenv/config.js";

// 從環境檔抓取secretKey(token加密用)
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const router = express.Router();
const upload = multer();

//得到所有會員資料
// let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");
// console.log(userData)



//在外部設定時間戳記 當作上傳檔案時的中介 以免檔名跟資料庫的名稱不同
const setTimestamp = (req, res, next) => {
  req.timestamp = Date.now();
  next(); // 调用 next() 将控制传递给下一个中间件或路由处理程序
};

//上傳檔案-----------------------
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, resolve(__dirname, "../public/user"));
  },
  filename: function (req, file, cb) {

    // let newName = (req.timestamp + req.index) + extname(file.originalname);
    let newName = "avatar_user00" + req.timestamp + extname(file.originalname);
    cb(null, newName)
  }
})
const uploadTest = multer({ storage: storage })
//此路由為在使用者編輯頁時 上傳頭像使用
router.post("/upload1", setTimestamp, uploadTest.single('myFile'), async (req, res) => {
  const id = req.body.name;
  const newName = "avatar_user00" + req.timestamp + ".jpg";

  // 更新資料庫
  const [result] = await db.execute(`UPDATE user SET img = ? WHERE id = ?;`, [newName, id]);


  // res.json({ status: 'success', data: { result } })
  //導回編輯頁
  res.redirect('http://localhost:3000/user/user-info-edit');

});

//上傳檔案-----------------------

//GET 測試 - 得到所有會員資料
router.get("/", async (req, res, next) => {
  try {
    let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");

    if (userData) {
      res.json(userData);
      // console.log(userData);
    } else {
      res.json("沒有找到相應的資訊");
    }
  } catch (error) {
    console.error("發生錯誤：", error);
    res.json("發生錯誤");
  }
});

// 動態路由來到個人首頁
router.get("/user-homepage/:uid", async (req, res) => {
  const uid = req.params.uid;
// console.log(uid)
  // 獲得該會員資訊
  // const [result] = await db.execute(`UPDATE user SET img = ? WHERE id = ?;`, [newName, id]);
  try {



    // let [userHomePageData] = await db.execute("SELECT * FROM `user` WHERE `uid` = ? AND `valid` = 1", [uid]);

    //正確版 未join
    // let [userHomePageData] = await db.execute("SELECT email, nickname, phone, birthday , genre_like , play_instrument , info, gender , privacy , my_jam , photo_url , img FROM `user`  WHERE `uid` = ? AND `valid` = 1", [uid]);

    //正確版 join
    let [userHomePageData] = await db.execute("SELECT email, nickname, phone, birthday , genre_like , play_instrument , info, gender , privacy , j.state AS my_jamState, j.name AS my_jam , photo_url , img FROM `user` u LEFT JOIN `jam` j ON CONVERT(j.juid USING utf8mb4) = CONVERT(u.my_jam USING utf8mb4) WHERE u.uid = ? AND u.valid = 1", [uid])

    //單獨
    // let [jamNameData] = await db.execute("SELECT  j.name AS my_jam FROM `user` u LEFT JOIN `jam` j ON CONVERT(j.juid USING utf8mb4) = CONVERT(u.my_jam USING utf8mb4) WHERE u.uid = ?", [uid])

    let result = userHomePageData[0]
    // console.log(result)
    if (userHomePageData) {
      res.json(result);
      // console.log(userHomePageData);
    } else {
      res.json("沒有找到相應的資訊");
    }
  } catch (error) {
    console.error("發生錯誤：", error);
    res.json("發生錯誤");
  }
  // res.json({ status: 'success', data: { result } })
});

// 個人首頁 獲得該使用者發布之文章 code來自article.js
router.get('/homepageArticle/:uid', async (req, res) => {
  const uid = req.params.uid;
  // console.log(uid);
  
  // 再不更動article資料庫的情況下 透過uid 找到user id
  const [userIDResult] = await db.execute(
    "SELECT * FROM `user` WHERE `uid` = ? AND `valid` = 1",[uid]
  );
 let userID
  if(userIDResult){
   userID = userIDResult[0].id;
  }
  try {
    let [articleData] = await db.execute(
      'SELECT article.*, article_category.name AS category_name,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img, article_user.nickname AS article_author_name, article_user.img AS article_author_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id LEFT JOIN user AS article_user ON article.user_id = article_user.id  WHERE article.user_id = ? ORDER BY article.id',[userID]
    );
    if (articleData) {
      res.json(articleData);
    } else {
      res.json('沒有找到相應的資訊');
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.json('發生錯誤' + error);
  }
});

// 我的文章頁 獲得該使用者發布之文章 code來自article.js
router.get('/MyArticle/:id', async (req, res) => {
  const id = req.params.id;
  // console.log(id);
  
  // 再不更動article資料庫的情況下 透過uid 找到user id
  const [userIDResult] = await db.execute(
    "SELECT * FROM `user` WHERE `id` = ? AND `valid` = 1",[id]
  );
 let userID
  if(userIDResult){
   userID = userIDResult[0].id;
  }
  // console.log(userIDResult[0]);
  try {
    let [articleData] = await db.execute(
      'SELECT article.*, article_category.name AS category_name,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img, article_user.nickname AS article_author_name, article_user.img AS article_author_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id LEFT JOIN user AS article_user ON article.user_id = article_user.id  WHERE article.user_id = ? ORDER BY article.id',[userID]
    );
    if (articleData) {
      res.json(articleData);
    } else {
      res.json('沒有找到相應的資訊');
    }
  } catch (error) {
    console.error('發生錯誤：', error);
    res.json('發生錯誤' + error);
  }
});

//登入 目前設定 email 就是帳號 不可更改
router.post("/login", upload.none(), async (req, res) => {
  let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");
  const { email, password } = req.body;
  const user = userData.find(
    (u) => u.email === email && u.password === password
  );
  if (user) {
    const token = jwt.sign(
      {
        // account: user.account, 沒用到帳號先註解測試
        id: user.id,
        name: user.name,
        email: user.email,
        img: user.img,
        my_jam: user.my_jam,
      },
      accessTokenSecret,
      //token 認證的時長原為30m
      { expiresIn: "3d" }
    );
    res.status(200).json({
      status: "success",
      token,
    });
  } else {
    res.status(400).json({
      status: "error",
      message: "使用者帳號或密碼錯誤。",
    });
  }
});

router.post("/logout", checkToken, async (req, res) => {
  // console.log(req.decoded)
  let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");
  const user = userData.find((u) => u.email === req.decoded.email);
  if (user) {
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        img: user.img,
        my_jam: user.my_jam,
      },
      accessTokenSecret,
      { expiresIn: "-10s" }
    );
    res.status(200).json({
      status: "logout success",
      token,
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "登出失敗，請稍後重整頁面再試。",
    });
  }
});

router.post("/status", checkToken, async (req, res) => {
  let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");
  const user = userData.find((u) => u.email === req.decoded.email);
  if (user) {
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        mail: user.mail,
        img: user.img,
        my_jam: user.my_jam,
      },
      accessTokenSecret,
      { expiresIn: "3d" }
    );
    res.json({
      status: "token ok",
      token,
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "請登入",
    });
  }
});

// GET - 得到單筆會員資料資料(注意，有動態參數時要寫在GET區段最後面)
router.get("/:id", checkToken, async function (req, res) {
  const id = req.params.id;
  //沒用 後端抓不到localStorage
  // const token = localStorage.getItem(appKey)
  // userData = jwtDecode(token)
  // const id = userData.id

  // 檢查是否為授權會員，只有授權會員可以存取自己的資料
  // if (req.user.id !== id) {
  //   return res.json({ status: 'error', message: '存取會員資料失敗' })
  // }

  //所有資料
  // const [singerUser] =  await db.execute(`SELECT * FROM \`user\` WHERE \`id\` = ? AND \`valid\` = 1`, [id]);

  // 不回傳密碼跟創建時間的版本  3/18 原版
  // const [singerUser] = await db.execute(
  //   `SELECT \`id\` , \`uid\` ,\`name\` ,\`email\`,\`phone\`,\`postcode\`,\`country\`,\`township\`,\`address\`,\`birthday\`,\`genre_like\`,\`play_instrument\`,\`info\`,\`img\`,\`gender\`,\`nickname\`,\`google_uid\`,\`photo_url\`,\`privacy\`,\`my_lesson\` ,\`my_jam\` FROM \`user\` WHERE \`id\` = ? AND \`valid\` = 1`,
  //   [id]
  // );

  // 不回傳密碼跟創建時間的版本  3/18 原版 join jam.name 來當my_jamname 名稱版本 
  let [singerUser] = await db.execute("SELECT u.id, uid, u.name , email, nickname, phone, birthday, postcode, country, township, address, genre_like, play_instrument , info, gender , privacy, google_uid, j.state AS my_jamState, j.name AS my_jamname, my_jam , photo_url, my_lesson, img FROM `user` u LEFT JOIN `jam` j ON CONVERT(j.juid USING utf8mb4) = CONVERT(u.my_jam USING utf8mb4) WHERE u.id = ? AND u.valid = 1", [id])

  const resUser = singerUser[0];

  return res.json(resUser);
  //改檔老師寫法
  // return res.json({ status: 'success', data: { resUser } })
});


// GET - 得到單筆會員資料資料 全部資料版本含密碼
router.get("/profile/:id", checkToken, async function (req, res) {
  const id = req.params.id;
  //所有資料
  const [singerUser] =  await db.execute(`SELECT * FROM \`user\` WHERE \`id\` = ? AND \`valid\` = 1`, [id]);
  const resUser = singerUser[0];
  return res.json(resUser);
  //改檔老師寫法
  // return res.json({ status: 'success', data: { resUser } })
});

//會員更新資訊
router.post("/editProfile/:id", checkToken, async function (req, res) {
  const id = req.params.id;
  let { email, name, password, phone, postcode, country, township, address, birthday, genre_like, play_instrument, info, gender, nickname, privacy } = req.body;
  // console.log(req.body)
  // birthday = new Date(birthday)
  // if(birthday.length > 10){
  //   birthday = birthday.split('T')[0]
  //   console.log(birthday)
  // }


  // 更新資料庫
  const [result] = await db.execute(`UPDATE user SET email = ?, name =? , phone = ?, postcode = ? , country = ? , township = ?, address = ? , birthday = STR_TO_DATE(?, '%Y-%m-%d') , genre_like = ? , play_instrument = ?, info = ?, gender = ?, nickname = ?, privacy = ? WHERE id = ?;`, [email, name, phone, postcode, country, township, address, birthday, genre_like, play_instrument, info, gender, nickname, privacy, id]);


  // const resUser = singerUser[0];
  // return res.json(resUser);
  //改檔老師寫法
  return res.json({ status: 'success', data: { result } })
});

//該使用者查詢訂單 checkToken 先拿掉 記得加回來
//router.post("/order/:id", checkToken, async function (req, res) {
  router.post("/order/:id", async function (req, res) {
  const id = req.params.id;
  // console.log(id)

  // 透過id 找到user uid
  const [userUIDResult] = await db.execute(
    "SELECT `uid` FROM `user` WHERE `id` = ? AND `valid` = 1",[id]
  );
  let UID
  if(userUIDResult){
  UID = userUIDResult[0].uid;
  }

 //正確版 join
  //  let [userHomePageData] = await db.execute("SELECT email, nickname, phone, birthday , genre_like , play_instrument , info, gender , privacy , j.state AS my_jamState, j.name AS my_jam , photo_url , img FROM `user` u LEFT JOIN `jam` j ON CONVERT(j.juid USING utf8mb4) = CONVERT(u.my_jam USING utf8mb4) WHERE u.uid = ? AND u.valid = 1", [uid])

  // 透過UID抓訂單 
  const [orderResult] = await db.execute(`SELECT * FROM order_total WHERE user_id = ?;`,[UID])

  let productResult = []; 

  if (orderResult.length > 0) {
    for (const order of orderResult) {
      const orderId = order.ouid;
    
      // 使用當前訂單的 id 進行查詢
      const [result] = await db.execute('SELECT  p.* , oi.* , ot.* FROM `order_item` oi LEFT JOIN `product` p ON CONVERT(p.id USING utf8mb4) = CONVERT(oi.product_id USING utf8mb4) LEFT JOIN `order_total` ot ON CONVERT(ot.ouid USING utf8mb4) = CONVERT(oi.ouid USING utf8mb4) WHERE oi.ouid = ?;', [orderId]);
      if(result != ""){
        productResult.push(result); // 將查詢結果添加到 productResult 中
      }
      
    }
  }

  // const [productResult] = await db.execute(`SELECT * FROM order_item WHERE order_id = ?;`,[orderResult[0].id])
  // return res.json({ status: 'success', data: { orderResult , productResult}  })
  return res.json({ status: 'success', data: {productResult}})
  // return res.json({ status: 'success' })
});

// 註冊 = 檢查資料庫是否有此email及密碼 ,如果沒有 就增加sql
router.post('/', async (req, res) => {
  const uuid = generateUid()
  // req.body資料範例
  // {
  //     "name":"金妮",
  //     "email":"ginny@test.com",
  //     "username":"ginny",
  //     "password":"12345"
  // }

  // 給予註冊當下時間 台北時區
  const currentTime = new Date();
  const taipeiTime = new Date(currentTime.getTime() + 8 * 60 * 60 * 1000);
  const YYYYMMDDTime = taipeiTime.toISOString().slice(0, 19).replace("T", " "); // 將時間轉換為 'YYYY-MM-DD HH:mm:ss' 格式

  // 要新增的會員資料
  const newUser = req.body;

  // 檢查從前端來的資料哪些為必要(name, username...)
  if (!newUser.email || !newUser.password || !newUser.passwordCheck) {
    return res.json({ status: "error", message: "缺少必要資料" });
  }

  // 密碼請由英數8~20位組成  --先註解方便測試
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(newUser.password)) {
    return res.json({ status: 'error 3', message: '密碼請由英數8~20位組成' });
  }

  // return res.json({ status: 'success 2', message: '成功' })
const uNickname = "USER-" + uuid 
  // 先查詢是否已存在該用戶
  const [users] = await db.execute("SELECT * FROM user WHERE email = ?;", [
    newUser.email,
  ]);
  if (users.length > 0) {
    // 用戶已存在
    return res.json({ status: "error 2", message: "該帳號已存在" });
  } else {
    // 用戶不存在，插入新用戶
    const [result] = await db.execute('INSERT INTO user (nickname , email, uid, password, created_time , valid) VALUES (?, ?, ?, ?, ?, 1);', [uNickname ,newUser.email, uuid, newUser.password, YYYYMMDDTime]);
    // console.log('User inserted:', result);
    const [user_id] = await db.execute('SELECT id FROM user WHERE uid = ?', [uuid])
    const [coupon] = await db.execute('INSERT INTO coupon (user_id, coupon_template_id) VALUES (?, 1)', [user_id[0].id])
  }

  // 成功建立會員的回應
  // 狀態`201`是建立資料的標準回應，
  // 如有必要可以加上`Location`會員建立的uri在回應標頭中，或是回應剛建立的資料
  // res.location(`/users/${user.id}`)
  return res.status(201).json({
    status: "success",
    data: null,
  });
});

//檢查token 當作中介使用
function checkToken(req, res, next) {
  let token = req.get("Authorization");

  if (token && token.indexOf("Bearer ") === 0) {
    token = token.slice(7);
    jwt.verify(token, accessTokenSecret, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ status: "error", message: "登入驗證失效，請重新登入。" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res
      .status(401)
      .json({ status: "error", message: "無登入驗證資料，請重新登入。" });
  }
}
//uid
function generateUid() {
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codeLength = 12;
  let createdCodes = [];
  let createCodes = "";

  let Code = "";
  do {
    Code = "";
    for (let i = 0; i < codeLength; i++) {
      let randomIndex = Math.floor(Math.random() * characters.length);
      //   回傳characters當中的隨機一值
      Code += characters.charAt(randomIndex);
    }
  } while (createdCodes.includes(Code));

  createdCodes.push(Code);
  createCodes += Code;
  return createCodes;
}

export default router;

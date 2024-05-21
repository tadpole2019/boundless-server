import express from 'express'
const router = express.Router()
import db from "../db.js";
import jwt from "jsonwebtoken";
import multer from "multer";
const upload = multer();

// 存取`.env`設定檔案使用
import 'dotenv/config.js'

// 從環境檔抓取secretKey(token加密用)
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
//得到所有會員資料
// let [userData] = await db.execute("SELECT * FROM `user` WHERE `valid` = 1");
// console.log(userData)

const currentTime = new Date();
const taipeiTime = new Date(currentTime.getTime() + 8 * 60 * 60 * 1000);
const YYYYMMDDTime = taipeiTime.toISOString().slice(0, 19).replace("T", " "); // 將時間轉換為 'YYYY-MM-DD HH:mm:ss' 格式


router.post('/', upload.none(), async function (req, res, next) {
  
  const uuid =  generateUid()
  // providerData =  req.body
  // console.log(JSON.stringify(req.body))
  
  // 檢查從react來的資料
  if (!req.body.providerId || !req.body.uid) {
    return res.json({ status: 'error', message: '缺少googl登入資料' })
  }

  const { displayName, email, uid, photoURL } = req.body
  const google_uid = uid

  // 以下流程:
  // 1. 先查詢資料庫是否有同google_uid的資料
  // 2-1. 有存在 -> 執行登入工作
  // 2-2. 不存在 -> 建立一個新會員資料(無帳號與密碼)，只有google來的資料 -> 執行登入工作

  // 1. 先查詢資料庫是否有同google_uid的資料
  // const total = await User.count({
  //   where: {
  //     google_uid,
  //   },
  // })
  const [total] = await db.execute('SELECT * FROM user WHERE google_uid = ?;', [google_uid]);

  // console.log(total)
  // 要加到access token中回傳給前端的資料
  // 存取令牌(access token)只需要id和username就足夠，其它資料可以再向資料庫查詢
  let returnUser = {
    id: 0,
    name: '',
    email: '',
    google_uid: '',
    line_uid: '',
  }

  // console.log(total[0])

  if (total.length > 0) {
    // 2-1. 有存在 -> 從資料庫查詢會員資料
    const dbUser = total[0];
    // 回傳給前端的資料
    returnUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      google_uid: dbUser.google_uid,
      // line_uid: dbUser.line_uid,
    }
  } else {
    // 2-2. 不存在 -> 建立一個新會員資料(無帳號與密碼)，只有google來的資料 -> 執行登入工作
    const user = {
      name: displayName,
      email: email,
      google_uid,
      photo_url: photoURL,
    }
    // 新增會員資料
    // const newUser = await User.create(user)
    const newUser = await db.execute('INSERT INTO user (name,uid, email, google_uid, photo_url, nickname, created_time, valid) VALUES (?,?, ?, ?, ?, ?, ?,1);', [displayName, uuid, email, google_uid, photoURL, displayName, YYYYMMDDTime]);
    // const lastInsertIdResult = await db.execute('SELECT LAST_INSERT_ID() AS inserted_id');




    const [lastInsertIdResult] = await db.execute('SELECT LAST_INSERT_ID() AS inserted_id');
    const lastInsertId = lastInsertIdResult[0].inserted_id;
    
    // const lastInsertIdResult = await db.execute('SELECT id, name, email, google_uid, photo_url FROM user id = LAST_INSERT_ID() AS inserted_id ');
    const [newId] = await db.execute('SELECT id, name, email, google_uid, photo_url FROM user WHERE id = ?;' ,[lastInsertId]);

    
    // console.log(lastInsertId)
    // console.log(newId)
    console.log(newId[0].id)
    console.log(newId[0].google_uid)
    console.log(newId[0].email)
    console.log(newId[0].photo_url)


    // console.log(lastInsertIdResult.inserted_id)
    // console.log(lastInsertId)
    // 回傳給前端的資料
    returnUser = {
      id: newId[0].id,
      name: newId[0].name,
      email: newId[0].email,
      google_uid: newId[0].google_uid,
      // line_uid: newUser.line_uid,
    }
  }

  // console.log(returnUser )
  // 產生存取令牌(access token)，其中包含會員資料
  // const accessToken = jsonwebtoken.sign(returnUser, accessTokenSecret, {
  //   expiresIn: '3d',
  // })
  if(returnUser){
    const token = jwt.sign(
      {
        id: returnUser.id,
        name: returnUser.name,
        email: returnUser.email,
        img: returnUser.img,
        my_jam:returnUser.my_jam,
        
      },
      accessTokenSecret,
      //token 認證的時長原為30m
      { expiresIn: "3d" }
      
    );
    res.status(200).json({
      status: 'success',
      token,
    })
  }else {
    res.status(400).json({
      status: "error",
      message: "使用者帳號或密碼錯誤。",
    });
  }
  

  // 使用httpOnly cookie來讓瀏覽器端儲存access token
  // res.cookie('accessToken', accessToken, { httpOnly: true })

  // 傳送access token回應(react可以儲存在state中使用)



  // return res.status(200).json({
  //   status: 'success',
  //   token,
  // })

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
})

export default router

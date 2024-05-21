import express, { json } from 'express';
import db from '../db.js';
// import formidable from "formidable";
//上傳檔案
import { rename } from "fs";
import { dirname, resolve, extname } from "path";
import { fileURLToPath } from "url";
//方法2
import formidable from "formidable";
const __dirname = dirname(dirname(fileURLToPath(import.meta.url)));
import multer from 'multer';
const upload = multer({ dest: resolve(__dirname, 'public') });

const router = express.Router();

// 文章列表
router.get('/', async (req, res) => {
  try {
    let [articleData] = await db.execute(
      'SELECT article.*, article_category.name AS category_name,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img, article_user.nickname AS article_author_name, article_user.img AS article_author_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id LEFT JOIN user AS article_user ON article.user_id = article_user.id ORDER BY article.id'
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

// comments 評論分享
router.get('/comments', async (req, res) => {
  try {
    let [articleData] = await db.execute(
      'SELECT article.*, article_category.name AS category_name,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img, article_user.name AS article_author_name, article_user.img AS article_author_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id LEFT JOIN user AS article_user ON article.user_id = article_user.id WHERE article.category_id = 1 ORDER BY article.id'
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

// Tech
router.get('/sharing', async (req, res) => {
  try {
    let [articleData] = await db.execute(
      'SELECT article.*, article_category.name AS category_name,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img, article_user.name AS article_author_name, article_user.img AS article_author_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id LEFT JOIN user AS article_user ON article.user_id = article_user.id WHERE article.category_id = 2 ORDER BY article.id'
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

router.get('/:auid', async (req, res, next) => {
  let auid = req.params.auid;
  console.log(auid);
  // 使用正确的参数名称
  let [data] = await db
    .execute(
      'SELECT article.*, article_category.name AS category_name, article_comment.content AS comment_content,article_comment.created_time AS comment_created_time,article_comment.likes AS comment_likes, user.name AS user_name, user.img AS user_img FROM article JOIN article_category ON article.category_id = article_category.id LEFT JOIN article_comment ON article.id = article_comment.article_id LEFT JOIN user ON article_comment.user_id = user.id WHERE article.auid = ?',
      [auid]
    )
    .catch(() => {
      return undefined;
    });
  if (data) {
    res.status(200).json(data);
    console.log(data);
  } else {
    res.status(400).send('发生错误');
  }
});

router.post('/upload', upload.single('myFile'), async (req, res) => {
  const now = new Date().toISOString();
  let newCover = Date.now() + extname(req.file.originalname);
  rename(req.file.path, resolve(__dirname, 'public/article', newCover), (error) => {
    if (error) {
      console.log("更名失敗" + error)
      return;
    }
    console.log('更名成功')
  })
  const { title, content, category_id, user_id } = req.body;
  console.log(req.body)
  const auid = generateUid();
  // const user_id = req.user.id;
  console.log(user_id)
  await db
    .execute(
      'INSERT INTO `article` (`id`,`auid`, `title`, `content`, `category_id`, `img`, `user_id` ) VALUES (NULL, ?, ?, ?, ?, ?, ?)',
      [auid, title, content, parseInt(category_id), newCover, user_id]
    )
    .then(() => {
      console.log('更新成功');

      res.status(200).json({ status: 'success', auid });
    })
    .catch((error) => {
      res.status(409).json({ status: 'error', error });
    });
}
);

router.put('/edit/:auid', upload.none(''), async (req, res) => {
  const { content } = req.body;
  const auid = req.params.auid;
  console.log(req.body)
  console.log(req.params);
  await db
    .execute(
      'UPDATE `article` SET `content` = ? WHERE `auid` = ?',
      [content, auid]
    )
    .then(() => {
      console.log('更新成功');
      res.status(200).json({ status: 'success', auid });
    })
    .catch((error) => {
      res.status(500).json({ status: 'error', error });
    });
}
);

function generateUid() {
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let codeLength = 12;
  let createdCodes = [];
  let createCodes = '';

  let Code = '';
  do {
    Code = '';
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

import express from 'express';
import db from '../db.js';
import crypto from 'crypto';
import ecpay_payment  from 'ecpay_aio_nodejs';

const router = express.Router();

//存取.env的設定
import 'dotenv/config.js'

const {MERCHANTID, HASHKEY, HASHIV, HOST} = process.env;

const options = {
    OperationMode: 'Test',
    MercProfile: {
      MerchantID: MERCHANTID,
      Hashkey: HASHKEY,
      HashIV: HASHIV,
    },
    IgnorePayment: [
      //    "Credit",
      //    "WebATM",
      //    "ATM",
      //    "CVS",
      //    "BARCODE",
      //    "AndroidPay"
    ],
    IsProjectContractor: false,
  };
  let TradeNo;

router.get('/', (req, res)=>{
    const MerchantTradeDate = new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      });
      TradeNo = 'test' + new Date().getTime();
      let base_param = {
        MerchantTradeNo: TradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
        MerchantTradeDate,
        TotalAmount: '100',
        TradeDesc: '測試交易描述',
        ItemName: '測試商品等',
        ReturnURL: `${HOST}/return`,
        ClientBackURL: `${HOST}/clientReturn`,
      };
      const create = new ecpay_payment(options);
    
      // 注意：在此事直接提供 html + js 直接觸發的範例，直接從前端觸發付款行為
      const html = create.payment_client.aio_check_out_all(base_param);
      console.log(html);
    
      res.render('index', {
        title: 'Express',
        html,
      });
})

// 後端接收綠界回傳的資料
router.post('/return', async (req, res) => {
    console.log('req.body:', req.body);
  
    const { CheckMacValue } = req.body;
    const data = { ...req.body };
    delete data.CheckMacValue; // 此段不驗證
  
    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data);
  
    console.log(
      '確認交易正確性：',
      CheckMacValue === checkValue,
      CheckMacValue,
      checkValue,
    );
  
    // 交易成功後，需要回傳 1|OK 給綠界
    res.send('1|OK');
  });
  
  // 用戶交易完成後的轉址
  router.get('/clientReturn', (req, res) => {
    console.log('clientReturn:', req.body, req.query);
    res.render('return', { query: req.query });
  });

  export default router
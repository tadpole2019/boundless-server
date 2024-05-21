import express, { json } from 'express';
import db from '../db.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/form', upload.none(), async (req, res) => {
    const ouid = generateOuid()

    const {
        username,
        phone,
        email,
        country,
        township,
        postcode,
        address,
        totaldiscount,
        payment,
        transportationstate,
        cartdata,
        orderID,
        uid,
        LessonCUID,
        InstrumentCUID,
    } = req.body;
    const newOrderID = parseInt(orderID)
    const newCartData = JSON.parse(cartdata)

    const now = new Date().toISOString();
    console.log(req.body);
 
    const orderTotal = 'INSERT INTO `order_total` (`id`, `user_id`, `payment`, `transportation_state`, `phone`, `discount`, `postcode`, `country`, `township`, `address`, `created_time`, `ouid`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)'

    await db.execute(orderTotal,
        [
            uid,
            payment,
            transportationstate,
            phone,
            totaldiscount,
            postcode,
            township,
            country,
            address,
            ouid,
        ]).then(() => {
            // res.status(200).json({ status: 'success' });
        })
        .catch((error) => {
            res.status(500).json({ status: 'error', error });
        });

    newCartData.map(async (v,i)=>{
        // console.log(v);
        await db.execute('INSERT INTO `order_item`  (`id`, `order_id`, `product_id`, `quantity`, `ouid`) VALUES (NULL, ?, ?, ?, ?)',
        [
            newOrderID,
            v.id,
            v.qty,
            ouid
        ]
        ).then(() => {
            // res.status(200).json({ status: 'success' });
        }).catch((error) => {
            res.status(500).json({ status: 'error', error });
        });
    })


    const [resultLessonCUID] = await db.execute(`UPDATE coupon SET valid = 0 WHERE coupon_template_id = ?;`, [LessonCUID]);
    const [resultInstrumentCUID] = await db.execute(`UPDATE coupon SET valid = 0 WHERE coupon_template_id = ?;`, [InstrumentCUID]);
});

function generateOuid() {
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

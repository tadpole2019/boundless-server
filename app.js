import createError from 'http-errors';
import express from 'express';
import path, { dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import cors from 'cors';
// import router 匯入路由
import indexRouter from './routes/index.js';
import jamRouter from './routes/jam.js';
import instrumentRouter from './routes/instrument.js';
import lessonRouter from './routes/lesson.js';
import couponRouter from './routes/coupon.js';
import userRouter from './routes/user.js';
import articleRouter from './routes/article.js';
import googleLoginRouter from './routes/google-login.js';
import cartRouter from './routes/cart.js'
import forgetpasswordRouter from './routes/reset-password.js';
import ecpayusersRouter from './routes/ecpay-users.js';
import ecpayorderRouter from './routes/ecpay-order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 設定允許互動的網域，讓port 3000  和 5500間可以互動
const whitelist = [
  'http://localhost:3005',
  'http://localhost:3000',
  'http://localhost:3001',
  undefined,
];
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允許傳遞資料'));
    }
  },
};


app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 使用路由
app.use('/', indexRouter);
app.use('/api/jam', jamRouter);
app.use('/api/instrument', instrumentRouter);
app.use('/api/lesson', lessonRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/user', userRouter);
app.use('/api/article', articleRouter);
app.use('/api/google-login', googleLoginRouter);
app.use('/api/cart', cartRouter);
app.use('/api/reset-password', forgetpasswordRouter);

app.use('/api/order', ecpayorderRouter);
app.use('/api/users', ecpayusersRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;

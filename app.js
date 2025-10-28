import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from "url";

// Import Routes
import courseRouter from './src/routes/course.route.js';
import accountRouter from './src/routes/account.route.js';
// import categoryRouter from './src/routes/category.route.js'; // Bỏ nếu chỉ dùng trong admin
import managementRouter from './src/routes/management.route.js';
import adminRouter from './src/routes/admin.route.js';

// Import Models & db
import categoryModel from './src/model/category.model.js';
import courseModel from './src/model/course.model.js'; // Cần cho hàm load global
import db from './src/utils/db.js';

// Import Middlewares
import { restrict, restrictAdmin } from './src/middlewares/auth.mdw.js'; // Chỉ import restrict và restrictAdmin

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares cơ bản
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'src/public'))); // Đường dẫn đúng

// Cấu hình Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, "src/views/layouts"),
  partialsDir: path.join(__dirname, "src/views/partials"),
  helpers: { // Giữ nguyên helpers, sửa minus thành subtract, sửa ifCond
    section: hbs_sections(),
    gt: (a, b) => a > b,
    eq: (a, b) => String(a) === String(b), // So sánh chuỗi cho chắc chắn
    lt: (a, b) => a < b,
    add: (a, b) => a + b,
    range: (start, end) => { let a = []; for (let i = start; i <= end; i++) a.push(i); return a; },
    plus: (a, b) => a + b,
    subtract: (a, b) => a - b, // Đổi tên
    ifCond: function (v1, operator, v2, options) {
      const strV1 = String(v1);
      const strV2 = String(v2);
      switch (operator) {
        case '==': return (strV1 == strV2) ? options.fn(this) : options.inverse(this);
        case '===': return (strV1 === strV2) ? options.fn(this) : options.inverse(this);
        case '!=': return (strV1 != strV2) ? options.fn(this) : options.inverse(this);
        case '!==': return (strV1 !== strV2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    },
    formatCurrency: (value) => { // Helper format tiền
      if (typeof value !== 'number') return value;
      return value.toLocaleString('us-US', { style: 'currency', currency: '$' });
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'));

// Cấu hình Session
app.use(session({
  secret: 'thay-chuoi-nay-bang-mot-chuoi-bi-mat-dai-hon-cua-ban!',
  resave: false,
  saveUninitialized: false, // Quan trọng
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// --- TẢI DỮ LIỆU GLOBAL (CATEGORIES + SUBCATEGORIES) 1 LẦN ---
(async function loadGlobalData() {
  try {
    const categories = await categoryModel.findAll();
    const subcatPromises = categories.map(cat =>
      db('sub_cat').where('CatID', cat.CatID).select('SubCatID', 'SubCatName', 'CatID')
    );
    const subcatResults = await Promise.all(subcatPromises);
    categories.forEach((cat, i) => {
      cat.subcategories = subcatResults[i] || [];
    });
    app.locals.global_categories = categories; // Lưu vào app.locals
    console.log('✅ Đã tải global categories và subcategories thành công!');
  } catch (err) {
    console.error('❌ Không thể tải global data:', err);
  }
})();

// Middleware GÁN BIẾN LOCALS cho MỌI REQUEST
app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.authUser = req.session.authUser || null;
  res.locals.global_categories = app.locals.global_categories || []; // Lấy từ app.locals
  next();
});

// ROUTERS
app.use('/course', courseRouter);
app.use('/account', accountRouter);
// app.use('/category', restrict, categoryRouter); // Bỏ route này
app.use('/management', restrict, managementRouter); // Chỉ cần restrict chung
app.use('/admin', restrict, restrictAdmin, adminRouter); // Admin cần đăng nhập và là Admin

// Redirect trang gốc
app.get('/', (req, res) => res.redirect('/course'));

// Route trang lỗi
app.get('/403', (req, res) => res.status(403).render('403'));
app.get('/500', (req, res) => res.status(500).render('500'));

// Middleware 404 (cuối cùng)
app.use((req, res, next) => { res.status(404).render('404'); });

// Middleware xử lý lỗi chung (quan trọng)
app.use((err, req, res, next) => {
  console.error("LỖI:", err);
  res.status(err.status || 500).render('500', { layout: false, message: 'Lỗi máy chủ.' });
});

app.listen(port, () => console.log(` Server đang chạy tại http://localhost:${port}`));
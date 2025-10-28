import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from "url";

// Import Routes
import courseRouter from './src/routes/course.route.js';
import accountRouter from './src/routes/account.route.js';
import managementRouter from './src/routes/management.route.js';
import adminRouter from './src/routes/admin.route.js'; // Sửa tên biến

// Import Models & db
import categoryModel from './src/model/category.model.js';
import db from './src/utils/db.js'; // Import db để query sub_cat

// Import Middlewares
import { restrict, restrictAdmin } from './src/middlewares/auth.mdw.js';

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
  helpers: {
    section: hbs_sections(),
    gt: (a, b) => a > b,
    eq: (a, b) => String(a) === String(b), // So sánh chuỗi
    lt: (a, b) => a < b,
    add: (a, b) => a + b,
    range: (start, end) => { let a = []; for (let i = start; i <= end; i++) a.push(i); return a; },
    plus: (a, b) => a + b,
    subtract: (a, b) => a - b, // Sửa tên
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
    // Helper format tiền tệ (Ví dụ: $USD)
    formatCurrency: (value) => {
      if (typeof value !== 'number' && typeof value !== 'string') return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;
      return numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'));

// Cấu hình Session
app.use(session({
  // SỬA: Thêm secret trực tiếp
  secret: 'thay-chuoi-nay-bang-mot-chuoi-bi-mat-dai-hon-cua-ban!',
  resave: false,
  saveUninitialized: false, // Sửa: Đặt là false
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// --- SỬA: TẢI DỮ LIỆU GLOBAL 1 LẦN (FIX LỖI N+1) ---
(async function loadGlobalData() {
  try {
    const categories = await categoryModel.findAll();
    // Lấy tất cả subcategories và gán vào categories tương ứng
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

// ROUTERS (Sửa phân quyền)
app.use('/course', courseRouter);
app.use('/account', accountRouter);
// app.use('/category', restrict, categoryRouter); // Bỏ route này
app.use('/management', restrict, managementRouter); // Chỉ cần đăng nhập
app.use('/admin', restrict, restrictAdmin, adminRouter); // Cần đăng nhập VÀ là Admin

// Redirect trang gốc
app.get('/', (req, res) => res.redirect('/course'));

// Route trang lỗi
app.get('/403', (req, res) => res.status(403).render('403'));
app.get('/500', (req, res) => res.status(500).render('500')); // Cần tạo file 500.hbs

// Middleware 404 (cuối cùng)
app.use((req, res, next) => { res.status(404).render('404'); });

// Middleware xử lý lỗi chung (quan trọng)
app.use((err, req, res, next) => {
  console.error("LỖI:", err.stack); // Log stack trace
  res.status(err.status || 500).render('500', { layout: false, message: 'Lỗi máy chủ.' });
});

app.listen(port, () => console.log(` Server đang chạy tại http://localhost:${port}`));
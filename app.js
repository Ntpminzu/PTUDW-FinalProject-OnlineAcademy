import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import  courseRouter from './src/routes/course.route.js';
import  accountRouter from './src/routes/account.route.js';
import  categoryRouter from './src/routes/category.route.js';
import  managementRouter from './src/routes/management.route.js';
import categoryModel from './src/models/category.model.js';

const app = express();
const port = 3005;

app.engine('hbs', engine({
    extname: '.hbs', 
      helpers: {
    section: hbs_sections(),
  },
}));
app.set('view engine', 'hbs'); 
app.set('views', './src/views');

app.use(express.static('src/public'));

app.use(express.urlencoded({
    extended: true
}));

app.use('/course', courseRouter);
app.use('/account', accountRouter);
app.use('/category', categoryRouter);
app.use('/management', managementRouter);

app.get('/', (req, res) => {
  res.redirect('/course');
});

(async function loadGlobalData() {
    try {
        const categories = await categoryModel.findAll();
        // Lưu vào app.locals, biến này sẽ tồn tại trong suốt vòng đời của app
        // và TẤT CẢ các template .hbs đều truy cập được
        app.locals.global_categories = categories;
        console.log('Đã tải global categories thành công!');
    } catch (err) {
        console.error('Không thể tải global categories:', err);
    }
})();

app.listen(port, function () {
    console.log(` Server is running at http://localhost:${port}`);
});
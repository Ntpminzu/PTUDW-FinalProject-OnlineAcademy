import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import  courseRouter from './src/routes/course.route.js';
import  accountRouter from './src/routes/account.route.js';
import  categoryRouter from './src/routes/category.route.js';
import categoryModel from './src/model/category.model.js';
import courseModel from './src/model/course.model.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('trust proxy', 1) // trust first proxy


app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs', 
      helpers: {
    section: hbs_sections(),
  },
}));
app.set('view engine', 'hbs'); 
app.set('views', './src/views');

app.use(express.static('src/public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(async (req, res, next) => {
  try {
    const categories = await categoryModel.findAll();
    for (const cat of categories) {
      cat.courses = await courseModel.findByCategory(cat.CatID);
    }
    res.locals.global_categories = categories;
    next();
  } catch (err) {
    console.error('Lỗi khi load categories:', err);
    next(err);
  }
});

app.use(async function (req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.isAuthenticated = false;
    res.locals.authUser = null;
  }

  next();
});

app.use('/course', courseRouter);
app.use('/account', accountRouter);
app.use('/category', categoryRouter);

app.get('/', (req, res) => {
  res.redirect('course');
});

app.listen(port, function () {
    console.log(` Server is running at http://localhost:${port}`);
});
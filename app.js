import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import  courseRouter from './src/routes/course.route.js';
import  accountRouter from './src/routes/account.route.js';
import  categoryRouter from './src/routes/category.route.js';
import categoryModel from './src/model/category.model.js';
import courseModel from './src/model/course.model.js';
import  managementRouter from './src/routes/management.route.js';
import userRouter from './src/routes/admin.route.js';
import { restrict, restrictAdmin } from './src/middlewares/auth.mdw.js';

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
    gt: function(a, b) {
      return a > b;
    },
    eq: function(a, b) {
      return a === b;
    },
    lt: function(a, b) {
      return a < b;
    },
    add: function(a, b) {
      return a + b;
    },
    range: function(start, end) {
      let arr = [];
      for (let i = start; i <= end; i++) {
        arr.push(i);
      }
      return arr;
    },
    plus: (a, b) => a + b,
    minus: (a, b) => a - b,
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    },
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    eq: (a, b) => a === b
  }
}));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


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
app.use('/management', restrict, restrictAdmin, managementRouter);
app.use('/admin', userRouter);

app.get('/403', (req, res) => {
  res.status(403).render('403');
});

app.get('/', (req, res) => {
  res.redirect('course');
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(port, function () {
    console.log(` Server is running at http://localhost:${port}`);
});
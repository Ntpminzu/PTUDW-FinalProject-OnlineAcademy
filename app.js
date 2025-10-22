import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import courseRouter from './src/routes/course.route.js';
import accountRouter from './src/routes/account.route.js';
import categoryRouter from './src/routes/category.route.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('hbs', engine({
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
}));

app.use('/', courseRouter);
app.use('/account', accountRouter);
app.use('/category', categoryRouter);

app.use((req, res) => {
  res.status(404).render('404', { layout: false, title: 'Page Not Found' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

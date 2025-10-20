import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import  courseRouter from './src/routes/course.route.js';
import  accountRouter from './src/routes/account.route.js';
import  categoryRouter from './src/routes/category.route.js';

const app = express();
const port = 3000;

app.engine('hbs', engine({
    extname: '.hbs', 
      helpers: {
    section: hbs_sections(),
  },
}));
app.set('view engine', 'hbs'); 
app.set('views', './src/views');

app.use(express.static('src/public'));

app.use('/', courseRouter);
app.use('/account', accountRouter);
app.use('/category', categoryRouter);

app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});
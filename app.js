import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import courseRouter from './src/routes/course.route.js';
import accountRouter from './src/routes/account.route.js';
import categoryRouter from './src/routes/category.route.js';
import userRouter from './src/routes/admin.route.js';

const app = express();
const port = 3000;

app.engine('hbs', engine({
  extname: '.hbs',
  helpers: {
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      if (options.hash.append) {
        this._sections[name] = (this._sections[name] || '') + options.fn(this);
      } else {
        this._sections[name] = options.fn(this);
      }
      return null;
    },
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

app.use('/', courseRouter);
app.use('/account', accountRouter);
app.use('/category', categoryRouter);
app.use('/admin', userRouter);


app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});
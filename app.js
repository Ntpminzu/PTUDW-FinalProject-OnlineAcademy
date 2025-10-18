import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import courseRoute from './src/routes/course.route.js';
import accountRoute from './src/routes/account.route.js';
import categoryRoute from './src/routes/category.router.js';


const app = express();
const port = 3000;

app.engine('hbs', engine({
    extname: '.hbs', 
}));
app.set('view engine', 'hbs'); 
app.set('views', './src/views');

app.use(express.static('src/public'));
app.use(express.urlencoded({ extended: true }));

app.use('/', courseRoute);
app.use('/category', categoryRoute);
app.use('/Account', accountRoute);

app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});
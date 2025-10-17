import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';

const app = express();
const port = 3000;

app.engine('hbs', engine({
    extname: '.hbs', 
}));
app.set('view engine', 'hbs'); 
app.set('views', './views');


app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});
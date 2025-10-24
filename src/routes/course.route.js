import express from 'express';
import knex from 'knex';
import courseModel from '../model/course.model.js';
import categoryModel from '../model/category.model.js';

const router = express.Router();

router.get('/',async function (req, res) {
    res.render('course/home',{
    });
});

router.get('/detail', function (req, res) {
    res.render('course/detail');
});

router.get('/bycat', async function (req, res) {
    const catId = req.query.id;
    const category = await categoryModel.findByID(catId);
    const courses = await courseModel.findByCategory(catId);
    res.render('course/bycat', {
        layout: 'main',
      category,
      courses
    });
});

export default router;
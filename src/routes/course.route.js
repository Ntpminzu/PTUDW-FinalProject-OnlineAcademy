import express from 'express';
import knex from 'knex';
import courseModel from '../model/course.model.js';
import categoryModel from '../model/category.model.js';

const router = express.Router();

router.get('/',async function (req, res) {
    const topCourses = await courseModel.findTop10CoursesViews();
    const top4Week = await courseModel.findTop4WeekViews();
    const top10Week = await courseModel.findTop10WeekViews();
    const top10Newest = await courseModel.findTop10Newest();
    res.render('course/home',{
        topCourses,
        top4Week,
        top10Week,
        top10Newest
    });
});

router.get('/detail', function (req, res) {
    res.render('course/detail');
});

router.get('/bycat', async function (req, res) {
    const catId = req.query.id;
    if (!catId) return res.redirect('/course');

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 4;
    const offset = (page - 1) * limit;
    const category = await categoryModel.findByID(catId);
    const courses = await courseModel.findByCategoryPaging(catId, limit, offset);
    const totalRow = await courseModel.countByCategory(catId);
    const totalPages = Math.ceil(totalRow.total / limit);

    res.render('course/bycat', {
        layout: 'main',
      category,
      courses,
      currentPage: page,
    totalPages,
    categoryId: catId,
    });
});

router.get('/enroll', function (req, res) {
    res.render('course/enroll');
});

router.get('/courselist', async function (req, res) {
    res.render('course/courselist', {
    });
} );

router.get('/search', async (req, res) => {
  const keyword = req.query.q?.trim().toLowerCase();
  if (!keyword) return res.redirect('/course');

  const results = await courseModel.findByKeyword(keyword);

  if (!results || results.length === 0) {
    return res.render('course/searchResults', {
      layout: 'main',
      keyword: req.query.q,
      results: [],
      notFound: true,
    });
  }

  res.render('course/searchResults', {
    layout: 'main',
    keyword: req.query.q,
    results,
    notFound: false,
  });
});

router.get('/searchResults', (req, res) => {
  res.render('course/searchResults');
});

export default router;
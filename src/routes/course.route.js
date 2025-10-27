import express from 'express';
import courseModel from '../model/course.model.js';
import categoryModel from '../model/category.model.js';
import * as accountModel from '../model/account.model.js';
import db from '../utils/db.js';

const router = express.Router();

router.get('/',async function (req, res) {
    const topCourses = await courseModel.findTop10CoursesViews();
    const top4Week = await courseModel.findTop4WeekViews();
    const top10Week = await categoryModel.findtopcategories();
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
  const subcatId = req.query.subcatid; // 👈 Lấy đúng query param
  if (!subcatId) return res.redirect('/course');

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 4;
  const offset = (page - 1) * limit;

  const category = await categoryModel.findByID(req.query.catid); // lấy tên category cha
  const sub_cat = await db('sub_cat').where('SubCatID', subcatId).first(); // lấy tên subcategory
  const courses = await courseModel.findByCategoryPaging(subcatId, limit, offset);
  const totalRow = await courseModel.countByCategory(subcatId);
  const totalPages = Math.ceil(totalRow.total / limit);

  res.render('course/bycat', {
    layout: 'main',
    category,
    courses,
    currentPage: page,
    totalPages,
    categoryId: subcatId,
    sub_cat,
  });
});

router.get('/enroll', function (req, res) {
    res.render('course/enroll');
});

router.get('/courselist', async function (req, res) {
    const UserId = req.session.authUser?.UserID;
    const courses = await courseModel.finduserenrollcourses(UserId);
    res.render('course/courselist', {
        layout: 'main',
        courses,
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

router.get('/course-remake', function (req, res) {
    res.render('course/course-remake');
});

router.post("/add-to-watchlist", async (req, res) => {
  if (!req.session.isAuthenticated)
    return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const { courseId } = req.body;

  await accountModel.addToWatchlist(userId, courseId);
  res.redirect(`/course/detail?id=${courseId}`);
});

export default router;
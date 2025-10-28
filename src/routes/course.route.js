import express from 'express';
import courseModel from '../model/course.model.js';
import categoryModel from '../model/category.model.js';
import * as accountModel from '../model/account.model.js';
import db from '../utils/db.js';

const router = express.Router();

router.get('/', async function (req, res) {
  const topCourses = await courseModel.findTop10CoursesViews();
  const top4Week = await courseModel.findTop4WeekViews();
  const top10Week = await categoryModel.findTopSubCategories();
  const top10Newest = await courseModel.findTop10Newest();
  res.render('course/home', {
    topCourses,
    top4Week,
    top10Week,
    top10Newest
  });
});


router.get('/detail', async function (req, res) {
  const courseId = req.query.id;
  const userId = req.session.authUser?.UserID;

  try {
    const course = await courseModel.findById(courseId);

    let isInWishlist = false;
    let isBought = false;
    let canFeedback = false;
    const feedbacks = await courseModel.findFeedbacksByCourseId(courseId);
    const relatedCourses = await courseModel.findRelatedCourses(courseId, course.SubCatID);

    if (userId) {
      const wishlist = await courseModel.checkIfInWishlist(userId, courseId);
      isInWishlist = wishlist.length > 0;

      const enrollments = await courseModel.checkIfInEnrollments(userId, courseId);
      isBought = enrollments.length > 0;

      const feedbackList = await courseModel.checkIfInFeedbacks(userId, courseId);
      canFeedback = feedbackList.length == 0 && isBought;
    }

    if (course) {
      res.render('course/detail', { course, isInWishlist, isBought, feedbacks, canFeedback, relatedCourses });
    } else {
      res.status(404).send('Course not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


router.get('/bycat', async function (req, res) {
  try {
    const catId = req.query.catid;
    const subcatId = req.query.subcatid;
    console.log('catId:', catId);
    console.log('subcatId:', subcatId);

    // 🔒 Nếu không có subcatid thì quay về trang course chính
    if (!subcatId) return res.redirect('/course');

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 4;
    const offset = (page - 1) * limit;

    // ✅ Lấy category cha
    const category = await categoryModel.findByID(catId);

    // ✅ Lấy thông tin subcategory
    const sub_cat = await db('sub_cat').where('SubCatID', subcatId).first();

    // ✅ Lấy danh sách course thuộc subcategory
    const courses = await courseModel.findByCategoryPaging(subcatId, limit, offset);

    // ✅ Đếm tổng số course để phân trang
    const totalRow = await courseModel.countByCategory(subcatId);
    const totalPages = Math.ceil(totalRow.total / limit);

    // ✅ Render ra view
    res.render('course/bycat', {
      layout: 'main',
      category,              // Category cha
      sub_cat,               // Subcategory con
      courses,               // Danh sách khóa học
      currentPage: page,
      totalPages,
      categoryId: catId,     // ✅ Giữ đúng: categoryId là ID cha
      subcatId,              // ✅ Giữ đúng: subcatId để link phân trang hoạt động
    });
  } catch (err) {
    console.error('Lỗi khi load trang bycat:', err);
    res.status(500).render('500', { layout: 'main', message: 'Đã xảy ra lỗi khi tải trang.' });
  }
});

router.get('/enroll', async function (req, res) {
  const courseId = req.query.id;
  const userId = req.session.authUser?.UserID;

  try {
    const course = await courseModel.findById(courseId);
    const lessons = await courseModel.findLessonsByCourseId(courseId);

    let completedLessons = [];
    if (userId) {
      completedLessons = await accountModel.getCompletedLessonsByUserId(userId, courseId);
    }

    const updatedLessons = lessons.map(lesson => {
      const isCompleted = completedLessons.some(completed => completed.LessonID === lesson.LessonID);
      return {
        ...lesson,
        isCompleted
      };
    });

    res.render('course/enroll', { course, lessons: updatedLessons });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


router.get('/courselist', async function (req, res) {
  const UserId = req.session.authUser?.UserID;
  const courses = await courseModel.finduserenrollcourses(UserId);
  res.render('course/courselist', {
    layout: 'main',
    courses,
  });
});

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


export default router;
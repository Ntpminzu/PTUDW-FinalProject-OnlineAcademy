import express from 'express';
import courseModel from '../model/course.model.js';
import categoryModel from '../model/category.model.js';
import * as accountModel from '../model/account.model.js';
import db from '../utils/db.js';

const router = express.Router();

// Trang chủ (GET /) - Đã sửa
router.get('/', async function (req, res, next) {
  try {
    const [topCourses, top4Week, top10WeekSubCat, top10Newest] = await Promise.all([
      courseModel.findTop10CoursesViews(),
      courseModel.findTop4WeekViews(),
      categoryModel.findTopSubCategories(10), // Dùng hàm subcategory mới
      courseModel.findTop10Newest()
    ]);
    res.render('course/home', {
      layout: 'main', topCourses, top4Week,
      top10Week: top10WeekSubCat, // Sửa tên biến
      top10Newest
    });
  } catch (err) { next(err); }
});

// Trang chi tiết (GET /detail) - Cần hoàn thiện
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
    const lessons = await courseModel.findLessonsByCourseId(courseId);

    if (userId) {
      const wishlist = await courseModel.checkIfInWishlist(userId, courseId);
      isInWishlist = wishlist.length > 0;

      const enrollments = await courseModel.checkIfInEnrollments(userId, courseId);
      isBought = enrollments.length > 0;

      const feedbackList = await courseModel.checkIfInFeedbacks(userId, courseId);
      canFeedback = feedbackList.length == 0 && isBought;
    }

    if (course) {
      res.render('course/detail', { course, isInWishlist, isBought, feedbacks, canFeedback, relatedCourses, lessons });
    } else {
      res.status(404).send('Course not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Trang theo SubCategory (GET /bycat) - Đã sửa hoàn chỉnh
router.get('/bycat', async function (req, res, next) {
  try {
      const catId = req.query.catid;
      const subcatId = req.query.subcatid;
      if (!subcatId) return res.redirect('/course');

      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = 4;
      const offset = (page - 1) * limit;

      const [category, sub_cat, courses, totalRow] = await Promise.all([
          categoryModel.findByID(catId),
          db('sub_cat').where('SubCatID', subcatId).first(),
          courseModel.findByCategoryPaging(subcatId, limit, offset), // Dùng subcatId
          courseModel.countByCategory(subcatId) // Dùng subcatId
      ]);

      if (!category || !sub_cat || String(sub_cat.CatID) !== String(category.CatID)) {
            return res.status(404).render('404');
      }
      const totalPages = Math.ceil((totalRow?.total || 0) / limit);

      res.render('course/bycat', {
          layout: 'main', category, sub_cat, courses,
          currentPage: page, totalPages,
          categoryId: catId, subcatId: subcatId, // Truyền lại ID
          hasCourses: courses.length > 0
      });
  } catch (err) { next(err); }
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

router.get('/courselist', async function (req, res, next) {
   if (!req.session.isAuthenticated) return res.redirect('/account/signin');
    try {
        const UserId = req.session.authUser?.UserID;
        const courses = await courseModel.finduserenrollcourses(UserId); // Đã join đủ
        res.render('course/courselist', { layout: 'main', courses, hasCourses: courses.length > 0 });
     } catch(err) { next(err); }
});

// Trang tìm kiếm (GET /search) - Đã sửa
router.get('/search', async (req, res, next) => {
  try {
      const keyword = req.query.q?.trim().toLowerCase();
      if (!keyword) return res.redirect('/course');
      const results = await courseModel.findByKeyword(keyword); // Đã join đủ

      res.render('course/searchResults', {
          layout: 'main', keyword: req.query.q, results,
          notFound: !results || results.length === 0
      });
    } catch(err) { next(err); }
});

router.get('/course-remake', function (req, res) {
  res.render('course/course-remake');
});

// Thêm vào Wishlist (POST /add-to-watchlist) - Đã sửa
router.post("/add-to-watchlist", async (req, res, next) => {
   if (!req.session.isAuthenticated) return res.redirect("/account/signin");
    try {
        const userId = req.session.authUser.UserID;
        const { courseId } = req.body;
         if (!courseId) { throw new Error('Missing courseId'); } // Thêm kiểm tra
        await accountModel.addToWatchlist(userId, courseId);
        const referringUrl = req.header('Referer') || `/course/detail?id=${courseId}`;
        res.redirect(referringUrl + '?msg=added_watchlist');
     } catch(err) {
         if (err.code === '23505') { // Lỗi trùng lặp
              const referringUrl = req.header('Referer') || `/course/detail?id=${req.body.courseId}`;
              return res.redirect(referringUrl + '?msg=already_in_watchlist');
         }
         next(err); // Chuyển lỗi khác
     }
});

export default router;
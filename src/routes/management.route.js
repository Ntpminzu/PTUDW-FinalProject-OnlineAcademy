// File: src/routes/management.route.js
import express from 'express';
import lessonModel from '../model/lesson.model.js';
import courseModel from '../model/course.model.js';
import * as accountModel from '../model/account.model.js';
import db from '../utils/db.js';

const router = express.Router();

// Hàm trợ giúp lấy categories và subcategories cho form
async function getCategoriesForForm() {
    const categoriesWithSubcats = await db('categories as c')
        .leftJoin('sub_cat as s', 'c.CatID', 's.CatID')
        .select('c.CatID', 'c.CatName', 's.SubCatID', 's.SubCatName')
        .orderBy('c.CatName', 'asc').orderBy('s.SubCatName', 'asc');
    // Nhóm lại
    return categoriesWithSubcats.reduce((acc, row) => {
        let cat = acc.find(c => c.CatID === row.CatID);
        if (!cat) {
            cat = { CatID: row.CatID, CatName: row.CatName, subcategories: [] };
            acc.push(cat);
        }
        if (row.SubCatID) {
            cat.subcategories.push({ SubCatID: row.SubCatID, SubCatName: row.SubCatName });
        }
        return acc;
    }, []);
}

// GET /management/course (Đã sửa hoàn chỉnh)
router.get('/course', async function (req, res, next) {
    // Middleware 'restrict' đã kiểm tra đăng nhập
    const userPermission = req.session.authUser.UserPermission;
    const userId = req.session.authUser.UserID; // UserID của người đăng nhập
    const instructorIdForStats = (userPermission === '1') ? userId : null;

    try {
        let listCourses;
        if (userPermission === '1') { // Instructor
            listCourses = await courseModel.findByUserId(userId); // Dùng UserID
        } else if (userPermission === '0') { // Admin
            listCourses = await courseModel.findAll(); // findAll đã join đủ
        } else { return res.status(403).render('403'); }

        const [categoriesForForm, totalCourses, totalStudents, avgRating, statusCounts] = await Promise.all([
            getCategoriesForForm(), // Lấy categories + subcats
            courseModel.countCourses(instructorIdForStats),
            courseModel.sumStudents(instructorIdForStats),
            courseModel.averageRating(instructorIdForStats),
            courseModel.countCoursesByStatus(instructorIdForStats)
        ]);
        const statistics = { totalCourses, totalStudents, avgRating, statusCounts };

        res.render('management/course', {
            layout: 'main',
            categories: categoriesForForm, // Truyền categories đã nhóm
            courses: listCourses,
            statistics: statistics, query: req.query,
            // Xác định tab active
            activeTab: req.query.errorAdd ? 'add' : (req.query.addSuccess || req.query.updateSuccess || req.query.deleteSuccess ? 'list' : 'list')
        });
    } catch (err) { next(err); }
});

// POST /management/course/add (Đã sửa hoàn chỉnh)
router.post('/course/add', async (req, res, next) => {
    // Nếu không thì check ở đây:
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        const instructorId = req.session.authUser.UserID; // UserID của giảng viên
        const { CourseName, TinyDes, FullDes, ImageUrl, Level, CurrentPrice, OriginalPrice, SubCatID } = req.body;
        if (!CourseName || !TinyDes || !FullDes || !Level || !SubCatID || OriginalPrice === undefined || CurrentPrice === undefined) {
            const [categoriesForForm, listCourses] = await Promise.all([
                getCategoriesForForm(),
                courseModel.findByUserId(instructorId)
            ]);
            return res.render('management/course', {
                layout: 'main', categories: categoriesForForm, courses: listCourses,
                errorAdd: 'Please fill in all fields (*).', formData: req.body, activeTab: 'add'
            });
        }

        // Dùng UserID và SubCatID
        const newCourse = {
            CourseName, TinyDes, FullDes, ImageUrl: ImageUrl || null, Level, CurrentPrice: parseFloat(CurrentPrice) || 0, OriginalPrice: parseFloat(OriginalPrice) || 0,
            UserID: instructorId, // Dùng UserID
            SubCatID: parseInt(SubCatID), // Dùng SubCatID
            Rating: 0.0, Total_Review: 0, TotalLession: 0, TotalStudent: 0, Views: 0, WeekView: 0, Date: new Date(), CourseStatus: 'draft'
        };
        await courseModel.add(newCourse);
        res.redirect('/management/course?addSuccess=true');
    } catch (err) { next(err); }
});

// GET /management/course/edit (Đã sửa hoàn chỉnh)
router.get('/course/edit', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        const courseId = req.query.id;
        const instructorId = req.session.authUser.UserID;
        if (!courseId) { return res.redirect('/management/course'); }

        const [course, categoriesForForm] = await Promise.all([
            courseModel.findById(courseId), // Chỉ lấy course cơ bản
            getCategoriesForForm()
        ]);

        // Kiểm tra bằng UserID
        if (!course || course.UserID !== instructorId) {
            return res.status(403).render('403', { message: 'No edit permission.' });
        }
        res.render('management/course-edit', { layout: 'main', course: course, categories: categoriesForForm });
    } catch (err) { next(err); }
});

// POST /management/course/update (Đã sửa hoàn chỉnh)
router.post('/course/update', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        const courseId = req.body.CourseID;
        const instructorId = req.session.authUser.UserID;
        const { CourseName, TinyDes, FullDes, ImageUrl, Level, CurrentPrice, OriginalPrice, SubCatID, CourseStatus } = req.body;
        if (!CourseName || !TinyDes || !FullDes || !Level || !SubCatID || OriginalPrice === undefined || CurrentPrice === undefined || !CourseStatus) {
            const [course, categoriesForForm] = await Promise.all([courseModel.findById(courseId), getCategoriesForForm()]);
            if (!course || course.UserID !== instructorId) { return res.status(403).render('403'); }
            return res.render('management/course-edit', { layout: 'main', course: course, categories: categoriesForForm, errorUpdate: 'Please fill in all fields (*).' });
        }

        // Kiểm tra bằng UserID
        const existingCourse = await courseModel.findById(courseId);
        if (!existingCourse || existingCourse.UserID !== instructorId) {
            return res.status(403).render('403', { message: 'No update permission.' });
        }

        // Cập nhật SubCatID
        const courseUpdates = {
            CourseName, TinyDes, FullDes, ImageUrl: ImageUrl || existingCourse.ImageUrl, Level, CurrentPrice: parseFloat(CurrentPrice) || 0, OriginalPrice: parseFloat(OriginalPrice) || 0,
            SubCatID: parseInt(SubCatID), CourseStatus
        };
        await courseModel.update(courseId, courseUpdates);
        res.redirect('/management/course?updateSuccess=true');
    } catch (err) { next(err); }
});

// POST /management/course/delete (Đã sửa hoàn chỉnh)
router.post('/course/delete', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        const courseIdToDelete = req.body.CourseID;
        const instructorId = req.session.authUser.UserID;
        if (!courseIdToDelete) { /* ...render lại list với lỗi... */ }

        // Kiểm tra bằng UserID
        const course = await courseModel.findById(courseIdToDelete);
        if (!course || course.UserID !== instructorId) {
            return res.status(403).render('403', { message: 'No delete permission.' });
        }
        // TODO: Kiểm tra xem có học viên nào đang enroll không trước khi xóa?
        await courseModel.delete(courseIdToDelete);
        res.redirect('/management/course?deleteSuccess=true');
    } catch (err) { next(err); }
});


// GET /management/profile (Đã sửa)
router.get('/profile', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        // Sửa: dùng instructor thay vì users
        const instructor = await accountModel.findById(req.session.authUser.UserID);
        if (!instructor) { return res.status(404).send('No information found.'); }
        res.render('management/profile', { layout: 'main', instructor: instructor }); // Sửa: truyền instructor
    } catch (err) { next(err); }
});

// POST /management/profile/update (Đã sửa)
router.post('/profile/update', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403'); }
    try {
        const { Fullname, Email } = req.body;
        const instructorId = req.session.authUser.UserID;
        if (!Fullname || !Email) {
            const instructor = await accountModel.findById(instructorId);
            return res.render('management/profile', { layout: 'main', instructor, error: 'Full name and Email cannot be blank.' });
        }
        await accountModel.update(instructorId, { Fullname, Email });
        const updatedInstructor = await accountModel.findById(instructorId);
        // Cập nhật session
        req.session.authUser.Fullname = updatedInstructor.Fullname;
        req.session.authUser.Email = updatedInstructor.Email;
        req.session.save(err => {
            if (err) return next(err); // Chuyển lỗi nếu không lưu được session
            res.render('management/profile', { layout: 'main', instructor: updatedInstructor, success: 'Update successful!' });
        });
    } catch (err) { next(err); }
});

// --- QUẢN LÝ BÀI HỌC (LESSON MANAGEMENT) ---

// Middleware kiểm tra quyền sở hữu khóa học cho các route bài học
async function checkCourseOwnership(req, res, next) {
    // Chỉ Giảng viên ('1') mới vào được
    if (req.session.authUser?.UserPermission !== '1') {
        return res.status(403).render('403');
    }
    try {
        const courseId = req.params.courseId; // Lấy ID khóa học từ URL
        const instructorId = req.session.authUser.UserID;
        const course = await courseModel.findById(courseId);

        // Kiểm tra khóa học tồn tại VÀ thuộc về giảng viên này
        if (!course || course.UserID !== instructorId) {
            console.warn(`Instructor ${instructorId} tried to access lessons for course ${courseId} owned by ${course?.UserID}`);
            return res.status(403).render('403', { message: 'You do not have permission to manage lessons for this course.' });
        }
        // Lưu thông tin khóa học vào req để các route sau sử dụng
        req.course = course;
        next(); // Cho phép đi tiếp
    } catch (err) {
        next(err); // Chuyển lỗi
    }
}

// HIỂN THỊ DANH SÁCH BÀI HỌC CỦA KHÓA HỌC (GET)
// Áp dụng middleware kiểm tra quyền sở hữu trước
router.get('/course/:courseId/lessons', checkCourseOwnership, async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const lessons = await lessonModel.findAllByCourseId(courseId);

        res.render('management/lesson-list', { // Render view mới
            layout: 'main',
            course: req.course, // Lấy thông tin khóa học từ middleware
            lessons: lessons,
            hasLessons: lessons.length > 0,
            query: req.query // Truyền query param cho thông báo
        });
    } catch (err) {
        next(err);
    }
});

// HIỂN THỊ FORM THÊM BÀI HỌC MỚI (GET)
router.get('/course/:courseId/lessons/add', checkCourseOwnership, (req, res) => {
    res.render('management/lesson-form', { // Render view form (dùng chung cho add/edit)
        layout: 'main',
        course: req.course,
        isEditing: false // Đánh dấu là đang thêm mới
    });
});

// XỬ LÝ THÊM BÀI HỌC MỚI (POST)
router.post('/course/:courseId/lessons/add', checkCourseOwnership, async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const instructorId = req.session.authUser.UserID;
        const { LessonName, TinyDes, FullDes, VideoUrl, LessonStatus, LessonPermission } = req.body;

        // Validation cơ bản
        if (!LessonName || !VideoUrl) {
            return res.render('management/lesson-form', {
                layout: 'main', course: req.course, isEditing: false,
                error: 'Please enter Lesson Name and Video URL.',
                formData: req.body // Giữ lại dữ liệu form
            });
        }

        const newLesson = {
            LessonName,
            TinyDes, FullDes, VideoUrl,
            LessonStatus: LessonStatus || 'draft', // Mặc định là draft
            LessonPermission: LessonPermission || 'private', // Mặc định là private
            CourseID: courseId, // Gán ID khóa học
            UserID: instructorId // Gán ID giảng viên (người tạo)
            // LastUpdate có DEFAULT trong DB
        };

        await lessonModel.add(newLesson);
        res.redirect(`/management/course/${courseId}/lessons?addSuccess=true`); // Về trang danh sách bài học

    } catch (err) {
        next(err);
    }
});

// HIỂN THỊ FORM SỬA BÀI HỌC (GET)
router.get('/course/:courseId/lessons/:lessonId/edit', checkCourseOwnership, async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const courseId = req.params.courseId; // Đã được check ownership ở middleware
        const instructorId = req.session.authUser.UserID;

        // Dùng hàm kiểm tra sở hữu bài học (an toàn hơn)
        const lesson = await lessonModel.findLessonIfOwned(lessonId, courseId, instructorId);

        if (!lesson) {
            return res.status(404).render('404', { message: 'Lesson not found or you do not have permission to edit.' });
        }

        res.render('management/lesson-form', { // Dùng lại view form
            layout: 'main',
            course: req.course, // Lấy từ middleware
            lesson: lesson,     // Dữ liệu bài học cần sửa
            isEditing: true     // Đánh dấu là đang sửa
        });
    } catch (err) {
        next(err);
    }
});

// XỬ LÝ CẬP NHẬT BÀI HỌC (POST)
router.post('/course/:courseId/lessons/:lessonId/update', checkCourseOwnership, async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const courseId = req.params.courseId;
        const instructorId = req.session.authUser.UserID;
        const { LessonName, TinyDes, FullDes, VideoUrl, LessonStatus, LessonPermission } = req.body;

        // Validation
        if (!LessonName || !VideoUrl) {
            const lesson = await lessonModel.findById(lessonId); // Lấy lại dữ liệu cũ
            return res.render('management/lesson-form', {
                layout: 'main', course: req.course, lesson: lesson, isEditing: true,
                error: 'Please enter Lesson Name and Video URL.',
                formData: req.body // Không nên gửi lại hết, chỉ gửi lỗi
            });
        }

        // Kiểm tra quyền sở hữu trước khi update
        const existingLesson = await lessonModel.findLessonIfOwned(lessonId, courseId, instructorId);
        if (!existingLesson) {
            return res.status(403).render('403', { message: 'You do not have permission to update this lesson.' });
        }

        const lessonUpdates = {
            LessonName, TinyDes, FullDes, VideoUrl,
            LessonStatus: LessonStatus || 'draft',
            LessonPermission: LessonPermission || 'private'
            // UserID và CourseID không đổi
        };

        await lessonModel.update(lessonId, lessonUpdates);
        res.redirect(`/management/course/${courseId}/lessons?updateSuccess=true`); // Về danh sách bài học

    } catch (err) {
        next(err);
    }
});

// XỬ LÝ XÓA BÀI HỌC (POST)
router.post('/course/:courseId/lessons/:lessonId/delete', checkCourseOwnership, async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const courseId = req.params.courseId;
        const instructorId = req.session.authUser.UserID;

        // Kiểm tra quyền sở hữu trước khi xóa
        const existingLesson = await lessonModel.findLessonIfOwned(lessonId, courseId, instructorId);
        if (!existingLesson) {
            return res.status(403).render('403', { message: 'You do not have permission to delete this lesson.' });
        }

        // TODO: Kiểm tra xem có sinh viên nào đã hoàn thành bài học này không (bảng lesson_status) trước khi xóa?

        await lessonModel.delete(lessonId);
        res.redirect(`/management/course/${courseId}/lessons?deleteSuccess=true`); // Về danh sách bài học

    } catch (err) {
        // Xử lý lỗi nếu xóa không thành công (vd: do foreign key constraint)
        console.error("Error deleting lesson:", err);
        // Có thể redirect về với thông báo lỗi
        res.redirect(`/management/course/${req.params.courseId}/lessons?errorDelete=true`);
        // next(err); // Hoặc chuyển lỗi
    }
});

// Quản lý học viên đã đăng ký khóa học (GET)
router.get('/course/:courseId/students', checkCourseOwnership, async (req, res, next) => {
    try {
        const courseId = req.params.courseId;

        // Gọi hàm model mới để lấy danh sách sinh viên
        const students = await accountModel.findEnrolledStudentsByCourseId(courseId);

        res.render('management/student-list', { // Render view mới
            layout: 'main',
            course: req.course, // Lấy thông tin khóa học từ middleware checkCourseOwnership
            students: students,
            hasStudents: students.length > 0
        });
    } catch (err) {
        next(err); // Chuyển lỗi cho middleware xử lý lỗi
    }
});

export default router;
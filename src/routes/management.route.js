// File: src/routes/management.route.js
import express from 'express';
import lessonModel from '../model/lesson.model.js';
import courseModel from '../model/course.model.js';
import * as accountModel from '../model/account.model.js';
import db from '../utils/db.js';
import upload from '../middlewares/upload.mdw.js';
import multer from 'multer';
import uploadFile from '../service/upload.js';
import path from 'path';

const uploadMulter = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30000000 },
}).single('courseVid');

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

// GET /management/course 
router.get('/course', async function (req, res, next) {
    // Middleware 'restrict' đã kiểm tra đăng nhập
    const userPermission = req.session.authUser.UserPermission;
    const userId = req.session.authUser.UserID;
    const instructorIdForStats = (userPermission === '1') ? userId : null;

    // --- BẮT ĐẦU LOGIC PHÂN TRANG ---
    const page = parseInt(req.query.page) || 1; // Lấy trang hiện tại từ query, mặc định là 1
    const LIMIT = 3; // Đặt số lượng khóa học mỗi trang (ví dụ: 6)
    const offset = (page - 1) * LIMIT;
    // ---------------------------------

    try {
        let listCourses;
        let totalCourses; // Biến để lưu tổng số khóa học

        // Lấy tổng số khóa học (Tận dụng hàm countCourses)
        totalCourses = await courseModel.countCourses(instructorIdForStats);

        // Tính tổng số trang
        const totalPages = Math.ceil(totalCourses / LIMIT);

        // Lấy danh sách khóa học đã phân trang
        if (userPermission === '1') { // Instructor
            listCourses = await courseModel.findByUserIdPaginated(userId, LIMIT, offset);
        } else if (userPermission === '0') { // Admin
            listCourses = await courseModel.findAllPaginated(LIMIT, offset);
        } else {
            return res.status(403).render('403');
        }

        // Lấy các dữ liệu khác (cho form và tab thống kê)
        const [categoriesForForm, totalStudents, avgRating, statusCounts] = await Promise.all([
            getCategoriesForForm(),
            courseModel.sumStudents(instructorIdForStats),
            courseModel.averageRating(instructorIdForStats),
            courseModel.countCoursesByStatus(instructorIdForStats)
        ]);

        // Cập nhật lại totalCourses trong statistics cho đúng
        const statistics = { totalCourses, totalStudents, avgRating, statusCounts };

        res.render('management/course', {
            layout: 'main',
            categories: categoriesForForm,
            courses: listCourses,
            statistics: statistics,
            query: req.query,
            activeTab: req.query.errorAdd ? 'add' : (req.query.addSuccess || req.query.updateSuccess || req.query.deleteSuccess ? 'list' : 'list'),

            // --- TRUYỀN DỮ LIỆU PHÂN TRANG RA VIEW ---
            pagination: {
                hasPagination: totalPages > 1 // Chỉ hiển thị nếu có nhiều hơn 1 trang
            },
            currentPage: page,  // Trang hiện tại
            totalPages: totalPages // Tổng số trang
            // ----------------------------------------
        });
    } catch (err) {
        next(err);
    }
});

// Route để xử lý upload file từ Uppy
router.post('/upload', (req, res, next) => {
    // Chỉ Giảng viên ('1') mới được upload
    if (req.session.authUser?.UserPermission !== '1') {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    const uploader = upload.single('file');

    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ Multer (ví dụ: file quá lớn)
            console.error("Multer error:", err);
            return res.status(500).json({ error: err.message });
        } else if (err) {
            // Lỗi không xác định (ví dụ: sai loại file)
            console.error("Unknown upload error:", err);
            return res.status(400).json({ error: err.message });
        }

        // Nếu không có file
        if (!req.file) {
            console.warn("Upload attempt with no file.");
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Thành công!
        // Tạo đường dẫn URL (vd: /temp_upload/file-12345.jpg)
        const urlPath = `/temp_upload/${req.file.filename}`;

        // Trả về JSON mà Uppy có thể hiểu
        res.status(200).json({
            success: true,
            uploadURL: urlPath // Uppy sẽ nhận được đường dẫn này
        });
    });
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
router.post('/course/:courseId/lessons/add', uploadMulter, checkCourseOwnership, async (req, res, next) => {
    const courseId = req.params.courseId;
    const instructorId = req.session.authUser.UserID;
    const { LessonName, TinyDes, FullDes, LessonStatus, LessonPermission } = req.body;

    if (!LessonName) {
        return res.render('management/lesson-form', {
            layout: 'main',
            course: req.course,
            isEditing: false,
            error: 'Please enter Lesson Name',
            formData: req.body,
        });
    }

    let videoUrl = null;
    if (req.file) {
        const videoFile = req.file;
        const videoExt = path.extname(videoFile.originalname);
        const videoPath = `videos/${Date.now()}${videoExt}`;

        videoUrl = await uploadFile(videoFile.buffer, videoPath);
    }

    const newLesson = {
        LessonName,
        TinyDes,
        FullDes,
        LessonStatus: LessonStatus || 'draft',
        LessonPermission: LessonPermission || 'private',
        CourseID: courseId,
        UserID: instructorId,
        VideoUrl: videoUrl,
    };

    await lessonModel.add(newLesson);
    res.redirect(`/management/course/${courseId}/lessons?addSuccess=true`);
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
router.post('/course/:courseId/lessons/:lessonId/update', uploadMulter, checkCourseOwnership, async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const courseId = req.params.courseId;
        const instructorId = req.session.authUser.UserID;
        const { LessonName, TinyDes, FullDes, LessonStatus, LessonPermission } = req.body;

        // Validation
        if (!LessonName) {
            const lesson = await lessonModel.findById(lessonId); // Lấy lại dữ liệu cũ
            return res.render('management/lesson-form', {
                layout: 'main', course: req.course, lesson: lesson, isEditing: true,
                error: 'Please enter Lesson Name',
                formData: req.body // Không nên gửi lại hết, chỉ gửi lỗi
            });
        }

        // Kiểm tra quyền sở hữu trước khi update
        const existingLesson = await lessonModel.findLessonIfOwned(lessonId, courseId, instructorId);
        if (!existingLesson) {
            return res.status(403).render('403', { message: 'You do not have permission to update this lesson.' });
        }

        let videoUrl = null;
        if (req.file) {
            const videoFile = req.file;
            const videoExt = path.extname(videoFile.originalname);
            const videoPath = `videos/${Date.now()}${videoExt}`;

            videoUrl = await uploadFile(videoFile.buffer, videoPath);
        }

        if (videoUrl != null) {
            const lessonUpdates = {
                LessonName, TinyDes, FullDes,
                LessonStatus: LessonStatus || 'draft',
                LessonPermission: LessonPermission || 'private',
                VideoUrl: videoUrl
            };

            await lessonModel.update(lessonId, lessonUpdates);
            res.redirect(`/management/course/${courseId}/lessons?updateSuccess=true`); // Về danh sách bài học

        } else {
            const lessonUpdates = {
                LessonName, TinyDes, FullDes,
                LessonStatus: LessonStatus || 'draft',
                LessonPermission: LessonPermission || 'private'
            };

            await lessonModel.update(lessonId, lessonUpdates);
            res.redirect(`/management/course/${courseId}/lessons?updateSuccess=true`); // Về danh sách bài học
        }


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
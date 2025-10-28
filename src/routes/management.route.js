// File: src/routes/management.route.js
import express from 'express';
import categoryModel from '../model/category.model.js';
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
    // Middleware restrictInstructor sẽ chạy trước nếu bạn thêm vào app.js
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
                errorAdd: 'Vui lòng điền đủ trường (*).', formData: req.body, activeTab: 'add'
            });
        }

        // Dùng UserID và SubCatID
        const newCourse = { CourseName, TinyDes, FullDes, ImageUrl: ImageUrl || null, Level, CurrentPrice: parseFloat(CurrentPrice) || 0, OriginalPrice: parseFloat(OriginalPrice) || 0,
                            UserID: instructorId, // Dùng UserID
                            SubCatID: parseInt(SubCatID), // Dùng SubCatID
                            Rating: 0.0, Total_Review: 0, TotalLession: 0, TotalStudent: 0, Views: 0, WeekView: 0, Date: new Date(), CourseStatus: 'draft' };
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
            return res.status(403).render('403', { message: 'Không có quyền sửa.' });
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
            const [course, categoriesForForm] = await Promise.all([ courseModel.findById(courseId), getCategoriesForForm() ]);
            if (!course || course.UserID !== instructorId) { return res.status(403).render('403'); }
            return res.render('management/course-edit', { layout: 'main', course: course, categories: categoriesForForm, errorUpdate: 'Vui lòng điền đủ trường (*).' });
        }

        // Kiểm tra bằng UserID
        const existingCourse = await courseModel.findById(courseId);
        if (!existingCourse || existingCourse.UserID !== instructorId) {
            return res.status(403).render('403', { message: 'Không có quyền cập nhật.' });
        }

        // Cập nhật SubCatID
        const courseUpdates = { CourseName, TinyDes, FullDes, ImageUrl: ImageUrl || existingCourse.ImageUrl, Level, CurrentPrice: parseFloat(CurrentPrice) || 0, OriginalPrice: parseFloat(OriginalPrice) || 0,
                                SubCatID: parseInt(SubCatID), CourseStatus };
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
            return res.status(403).render('403', { message: 'Không có quyền xóa.' });
        }
        // TODO: Kiểm tra xem có học viên nào đang enroll không trước khi xóa?
        await courseModel.delete(courseIdToDelete);
        res.redirect('/management/course?deleteSuccess=true');
    } catch (err) { next(err); }
});


// GET /management/profile (Đã sửa)
router.get('/profile', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403');}
    try {
        // Sửa: dùng instructor thay vì users
        const instructor = await accountModel.findById(req.session.authUser.UserID); 
        if (!instructor) { return res.status(404).send('Không tìm thấy thông tin.');}
        res.render('management/profile', { layout: 'main', instructor: instructor }); // Sửa: truyền instructor
    } catch (err) { next(err); }
});

// POST /management/profile/update (Đã sửa)
router.post('/profile/update', async (req, res, next) => {
    if (req.session.authUser.UserPermission !== '1') { return res.status(403).render('403');}
    try {
        const { Fullname, Email } = req.body; 
        const instructorId = req.session.authUser.UserID;
        if (!Fullname || !Email) { 
            const instructor = await accountModel.findById(instructorId);
            return res.render('management/profile', { layout: 'main', instructor, error: 'Họ tên và Email không được trống.' });
        }
        await accountModel.update(instructorId, { Fullname, Email });
        const updatedInstructor = await accountModel.findById(instructorId);
        // Cập nhật session
        req.session.authUser.Fullname = updatedInstructor.Fullname; 
        req.session.authUser.Email = updatedInstructor.Email;
        req.session.save(err => {
            if (err) return next(err); // Chuyển lỗi nếu không lưu được session
            res.render('management/profile', { layout: 'main', instructor: updatedInstructor, success: 'Cập nhật thành công!' });
        });
    } catch (err) { next(err); }
});

export default router;
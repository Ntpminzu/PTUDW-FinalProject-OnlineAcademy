import express from 'express';
import categoryModel from '../model/category.model.js'; // Sửa: đường dẫn đúng
import courseModel from '../model/course.model.js';   // Sửa: đường dẫn đúng
import * as accountModel from '../model/account.model.js'; // Sửa: đường dẫn đúng

const router = express.Router();

// --- QUẢN LÝ KHÓA HỌC ---
router.get('/course', async function (req, res) {

    const userPermission = req.session.authUser.UserPermission;
    const userId = req.session.authUser.UserID;

    try {
        let listCourses;
        // Biến userIdForStats: null cho Admin, userId cho Instructor
        const userIdForStats = (userPermission === '1') ? userId : null; 

        // Lấy danh sách khóa học (Đã phân quyền và join ở lần sửa trước)
        if (userPermission === '1') {
            listCourses = await courseModel.findByUserId(userId);
        } else if (userPermission === '0') {
            listCourses = await courseModel.findAll();
        } else {
            return res.status(403).render('403');
        }

        // Lấy danh sách categories cho form Add
        const listCategories = await categoryModel.findAll();

        // ** GỌI CÁC HÀM THỐNG KÊ MỚI **
        const [totalCourses, totalStudents, avgRating, statusCounts] = await Promise.all([
            courseModel.countCourses(userIdForStats),
            courseModel.sumStudents(userIdForStats),
            courseModel.averageRating(userIdForStats),
            courseModel.countCoursesByStatus(userIdForStats)
        ]);

        // Tạo object chứa dữ liệu thống kê
        const statistics = {
            totalCourses,
            totalStudents,
            avgRating,
            statusCounts // Ví dụ: { complete: 5, not cpmplete: 10 }
        };

        res.render('management/course', {
            layout: 'main',
            categories: listCategories,
            courses: listCourses,
            statistics: statistics, // ** TRUYỀN DỮ LIỆU THỐNG KÊ **
            query: req.query,
            activeTab: req.query.errorAdd ? 'add' : (req.query.addSuccess ? 'list' : 'list') // Xác định tab active
        });
    } catch (err) {
        console.error("Lỗi khi tải trang quản lý khóa học:", err);
        res.status(500).send('Đã xảy ra lỗi khi tải dữ liệu');
    }
});

// Route xử lý thêm khóa học (Code bạn cung cấp đã khá tốt, giữ nguyên)
router.post('/course/add', async (req, res) => {

    try {
        const instructorId = req.session.authUser.UserID;
        const { CourseName, TinyDes, FullDes, ImageUrl, Level, CurrentPrice, OriginalPrice, CatID } = req.body;

        // Kiểm tra dữ liệu đầu vào cơ bản (Giữ nguyên logic kiểm tra của bạn)
        if (!CourseName || !TinyDes || !FullDes || !Level || !CatID || OriginalPrice === undefined || CurrentPrice === undefined) {
             const listCategories = await categoryModel.findAll();
             const listCourses = await courseModel.findByUserId(instructorId); 
             return res.render('management/course', { // Sửa: tên file view đúng
                 layout: 'main',
                 categories: listCategories,
                 courses: listCourses,
                 errorAdd: 'Vui lòng điền đầy đủ các trường bắt buộc (*).',
                 formData: req.body,
                 activeTab: 'add' // Gợi ý: Truyền biến để active đúng tab khi có lỗi
             });
        }

        // Tạo object newCourse (Giữ nguyên logic tạo object của bạn)
        const newCourse = { CourseName, TinyDes, FullDes, ImageUrl: ImageUrl || null, Level, CurrentPrice: parseFloat(CurrentPrice) || 0, OriginalPrice: parseFloat(OriginalPrice) || 0, UserID: instructorId, CatID: parseInt(CatID), Rating: 0.0, Total_Review: 0, TotalLession: 0, TotalStudent: 0, Views: 0, WeekView: 0, Date: new Date(), CourseStatus: 'draft' };

        await courseModel.add(newCourse);
        res.redirect('/management/course?addSuccess=true'); // Redirect kèm thông báo thành công

    } catch (err) {
        console.error("Lỗi khi thêm khóa học:", err);
        try { // Xử lý lỗi tốt hơn
            const listCategories = await categoryModel.findAll();
            const listCourses = await courseModel.findByUserId(req.session.authUser.UserID);
             res.render('management/course', { // Sửa: tên file view đúng
                layout: 'main',
                categories: listCategories,
                courses: listCourses,
                errorAdd: 'Thêm khóa học thất bại do lỗi hệ thống.',
                formData: req.body,
                activeTab: 'add' // Gợi ý: Active tab 'add' khi có lỗi
            });
        } catch (renderError) {
             console.error("Lỗi khi render trang lỗi:", renderError);
             res.status(500).send('Lỗi hệ thống nghiêm trọng.');
        }
    }
});

// --- QUẢN LÝ PROFILE GIẢNG VIÊN ---
router.get('/profile', async (req, res) => {

    try {
        // Code bạn cung cấp ở đây đã gần đúng, chỉ cần sửa tên biến
        const userContent = await accountModel.findById(req.session.authUser.UserID);
        if (!userContent) {
            // Xử lý trường hợp không tìm thấy user (dù khó xảy ra nếu đã đăng nhập)
             return res.status(404).send('Không tìm thấy thông tin người dùng.');
        }
        res.render('management/profile', { // Render file profile.hbs bạn đã có
            layout: 'main',
            users: userContent // Sửa: giữ tên biến 'users' như code cũ của bạn
        });
    } catch (err) {
        console.error("Lỗi khi tải profile giảng viên:", err);
        res.status(500).send('Lỗi máy chủ');
    }
});

// Route cập nhật profile (Code bạn cung cấp đã gần đúng)
router.post('/profile/update', async (req, res) => {

    try {
        // Sửa: Lấy đúng tên từ req.body (Fullname và Email)
        const { Fullname, Email } = req.body; 
        
         // Kiểm tra nếu Fullname hoặc Email bị trống
        if (!Fullname || !Email) {
             const userContent = await accountModel.findById(req.session.authUser.UserID);
             return res.render('management/profile', {
                 layout: 'main',
                 users: userContent,
                 error: 'Họ tên và Email không được để trống.' // Thêm thông báo lỗi
             });
        }

        await accountModel.update(req.session.authUser.UserID, {
            Fullname: Fullname, // Sửa: Dùng Fullname
            Email: Email     // Sửa: Dùng Email
        });

        // Lấy lại thông tin mới nhất sau khi cập nhật
        const updatedUser = await accountModel.findById(req.session.authUser.UserID);
        
        // Cập nhật thông tin trong session để navbar hiển thị đúng tên mới
        req.session.authUser.Fullname = updatedUser.Fullname; 
        req.session.authUser.Email = updatedUser.Email;
        // Lưu lại session
        req.session.save(err => {
            if (err) {
                console.error("Lỗi khi lưu session:", err);
                // Có thể bỏ qua lỗi này và vẫn render trang
            }
             res.render('management/profile', {
                layout: 'main',
                users: updatedUser,
                success: 'Cập nhật thông tin thành công!'
            });
        });

    } catch (err) {
        console.error("Lỗi khi cập nhật profile:", err);
         try { // Xử lý lỗi tốt hơn
            const userContent = await accountModel.findById(req.session.authUser.UserID);
            res.render('management/profile', {
                layout: 'main',
                users: userContent,
                error: 'Cập nhật thông tin thất bại do lỗi hệ thống.' // Thêm thông báo lỗi chung
            });
         } catch(renderError) {
             console.error("Lỗi khi render trang lỗi profile:", renderError);
             res.status(500).send('Lỗi hệ thống nghiêm trọng.');
         }
    }
});

// --- CHỈNH SỬA KHÓA HỌC ---
// ROUTE HIỂN THỊ FORM CHỈNH SỬA KHÓA HỌC (GET)
router.get('/course/edit', async (req, res) => {

    try {
        const courseId = req.query.id; // Lấy CourseID từ query param ?id=...
        const instructorId = req.session.authUser.UserID;

        if (!courseId) {
            return res.redirect('/management/course'); // Nếu không có id, quay về danh sách
        }

        const course = await courseModel.findById(courseId);

        // Kiểm tra xem khóa học có tồn tại và giảng viên có phải chủ sở hữu không
        if (!course || course.UserID !== instructorId) {
             console.log(`Attempt by instructor ${instructorId} to edit course ${courseId} failed. Owner: ${course?.UserID}`);
             return res.status(403).render('403', { message: 'Bạn không có quyền chỉnh sửa khóa học này.' });
        }

        // Lấy danh sách categories để hiển thị trong select box
        const categories = await categoryModel.findAll();

        res.render('management/course-edit', { // Render view mới
            layout: 'main',
            course: course,
            categories: categories
        });

    } catch (err) {
        console.error("Lỗi khi tải trang sửa khóa học:", err);
        res.status(500).send('Lỗi máy chủ');
    }
});

// ROUTE XỬ LÝ CẬP NHẬT KHÓA HỌC (POST)
router.post('/course/update', async (req, res) => {

    try {
        const courseId = req.body.CourseID; // Lấy CourseID từ hidden input trong form
        const instructorId = req.session.authUser.UserID;

        // Lấy dữ liệu cần cập nhật từ form
        const {
            CourseName,
            TinyDes,
            FullDes,
            ImageUrl,
            Level,
            CurrentPrice,
            OriginalPrice,
            CatID,
            CourseStatus // Thêm CourseStatus vào
        } = req.body;

         // --- Kiểm tra dữ liệu đầu vào cơ bản ---
        if (!CourseName || !TinyDes || !FullDes || !Level || !CatID || OriginalPrice === undefined || CurrentPrice === undefined || !CourseStatus) {
             // Nếu thiếu trường, tải lại trang edit với lỗi
             const course = await courseModel.findById(courseId); // Lấy lại data cũ
             const categories = await categoryModel.findAll();
              // Chỉ render lại nếu khóa học thuộc về giảng viên này
             if (!course || course.UserID !== instructorId) { return res.status(403).render('403'); }
             return res.render('management/course-edit', {
                 layout: 'main',
                 course: course,
                 categories: categories,
                 errorUpdate: 'Vui lòng điền đầy đủ các trường bắt buộc (*).'
             });
        }
         // --- Kết thúc kiểm tra ---


        // Lấy khóa học hiện tại để kiểm tra quyền sở hữu trước khi cập nhật
        const existingCourse = await courseModel.findById(courseId);
        if (!existingCourse || existingCourse.UserID !== instructorId) {
            console.log(`Attempt by instructor ${instructorId} to UPDATE course ${courseId} failed. Owner: ${existingCourse?.UserID}`);
            return res.status(403).render('403', { message: 'Bạn không có quyền cập nhật khóa học này.' });
        }

        // Tạo object chứa các cập nhật
        const courseUpdates = {
            CourseName,
            TinyDes,
            FullDes,
            ImageUrl: ImageUrl || existingCourse.ImageUrl, // Giữ ảnh cũ nếu không nhập mới
            Level,
            CurrentPrice: parseFloat(CurrentPrice) || 0,
            OriginalPrice: parseFloat(OriginalPrice) || 0,
            CatID: parseInt(CatID),
            CourseStatus // Cập nhật trạng thái
            // Không cập nhật UserID (chủ sở hữu)
            // Có thể thêm cập nhật 'Date' nếu muốn ghi nhận ngày sửa đổi
        };

        await courseModel.update(courseId, courseUpdates);

        // Redirect về danh sách khóa học với thông báo thành công
        res.redirect('/management/course?updateSuccess=true');

    } catch (err) {
        console.error("Lỗi khi cập nhật khóa học:", err);
         // Nếu lỗi, tải lại trang edit với thông báo lỗi
         try {
            const courseId = req.body.CourseID;
            const instructorId = req.session.authUser.UserID;
            const course = await courseModel.findById(courseId);
            const categories = await categoryModel.findAll();
             if (!course || course.UserID !== instructorId) { return res.status(403).render('403'); }
             res.render('management/course-edit', {
                layout: 'main',
                course: course,
                categories: categories,
                errorUpdate: 'Cập nhật khóa học thất bại do lỗi hệ thống.'
            });
         } catch (renderError) {
             console.error("Lỗi khi render trang lỗi update:", renderError);
              res.status(500).send('Lỗi hệ thống nghiêm trọng.');
         }
    }
});

// --- XÓA KHÓA HỌC ---
// ROUTE XỬ LÝ XÓA KHÓA HỌC (POST)
router.post('/course/delete', async (req, res) => {
    // Chỉ Giảng viên ('1')
    if (!req.session.isAuthenticated || req.session.authUser.UserPermission !== '1') {
        return res.status(403).render('403');
    }

    try {
        const courseIdToDelete = req.body.CourseID; // Lấy CourseID từ hidden input
        const instructorId = req.session.authUser.UserID;

        if (!courseIdToDelete) {
             // Nếu không có CourseID, quay lại danh sách với lỗi (hoặc thông báo)
             console.warn("Attempt to delete course without ID by instructor:", instructorId);
             // Tải lại trang với thông báo lỗi nhẹ nhàng hơn
              const [listCategories, listCourses] = await Promise.all([
                 categoryModel.findAll(),
                 courseModel.findByUserId(instructorId)
              ]);
              // Tải lại các số liệu thống kê
              const [totalCourses, totalStudents, avgRating, statusCounts] = await Promise.all([
                  courseModel.countCourses(instructorId),
                  courseModel.sumStudents(instructorId),
                  courseModel.averageRating(instructorId),
                  courseModel.countCoursesByStatus(instructorId)
              ]);
               const statistics = { totalCourses, totalStudents, avgRating, statusCounts };

              return res.render('management/course', {
                 layout: 'main',
                 categories: listCategories,
                 courses: listCourses,
                 statistics: statistics,
                 errorDelete: 'Không tìm thấy khóa học cần xóa.' // Thêm thông báo lỗi
             });
        }

        // Lấy thông tin khóa học để kiểm tra quyền sở hữu
        const course = await courseModel.findById(courseIdToDelete);

        // Kiểm tra xem khóa học có tồn tại và giảng viên có phải chủ sở hữu không
        if (!course || course.UserID !== instructorId) {
            console.log(`Attempt by instructor ${instructorId} to DELETE course ${courseIdToDelete} failed. Owner: ${course?.UserID}`);
            return res.status(403).render('403', { message: 'Bạn không có quyền xóa khóa học này.' });
        }

        // Thực hiện xóa
        await courseModel.delete(courseIdToDelete);

        // Redirect về danh sách khóa học với thông báo thành công
        res.redirect('/management/course?deleteSuccess=true');

    } catch (err) {
        console.error("Lỗi khi xóa khóa học:", err);
         // Nếu lỗi, tải lại trang danh sách với thông báo lỗi chung
         try {
            const instructorId = req.session.authUser.UserID;
             const [listCategories, listCourses] = await Promise.all([
                 categoryModel.findAll(),
                 courseModel.findByUserId(instructorId)
             ]);
              const [totalCourses, totalStudents, avgRating, statusCounts] = await Promise.all([
                  courseModel.countCourses(instructorId),
                  courseModel.sumStudents(instructorId),
                  courseModel.averageRating(instructorId),
                  courseModel.countCoursesByStatus(instructorId)
              ]);
              const statistics = { totalCourses, totalStudents, avgRating, statusCounts };
             res.render('management/course', { // Sửa tên view cho đúng
                 layout: 'main',
                 categories: listCategories,
                 courses: listCourses,
                 statistics: statistics,
                 errorDelete: 'Xóa khóa học thất bại do lỗi hệ thống.' // Thêm thông báo lỗi
             });
         } catch(renderError) {
              console.error("Lỗi khi render trang lỗi delete:", renderError);
              res.status(500).send('Lỗi hệ thống nghiêm trọng.');
         }
    }
});

export default router;
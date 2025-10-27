import express from 'express';
import categoryModel from '../model/category.model.js';
import courseModel from '../model/course.model.js';
import * as accountModel from '../model/account.model.js';

const router = express.Router();

router.get('/course', async function (req, res) { 
    try {
        // Gọi cả 2 promise cùng lúc và đợi cả 2 hoàn thành
        const [listCategories, listCourses] = await Promise.all([
            categoryModel.findAll(),
            courseModel.findAll()
        ]);

        // Bây giờ listCategories và listCourses mới thực sự là mảng dữ liệu
        res.render('management/course', {  
            categories: listCategories,
            courses: listCourses
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Đã xảy ra lỗi khi tải dữ liệu');
    }
});

router.get('/profile', async function (req, res) {  
    try {
        const [userContent] = await Promise.all([
            accountModel.findById(req.session.authUser.UserID)
        ]);

       res.render('management/profile', {  
            users: userContent
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Đã xảy ra lỗi khi tải dữ liệu');
    }
    
});

router.post('/profile/update', async function (req, res) {
    try {
        const { fullname, email } =  req.body;
        await accountModel.update(req.session.authUser.UserID, {
            Fullname: fullname,
            Email: email
        });
        res.render('management/profile', {  
            users: await accountModel.findById(req.session.authUser.UserID),
            success: 'Cập nhật thông tin thành công!'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Đã xảy ra lỗi khi cập nhật dữ liệu');
    }
});


router.post('/course/add', async (req, res) => {
    // Chỉ Giảng viên (chuỗi '1') mới được thêm
    if (!req.session.isAuthenticated || req.session.authUser.UserPermission !== '1') {
        // Nếu không phải giảng viên, không cho phép (có thể redirect hoặc báo lỗi)
        return res.status(403).send('Forbidden: Chỉ giảng viên mới có quyền thêm khóa học.'); 
    }

    try {
        const instructorId = req.session.authUser.UserID; // Lấy UserID của giảng viên đang đăng nhập

        // Lấy dữ liệu từ form (req.body) - Đảm bảo tên các trường khớp với form HTML
        const {
            CourseName,
            TinyDes,
            FullDes,
            ImageUrl,
            Level, 
            CurrentPrice,
            OriginalPrice,
            CatID 
        } = req.body;

        // --- Kiểm tra dữ liệu đầu vào cơ bản ---
        if (!CourseName || !TinyDes || !FullDes || !Level || !CatID || OriginalPrice === undefined || CurrentPrice === undefined) {
             // Nếu thiếu trường bắt buộc, quay lại form với lỗi
             const listCategories = await categoryModel.findAll(); // Cần lấy lại categories cho form
             // Lấy lại danh sách khóa học của giảng viên này để hiển thị lại trang
             const listCourses = await courseModel.findByUserId(instructorId); 
             return res.render('management/course-mgm', { // Render lại trang quản lý
                 categories: listCategories,
                 courses: listCourses,
                 errorAdd: 'Vui lòng điền đầy đủ các trường bắt buộc (*).',
                 formData: req.body // Gửi lại dữ liệu cũ để điền lại form
             });
        }
        // --- Kết thúc kiểm tra ---


        // Tạo object để insert vào DB (đối chiếu DDL)
        const newCourse = {
            CourseName,
            TinyDes,
            FullDes,
            ImageUrl: ImageUrl || null, // Cho phép trống, DDL là text
            Level, // DDL là character varying
            CurrentPrice: parseFloat(CurrentPrice) || 0, // DDL là numeric
            OriginalPrice: parseFloat(OriginalPrice) || 0, // DDL là numeric
            UserID: instructorId, // DDL là uuid (đã đổi tên từ InstructorID)
            CatID: parseInt(CatID), // DDL là bigint
            // Các trường có giá trị DEFAULT trong DDL
            Rating: 0.0,
            Total_Review: 0,
            TotalLession: 0, // Tạm thời để 0
            TotalStudent: 0,
            Views: 0,
            WeekView: 0, // DDL là bigint
            Date: new Date(), // DDL là date
            CourseStatus: 'draft' // DDL là text
        };

        await courseModel.add(newCourse);

        // Sau khi thêm thành công, quay lại trang quản lý khóa học
        // Redirect kèm tham số để hiển thị thông báo thành công
        res.redirect('/management/course?addSuccess=true'); 

    } catch (err) {
        console.error("Lỗi khi thêm khóa học:", err);
        // Nếu có lỗi CSDL hoặc lỗi khác, render lại trang với thông báo lỗi chung
        try {
            const listCategories = await categoryModel.findAll();
            const listCourses = await courseModel.findByUserId(req.session.authUser.UserID);
             res.render('management/course-mgm', {
                categories: listCategories,
                courses: listCourses,
                errorAdd: 'Thêm khóa học thất bại do lỗi hệ thống. Vui lòng thử lại.',
                formData: req.body 
            });
        } catch (renderError) {
             console.error("Lỗi khi render trang lỗi:", renderError);
             res.status(500).send('Lỗi hệ thống nghiêm trọng.');
        }
    }
}); // Đóng route POST /course/add

export default router;
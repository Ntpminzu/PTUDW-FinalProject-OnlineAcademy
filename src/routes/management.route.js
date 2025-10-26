import express from 'express';
import categoryModel from '../model/category.model.js';
import courseModel from '../model/course.model.js';

const router = express.Router();

router.get('/course', async function (req, res) { // Thêm 'async'
    try {
        // Gọi cả 2 promise cùng lúc và đợi cả 2 hoàn thành
        const [listCategories, listCourses] = await Promise.all([
            categoryModel.findAll(),
            courseModel.findAll()
        ]);

        // Bây giờ listCategories và listCourses mới thực sự là mảng dữ liệu
        res.render('management/course-mgm', {  
            categories: listCategories,
            courses: listCourses
            // Lưu ý: file course-mgm.hbs của bạn đang dùng 'global_categories'
            // nên có thể bạn không cần truyền 'categories' ở đây nữa
            // vì nó đã có sẵn từ app.js (xem Vấn đề 2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Đã xảy ra lỗi khi tải dữ liệu');
    }
});

router.get('/instrustor', function (req, res) {  
    res.render('management/instructor-mgm');
});

export default router;
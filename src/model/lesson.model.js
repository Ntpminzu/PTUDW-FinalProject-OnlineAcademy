// File: src/model/lesson.model.js
import db from '../utils/db.js';

export default {

    findAllByCourseId(courseId) {
        return db('lessons')
            .where('CourseID', courseId)
            .orderBy('LastUpdate', 'asc'); // Sắp xếp theo ngày cập nhật, hoặc bạn có thể thêm cột Order
    },

    findById(lessonId) {
        return db('lessons').where('LessonID', lessonId).first();
    },

    add(lessonEntity) {
        return db('lessons').insert(lessonEntity);
    },

    update(lessonId, lessonUpdates) {
        // Cập nhật cả LastUpdate khi sửa
        lessonUpdates.LastUpdate = new Date();
        return db('lessons').where('LessonID', lessonId).update(lessonUpdates);
    },

    delete(lessonId) {
        // Cẩn thận: Nên kiểm tra xem có dữ liệu liên quan (vd: lesson_status) không trước khi xóa
        return db('lessons').where('LessonID', lessonId).del();
    },

    async findLessonIfOwned(lessonId, courseId, instructorId) {
        // DDL: lessons có CourseID và UserID (là instructor)
        return db('lessons')
            .where('LessonID', lessonId)
            .andWhere('CourseID', courseId)
            .andWhere('UserID', instructorId) // Kiểm tra người tạo bài học
            .first();
    }
}
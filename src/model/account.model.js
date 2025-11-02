import e from 'express';
import db from '../utils/db.js'

export function findById(userId) {
  return db('users').where('UserID', userId).first();
}

export function update(userId, changes) {
  return db('users').where('UserID', userId).update(changes);
}

export function add(user) {
  return db('users').insert(user);
}

export function findByUsername(username) {
  return db('users').where('UserName', username).first();
}

export function findByEmail(email) {
  return db('users').where('Email', email).first();
}

// Sửa lại hàm 'patch' theo đúng chuẩn
export function patch(userId, user) { // Đổi 'id' thành 'userId'
  return db('users').where('UserID', userId).update(user); // Sửa 'id' thành 'UserID'
}

// Sửa lại hàm getByUser trong src/model/account.model.js
export function getByUser(userId) { // Dùng cho Wishlist
  return db("watch_list as wl")
    .join("courses as c", "wl.CourseID", "=", "c.CourseID")
    // SỬA: Join users qua courses.UserID (người tạo course)
    .join("users as u", "c.UserID", "=", "u.UserID")
    .where("wl.UserID", userId) // Lọc theo người xem watchlist
    .select(
      "c.CourseID",
      "c.CourseName",
      "c.TinyDes",
      "c.ImageUrl",
      "c.Rating",
      "c.CurrentPrice",
      "u.Fullname as InstructorName" // Lấy tên giảng viên
    );
}

export function addToWatchlist(userId, courseId) {
  return db("watch_list").insert({
    UserID: userId,
    CourseID: courseId,
    added_at: db.fn.now()
  });
}

export function buyNow(userId, courseId) {
  return db("enrollments").insert({
    UserID: userId,
    CourseID: courseId,
    enrolled_at: db.fn.now()
  });
}

export function addFeedback(userId, courseId, feedback) {
  return db("course_feedback").insert({
    UserID: userId,
    CourseID: courseId,
    Feedback: feedback,
    created_at: db.fn.now()
  });
}

export function finishLesson(userId, lessonId) {
  return db("lesson_status").insert({
    UserID: userId,
    LessonID: lessonId,
    completed_at: db.fn.now(),
    UserStatus: 'DONE'
  });
}

export function remove(userId, courseId) {
  return db("watch_list")
    .where("UserID", userId)
    .andWhere("CourseID", courseId)
    .del();
}

export function getCompletedLessonsByUserId(userId, courseId) {
  return db('lesson_status')
    .join('lessons', 'lesson_status.LessonID', '=', 'lessons.LessonID')
    .join('courses', 'lessons.CourseID', '=', 'courses.CourseID')
    .where('lesson_status.UserID', userId)
    .andWhere('lessons.CourseID', courseId)
    .andWhere('lesson_status.UserStatus', 'DONE')
    .select(
      'lesson_status.LessonID',
      'lessons.LessonName',
      'lessons.VideoUrl',
      'courses.CourseID',
      'courses.CourseName'
    );
}

export function updatePassword(userId, hashedPassword) {
  return db('users')
    .where('UserID', userId)
    .update({ Password: hashedPassword });
}

export function findEnrolledStudentsByCourseId(courseId) {
  return db('enrollments as e')
    .join('users as u', 'e.UserID', '=', 'u.UserID') // Join với bảng users
    .where('e.CourseID', courseId) // Lọc theo CourseID
    .andWhere('u.UserPermission', '2') // Chỉ lấy những người là Student ('2')
    .select(
      'u.UserID',
      'u.Fullname',
      'u.Email',
      'u.UserName', // Thêm UserName nếu muốn hiển thị
      'e.enrolled_at' // Ngày đăng ký
    )
    .orderBy('e.enrolled_at', 'desc'); // Sắp xếp theo ngày đăng ký mới nhất
}

export async function countWishlistItems(UserID) {
  const result = await db('watch_list')
    .where('UserID', UserID)
    .count('CourseID as total')
    .first();
  return parseInt(result.total, 10) || 0;
}
export function getWishlistPaging(UserID, limit, offset) {
  return db('watch_list as w')
    .join('courses as c', 'w.CourseID', 'c.CourseID') // ✅ chỉ join 1 lần
    .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
    .join('categories as ca', 's.CatID', '=', 'ca.CatID')
    .select('c.*', 'ca.CatName', 's.SubCatName', 'w.added_at')
    .where('w.UserID', UserID)
    .orderBy('w.added_at', 'desc')
    .limit(limit)
    .offset(offset);
}
// ✅ Đánh dấu khóa học đã DONE
export async function finishCourse(userId, courseId) {
  const existing = await db('enrollments')
    .where('UserID', userId)
    .andWhere('CourseID', courseId)
    .first();

  if (existing) {
    // Nếu user đã đăng ký, chỉ cần update trạng thái
    return db('enrollments')
      .where('UserID', userId)
      .andWhere('CourseID', courseId)
      .update({
        LearnStatus: 'DONE',
      });
  } else {
    // Nếu user chưa có record trong enrollments, insert mới
    return db('enrollments').insert({
      UserID: userId,
      CourseID: courseId,
      LearnStatus: 'DONE',
      enrolled_at: db.fn.now(),
    });
  }
}
// ✅ Lấy danh sách khóa học đã hoàn thành (LearnStatus = 'DONE')
export function getCompletedCoursesByUserId(userId) {
  return db('enrollments as e')
    .join('courses as c', 'e.CourseID', '=', 'c.CourseID')
    .join('users as u', 'c.UserID', '=', 'u.UserID') // giảng viên
    .where('e.UserID', userId)
    .andWhere('e.LearnStatus', 'DONE')
    .select(
      'c.CourseID',
      'c.CourseName',
      'c.ImageUrl',
      'c.CurrentPrice',
      'c.Rating',
      'u.Fullname as InstructorName',
      'e.enrolled_at',
      'e.completed_at'
    )
    .orderBy('e.completed_at', 'desc');
}
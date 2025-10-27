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

export function getByUser(userId) {
  return db("watch_list")
    .join("courses", "watch_list.CourseID", "=", "courses.CourseID")
    .join("users", "courses.UserID", "=", "users.UserID")
    .where("watch_list.UserID", userId)
    .select(
      "courses.CourseID",
      "courses.CourseName",
      "courses.TinyDes",
      "courses.ImageUrl",
      "courses.Rating",
      "courses.CurrentPrice",
      "users.Fullname as InstructorName"
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

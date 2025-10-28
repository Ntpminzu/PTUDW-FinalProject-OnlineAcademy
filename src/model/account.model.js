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

export function remove(userId, courseId) {
  return db("watch_list")
    .where("UserID", userId)
    .andWhere("CourseID", courseId)
    .del();
}
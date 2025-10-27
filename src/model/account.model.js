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

  export function patch(id, user) {
    return db('users').where('id', id).update(user);
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

export function remove(userId, courseId) {
  return db("watch_list")
    .where("UserID", userId)
    .andWhere("CourseID", courseId)
    .del();
}
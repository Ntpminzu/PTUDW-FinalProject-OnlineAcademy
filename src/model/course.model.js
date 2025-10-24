import db from "../utils/db.js";

export default{
     findAll() {
    return db('courses');
  },

  findByCategory(catId) {
    return db('courses')
    .join('users', 'courses.InstructorID', '=', 'users.UserID')
    .where('courses.CatID', catId)
    .select(
      'courses.*',
      'users.Fullname as InstructorName'
    );
  },
};
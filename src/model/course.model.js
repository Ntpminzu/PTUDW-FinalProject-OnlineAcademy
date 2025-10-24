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
  findTop10CoursesViews() {
  return db('courses as c')
    .leftJoin('users as u', 'c.InstructorID', 'u.UserID')
    .leftJoin('categories as ca', 'c.CatID', 'ca.CatID')
    .orderBy('c.Views', 'desc')
    .select(
      'c.CourseID',
      'c.CourseName',
      'c.ImageUrl',
      'c.Rating',
      'c.Total_Review',
      'c.CurrentPrice',
      'c.OriginalPrice',
      'u.Fullname as InstructorName',
      'ca.CatName'
    )
    .limit(10);
  },
};
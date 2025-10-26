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
  
  // Top 4 xem nhiều trong tuần
  findTop4WeekViews() {
    return db('courses')
      .join('users', 'courses.InstructorID', '=', 'users.UserID')
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('WeekView', 'desc')
      .limit(4);
  },

  // Top 10 xem nhiều trong tuần
  findTop10WeekViews() {
    return db('courses')
      .join('users', 'courses.InstructorID', '=', 'users.UserID')
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('WeekView', 'desc')
      .limit(10);
  },

  // Top 10 mới nhất
  findTop10Newest() {
    return db('courses')
      .join('users', 'courses.InstructorID', '=', 'users.UserID')
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('Date', 'desc')
      .limit(10);
  },
  findByCategoryPaging(catId, limit, offset) {
  return db('courses')
    .join('users', 'courses.InstructorID', '=', 'users.UserID')
    .join('categories', 'courses.CatID', '=', 'categories.CatID')
    .where('courses.CatID', catId)
    .select(
      'courses.*',
      'users.Fullname as InstructorName',
      'categories.CatName as CategoryName'
    )
    .limit(limit)
    .offset(offset);
  },
  countByCategory(catId) {
  return db('courses')
    .where('CatID', catId)
    .count('* as total')
    .first();
  },
  findByName(keyword) {
  return db('courses')
    .whereRaw('LOWER("CourseName") LIKE ?', [`%${keyword.toLowerCase()}%`])
    .first();
  },
  findByKeyword(keyword) {
  return db('courses')
    .join('users', 'courses.InstructorID', '=', 'users.UserID')
    .join('categories', 'courses.CatID', '=', 'categories.CatID')
    .whereRaw(`
      LOWER("CourseName") LIKE ? 
      OR LOWER("TinyDes") LIKE ? 
      OR LOWER("FullDes") LIKE ? 
      OR LOWER("categories"."CatName") LIKE ?
      OR LOWER("users"."Fullname") LIKE ?
    `, [
      `%${keyword.toLowerCase()}%`,
      `%${keyword.toLowerCase()}%`,
      `%${keyword.toLowerCase()}%`,
      `%${keyword.toLowerCase()}%`,
      `%${keyword.toLowerCase()}%`
    ])
    .select(
      'courses.*',
      'users.Fullname as InstructorName',
      'categories.CatName as CategoryName'
    );
  },


};
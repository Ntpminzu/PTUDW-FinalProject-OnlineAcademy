import db from "../utils/db.js";

export default {
  findAll() {
    return db('courses');
  },
  
  // THÊM: Hàm thêm khóa học mới
  add(courseEntity) {
    return db('courses').insert(courseEntity);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByCategory(SubCatID) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID') 
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .where('courses.SubCatID', SubCatID)
      .select(
        'courses.*',
        'users.Fullname as InstructorName'
      );
  },

  // SỬA: 'c.InstructorID' -> 'c.UserID'
  findTop10CoursesViews() {
    return db('courses as c')
      .leftJoin('users as u', 'c.UserID', 'u.UserID')
      .leftJoin('categories as ca', 'c.SubCatID', 'ca.CatID')
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

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findTop4WeekViews() {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('WeekView', 'desc')
      .limit(4);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findTop10WeekViews() {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('WeekView', 'desc')
      .limit(10);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findTop10Newest() {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('Date', 'desc')
      .limit(10);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByCategoryPaging(SubCatID, limit, offset) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .where('courses.SubCatID', SubCatID)
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .limit(limit)
      .offset(offset);
  },

  countByCategory(SubCatID) {
    return db('courses')
      .where('SubCatID', SubCatID)
      .count('* as total')
      .first();
  },

  findByName(keyword) {
    return db('courses')
      .whereRaw('LOWER("CourseName") LIKE ?', [`%${keyword.toLowerCase()}%`])
      .first();
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByKeyword(keyword) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .whereRaw(`
        LOWER(courses."CourseName") LIKE ? 
        OR LOWER(courses."TinyDes") LIKE ?
        OR LOWER(courses."FullDes") LIKE ?
        OR LOWER(categories."CatName") LIKE ?
        OR LOWER(users."Fullname") LIKE ?
      `, [
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      ])
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      );
  },

  // finduserenrollcourses (Hàm này không join với bảng users nên không cần sửa)
  async finduserenrollcourses(UserId) {
    return await db('enrollments')
      .join('courses', 'enrollments.CourseID', 'courses.CourseID')
      .join('categories', 'courses.SubCatID', 'categories.CatID')
      .select(
        'courses.CourseID',
        'courses.CourseName',
        'courses.ImageUrl',
        'categories.CatName',
        'courses.CurrentPrice',
        'courses.OriginalPrice',
        'courses.Rating',
        'courses.Total_Review',
        'courses.TotalStudent'
      )
      .where('enrollments.UserID', UserId)
      .orderBy('enrollments.enrolled_at', 'desc');
  },

  // THÊM HÀM MỚI (đã sửa): Dùng 'UserID'
  findByUserId(userId) {
    // Tìm các khóa học có 'UserID' (trường foreign key) khớp với 'userId' (param)
    return db('courses').where('UserID', userId);
  }
};
import db from "../utils/db.js";

export default {
  findAll() {
    // JOIN with categories and users to get names
    return db('courses')
        .join('categories', 'courses.CatID', '=', 'categories.CatID')
        .join('users', 'courses.UserID', '=', 'users.UserID') // Join with users on UserID
        .select(
            'courses.*', // Select all columns from courses
            'categories.CatName', // Select Category Name
            'users.Fullname as InstructorName' // Select Instructor Fullname, aliased as InstructorName
        );
  },

  // THÊM HÀM MỚI (đã sửa): Dùng 'UserID'
  findByUserId(userId) {
    // JOIN with categories and users to get names
    return db('courses')
        .where('courses.UserID', userId) // Filter by the instructor's UserID first
        .join('categories', 'courses.CatID', '=', 'categories.CatID')
        .join('users', 'courses.UserID', '=', 'users.UserID')
        .select(
            'courses.*',
            'categories.CatName',
            'users.Fullname as InstructorName' // UserID in courses table is the instructor
        );
  },
  
  // THÊM: Hàm thêm khóa học mới
  add(courseEntity) {
    return db('courses').insert(courseEntity);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByCategory(catId) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID') 
      .where('courses.CatID', catId)
      .select(
        'courses.*',
        'users.Fullname as InstructorName'
      );
  },

  // SỬA: 'c.InstructorID' -> 'c.UserID'
  findTop10CoursesViews() {
    return db('courses as c')
      .leftJoin('users as u', 'c.UserID', 'u.UserID')
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

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findTop4WeekViews() {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
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
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
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
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .orderBy('Date', 'desc')
      .limit(10);
  },

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByCategoryPaging(catId, limit, offset) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
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

  // SỬA: 'courses.InstructorID' -> 'courses.UserID'
  findByKeyword(keyword) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID')
      .join('categories', 'courses.CatID', '=', 'categories.CatID')
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
      .join('categories', 'courses.CatID', 'categories.CatID')
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

  //--- CÁC HÀM THỐNG KÊ CHO QUẢN LÝ GIẢNG VIÊN ---//
  // Hàm trợ giúp để tạo điều kiện WHERE
  _createWhereClause(userId) {
    return userId ? { UserID: userId } : {}; // Nếu có userId, lọc theo UserID, nếu không thì không lọc
  },

  // Đếm tổng số khóa học (của GV hoặc tất cả)
  async countCourses(userId = null) {
    const whereClause = this._createWhereClause(userId);
    const result = await db('courses').where(whereClause).count('CourseID as total').first();
    return result.total || 0;
  },

  // Tính tổng số học viên (của GV hoặc tất cả)
  async sumStudents(userId = null) {
    const whereClause = this._createWhereClause(userId);
    const result = await db('courses').where(whereClause).sum('TotalStudent as total').first();
    return result.total || 0;
  },

  // Tính rating trung bình (của GV hoặc tất cả)
  async averageRating(userId = null) {
    const whereClause = this._createWhereClause(userId);
    // Tính trung bình rating, chỉ tính các khóa học có rating > 0 để tránh làm sai lệch
    const result = await db('courses').where(whereClause).andWhere('Rating', '>', 0).avg('Rating as average').first();
     // Làm tròn đến 1 chữ số thập phân
    return result.average ? parseFloat(result.average.toFixed(1)) : 0;
  },

  // Đếm số khóa học theo từng trạng thái (của GV hoặc tất cả)
  async countCoursesByStatus(userId = null) {
    const whereClause = this._createWhereClause(userId);
    const results = await db('courses')
      .where(whereClause)
      .groupBy('CourseStatus')
      .select('CourseStatus')
      .count('CourseID as count');
    
    // Chuyển kết quả thành dạng { complete: 5, not complete: 10, ... }
    const counts = {};
    results.forEach(row => {
      counts[row.CourseStatus || 'unknown'] = row.count;
    });
    return counts;
  },

  // Hàm tìm một khóa học theo CourseID (DDL xác nhận CourseID là uuid)
  findById(courseId) {
    return db('courses').where('CourseID', courseId).first();
  },

  // Hàm cập nhật thông tin khóa học
  update(courseId, courseUpdates) {
    // courseUpdates là object chứa các trường cần cập nhật
    // Ví dụ: { CourseName: '...', TinyDes: '...', CurrentPrice: ... }
    return db('courses').where('CourseID', courseId).update(courseUpdates);
  },

  // Hàm xóa khóa học theo CourseID
  delete(courseId) {
    return db('courses').where('CourseID', courseId).del();
  }
};
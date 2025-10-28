import db from "../utils/db.js";

export default {
  
  findAll() {
    return db('courses as c')
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // Dùng UserID
      .select('c.*', 'ca.CatName', 's.SubCatName', 'u.Fullname as InstructorName');
  },

  // Lấy chi tiết khóa học (bao gồm tên GV, Cat, SubCat)
  async findByIdWithDetails(courseId) {
    return db('courses as c')
      .where('c.CourseID', courseId)
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // Dùng UserID
      .select('c.*', 'ca.CatName', 's.SubCatName', 'u.Fullname as InstructorName')
      .first(); // Chỉ lấy 1 kết quả
  },

  // Hàm mới cho app.js lấy course cho dropdown navbar
  findByCategoryLimit(catId, limit) {
    return db('courses as c')
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .where('s.CatID', catId)
      .orderBy('c.Views', 'desc')
      .limit(limit)
      .select('c.CourseID', 'c.CourseName');
  },

  // Dùng UserID, SubCatID
  findBySubCategory(subCatId) { // Tìm theo SubCategory
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID') // Dùng UserID
      .where('courses.SubCatID', subCatId)
      .select('courses.*', 'users.Fullname as InstructorName');
  },

  findByUserId(userId) { // Tìm course của giảng viên
    return db('courses as c')
      .where('c.UserID', userId) // Dùng UserID
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .select('c.*', 'ca.CatName', 's.SubCatName'); // Lấy tên Cat, SubCat
  },
  
  // THÊM: Hàm thêm khóa học mới
  add(courseEntity) {
    return db('courses').insert(courseEntity);
  },

  findByCategory(SubCatID) {
    return db('courses')
      .join('users', 'courses.UserID', '=', 'users.UserID') 
      .join('sub_cat', 'courses.SubCatID', '=', 'sub_cat.SubCatID') 
      .join('categories', 'sub_cat.CatID', '=', 'categories.CatID')
      .where('courses.SubCatID', SubCatID)
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName',
        'sub_cat.SubCatName as SubCategoryName'
      );
  },

  findTop10CoursesViews() {
    return db('courses as c')
      .leftJoin('users as u', 'c.UserID', 'u.UserID') // UserID
      .leftJoin('sub_cat as s', 'c.SubCatID', 's.SubCatID')
      .leftJoin('categories as ca', 's.CatID', 'ca.CatID')
      .orderBy('c.Views', 'desc')
      .select('c.*', 'u.Fullname as InstructorName', 'ca.CatName', 's.SubCatName')
      .limit(10);
  },

  findTop4WeekViews() {
    return db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // UserID
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .select('c.*', 'u.Fullname as InstructorName', 'ca.CatName', 's.SubCatName')
      .orderBy('c.WeekView', 'desc')
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

  findTop10Newest() {
    return db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // UserID
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .select('c.*', 'u.Fullname as InstructorName', 'ca.CatName', 's.SubCatName')
      .orderBy('c.Date', 'desc') // Sắp xếp theo ngày tạo
      .limit(10);
  },

  // Dùng SubCatID
  findByCategoryPaging(subCatId, limit, offset) { // Đổi tên param
    return db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // UserID
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .where('c.SubCatID', subCatId)
      .select('c.*', 'u.Fullname as InstructorName', 'ca.CatName', 's.SubCatName')
      .limit(limit)
      .offset(offset);
  },

  // Dùng SubCatID
  countByCategory(subCatId) { 
      return db('courses').where('SubCatID', subCatId).count('* as total').first();
  },

  findByName(keyword) {
    return db('courses')
      .whereRaw('LOWER("CourseName") LIKE ?', [`%${keyword.toLowerCase()}%`])
      .first();
  },

  // SỬA: 'courses.UserID'
  findByKeyword(keyword) {
    const term = `%${keyword.toLowerCase()}%`;
    return db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID') // UserID
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .whereRaw(`LOWER(c."CourseName") LIKE ? OR LOWER(c."TinyDes") LIKE ? OR LOWER(c."FullDes") LIKE ? OR LOWER(ca."CatName") LIKE ? OR LOWER(s."SubCatName") LIKE ? OR LOWER(u."Fullname") LIKE ?`,
                [term, term, term, term, term, term])
      .select('c.*', 'u.Fullname as InstructorName', 'ca.CatName', 's.SubCatName');
  },

  // finduserenrollcourses 
  async finduserenrollcourses(UserId) {
      return db('enrollments as e')
        .join('courses as c', 'e.CourseID', 'c.CourseID')
        .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
        .join('categories as ca', 's.CatID', '=', 'ca.CatID')
        .select('c.*', 'ca.CatName', 's.SubCatName')
        .where('e.UserID', UserId)
        .orderBy('e.enrolled_at', 'desc');
  },

  //--- CÁC HÀM THỐNG KÊ CHO QUẢN LÝ GIẢNG VIÊN ---//
  // Hàm trợ giúp để tạo điều kiện WHERE
  _createWhereClause(userId = null) {
      return userId ? { UserID: userId } : {}; // Lọc theo UserID
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
    return db('courses').where('CourseID', courseId).update(courseUpdates);
  },

  // Hàm xóa khóa học theo CourseID
  delete(courseId) {
    return db('courses').where('CourseID', courseId).del();
  }
};
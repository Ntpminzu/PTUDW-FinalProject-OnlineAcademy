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
      .select(
      'c.CourseID',
      'c.CourseName',
      'c.ImageUrl',
      'c.Rating',
      'c.Total_Review',
      'c.CurrentPrice',
      'c.OriginalPrice',
      'c.WeekView',
      'u.Fullname as InstructorName',
      'ca.CatName as CategoryName'
      )
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

  // SỬA: 'courses.UserID'
  async findByKeyword(keyword, sortBy = 'name_asc', limit = 6, offset = 0) {
    const term = `%${keyword.toLowerCase()}%`;

    // Base query
    const baseQuery = db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID')
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .whereRaw(`
        LOWER(c."CourseName") LIKE ? OR
        LOWER(c."TinyDes") LIKE ? OR
        LOWER(c."FullDes") LIKE ? OR
        LOWER(ca."CatName") LIKE ? OR
        LOWER(s."SubCatName") LIKE ? OR
        LOWER(u."Fullname") LIKE ?
      `, [term, term, term, term, term, term])
      .select(
        'c.CourseID',
        'c.CourseName',
        'c.ImageUrl',
        'c.Rating',
        'c.TotalStudent',
        'c.CurrentPrice',
        'c.OriginalPrice',
        'u.Fullname as InstructorName',
        'ca.CatName as CategoryName'
      );

    // ✅ Thêm sắp xếp
      switch (sortBy) {
        case 'name_asc': baseQuery.orderBy('c.CourseName', 'asc'); break;
        case 'name_desc': baseQuery.orderBy('c.CourseName', 'desc'); break;
        case 'price_asc': baseQuery.orderBy('c.CurrentPrice', 'asc'); break;
        case 'price_desc': baseQuery.orderBy('c.CurrentPrice', 'desc'); break;
        case 'rating_desc': baseQuery.orderBy('c.Rating', 'desc'); break;
        default: baseQuery.orderBy('c.CourseName', 'asc');
      }

    // Lấy dữ liệu có phân trang
    const results = await baseQuery.clone().limit(limit).offset(offset);

    // Đếm tổng số kết quả
    const totalResult = await db('courses as c')
      .join('users as u', 'c.UserID', '=', 'u.UserID')
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .whereRaw(`
        LOWER(c."CourseName") LIKE ? OR
        LOWER(c."TinyDes") LIKE ? OR
        LOWER(c."FullDes") LIKE ? OR
        LOWER(ca."CatName") LIKE ? OR
        LOWER(s."SubCatName") LIKE ? OR
        LOWER(u."Fullname") LIKE ?
      `, [term, term, term, term, term, term])
      .count('* as count')
      .first();

    return { results, total: parseInt(totalResult.count) };
    },
  // finduserenrollcourses 
  async finduserenrollcourses(UserId) {
      return db('enrollments as e')
        .join('courses as c', 'e.CourseID', 'c.CourseID')
        .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
        .join('categories as ca', 's.CatID', '=', 'ca.CatID')
        .select('c.*', 'ca.CatName', 's.SubCatName', 'e.enrolled_at')
        .where('e.UserID', UserId)
        .orderBy('e.enrolled_at', 'desc');
  },
  // 🧮 Đếm tổng số khóa học mà user đã ghi danh
    async countUserEnrollCourses(UserId) {
      const result = await db('enrollments')
        .where('UserID', UserId)
        .count('CourseID as total')
        .first();
      return parseInt(result.total, 10) || 0;
    },

// 📄 Lấy danh sách khóa học theo phân trang (limit + offset)
  async findUserEnrollCoursesPaging(UserId, limit, offset) {
    return db('enrollments as e')
      .join('courses as c', 'e.CourseID', 'c.CourseID')
      .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
      .join('categories as ca', 's.CatID', '=', 'ca.CatID')
      .select('c.*', 'ca.CatName', 's.SubCatName', 'e.enrolled_at')
      .where('e.UserID', UserId)
      .orderBy('e.enrolled_at', 'desc')
      .limit(limit)
      .offset(offset);
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
      const whereClause = this._createWhereClause(userId); // Dùng UserID theo schema mới
      const result = await db('courses')
          .where(whereClause)
          .andWhere('Rating', '>', 0) // Chỉ tính các khóa học có rating
          .avg('Rating as average')
          .first();

      // SỬA: Kiểm tra result.average trước khi gọi toFixed
      if (result && typeof result.average === 'number') {
          return parseFloat(result.average.toFixed(1)); // Làm tròn nếu là số
      } else if (result && typeof result.average === 'string') {
          // Nếu kết quả avg trả về là string (một số DB có thể làm vậy)
          const numAvg = parseFloat(result.average);
          return isNaN(numAvg) ? 0 : parseFloat(numAvg.toFixed(1));
      }
      // Nếu không có kết quả hoặc không phải số, trả về 0
      return 0;
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

  // Hàm cập nhật thông tin khóa học
  update(courseId, courseUpdates) {
    return db('courses').where('CourseID', courseId).update(courseUpdates);
  },

  // Hàm xóa khóa học theo CourseID
  delete(courseId) {
    return db('courses').where('CourseID', courseId).del();
  },

  //--- HẾT CÁC HÀM THỐNG KÊ CHO QUẢN LÝ GIẢNG VIÊN ---//

  // Các hàm khác
  findById(courseId) {
    return db('courses')
      .leftJoin('users', 'courses.UserID', '=', 'users.UserID')
      .leftJoin('categories', 'courses.SubCatID', '=', 'categories.CatID')
      .where('courses.CourseID', courseId)
      .select(
        'courses.*',
        'users.Fullname as InstructorName',
        'categories.CatName as CategoryName'
      )
      .first();
  },
  checkIfInWishlist(userId, courseId) {
    return db('watch_list')
      .where('UserID', userId)
      .andWhere('CourseID', courseId);
  },
  checkIfInEnrollments(userId, courseId) {
    return db('enrollments')
      .where('UserID', userId)
      .andWhere('CourseID', courseId);
  },
  checkIfInFeedbacks(userId, courseId) {
    return db('course_feedback')
      .where('UserID', userId)
      .andWhere('CourseID', courseId);
  },
  findLessonsByCourseId(courseId) {
    return db('lessons')
      .where('CourseID', courseId)
      .select(
        'LessonID',
        'LessonName',
        'TinyDes',
        'FullDes',
        'VideoUrl',
        'LessonStatus',
        'LessonPermission',
        'LastUpdate',
        'CourseID',
        'UserID'
      )
      .orderBy('LastUpdate', 'asc');
  },
  findFeedbacksByCourseId(courseId) {
    return db('course_feedback')
      .where('CourseID', courseId)
      .leftJoin('users', 'course_feedback.UserID', '=', 'users.UserID')
      .select(
        'Fullname',
        'CourseID',
        'Feedback',
        'created_at'
      )
      .orderBy('created_at', 'asc');
  },
async findRelatedCourses(courseId, catId) {
  const sameCat = await db('courses as c')
    .join('users as u', 'c.UserID', '=', 'u.UserID')
    .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
    .join('categories as ca', 's.CatID', '=', 'ca.CatID')
    .where('ca.CatID', catId)
    .andWhereNot('c.CourseID', courseId)
    .select(
      'c.CourseID',
      'c.CourseName',
      'c.ImageUrl',
      'c.Rating',
      'c.Total_Review',
      'c.TotalStudent',  
      'c.CurrentPrice',
      'c.OriginalPrice',
      'u.Fullname as InstructorName',
      'ca.CatName as CategoryName'
    )
    .orderBy('c.Views', 'desc')
    .limit(5);

  if (sameCat.length >= 5) return sameCat;

  const remaining = 5 - sameCat.length;

  const extra = await db('courses as c')
    .join('users as u', 'c.UserID', '=', 'u.UserID')
    .join('sub_cat as s', 'c.SubCatID', '=', 's.SubCatID')
    .join('categories as ca', 's.CatID', '=', 'ca.CatID')
    .whereNot('c.CourseID', courseId)
    .select(
      'c.CourseID',
      'c.CourseName',
      'c.ImageUrl',
      'c.Rating',
      'c.Total_Review',
      'c.TotalStudent',   
      'c.CurrentPrice',
      'c.OriginalPrice',
      'u.Fullname as InstructorName',
      'ca.CatName as CategoryName'
    )
    .orderByRaw('RANDOM()')
    .limit(remaining);

  return [...sameCat, ...extra];
}



};
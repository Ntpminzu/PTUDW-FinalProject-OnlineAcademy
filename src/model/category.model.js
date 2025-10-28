import db from "../utils/db.js";

export default{
    async findAll(){
        return db('categories').orderBy('CatID', 'asc');
    },
    findByID(id){
        return db('categories').where('CatID',id).first();
    },
    add(category){
     return db('categories').insert(category);
    },
    delete(id){
        return db('categories').where('CatID',id).del();
    },
    patch(id,category){
        return db('categories').where('CatID',id).update(category);
    },
    findByName(keyword) {
    return db('categories')
      .whereRaw('LOWER("CatName") LIKE ?', [`%${keyword.toLowerCase()}%`])
    },

    // Sửa hàm findTopSubCategories
    findTopSubCategories(limit = 10) {
        return db('sub_cat as s')
            .leftJoin( // Subquery tính tổng WeekView cho từng SubCatID
                db('courses')
                .select('SubCatID')
                .sum('WeekView as TotalWeekView')
                .groupBy('SubCatID')
                .as('course_views'),
                's.SubCatID', '=', 'course_views.SubCatID'
            )
            .leftJoin('categories as ca', 's.CatID', 'ca.CatID') // Join categories cha
            .select(
                's.SubCatID', 's.SubCatName', 's.CatID', 'ca.CatName',
                // Lấy tổng WeekView, nếu không có course thì là 0
                db.raw('COALESCE(course_views."TotalWeekView", 0) as total_week_views')
            )
            .orderBy('total_week_views', 'desc')
            .limit(limit);
    },
};
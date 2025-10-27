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
    findTopSubCategories(limit) {
        return db('sub_cat as s')
            .leftJoin('courses as c', 's.SubCatID', 'c.SubCatID')
            .leftJoin('categories as ca', 's.CatID', 'ca.CatID')
            .select(
            's.SubCatID',
            's.SubCatName',
            's.CatID',
            's.SubCatDes',
            'ca.CatName',
            db.raw('COALESCE(SUM(c."WeekView"), 0) as total_week_views')
            )
            .groupBy('s.SubCatID', 's.SubCatName', 's.SubCatDes','s.CatID', 'ca.CatName')
            .orderBy('total_week_views', 'desc')
            .limit(10);
    },
};
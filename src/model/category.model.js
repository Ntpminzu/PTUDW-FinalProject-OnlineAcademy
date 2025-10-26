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
    findtopcategories(limit) {
    return db('categories')
      .limit(10);
    },
};
import db from '../utils/db.js';

export default {
    findbyId(id){
        return db('categories').where('CatID', id).first();
    },
    findAll(){
        return db('categories');
    },
    add(category){
        return db('categories').insert(category);
    },
    del(id){
        return db('categories').where('CatID', id).del();
    },
    patch(id, category){
        return db('categories').where('CatID', id).update(category);
    },
}
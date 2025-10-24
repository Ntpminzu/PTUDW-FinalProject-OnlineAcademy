import db from "../utils/db.js";

export default{
    findAll(){
        return db('categories');
    },
    findByID(id){
        return db('categories').where('CatID',id).first();
    },
};
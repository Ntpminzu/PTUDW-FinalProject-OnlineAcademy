import db from '../utils/db.js';

export default {
    findbyId(id){
        return db('courses').where('CourseID', id).first();
    },
    findAll(){
        return db('courses');
    },
    add(course){
        return db('courses').insert(course);
    },
    del(id){
        return db('courses').where('CourseID', id).del();
    },
    patch(id, course){
        return db('courses').where('CourseID', id).update(course);
    }
}
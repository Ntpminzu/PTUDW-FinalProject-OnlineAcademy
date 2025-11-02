import db from '../utils/db.js';

export function findAll() {
  return db('users').orderBy('UserPermission', 'asc');
}

export function findById(id) {
  return db('users').where('UserID', id).first();
}
export function allTeachers() {
  return db('users')
    .whereRaw('TRIM("UserPermission") = ?', ['1']);
}


export function add(user) {
  return db('users').insert(user);
}

export function del(id) {
  return db('users').where('UserID', id).del();
}

export function patch(id, user) {
  return db('users').where('UserID', id).update(user);
}
export function findPage(offset, limit) {
  return db('users').limit(limit).offset(offset);
}

export async function countAll() {
  const result = await db('users').count('UserID as amount');
  return result[0];
}

/*=================categories=================*/
export function findCategoryById(id) {
  return db('categories').where('CatID', id).first();
}
export function findAllCategories() {
  return db('categories').orderBy('CatID', 'asc');
}
export function addCategory(category) {
  return db('categories').insert(category);
}
export function delCategory(id) {
  return db('categories').where('CatID', id).del();
}
export function patchCategory(id, category) {
  return db('categories').where('CatID', id).update(category);
}
/*=================sub_categories=================*/

export function findAllSubCat() {
  return db('sub_cat').orderBy('SubCatID', 'asc');
}

export function findSubCategoryById(id) {
  return db('sub_cat').where('SubCatID', id).first();
}
export function findSubCatByCat(CatID) {
  return db('sub_cat')
    .select('SubCatID', 'SubCatName', 'SubCatDes', 'CatID')
    .where('CatID', CatID)
    .orderBy("SubCatID", "asc");
}

export function addSubCategory(subcat) {
  return db('sub_cat').insert(subcat);
}
export function delSubCategory(id) {
  return db('sub_cat').where('SubCatID', id).del();
}
export function patchSubCategory(id, subcat) {
  return db('sub_cat').where('SubCatID', id).update(subcat);
}

/*=================course=================*/
export function findCourseById(id) {
  return db('courses').where('CourseID', id).first();
}
export function findCourseBySubCat(SubCatID) {
  return db('courses')
    .select('CourseID', 'CourseName', 'TinyDes', 'Level', 'CurrentPrice', 'OriginalPrice', 'CourseStatus', 'SubCatID', 'UserID')
    .where('SubCatID', SubCatID)
    .orderBy("CourseID", "asc");
}

export function delCourse(id) {
  return db('courses').where('CourseID', id).del();
}
export function patchCourse(id, Courses) {
  return db('courses').where('CourseID', id).update(Courses);
}

export function findAllCourses() {
  return db('courses')
    .select(
      'CourseID',
      'CourseName',
      'TinyDes',
      'Level',
      'CurrentPrice',
      'OriginalPrice',
      'CourseStatus',
      'SubCatID',
      'UserID'
    )
    .orderBy('CourseID', 'asc');
}

export function findCourseByCat(CatID) {
  return db('courses as c')
    .join('sub_cat as s', 'c.SubCatID', 's.SubCatID')
    .select(
      'c.CourseID',
      'c.CourseName',
      'c.TinyDes',
      'c.Level',
      'c.CurrentPrice',
      'c.OriginalPrice',
      'c.CourseStatus',
      'c.SubCatID',
      'c.UserID'
    )
    .where('s.CatID', CatID)
    .orderBy('c.CourseID', 'asc');
}



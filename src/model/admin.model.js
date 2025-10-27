import db from '../utils/db.js';

export function findAll() {
  return db('users').orderBy('UserPermission', 'asc');
}

export function findById(id) {
  return db('users').where('UserID', id).first();
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
export function findSubCategoryById(id) {
  return db('sub_cat').where('SubCatID', id).first();
}
export function findSubCatByCat(CatID) {
  return db('sub_cat')
    .select('SubCatID', 'SubCatName', 'SubCatDes', 'CatID')
    .where('CatID', CatID)
    .orderBy("SubCatID","asc");
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

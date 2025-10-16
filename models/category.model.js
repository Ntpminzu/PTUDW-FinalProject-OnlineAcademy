import db from '../utils/db.js';

export function findAll() {
  return db('categories');
}

export function findById(id) {
  return db('categories').where('catid', id).first();
}

export function add(category) {
  return db('categories').insert(category);
}

export function del(id) {
  return db('categories').where('catid', id).del();
}

export function patch(id, category) {
  return db('categories').where('catid', id).update(category);
}
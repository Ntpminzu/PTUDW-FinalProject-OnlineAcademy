import db from '../utils/db.js';

export function findById(id) {
  return db('products').where('proid', id).first();
}

export function findByCat(catid) {
  return db('products').where('catid', catid);
}

export function findPageByCat(catid, offset, limit) {
  return db('products')
    .where('catid', catid)
    .offset(offset)
    .limit(limit);
}

export function countByCat(catid) {
  return db('products')
    .where('catid', catid)
    .count('catid as amount')
    .first();
}

export function searchByName(name) {
  return db('products')
  .whereRaw('fts @@ to_tsquery(remove_accents(?))', [name])
}
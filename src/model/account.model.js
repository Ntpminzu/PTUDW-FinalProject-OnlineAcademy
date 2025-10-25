import db from '../utils/db.js'

  export function findById(userId) {
    return db('users').where('UserID', userId).first();
  }

  export function update(userId, changes) {
    return db('users').where('UserID', userId).update(changes);
  }

  export function add(user) {
    return db('users').insert(user);
  }

  export function findByUsername(username) {
    return db('users').where('UserName', username).first();
  }

  export function findByEmail(email) {
    return db('users').where('Email', email).first();
  }

  export function patch(id, user) {
    return db('users').where('id', id).update(user);
  }
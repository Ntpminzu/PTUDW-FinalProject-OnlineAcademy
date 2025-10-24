import db from '../utils/db.js'

export default {
  findById(userId) {
    return db('users').where('UserID', userId).first();
  },

  update(userId, changes) {
    return db('users').where('UserID', userId).update(changes);
  }
}
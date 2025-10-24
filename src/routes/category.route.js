import express from 'express';
import knex from 'knex';
import categoryModel from '../model/category.model.js';


const router = express.Router();

router.get('/list', function (req, res) {
    res.render('category/list');
} );

router.get('/add', function (req, res) {
    res.render('category/add');
} );
router.get('/edit', function (req, res) {
    res.render('category/edit');
} );

export default router;
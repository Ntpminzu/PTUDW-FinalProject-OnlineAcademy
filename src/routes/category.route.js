import express from 'express';

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
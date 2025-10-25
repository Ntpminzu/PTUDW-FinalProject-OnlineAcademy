import express from 'express';

const router = express.Router();

router.get('/', function (req, res) {
    res.render('course/home');
});

router.get('/detail', function (req, res) {
    res.render('course/detail');
});

router.get('/course-remake', function (req, res) {
    res.render('course/course-remake');
});

export default router;
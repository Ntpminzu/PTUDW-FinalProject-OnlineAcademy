import express from 'express';

const router = express.Router();

router.get('/', function (req, res) {
    res.render('course/home');
});

router.get('/detail', function (req, res) {
    res.render('course/detail');
});

router.get('/list', function (req, res) {
    res.render('course/CourseList');
});

router.get('/add', function (req, res) {
    res.render('course/CourseAdd');
});

router.get('/enroll', function (req, res) {
    res.render('course/enroll');
});

export default router;
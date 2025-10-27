import express from 'express';

const router = express.Router();

router.get('/course', function (req, res) {  
    res.render('management/course-mgm');
});

router.get('/instructor', function (req, res) {  
    res.render('management/instructor-mgm');
});

export default router;
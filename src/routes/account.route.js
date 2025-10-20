import express from 'express';

const router = express.Router();
router.get('/signup', (req, res) => {
  res.render('account/signup'); 
});

router.get('/signin', (req, res) => {
  res.render('account/signin');
});

router.get('/profile', (req, res) => {
  res.render('account/profile');
});

router.get('/change-password', (req, res) => {
  res.render('account/change-password');
});

export default router;


import express from 'express';

const router = express.Router();
router.get('/signup', (req, res) => {
  res.render('account/signup'); 
});

router.get('/signin', (req, res) => {
  res.render('account/signin');
});

export default router;


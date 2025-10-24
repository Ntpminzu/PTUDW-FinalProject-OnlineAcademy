import express from 'express';

const router = express.Router();
router.get('/signup', (req, res) => {
  res.render('account/signup'); 
});

router.get('/signin', (req, res) => {
  res.render('account/signin');
});

router.get('/profile',async (req, res) => {
  if (!req.session.auth) return res.redirect("/login");

  const user = await accountModel.findById(req.session.authUser.UserID);
  res.render("view/account/profile", {
     user
     });
});

router.post("/profile", async (req, res) => {
  if (!req.session.auth) return res.redirect("/login");

  const userId = req.session.authUser.UserID;
  const { Fullname, Email, Permission } = req.body;

  await accountModel.update(userId, {
    Fullname, Email, Permission
  });

  res.redirect("/profile");
});

router.get('/change-password', (req, res) => {
  res.render('account/change-password');
});

export default router;


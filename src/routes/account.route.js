import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountModel from '../model/account.model.js';
import { sendOTP } from '../utils/mail.js';

const router = express.Router();

router.get('/signup', (req, res) => {
  res.render('account/signup', { showOtp: false });
});

router.post('/signup', async (req, res) => {
  try {
    const { username, password, confirm, name, email } = req.body;

    if (!username || !password || !confirm || !name || !email)
      return res.render('account/signup', { error: 'Vui lòng điền đầy đủ thông tin.', showOtp: false });

    if (password !== confirm)
      return res.render('account/signup', { error: 'Mật khẩu không khớp.', showOtp: false });

    const existingUser = await accountModel.findByUsername(username);
    if (existingUser)
      return res.render('account/signup', { error: 'Tên đăng nhập đã tồn tại.', showOtp: false });

    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.pendingUser = { username, password, name, email };
    req.session.signupOtp = otp;
    req.session.signupOtpAt = Date.now();

    await sendOTP(email, otp);
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.render('account/signup', { showOtp: true, email });
  } catch (error) {
    console.error(error);
    res.render('account/signup', { error: 'Server error.', showOtp: false });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const pending = req.session.pendingUser;
    const storedOtp = req.session.signupOtp;
    const otpAt = req.session.signupOtpAt;

    if (!pending || !storedOtp)
      return res.render('account/signup', { error: 'Không tìm thấy phiên đăng ký.', showOtp: false });

    if (Date.now() - otpAt > 5 * 60 * 1000)
      return res.render('account/signup', { error: 'OTP đã hết hạn.', showOtp: false });

    if (String(otp) !== String(storedOtp))
      return res.render('account/signup', { error: 'OTP không đúng.', showOtp: true, email: pending.email });

    const hash = bcrypt.hashSync(pending.password, 10);
    await accountModel.add({
      UserName: pending.username,
      Password: hash,
      Fullname: pending.name,
      Email: pending.email,
      UserPermission: 2,
    });

    req.session.pendingUser = null;
    req.session.signupOtp = null;
    req.session.signupOtpAt = null;

    res.render('account/signin', { success: 'Đăng ký thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    console.error(error);
    res.render('account/signup', { error: 'Lỗi khi xác minh OTP.', showOtp: true });
  }
});


router.get('/signin', (req, res) => {
  res.render('account/signin', { showOtp: false });
});

router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await accountModel.findByUsername(username);

    if (!user)
      return res.render('account/signin', { error: 'Sai tên đăng nhập hoặc mật khẩu.', showOtp: false });

    const match = bcrypt.compareSync(password, user.Password);
    if (!match)
      return res.render('account/signin', { error: 'Sai tên đăng nhập hoặc mật khẩu.', showOtp: false });

    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.signinUser = user;
    req.session.signinOtp = otp;
    req.session.signinOtpAt = Date.now();

    await sendOTP(user.Email, otp);
    console.log(`📩 Signin OTP sent to ${user.Email}: ${otp}`);

    res.render('account/signin', { showOtp: true, email: user.Email, username });
  } catch (error) {
    console.error(error);
    res.render('account/signin', { error: 'Server error.', showOtp: false });
  }
});

router.post('/verify-signin-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const pending = req.session.signinUser;
    const storedOtp = req.session.signinOtp;
    const otpAt = req.session.signinOtpAt;

    if (!pending || !storedOtp)
      return res.render('account/signin', { error: 'Không tìm thấy phiên đăng nhập.', showOtp: false });

    if (Date.now() - otpAt > 5 * 60 * 1000)
      return res.render('account/signin', { error: 'OTP đã hết hạn.', showOtp: false });

    if (String(otp) !== String(storedOtp))
      return res.render('account/signin', { error: 'OTP không đúng.', showOtp: true, email: pending.Email 
    });
    req.session.isAuthenticated = true;
    req.session.authUser = pending;
    req.session.signinUser = null;
    req.session.signinOtp = null;
    req.session.signinOtpAt = null;

    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    res.redirect(retUrl);
  } catch (error) {
    console.error(error);
    res.render('account/signin', { error: 'Lỗi khi xác minh OTP.', showOtp: true });
  }
});

router.get('/profile',async (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect("/account/signin");

  const user = await accountModel.findById(req.session.authUser.UserID);
  res.render("account/profile", {
     user
     });
});

router.post("/profile", async (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect("/account/signin");
  const userId = req.session.authUser.UserID;
  const { Fullname } = req.body;

  await accountModel.update(userId, { Fullname });
  req.session.authUser.Fullname = Fullname; // cập nhật trong session

  res.redirect("/account/profile");
});


router.post('/signout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect('/');
});

router.get('/change-password', (req, res) => {
  res.render('account/change-password');
});

router.post('/change-password', async function (req, res) {
  if (!req.session.isAuthenticated)
    return res.redirect('/account/signin');

  const userId = req.session.authUser.UserID;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('account/change-password', {
      error: 'Vui lòng nhập đầy đủ thông tin.'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('account/change-password', {
      error: 'Mật khẩu mới không khớp.'
    });
  }

  const user = await accountModel.findById(userId);

  const isMatch = bcrypt.compareSync(currentPassword, user.Password);
  if (!isMatch) {
    return res.render('account/change-password', {
      error: 'Mật khẩu hiện tại không đúng.'
    });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await accountModel.patch(userId, { Password: hashedPassword });

  req.session.authUser.Password = hashedPassword;

  res.render('account/change-password', {
    success: 'Đổi mật khẩu thành công!'
  });
});



router.get('/wishlist',async (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const items = await accountModel.getByUser(userId);

  res.render("account/wishlist", {
    items,
    empty: items.length === 0
  });
});

router.post("/wishlist/remove", async (req, res) => {
  const userId = req.session.authUser.UserID;
  const { courseId } = req.body;

  await accountModel.remove(userId, courseId);
  res.redirect("/account/wishlist");
});


router.post("/add-to-watchlist", async (req, res) => {
  if (!req.session.isAuthenticated)
    return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const { courseId } = req.body;

  await accountModel.addToWatchlist(userId, courseId);
  res.redirect(`/account/wishlist`);
});

router.post("/buy-now", async (req, res) => {
  if (!req.session.isAuthenticated)
    return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const { courseId } = req.body;

  await accountModel.buyNow(userId, courseId);
  res.redirect(`/course/detail?id=` + courseId);
});

router.post("/add-feedback", async (req, res) => {
  if (!req.session.isAuthenticated)
    return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const { courseId, feedback } = req.body;

  await accountModel.addFeedback(userId, courseId, feedback);
  res.redirect(`/course/detail?id=` + courseId);
});


router.post("/finish-lesson", async (req, res) => {
  if (!req.session.isAuthenticated)
    return res.redirect("/account/signin");

  const userId = req.session.authUser.UserID;
  const { lessonId, courseId } = req.body;

  await accountModel.finishLesson(userId, lessonId);
  res.redirect(`/course/enroll?id=` + courseId);
});

router.get('/change-email', (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect('/account/signin');
  res.render('account/change-email', { showOtp: false });
});

router.post('/change-email', async (req, res) => {
  const { newEmail } = req.body;
  if (!req.session.isAuthenticated)
    return res.redirect('/account/signin');

  if (!newEmail)
    return res.render('account/change-email', { error: 'Vui lòng nhập email mới.', showOtp: false });

  const otp = Math.floor(100000 + Math.random() * 900000);
  req.session.changeEmailOtp = otp;
  req.session.changeEmailNew = newEmail;
  req.session.changeEmailAt = Date.now();

  await sendOTP(newEmail, otp);
  console.log(`📩 OTP gửi đến ${newEmail}: ${otp}`);

  res.render('account/change-email', { showOtp: true, newEmail });
});

router.post('/verify-change-email', async (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect('/account/signin');

  const { otp } = req.body;
  const userId = req.session.authUser.UserID;
  const storedOtp = req.session.changeEmailOtp;
  const otpAt = req.session.changeEmailAt;
  const newEmail = req.session.changeEmailNew;

  if (!storedOtp || !newEmail)
    return res.render('account/change-email', { error: 'Không tìm thấy phiên xác thực.', showOtp: false });

  if (Date.now() - otpAt > 5 * 60 * 1000)
    return res.render('account/change-email', { error: 'OTP đã hết hạn.', showOtp: false });

  if (String(otp) !== String(storedOtp))
    return res.render('account/change-email', { error: 'OTP không đúng.', showOtp: true, newEmail });

  await accountModel.update(userId, { Email: newEmail });
  req.session.authUser.Email = newEmail;

  req.session.changeEmailOtp = null;
  req.session.changeEmailNew = null;
  req.session.changeEmailAt = null;

  res.render('account/change-email', { success: '✅ Đổi email thành công!', showOtp: false });
});


export default router;


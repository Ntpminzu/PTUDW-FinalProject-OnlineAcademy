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
      UserPermission: 0,
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

    res.redirect('/');
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
  if (!req.session.auth) return res.redirect("/login");

  const userId = req.session.authUser.UserID;
  const { Fullname, Email, Permission } = req.body;

  await accountModel.update(userId, {
    Fullname, Email, Permission
  });

  res.redirect("/profile");
});

router.post('/signout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect('/');
});

router.get('/change-password', (req, res) => {
  res.render('account/change-password');
});

router.get('/wishlist', (req, res) => {
  res.render('account/wishlist');
});

router.get('/history', (req, res) => {
  res.render('account/history');
});

export default router;


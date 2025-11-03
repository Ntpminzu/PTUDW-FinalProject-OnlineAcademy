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

    const existingEmail = await accountModel.findByEmail(email);
    if (existingEmail)
      return res.render('account/signup', { error: 'Email đã được sử dụng.', showOtp: false });

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
      return res.render('account/signin', {
        error: 'Sai tên đăng nhập hoặc mật khẩu.',
        showOtp: false
      });

    if (user.Lock === true || user.Lock === 1) {
      return res.render('Admin/user/AddLock', {
        layout: false,
        user
      });
    }

    const match = bcrypt.compareSync(password, user.Password);
    if (!match)
      return res.render('account/signin', {
        error: 'Sai tên đăng nhập hoặc mật khẩu.',
        showOtp: false
      });

    req.session.isAuthenticated = true;
    req.session.authUser = user;

    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    res.redirect(retUrl);
  } catch (error) {
    console.error(error);
    res.render('account/signin', {
      error: 'Server error.',
      showOtp: false
    });
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



router.get('/wishlist', async (req, res, next) => {
  if (!req.session.isAuthenticated) return res.redirect('/account/signin');

  try {
    const userId = req.session.authUser.UserID;

    const page = parseInt(req.query.page) || 1;
    const limit = 3; // Số khóa học mỗi trang
    const offset = (page - 1) * limit;

    // Đếm tổng số wishlist của user
    const totalItems = await accountModel.countWishlistItems(userId);
    const totalPages = Math.ceil(totalItems / limit);

    // Lấy danh sách wishlist theo trang
    const items = await accountModel.getWishlistPaging(userId, limit, offset);

    res.render('account/wishlist', {
      layout: 'main',
      items,
      empty: items.length === 0,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
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
// ======================= [POST] /account/finish-course =======================
router.post("/finish-course", async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.session?.authUser?.UserID;

    console.log("[finish-course] courseId =", courseId, "| userId =", userId);

    if (!userId) {
      console.warn("[finish-course] ❌ userId missing");
      return res.status(401).json({ error: "Unauthorized: user not logged in" });
    }

    if (!courseId || String(courseId).trim() === "") {
      console.warn("[finish-course] ⚠️ courseId is missing or empty");
      return res.status(400).json({ error: "Missing courseId" });
    }

    await accountModel.finishCourse(userId, courseId);

    console.log(`[finish-course] ✅ User ${userId} finished course ${courseId}`);
    return res.status(200).json({ message: "Course marked as DONE successfully" });
  } catch (error) {
    console.error("Error finishing course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// ======================= [GET] /account/completed-courses =======================
router.get("/completed-courses", async (req, res) => {
  try {
    const userId = req.session?.authUser?.UserID;

    if (!userId) {
      console.warn("[completed-courses] ❌ userId missing");
      return res.status(401).json({ error: "Unauthorized: user not logged in" });
    }

    const courses = await accountModel.getCompletedCoursesByUserId(userId);

    console.log(`[completed-courses] ✅ Found ${courses.length} courses for user ${userId}`);
    return res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching completed courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/change-email', (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect('/account/signin');
  res.render('account/change-email', { showOtp: false });
});

router.post('/change-email', async (req, res) => {
  if (!req.session.isAuthenticated) return res.redirect('/account/signin');

  const { newEmail } = req.body;
  const userId = req.session.authUser.UserID;

  if (!newEmail)
    return res.render('account/change-email', { error: 'Vui lòng nhập email mới.' });

  try {
    await accountModel.update(userId, { Email: newEmail });
    req.session.authUser.Email = newEmail;

    res.render('account/change-email', { success: '✅ Đổi email thành công!' });
  } catch (error) {
    console.error('Lỗi khi đổi email:', error);
    res.render('account/change-email', { error: '❌ Có lỗi xảy ra khi đổi email.' });
  }
});

export default router;


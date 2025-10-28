// File: src/middlewares/auth.mdw.js
export function restrict(req, res, next) {
  if (req.session.isAuthenticated) {
    next(); // Đã đăng nhập, cho đi tiếp
  } else {
    // Chưa đăng nhập, lưu lại URL muốn truy cập và chuyển hướng về trang login
    req.session.retUrl = req.originalUrl;
    res.redirect('/account/signin');
  }
}

// Kiểm tra Admin ('0')
export function restrictAdmin(req, res, next) {
  // Đã đăng nhập VÀ là Admin
  if (req.session.authUser?.UserPermission === '0') {
    next(); // Là Admin, cho đi tiếp
  } else {
    // Không phải Admin, hiển thị trang lỗi 403 (Forbidden)
    res.status(403).render('403');
  }
}

// Kiểm tra Instructor ('1') 
export function restrictInstructor(req, res, next) {
  // Đã đăng nhập VÀ là Instructor
  if (req.session.authUser?.UserPermission === '1') {
    next(); // Là Instructor, cho đi tiếp
  } else {
    // Không phải Instructor, hiển thị trang lỗi 403
    res.status(403).render('403');
  }
}
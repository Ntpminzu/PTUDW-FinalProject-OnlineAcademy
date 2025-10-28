// File: src/middlewares/auth.mdw.js
export function restrict(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    req.session.retUrl = req.originalUrl;
    res.redirect('/account/signin');
  }
}

// Kiểm tra Admin ('0')
export function restrictAdmin(req, res, next) {
  if (req.session.authUser?.UserPermission === '0') { 
    next();
  } else {
    res.status(403).render('403'); 
  }
}

// Kiểm tra Instructor ('1')
export function restrictInstructor(req, res, next) {
  if (req.session.authUser?.UserPermission === '1') {
    next();
  } else {
    res.status(403).render('403'); 
  }
}

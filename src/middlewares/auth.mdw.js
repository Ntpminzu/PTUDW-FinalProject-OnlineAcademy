export function restrict(req, res, next) {
  if (!req.session.isAuthenticated) {
    req.session.retUrl = req.originalUrl;
    res.redirect('/account/signin');
  } else {
    next();
  }
}

export function restrictAdmin(req, res, next) {
  if (req.session.authUser && req.session.authUser.permission === "0") {
    next();
  } else {
    res.status(403).render('403'); 
  }
}

export function restrictInstructor(req, res, next) {
    if (!req.session.isAuthenticated || req.session.authUser.UserPermission !== "1") {
      res.status(403).render('403');
    } else {
    next(); 
  }
}

export function restrictStudent(req, res, next) {
  if (req.session.authUser && req.session.authUser.permission === "2") {
    next();
  } else {
    res.status(403).render('403'); 
  }
}
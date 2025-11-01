import express from 'express';
import * as adminModel from '../model/admin.model.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/user/list', async function (req, res) {
  const list = await adminModel.findAll();
  res.render('Admin/user/UserList', {
    users: list
  });
});

router.get('/user/add', function (req, res) {
  res.render('Admin/user/UserAdd');
});


router.get('/adminpage', function (req, res) {
  res.render('Admin/AdminPage');
});


router.get('/AccLock', function (req, res) {
  res.render('Admin/user/AddLock');
});
router.post('/user/lock', async (req, res) => {
  const id = req.body.UserID;
  const lockStatus = req.body.Lock === 'true';
  await adminModel.patch(id, { Lock: lockStatus });
  res.redirect('/admin/user/list'); // quay lại trang danh sách user
});


router.get('/user/edit', async function (req, res) {
  const id = req.query.id || 0;
  const user = await adminModel.findById(id);
  res.render('Admin/user/UserEdit', {
    user: user
  });
});

router.post('/user/del', async function (req, res) {
  const id = req.body.UserID; // ✅ đúng key
  console.log("Deleting user id =", id);
  await adminModel.del(id);
  res.redirect('/admin/user/list');
});


router.get('/user/edit', function (req, res) {
  res.render('Admin/user/UserEdit');
});

router.post('/user/add', async function (req, res) {
  const hash = await bcrypt.hash(req.body.Password, 10);

  const user = {
    Fullname: req.body.Fullname,
    UserName: req.body.UserName,
    Password: hash,
    Email: req.body.Email,
    UserPermission: req.body.UserPermission
  };

  console.log('req.body =', req.body);
  await adminModel.add(user);
  res.redirect('/admin/user/list');
});

router.post('/user/patch', async function (req, res) {
  const id = req.body.UserID;
  const user = {
    UserName: req.body.UserName,
    Email: req.body.Email,
    Fullname: req.body.Fullname,
    UserPermission: req.body.UserPermission
  }
  console.log('req.body =', req.body);
  console.log('user =', user);
  await adminModel.patch(id, user);
  res.redirect('/admin/user/list'); // cập nhật xong thì quay về trang danh sách
});
/*================categories=================*/

router.get('/category/list', async function (req, res) {
  const list = await adminModel.findAllCategories();
  res.render('Admin/category/CatList', {
    categories: list
  });
});

router.get('/category/add', function (req, res) {
  res.render('Admin/category/CatAdd');
});

router.get('/category/edit', async function (req, res) {
  const id = req.query.id || 0;
  const category = await adminModel.findCategoryById(id);
  res.render('Admin/category/CatEdit', {
    category: category
  });
});

router.post('/category/del', async function (req, res) {
  const id = req.body.CatID;
  console.log("Deleting category id =", id);
  await adminModel.delCategory(id);
  res.redirect('/admin/category/list');
});


router.post('/category/add', async function (req, res) {
  const category = {
    CatName: req.body.CatName,
    CatDes: req.body.CatDes
  };
  console.log('req.body =', req.body); // debug
  await adminModel.addCategory(category);
  res.redirect('/admin/category/list');
});

router.post('/category/patch', async function (req, res) {
  const id = req.body.CatID;
  const category = {
    CatName: req.body.CatName,
    CatDes: req.body.CatDes
  }
  console.log('req.body =', req.body);
  console.log('category =', category);
  await adminModel.patchCategory(id, category);
  res.redirect('/admin/category/list');
});
/*===================== subcategories =====================*/
router.get('/subcat/byCat', async function (req, res) {
  const id = req.query.id || 0;

  let CatName = '?';
  let CatID = '?';
  const cats = await adminModel.findAllCategories();
  const referer = req.get('Referer') || '';

  let list = [];

  if (id === 'all') {
    list = await adminModel.findAllSubCat();
    CatName = 'All Categories';
    CatID = 'all';
  } else {
    const category = await adminModel.findCategoryById(id);
    if (category) {
      CatName = category.CatName;
      CatID = category.CatID;
    }
    list = await adminModel.findSubCatByCat(id);
  }
  let back = '';
  if (referer.includes('/admin/category/list')) {
    back = "/admin/category/list";
  } else
    back = "/admin/adminpage";
  res.render('Admin/sub_cat/SubCatList', {
    cats: cats,
    subcats: list,
    empty: list.length === 0,
    CatName: CatName,
    back: back,
    CatID: CatID
  });
});

router.get('/subcat/add/byCat', async function (req, res) {
  const id = req.query.id || 0;
  const category = await adminModel.findCategoryById(id);

  res.render('Admin/sub_cat/SubCatAdd', {
    CatID: id,
    CatName: category ? category.CatName : '?'
  });
});

router.post('/subcat/add', async function (req, res) {
  const subcat = {
    SubCatName: req.body.SubCatName,
    SubCatDes: req.body.SubCatDes,
    CatID: req.body.CatID
  };
  console.log('req.body =', req.body);
  await adminModel.addSubCategory(subcat);
  res.redirect(`/admin/subcat/byCat?id=${req.body.CatID}`);
});


router.get('/subcat/edit', async function (req, res) {
  const id = req.query.id || 0;
  const subcat = await adminModel.findSubCategoryById(id);
  res.render('Admin/sub_cat/SubCatEdit', {
    CatID: id,
    subcat: subcat
  });
});

router.post('/subcat/patch', async function (req, res) {
  const id = req.body.SubCatID;
  const subcat = {
    SubCatName: req.body.SubCatName,
    SubCatDes: req.body.SubCatDes,
    CatID: req.body.CatID
  };
  await adminModel.patchSubCategory(id, subcat);
  res.redirect('/admin/subcat/byCat?id=' + req.body.CatID);
});


router.post('/subcat/del', async function (req, res) {
  const id = req.body.SubCatID;
  const catid = req.body.CatID; // lấy CatID từ form ẩn
  console.log('Deleting subcat id =', id, 'catid =', catid);
  await adminModel.delSubCategory(id);
  res.redirect('/admin/subcat/byCat?id=' + catid); // quay lại đúng category
});

/*===================Course==================*/
router.get('/course/byCat', async function (req, res) {
  const referer = req.get('Referer') || '';
  let catID = req.query.id || 'all';
  let subCatID = req.query.bySubCat || 'all';

  const catList = await adminModel.findAllCategories();

  let back = '';

  if (referer.includes('/admin/course/byCat')) {
    // Ví dụ: /admin/course/byCat?id=2&bySubCat=all
    back = "/admin/subcat/byCat?id=all";
  }
  else if (referer.includes('/admin/adminpage')) {
    // Ví dụ: /admin/course/bySubCat?id=5
    back = "/admin/adminpage";
  }
  else {
    // Mặc định về danh sách toàn bộ
    back = "/admin/course/byCat?id=all&bySubCat=all";
  }


  // === TÌM CAT TỪ SUBCAT ===
  if (subCatID !== 'all') {
    const sub = await adminModel.findSubCategoryById(subCatID);
    if (sub) {
      catID = sub.CatID; // Update Cat theo SubCat
    }
  }

  // === LẤY DANH SÁCH SUBCATEGORY THEO CAT ===
  let subCatList = [];
  if (catID !== 'all') {
    subCatList = await adminModel.findSubCatByCat(catID);
  } else {
    subCatList = await adminModel.findAllSubCat();
  }

  // === LẤY DANH SÁCH COURSE THEO SUBCAT HOẶC CAT ===
  let courseList = [];
  if (subCatID !== 'all') {
    courseList = await adminModel.findCourseBySubCat(subCatID);
  } else if (catID !== 'all') {
    courseList = await adminModel.findCourseByCat(catID);
  } else {
    courseList = await adminModel.findAllCourses();
  }

  // === GÁN USERNAME ===
  for (const course of courseList) {
    if (course.UserID) {
      const user = await adminModel.findById(course.UserID);
      course.UserName = user ? user.Fullname : "Unknown";
    } else {
      course.UserName = "Unknown";
    }
  }

  // === TÊN CATEGORY ===
  let selectedCatName = "All Categories";
  if (catID !== "all") {
    const cat = await adminModel.findCategoryById(catID);
    if (cat) selectedCatName = cat.CatName;
  }

  // === TÊN SUBCATEGORY ===
  let selectedSubCatName = "All Subcategories";
  if (subCatID !== "all") {
    const sub = await adminModel.findSubCategoryById(subCatID);
    if (sub) selectedSubCatName = sub.SubCatName;
  }
  const ins = await adminModel.allTeachers();

  // === RENDER ===
  res.render("Admin/course/CourseList", {
    course: courseList,
    catList,
    ins: ins,
    back: back,
    subCatList,
    selectedCat: catID,
    selectedSubCat: subCatID,
    selectedCatName,
    selectedSubCatName,
    empty: courseList.length === 0,
  });
});



router.get('/course/edit', async function (req, res) {
  const id = req.query.id || 0;
  const referer = req.get('Referer') || '';
  const course = await adminModel.findCourseById(id);
  const subcategories = await adminModel.findAllSubCat();
  const subcat = await adminModel.findSubCategoryById(course.SubCatID);

  let view = '';

  if (referer.includes('/admin/course/bysubCat')) {
    view = 'Admin/course/CourseEdit';
  } else
    view = 'Admin/course/CourseEdit';
  res.render(view, {
    course: course,
    subcat: subcat,
    subcategories: subcategories
  });
});


router.post('/course/patch', async function (req, res) {
  const id = req.body.CourseID;

  const subcat = Array.isArray(req.body.SubCatID)
    ? req.body.SubCatID[0]
    : req.body.SubCatID;

  // COURSE DATA
  const course = {
    CourseName: req.body.CourseName,
    TinyDes: req.body.TinyDes,
    FullDes: req.body.FullDes,
    ImageUrl: req.body.ImageUrl,
    Level: req.body.Level,
    CurrentPrice: req.body.CurrentPrice,
    OriginalPrice: req.body.OriginalPrice,
    CourseStatus: req.body.CourseStatus,
    SubCatID: subcat
  };

  await adminModel.patchCourse(id, course);

  const sub = await adminModel.findSubCategoryById(subcat);
  const catID = sub ? sub.CatID : "all";

  res.redirect(`/admin/course/byCat?id=${catID}&bySubCat=${subcat}`);
});


router.post('/course/del', async function (req, res) {
  const id = req.body.CourseID;
  const subcatid = req.body.SubCatID;

  console.log('Deleting CourseID =', id, 'SubCatID =', subcatid);

  await adminModel.delCourse(id);

  const sub = await adminModel.findSubCategoryById(subcatid);
  const catID = sub ? sub.CatID : "all";

  res.redirect(`/admin/course/byCat?id=${catID}&bySubCat=${subcatid}`);
});

export default router;
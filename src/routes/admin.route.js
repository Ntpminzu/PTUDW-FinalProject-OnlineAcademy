import express from 'express';
import * as adminModel from '../model/admin.model.js';

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
  const user = {
    Fullname: req.body.Fullname,
    UserName: req.body.UserName,
    Password: req.body.Password,
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
  let CatID = "?";
  const category = await adminModel.findCategoryById(id);
  if (category) {
    CatName = category.CatName;
    CatID = category.CatID;
  }
  const list = await adminModel.findSubCatByCat(id);
  res.render('Admin/sub_cat/SubCatList', {
    subcats: list,
    empty: list.length === 0,
    CatName: CatName,
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
export default router;
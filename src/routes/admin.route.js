import express from 'express';
import * as adminModel from '../model/admin.model.js';
import categoryModel from '../model/category.model.js';
import courseModel from '../model/course.model.js';

const router = express.Router();

router.get('/user/list', async function (req, res) {
  const limit = 10; // số user mỗi trang
  const page = parseInt(req.query.page) || 1; // trang hiện tại
  const offset = (page - 1) * limit;

  // Lấy danh sách user theo trang
  const list = await adminModel.findPage(offset, limit);

  // Tổng số user
  const total = await adminModel.countAll();
  const totalPages = Math.ceil(total.amount / limit);

  // Danh sách các trang
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      value: i,
      isCurrent: i === page
    });
  }

  res.render('Admin/user/UserList', {
    users: list,
    pages: pages,
    currentPage: page
  });
});


router.get('/user/add', function (req, res) {
  res.render('Admin/user/UserAdd');
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


router.get('/category/edit', function (req, res) {
  res.render('Admin/category/CatEdit');
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

export default router;
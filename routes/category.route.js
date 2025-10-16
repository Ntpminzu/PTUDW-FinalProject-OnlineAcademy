import express from 'express';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

router.get('/', async function (req, res) {
  const list = await categoryModel.findAll();
  res.render('vwAdminCategory/list', {
    categories: list
  });
});

  router.get('/add', function (req, res) {
    res.render('vwAdminCategory/add');
  });

router.post('/add', async function (req, res) {
  const category = {
    catname: req.body.catname
  };
  await categoryModel.add(category);
  res.render('vwAdminCategory/add');
});

router.get('/edit', async function (req, res) {
  const id = req.query.id || 0;
  const category = await categoryModel.findById(id);
  res.render('vwAdminCategory/edit', {
    category: category
  });
});

router.post('/del', async function (req, res) {
  const id = req.body.catid;
  await categoryModel.del(id);
  res.redirect('/admin/categories'); // xoá xong thì quay về trang danh sách
});

router.post('/patch', async function (req, res) {
  const id = req.body.catid;
  const category = {
    catname: req.body.catname
  }
  await categoryModel.patch(id, category);
  res.redirect('/admin/categories'); // cập nhật xong thì quay về trang danh sách
});

export default router;
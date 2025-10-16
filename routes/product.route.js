import express from 'express';
import * as productModel from '../models/product.model.js';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

router.get('/byCat', async function (req, res) {
  const id = req.query.id || 0;

  let catname = '?';
  const category = await categoryModel.findById(id);
  if (category) {
    catname = category.catname;
  }


  const limit = 4;
  const page = req.query.page || 1;
  const offset = (page - 1) * limit;
  const list = await productModel.findPageByCat(id, offset, limit);

  const total = await productModel.countByCat(id); // { amount: 10 }
  const totalPages = Math.ceil(total.amount / limit);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      value: i,
      catid: id,
      isCurrent: i === parseInt(page),
      next:i+1,
      prev:i-1
    });
  }

  res.render('vwProduct/byCat', {
    products: list,
    empty: list.length === 0,
    catname: catname,
    pages: pages,
  });
});

router.get('/details', async function (req, res) {
  const id = req.query.id;
  const product = await productModel.findById(id);
  if (product === null) {
    return res.redirect('/');
  }

  res.render('vwProduct/details', {
    product: product,
  });
});

router.get('/search', async function (req, res) {
  const q = req.query.q || '';
  if (q.length === 0) {
    return res.render('vwProduct/search', {
      q: q,
      empty: true,
    });
  } 

  const keywords = q.replace(/ /g, ' & ');
  const products = await productModel.searchByName(keywords);
  res.render('vwProduct/search', {
    q: q,
    empty: products.length === 0,
    products: products,
  });
});

export default router;
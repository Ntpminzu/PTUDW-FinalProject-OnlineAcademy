import express from 'express';
import categoryModel from '../model/category.model.js';


const router = express.Router();

router.get('/list',async function (req, res) {
    const list =await categoryModel.findAll();
    res.render('category/list',{
    category: list
    });
   
} );

router.get('/add', function (req, res) {
    res.render('category/add');
} );

router.post('/add', async function (req, res) {
    const { catName, catDesc} = req.body;
    await categoryModel.add({
        CatName: catName,
        CatDes: catDesc
    });
    res.redirect('/category/list');
} );

router.get('/edit',async function (req, res) {
    const id = req.query.id|| 0;
    const category = await categoryModel.findByID(id);
    if(!category) {
    return res.redirect("/category/list");
    };
    res.render('category/edit',{
    category: category
    });
} );
router.post('/patch', async function (req, res) {
    const { catid, catName, catDesc} = req.body;
    await categoryModel.patch(catid,{
        CatName: catName,
        CatDes: catDesc
    });
    res.redirect('/category/list');
} );
router.post('/delete', async function (req, res) {
    const { catid} = req.body;
    await categoryModel.delete(catid);
    res.redirect('/category/list');
});

export default router;
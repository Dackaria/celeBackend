import ProductService from "../daos/mongoDB/products.service.js";
import userService from "../daos/mongoDB/products.service.js";
import CartService from "../daos/mongoDB/products.service.js";
import { HttpResponse } from "../middleware/error-handle.js";

const cartService = new CartService();
const productService = new ProductService();
const httpResponse = new HttpResponse();

//** Vista de todos los productos **/
const viewHomeProductsCtrl = (req, res) => {
    productService.getAllProducts().then(result => {
        res.render("home", { products: result })
    }).catch(err => {
        req.logger.error(`${err.message}`);
        httpResponse.BadRequest(res, err.message);
    })
};

//** Vista de todos los productos EN TIEMPO REAL**/
const viewRealTimeProductsCtrl = (req, res) => {
    productService.getAllProducts().then(result => {
        res.render("realTimeProducts", { 
            products: result,
            user: req.session.user})
    }).catch(err => {
        req.logger.error(`${err.message}`);
        httpResponse.BadRequest(res, err.message);

    })
};


//** Vista de productos con paginacion y boton para agregar a carrito **/
const viewProductsCtrl = (req, res) => {
    const user = req.session.user;
    console.log(user);
    //console.log(req.query);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // const sort = req.query.sort === 'Ascendente' ? 1 
    // : req.query.sort === 'Descendente' ? -1 
    // : null;

    //console.log(req.query.sort);
    let sort;
    if (req.query.sort == 'Ascendente') sort = 1;
    if (req.query.sort == 'Descendente') sort = -1;
    if (req.query.sort != 'Ascendente' && req.query.sort != 'Descendente') sort = null;

    
    //filtrar por categoria
    const query = req.query.query || null;
    let queryObj = {}
    if (query != undefined && query != 'null') {
        queryObj.category = query;
    }

    productService.getProducts(page, limit, queryObj, sort).then(result => {
     

        res.render("home", {
            layout: 'main', 
            navbar: 'partials/navBar',
            products: result.payload,
            prevLink: result.prevLink,
            nextLink: result.nextLink,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            page: result.page,
            totalPages: result.totalPages,
            user: user,
            cart: user.cart
        })
    }).catch(err => {
        req.logger.error(`${err.message}`);
        httpResponse.BadRequest(res, err.message);

    })
};

//** Vista de un carrito **/
const viewCartByIdCtrl = (req, res) => {
    const cid = req.params.cid;
    const user = req.session.user;

    cartService.getCartById(cid).then(result => {
        res.render("cart", {
            products: result[0].products,
            user: user
        })
    }).catch(err => {
        req.logger.error(`${err.message}`);
        httpResponse.BadRequest(res, err.message);

    })
};

//** Vista perfil usuario **/
const viewProfileCtrl = async (req, res) => {
    const user = req.session.user;
    console.log(user)

    res.render("profile", {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
    });
};

//** Vista cambiar contraseña **/
const viewChangePswCtrl = async (req, res) => {
    const token = req.query.token;
    res.render("changePsw", {
        token: token
    });
};

//** Vista mandar mail para cambiar contraseña **/
const viewSendMailChangePswCtrl = async (req, res) => {
    res.render("changePswMail");
};

//** Vista admin **/
// Controlador para la vista de usuarios de administración
const viewAdminUsersCtrl = async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.render('users', { users });
    } catch (error) {
      req.logger.error(`Error al obtener la lista de usuarios: ${error.message}`);
      res.status(500).send('Error al obtener la lista de usuarios');
    }
  };
  
  export {
    viewHomeProductsCtrl,
    viewRealTimeProductsCtrl,
    viewProductsCtrl,
    viewCartByIdCtrl,
    viewProfileCtrl,
    viewChangePswCtrl,
    viewSendMailChangePswCtrl,
    viewAdminUsersCtrl
  };
  


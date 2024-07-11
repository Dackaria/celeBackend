import jwt from "jsonwebtoken";
import { logger } from '../middleware/logger-midelleware.js';
import { generateJWT, SECRET_JWT } from "../utils/jwt.js";
import userService from "../daos/mongoDB/users.service.js";
import { transporter } from "../utils/email.js";
import { GOOGLE_EMAIL } from "../config/config.js"
import { HttpResponse } from "../middleware/error-handle.js";
import cartService from "../daos/mongoDB/carts.service.js"; 
const httpResponse = new HttpResponse();

// LOGOUT
const logoutCtrl = async (req, res) => {
  req.session.destroy((err) => {
    if (!err) {
      req.logger.info("Se cerró la sesión...")
      return res.redirect("/login")
    };
    req.logger.error(`logout error: ${err.message}`);
    return res.send({ message: `logout error`, body: err });
  });
};

// LOGIN
const loginCtrl = async (req, res, next) => {
  try {
    req.logger.info(`BODY LOGIN: ${JSON.stringify(req.body)}`);
    const { email, password } = req.body;
    logger.info(`Iniciando sesión para el usuario con email: ${email}`);
    const session = req.session;
    req.logger.info(`Session: ${JSON.stringify(session)}`);

    const foundUser = await userService.getUser(email, password);
    console.log(`este es el usuario ${foundUser}`)
    if (foundUser.error) {

      logger.error(`Error al buscar usuario: ${foundUser.error}`);
      return res.status(foundUser.code).json({
        status: foundUser.code,
        message: foundUser.error,
      });
    };

    if (foundUser.email != "fennix.ecommerce@gmail.com") {
      foundUser.last_connection = new Date();
      await foundUser.save();
    }

    const user = {
      first_name: foundUser.first_name,
      last_name: foundUser.last_name,
      email: foundUser.email,
      role: foundUser.role,
      cart: foundUser.cart
    }

    // Con session
    req.session.user = user;

    // Con jwt
    const token = await generateJWT(user, 30);

    logger.info(`Token generado para usuario ${email}: ${token}`);
    console.log(`Token: ${token}`)
    req.logger.info(`Token: ${token}`);

    //administrador
    if (user.email === "fennix.ecommerce@gmail.com") {
      return res
        .cookie("cookieToken", token, {
          maxAge: 30 * 60 * 1000,
          httpOnly: true
        })
        .redirect("/admin/users");
    }
    
    return res
      .cookie("cookieToken", token, {
        maxAge: 30 * 60 * 1000,
        httpOnly: true
      })
      .redirect("/");
  } catch (error) {

    logger.error(`Error en loginCtrl: ${error.message}`);
    req.logger.error(`${error.message}`);
    next(error);
  }
};


// REGISTER

const renderRegisterForm = (req, res) => {
  res.render('register');
};

const registerCtrl = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Crea un carrito para el nuevo usuario
    const cartResult = await cartService.addCart();
    if (cartResult.error) {
      console.error("Error creating cart:", cartResult.error);
      return res.status(500).json({
        status: 500,
        message: "Error creating cart",
      });
    }
    
    // Obtiene el ID del carrito creado
    const cartId = cartResult.cart._id;

    // Crea el nuevo usuario con el carrito asociado
    const newUser = {
      first_name,
      last_name,
      email,
      password,
      cart: cartId // Asocia el ID del carrito al nuevo usuario
    };

    // Agrega el usuario a la base de datos
    const result = await userService.addUser(newUser);
    if (result.error) {
      console.error("Error creating user:", result.error);
      return res.status(500).json({
        status: 500,
        message: "Error creating user",
      });
    }

    // Guarda información no sensible en la sesión
    req.session.user = { first_name, last_name, email };
    return res.redirect("/login");

  } catch (error) {
    console.error("Error in registerCtrl:", error.message);
    next(error);
  }
};


// CHANGE ROLE
const changeRoleCtrl = async (req, res, next) => {
  try {
    const email = req.params.email;
    req.logger.info(`Email usuario: ${email}`);
    const role = req.body.role;
    req.logger.info(`Rol usuario: ${role}`);
    if (role != "USER" && role != "PREMIUM") return httpResponse.BadRequest(res, "rol no permitido");

    //Cambio de rol
    const foundUser = await userService.changeRole(email, role);
    if (foundUser.error) {
      return res.status(foundUser.code).json({
        status: foundUser.code,
        message: foundUser.error,
      });
    };

    return res.send({ ok: true, message: foundUser.message });

  } catch (error) {
    req.logger.error(`${error.message}`);
    next(error);
  }
}


// CURRENT
const currentCtrl = async (req, res) => {
  req.logger.info(`VALIDANDO REQ
    User: ${JSON.stringify(req.user)}
    Cookies: ${JSON.stringify(req.cookies)}`);
  return res.json({ message: `jwt en las cookies` });
};

// GET ALL
const getAllUsersCtrl = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return httpResponse.OK(res, "Se obtienen todos los usuarios", users);

  } catch (error) {
    req.logger.error(`${error.message}`);
    next(error);
  }
};

// DELETE USER BY ID
const deleteOneUserCtrl = async (req, res) => {
  try {
    const email = req.params.email;
    req.logger.info(`email user to delete: ${email}`)

    const foundUser = await userService.deleteUser(email);
    if (foundUser.error) {
      req.logger.error(`${foundUser.error}`);
      return httpResponse.BadRequest(res, `${foundUser.error}`);
    };

    return httpResponse.OK(res, foundUser.message);

  } catch (error) {
    req.logger.error(`${error.message}`);
    next(error);
  }
};

// DELETE USER BY ID
const deleteOldUsersCtrl = async (req, res) => {
  try {
    const result = await userService.deleteOldUsers();

    const deletedUsers = result.data;

    for (const emailReceiver of deletedUsers) {
      let resultEmail = await transporter.sendMail({
        from: GOOGLE_EMAIL,
        to: emailReceiver,
        subject: `Se ha eliminado su cuenta en el ecommerce`,
        html: `
        <div>
          <h1>Se ha eliminado su cuenta</h1>
          Usted se registró en el ecommerce con el email: ${emailReceiver}.
          Se ha eliminado su cuenta por inactividad.

          Esperamos que vuelva pronto!.
        </div>
        `
      });
      if (resultEmail.rejected.length != 0) {
        req.logger.error(`El email no se pudo enviar`);
        return httpResponse.BadRequest(res, `El email no se pudo enviar`);
      };
      
    };


    return httpResponse.OK(res, result.message, result.data);

  } catch (error) {
    req.logger.error(`${error.message}`);
    next(error);
  }
};



export {
  logoutCtrl,
  loginCtrl,
  renderRegisterForm,
  registerCtrl,
  currentCtrl,
  changeRoleCtrl,
  getAllUsersCtrl,
  deleteOneUserCtrl,
  deleteOldUsersCtrl
};
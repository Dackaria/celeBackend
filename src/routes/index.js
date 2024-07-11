import { Router } from 'express';
import passport from "passport";
import usersRouter from './users.router.js';
import productsRouter from './products.router.js';
import cartsRouter from './carts.router.js';
import viewsRouter from './views.router.js';

const router = Router();
const API_PREFIX = "api";

// Rutas principales
router.use(`/${API_PREFIX}/users`, usersRouter);
router.use(`/${API_PREFIX}/products`, productsRouter);
router.use(`/${API_PREFIX}/carts`, cartsRouter);
router.use('/', viewsRouter); 

// // POST /login
// router.post('/login', passport.authenticate('local', {
//     successRedirect: '/dashboard', // Redirige aquí en caso de éxito
//     failureRedirect: '/login', // Redirige aquí en caso de fallo
//     failureFlash: true // Habilita mensajes flash en caso de fallo
// }));

export default router;

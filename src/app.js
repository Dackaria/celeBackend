import express from  'express';
import logger  from 'morgan';
import { dynamicLogger } from './utils/logger.js';
import 'dotenv/config';
import passport from './config/passport.js';
import appRouter from './routes/index.js'
import connectBD from './config/connectDB.js';
import {PORT, MONGO_URI, SECRET_SESSION} from './config/config.js';
import { engine } from 'express-handlebars';
import { __dirname, uploader } from './utils.js';
import path from 'path';
import session from 'express-session';
import idErrors from './middleware/id.middleware.js';
import flash from 'connect-flash';
import mongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import { loggerMiddleware } from './middleware/logger-midelleware.js';


const app = express();
connectBD();

app.use(dynamicLogger);
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'))
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
  }));

  // Inicializar flash
app.use(flash());
  
  // Middleware para establecer user en req.session
  app.use((req, res, next) => {
    if (req.session && req.session.user) {
      res.locals.user = req.session.user;
    } else {
      res.locals.user = null;
    }
    next();
  });

  app.use(loggerMiddleware);

// Configuración de Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
  }));
  app.set('view engine', 'handlebars');
  app.set('views', path.join(__dirname, 'views'));
  
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/image', express.static(path.join(__dirname, 'public', 'image')));

  // Helper para comparación en Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    ifCond: function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  }
}));

//Multer para subir imagenes desde el ordenador (Middleware)
app.post("/file", uploader.single('image'),(request,response)=>{
    response.send('imagen subida')
})

// // Middleware para validar IDs y autenticación
//app.use(authMdw);
app.use(idErrors);

// Middleware para cargar datos de usuario en res.locals
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user; // Asigna el usuario a res.locals
    } else {
        res.locals.user = null; // Usuario no autenticado
    }
    next();
});

app.use(
  session({
    store: mongoStore.create({
      mongoUrl: MONGO_URI,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 60 * 3600, //sesion dura 1 hora
    }),
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
  })
);

//app.use(passport.initialize());
//app.use(passport.session());

app.use(appRouter);

app.listen(PORT, (err) => {
    if(err) console.log(err)
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});






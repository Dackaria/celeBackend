// src/config/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../daos/models/users.model.js'; 
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { SECRET_JWT } from "../config/config.js";

// Configuración de la estrategia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET_JWT
};

// Configuración de la estrategia Local para el login
passport.use('login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Busca al usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }

    // Compara las contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Contraseña incorrecta' });
    }

    // Si todo está bien, devuelve el usuario
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    // Busca al usuario en la base de datos usando el ID del payload
    const user = await User.findById(jwtPayload.user._id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));

// Configuración de la estrategia Local para el registro
passport.use('register', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return done(null, false, { message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email,
      password: hashedPassword,
      role: req.body.role,
      cart: req.body.cart 
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;



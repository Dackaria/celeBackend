import jwt from "jsonwebtoken";
import {SECRET_JWT} from "../config/config.js"

const generateJWT = (user, expiresInMinutes) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      user,
      SECRET_JWT,
      { expiresIn: `${expiresInMinutes}m` },
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });
};

export {
  SECRET_JWT,
  generateJWT,
};
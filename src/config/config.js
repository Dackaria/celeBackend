import 'dotenv/config'

export const {
    PORT,
    API_PREFIX,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    MONGO_URI,
    SECRET_SESSION,
    SECRET_JWT,
    GOOGLE_EMAIL,
    GOOGLE_PSW,
} = process.env;
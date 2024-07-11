import mongoose from 'mongoose';
import {MONGO_URI} from "../config/config.js"


const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Base de datos conectada');
    } catch (error) {
        console.error('Error al conectar a la base de datos', error.message);
        process.exit(1); 
    }
};

export default connectDB;
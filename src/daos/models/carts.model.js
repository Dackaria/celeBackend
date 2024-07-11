import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const collectionName = 'carts';

const cartSchema = new Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            }
        }
    ]
});

// Middleware para poblar los productos referenciados
cartSchema.pre('find', function () {
    this.populate('products.product');
});

cartSchema.pre('findOne', function () {
    this.populate('products.product');
});

const cartsModel = model(collectionName, cartSchema);

export default cartsModel;


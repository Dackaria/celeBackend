import cartsModel from "../models/carts.model.js";
import ticketsModel from "../models/tickets.model.js";
import ProductService from "../../daos/mongoDB/products.service.js";

const productService = new ProductService();

class CartService {

    async #getCarts() {
        try {
            return await cartsModel.find({});

        } catch (error) {
            throw new Error(`No se pueden obtener los carritos\n ${error.message}`);
        }
    }

    async #checkCartAndProduct(cid, pid, userEmail) {
        //Chequeo si el carrito existe
        const cart = await this.getCartById(cid);
        if (cart.error) return { error: "Cart not found" };

        //Chequeo si el producto existe en el ecommerce
        const product = await productService.getProductById(pid);
        if (product.error) return { error: "Product not available" };

        if (userEmail === product[0].owner) {
            return {
                code: 401,
                error: `No puede agregar el producto con id ${pid} porque usted es dueño de ese producto`
            }
        };
    }

    async addCart() {
        try {
             // Crea el carrito vacío
      const cart = await cartsModel.create({ products: [] });
      return { cart }; // Devuelve el carrito creado
    } catch (error) {
      return { error: error.message };
    }
    }

    async getCartById(cid) {
        try {
            const cart = await cartsModel.findById(cid).populate('products.product');
            if (!cart) return { error: "Not found" };
            return cart;
        } catch (error) {
            throw new Error(`No se puede obtener el carrito con id ${cid}\n ${error.message}`);
        }
    }

    async addProductToCart(cid, pid, quantity) {
        try {
            const cart = await cartsModel.findById(cid);
            if (!cart) return { error: "Cart not found" };

            const product = await productService.getProductById(pid);
            if (!product) return { error: "Product not found" };

            // Check if product already exists in cart
            const existingProduct = cart.products.find(item => item.product.equals(pid));

            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                cart.products.push({ product: pid, quantity });
            }

            await cart.save();

            return { message: `Product ${pid} added to cart ${cid}` };
        } catch (error) {
            throw new Error(`Could not add product to cart\n ${error.message}`);
        }
    }

    async deleteProductInCart(cid, pid) {
        try {
            const cart = await cartsModel.findByIdAndUpdate(cid, {
                $pull: { products: { product: pid } }
            });

            if (!cart) return { error: "Cart not found" };

            return { message: `Product with id ${pid} removed from cart ${cid}` };
        } catch (error) {
            throw new Error(`Could not delete product from cart\n ${error.message}`);
        }
    }

    async deleteAllInCart(cid) {
        try {
            const result = await cartsModel.updateOne(
                { "_id": cid },
                { $set: { products: [] } },
            )

            return result.matchedCount === 0 ? { error: "Not found" } : { message: `Se eliminaron todos los productos del carrito ${cid}` };

        } catch (error) {
            throw new Error(`No se puede obtener el carrito con id ${id}\n ${error.message}`);
        }
    }

    async updateProductQuantityInCart(cid, pid, newQuantity) {
        try {
            const cart = await cartsModel.findOneAndUpdate(
                { _id: cid, "products.product": pid },
                { $set: { "products.$.quantity": newQuantity } }
            );

            if (!cart) return { error: "Cart or product not found" };

            return { message: `Product ${pid} quantity updated in cart ${cid}` };
        } catch (error) {
            throw new Error(`Could not update product quantity in cart\n ${error.message}`);
        }
    }

    async updateCart(cid, newData) {
        try {
            const result = await cartsModel.updateOne(
                { "_id": cid },
                { $set: { products: newData } });

            return result.matchedCount === 0
                ? { error: "Not found" }
                : { message: `Se actualizó el carrito con id ${cid}` };

        } catch (error) {
            throw new Error(`No se puede actualizar el producto con id ${id}\n ${error.message}`);
        }
    }

    async buyCart(user) {
        console.log(user);
        try {
            const cart = (await this.getCartById(user.cart))[0].products;

            const { available, unavailable } = await this.#separateProducts(cart)

            for (const item of available) {
                const quantity = item.product.stock - item.quantity;
                await productService.updateProduct(item.product._id, { "stock": quantity });
            };

            const amount = await this.#getTotalAmountCart(available);

            const purchaser = user.email;

            const ticket = {
                code: crypto.randomUUID(),
                purchase_datetime: Date.now(),
                amount: amount,
                purchaser: purchaser
            };
            const createdTicket = await ticketsModel.create(ticket);
            console.log(createdTicket);

            const updatedCart = await this.updateCart(user.cart, unavailable);
            console.log(updatedCart);

            if (unavailable.length === 0) {
                return {
                    message: "Compra exitosa! No tenes productos pendientes.",
                    ticket: ticket
                };
            }

            return {
                message: "Compra exitosa! Tenes productos pendientes en tu carrito debido a que no tenian stock.",
                productsUnavailable: unavailable
            };

        } catch (error) {
            throw new Error(`No se puede finalizar la compra del carrito con id ${cid}\n ${error.message}`);
        }
    }

    async #getTotalAmountCart(cart) {
        let total = 0;

        cart.forEach(item => {
            total += item.product.price * item.quantity;
        });

        return total;
    }

    async #separateProducts(cart) {
        const availableProducts = [];
        const unavailableProducts = [];

        cart.forEach(item => {
            if (item.quantity <= item.product.stock) {
                availableProducts.push(item);
            } else {
                unavailableProducts.push(item);
            }
        });

        return {
            available: availableProducts,
            unavailable: unavailableProducts
        };
    }
}

export default CartService;
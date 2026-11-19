export class Cart {
    constructor(){this.items = [];}

    addItem(product){
        const exists = this.items.find(item => product.title === item.title);
        if(exists){exists.quantity++;}else{this.items.push({id: product.id, title: product.title, price: product.price, quantity: 1});}}

    removeItem(title){
        exists = this.items.find(item => title === item.title);
        if(exists){this.items = this.items.filter(item => item !== exists)}else{return "Product not found in cart";}
    }

    updateQuantity(title, quantity){const exists = this.items.find(item => item.title === title); if(exists){exists.quantity = quantity;} else{return "Product not found in cart";}}

    getTotal(){return this.items.map(item => item.price * item.quantity).reduce((total, value) => total + value, 0);}

    getItemCount(){return this.items.reduce((totalNumber, item) => totalNumber + item.quantity, 0)}
}
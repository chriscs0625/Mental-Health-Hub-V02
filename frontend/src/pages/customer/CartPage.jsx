import React from 'react';
import { Link } from 'react-router-dom';

const CartPage = () => {
  return (
    <div>
      <h2>Your Cart</h2>
      <p>Cart is currently empty (skeleton).</p>
      <Link to="/checkout">Proceed to Checkout</Link>
    </div>
  );
};

export default CartPage;

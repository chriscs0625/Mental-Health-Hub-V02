import React from 'react';
import { Link } from 'react-router-dom';

const ShopPage = () => {
  return (
    <div>
      <h2>Shop</h2>
      <div className="product-list">
        <div className="product-card">
          <h3>Sample Product</h3>
          <p>$10.00</p>
          <Link to="/product/1">View Details</Link>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;

import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1>Mental Balance Hub</h1>
      <p>Welcome to our store!</p>
      <Link to="/shop">Go to Shop</Link>
    </div>
  );
};

export default HomePage;

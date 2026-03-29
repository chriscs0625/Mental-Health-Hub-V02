import React from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetailPage = () => {
  const { id } = useParams();

  return (
    <div>
      <h2>Product Detail - {id}</h2>
      <p>Details about the product...</p>
      <button>Add to Cart</button>
      <br/>
      <Link to="/cart">Go to Cart</Link>
    </div>
  );
};

export default ProductDetailPage;

 
import React, { createContext, useState, useEffect, useContext } from 'react';
 
import { useAuth } from './AuthContext';
// import api from '../services/api'; // Commented out until api.js is created
/* eslint-disable react-refresh/only-export-components */
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCart();
    } else {
      setCartItems([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      // const response = await api.get('/cart');
      // setCartItems(response.data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
        toast.error('Please login to add to cart');
        return;
    }
    try {
      // await api.post('/cart', { productId });
      await fetchCart();
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const removeFromCart = async () => {
    try {
      // await api.delete(`/cart/${productId}`);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (error) {
       console.error('Error removing from cart:', error);
       toast.error('Failed to remove from cart');
    }
  };
  
  const clearCart = async () => {
    try {
      // await api.delete('/cart');
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, isLoading, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

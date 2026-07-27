import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No order information found.</p>
          <button onClick={() => navigate('/shop')} className="px-6 py-2 bg-orange-500 text-white rounded-full">
            Go to PawMart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-xl text-gray-600">Thank you for your purchase</p>
          </div>

          <div className="border-t border-b border-gray-200 py-6 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-bold text-gray-900">{order._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment</span>
              <span className="font-medium">{order.paymentMethod || 'COD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium capitalize text-green-600">{order.orderStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {order.deliveryAddress && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
              <p className="text-gray-700">{order.deliveryAddress.name}</p>
              <p className="text-gray-600 text-sm">{order.deliveryAddress.address}</p>
              <p className="text-gray-600 text-sm">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
              </p>
              <p className="text-gray-600 text-sm">{order.deliveryAddress.phone}</p>
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-4 mb-8">
            <span className="text-2xl font-bold">Total</span>
            <span className="text-3xl font-bold text-orange-500">{formatPrice(order.totalAmount)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="flex-1 px-8 py-4 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/user-dashboard')}
              className="flex-1 px-8 py-4 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-50"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSuccess;

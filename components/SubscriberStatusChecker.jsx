"use client";

import { useState } from 'react';

export default function SubscriberStatusChecker() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await fetch(`/api/newsletter/subscriber-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check subscriber status');
      }
      
      setStatus('success');
      setResult(data);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-6">Check Subscriber Status</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {status === 'loading' ? 'Checking...' : 'Check Status'}
        </button>
      </form>
      
      {status === 'success' && result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Subscriber Information</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Email:</div>
            <div>{result.email}</div>
            
            <div className="font-medium">API Status:</div>
            <div className={`font-bold ${
              result.api_status === 'subscribed' ? 'text-green-600' : 
              result.api_status === 'unsubscribed' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {result.api_status || 'N/A'}
            </div>
            
            <div className="font-medium">DB Status:</div>
            <div className={`font-bold ${
              result.db_status === 'subscribed' ? 'text-green-600' : 
              result.db_status === 'unsubscribed' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {result.db_status || 'N/A'}
            </div>
            
            <div className="font-medium">Subscriber ID:</div>
            <div>{result.subscriber_id}</div>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

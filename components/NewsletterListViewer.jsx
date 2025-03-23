"use client";

import { useState, useEffect } from 'react';

export default function NewsletterListViewer() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLists() {
      try {
        setLoading(true);
        const response = await fetch('/api/newsletter/lists');
        
        if (!response.ok) {
          throw new Error('Failed to fetch lists');
        }
        
        const data = await response.json();
        setLists(data.lists || []);
      } catch (err) {
        console.error('Error fetching newsletter lists:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLists();
  }, []);

  if (loading) return <div>Loading newsletter lists...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Available Newsletter Lists</h2>
      {lists.length === 0 ? (
        <p>No lists found</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {lists.map(list => (
              <tr key={list.id}>
                <td>{list.id}</td>
                <td>{list.name}</td>
                <td>{list.type}</td>
                <td>{list.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <strong>Note:</strong> Use the non-WordPress Users list IDs for your newsletter subscription.
      </p>
    </div>
  );
}

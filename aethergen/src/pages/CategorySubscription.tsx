import React from 'react';
import { useParams } from 'react-router-dom';
import SubscriptionForm from '../components/SubscriptionForm';

const CategorySubscription = () => {
  const { categoryId } = useParams();
  
  // Convert URL parameter to proper category name
  const categoryName = categoryId === 'government' ? 'Government' : 
                      categoryId === 'finance' ? 'Finance' :
                      categoryId === 'manufacturing' ? 'Manufacturing' : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <SubscriptionForm selectedCategory={categoryName} />
    </div>
  );
};

export default CategorySubscription;
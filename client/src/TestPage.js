import React from 'react';
import { useParams } from 'react-router-dom';

const TestPage = () => {
  const { testParam } = useParams();
  console.log('Test param:', testParam);

  return (
    <div>
      <h1>صفحه تست</h1>
      <p>پارامتر: {testParam || 'پارامتر مشخص نشده'}</p>
    </div>
  );
};

export default TestPage;
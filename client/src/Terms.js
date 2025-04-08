import React from 'react';
import { Link } from 'react-router-dom';

function Terms() {
  return (
    <div className="terms-page" dir="rtl">
      <h1>شرایط استفاده</h1>
      <p>خوش اومدی به Canva خودمون! اینجا چند تا قانون ساده داریم:</p>
      <ul>
        <li>از حساب کاربریت درست استفاده کن و اطلاعات غلط نده.</li>
        <li>هر طرحی که می‌سازی، مال خودته ولی ما می‌تونیم برای تبلیغ نشونش بدیم.</li>
        <li>اگه مشکلی پیش اومد، با پشتیبانی تماس بگیر.</li>
        <li>استفاده از خدمات ما یعنی این شرایط رو پذیرفتی.</li>
      </ul>
      <p>
        <Link to="/" className="back-link">برگشت به صفحه اصلی</Link>
      </p>
    </div>
  );
}

export default Terms;
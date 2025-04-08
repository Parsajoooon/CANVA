import React, { useState } from 'react';
import './InstagramStory.css';

const InstagramStory = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files); // فایل‌های انتخاب‌شده توسط کاربر
    const fileURLs = files.map((file) => URL.createObjectURL(file)); // ایجاد URL برای پیش‌نمایش فایل‌ها
    setUploadedFiles((prevFiles) => [...prevFiles, ...fileURLs]); // اضافه کردن فایل‌ها به لیست
  };

  return (
    <div className="instagram-story-container">
      <div className="upload-section">
        <label htmlFor="file-upload" className="upload-button">
          آپلود فایل
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
      
      <div className="story-grid">
        {uploadedFiles.map((file, index) => (
          <div key={index} className="story-box">
            <img
              src={file}
              alt={`Uploaded File ${index + 1}`}
              className="uploaded-file"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstagramStory;

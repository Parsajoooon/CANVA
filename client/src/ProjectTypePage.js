import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProjectTypePage.css';

const ProjectTypePage = () => {
  const { projectType } = useParams();
  const navigate = useNavigate();
  const [userFiles, setUserFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // نگاشت projectType انگلیسی به فارسی
  const projectTypeMapping = {
    'instagram-story': 'استوری‌های اینستاگرام',
    'instagram-post': 'پست‌های اینستاگرام',
    'linkedin-post': 'پست‌های لینکدین',
    'presentation': 'پرزنتیشن',
    'appreciation': 'تقدیرنامه',
    'official-letters': 'نامه‌های اداری',
    'business-plan': 'طرح‌های تجاری',
    'poster': 'پوستر',
    'business-model': 'بیزینس‌مدل',
  };

  console.log('ProjectType from URL:', projectType);
  const persianProjectType = projectTypeMapping[projectType] || projectType;
  console.log('Persian projectType:', persianProjectType);

  useEffect(() => {
    let isMounted = true;

    const fetchUserFiles = async () => {
      try {
        if (!projectType) {
          if (isMounted) {
            setError('نوع پروژه در URL مشخص نشده است. لطفاً از صفحه اصلی یک نوع پروژه انتخاب کنید.');
            setLoading(false);
          }
          return;
        }

        if (!persianProjectType || persianProjectType === projectType) {
          if (isMounted) {
            setError(`نوع پروژه "${projectType}" در نگاشت پیدا نشد. لطفاً مطمئن شوید که URL درست است.`);
            setLoading(false);
          }
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }

        if (isMounted) {
          setLoading(true);
        }
        const encodedProjectType = encodeURIComponent(persianProjectType);
        console.log('Encoded projectType:', encodedProjectType);

        const response = await fetch(`http://localhost:8000/get-user-files-by-project-type/${encodedProjectType}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('Response from server:', data);
        if (isMounted) {
          if (data.success) {
            setUserFiles(data.userFiles);
          } else {
            setError(data.message || 'خطا در گرفتن فایل‌ها');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('خطا در ارتباط با سرور');
          console.error('Error fetching user files:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserFiles();

    return () => {
      isMounted = false;
    };
  }, [projectType, navigate]);

  const handleFileClick = (filePath) => {
    window.open(filePath, '_blank');
  };

  // تابع برای تشخیص نوع فایل و نمایش پیش‌نمایش
  const renderFilePreview = (filePath) => {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const pdfExtension = 'pdf';

    if (imageExtensions.includes(fileExtension)) {
      return (
        <img
          src={filePath}
          alt="File Preview"
          className="file-preview"
          style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
        />
      );
    } else if (fileExtension === pdfExtension) {
      return (
        <div className="pdf-preview">
          <p>پیش‌نمایش PDF</p>
          {/* می‌تونی از یه کتابخونه مثل react-pdf برای پیش‌نمایش PDF استفاده کنی */}
          <a href={filePath} target="_blank" rel="noopener noreferrer">
            باز کردن PDF
          </a>
        </div>
      );
    } else {
      return (
        <div className="file-preview-placeholder">
          <p>پیش‌نمایش برای این نوع فایل در دسترس نیست</p>
        </div>
      );
    }
  };

  return (
    <div className="project-type-page-container">
      <h1 className="page-title">{persianProjectType ? `فایل‌های ${persianProjectType}` : 'خطا'}</h1>
      {loading ? (
        <p className="loading-message">در حال بارگذاری...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : userFiles.length === 0 ? (
        <p className="no-files">هیچ فایلی برای نوع پروژه "{persianProjectType}" یافت نشد.</p>
      ) : (
        <div className="files-container">
          {userFiles.map((file) => (
            <div
              key={file.id}
              className="file-card"
              onClick={() => handleFileClick(file.file_path)}
            >
              {/* پیش‌نمایش فایل */}
              <div className="file-preview-container">
                {renderFilePreview(file.file_path)}
              </div>
              <img
                src={file.profile_picture_url || 'https://via.placeholder.com/48'}
                alt={file.username}
                className="user-profile-pic"
              />
              <p className="username">کاربر: {file.username}</p>
              <p className="file-name">فایل: {file.file_name}</p>
              <p className="project-name">پروژه: {file.project_name}</p>
              <p className="upload-date">
                آپلود شده در: {new Date(file.uploaded_at).toLocaleDateString('fa-IR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTypePage;
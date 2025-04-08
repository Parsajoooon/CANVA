import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ handleLogout }) {
    const [user, setUser] = useState(null);
    const [initialLogin, setInitialLogin] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState({});
    const [profilePic, setProfilePic] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [motherFileSelected, setMotherFileSelected] = useState(false);
    const [userFileSelected, setUserFileSelected] = useState(false);
    const [motherFileName, setMotherFileName] = useState('');
    const [userFileName, setUserFileName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('');
    const navigate = useNavigate();

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                handleLogout();
                navigate('/login');
                return;
            }
            const response = await axios.get('http://localhost:8000/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data.user;
            setInitialLogin((prev) => {
                if (prev === null) {
                    setShowWelcome(true);
                    setTimeout(() => setShowWelcome(false), 3000);
                    return userData.is_first_login;
                }
                return prev;
            });
            setUser(userData);
            setEditedUser(userData);
            setIsLoading(false);
            fetchDocuments();
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                handleLogout();
                navigate('/login');
            } else {
                console.error('خطا در دریافت اطلاعات کاربر:', error);
            }
        }
    };

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/get-documents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const pairs = response.data.pairs;
            const formattedDocuments = Object.entries(pairs).map(([pairId, pair]) => ({
                mother: pair.mother,
                user: pair.user
            }));
            setDocuments(formattedDocuments);
        } catch (error) {
            console.error('خطا در دریافت فایل‌ها:', error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [handleLogout, navigate]);

    const handleLogoutClick = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                handleLogout();
                navigate('/login', { replace: true });
                return;
            }
            await axios.post('http://localhost:8000/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.removeItem('token');
            setUser(null);
            setInitialLogin(null);
            setShowWelcome(false);
            setIsLoading(true);
            handleLogout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('خطا در خروج:', error);
            localStorage.removeItem('token');
            handleLogout();
            navigate('/login', { replace: true });
        }
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            saveEditedUser();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number' && value.length > 11) return;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name;
            const fileNameRegex = /^[a-zA-Z0-9-_\.]+$/;
            if (!fileNameRegex.test(fileName)) {
                alert('نام فایل باید فقط شامل حروف انگلیسی و عدد باشد (کاراکترهای فارسی یا خاص مجاز نیستند).');
                e.target.value = null;
                return;
            }
            if (file.size > 25 * 1024 * 1024) {
                alert('حجم فایل باید کمتر از 25 مگابایت باشد.');
                e.target.value = null;
                return;
            }
            setProfilePic(file);
        }
    };

    const saveEditedUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            if (editedUser.first_name !== user.first_name) formData.append('first_name', editedUser.first_name);
            if (editedUser.last_name !== user.last_name) formData.append('last_name', editedUser.last_name);
            if (editedUser.username !== user.username) formData.append('username', editedUser.username);
            if (editedUser.email !== user.email) formData.append('email', editedUser.email || '');
            if (editedUser.phone_number !== user.phone_number) formData.append('phone_number', editedUser.phone_number);
            if (profilePic) {
                formData.append('profile_picture', profilePic);
            }
            const response = await axios.put('http://localhost:8000/user', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setUser(response.data.user);
            setProfilePic(null);
        } catch (error) {
            alert('خطا در ذخیره تغییرات: ' + (error.response?.data.message || 'خطای سرور'));
        }
    };

    const handleDocumentUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const motherFile = e.target.mother_file.files[0];
        const userFile = e.target.user_file.files[0];

        if (!motherFile || !userFile || !projectName || !projectType) {
            alert('لطفاً همه فیلدها را پر کنید.');
            return;
        }

        const fileNameRegex = /^[a-zA-Z0-9-_\.]+$/;
        if (!fileNameRegex.test(motherFile.name)) {
            alert('نام فایل مادر باید فقط شامل حروف انگلیسی و عدد باشد (کاراکترهای فارسی یا خاص مجاز نیستند).');
            return;
        }
        if (!fileNameRegex.test(userFile.name)) {
            alert('نام فایل کاربردی باید فقط شامل حروف انگلیسی و عدد باشد (کاراکترهای فارسی یا خاص مجاز نیستند).');
            return;
        }

        if (motherFile.size > 25 * 1024 * 1024) {
            alert('حجم فایل مادر باید کمتر از 25 مگابایت باشد.');
            return;
        }
        if (userFile.size > 25 * 1024 * 1024) {
            alert('حجم فایل کاربردی باید کمتر از 25 مگابایت باشد.');
            return;
        }

        formData.append('mother_file', motherFile);
        formData.append('user_file', userFile);
        formData.append('project_name', projectName);
        formData.append('project_type', projectType);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/upload-document', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('فایل‌ها با موفقیت آپلود شدند.');
            fetchDocuments();
            e.target.reset();
            setMotherFileSelected(false);
            setUserFileSelected(false);
            setMotherFileName('');
            setUserFileName('');
            setProjectName('');
            setProjectType('');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                handleLogout();
                navigate('/login');
            } else {
                alert('خطا در آپلود فایل: ' + (error.response?.data.message || 'خطای سرور'));
            }
        }
    };

    const handleFileInputChange = (e) => {
        const { name, files } = e.target;
        if (name === 'mother_file') {
            setMotherFileSelected(!!files[0]);
            setMotherFileName(files[0] ? files[0].name : '');
        } else if (name === 'user_file') {
            setUserFileSelected(!!files[0]);
            setUserFileName(files[0] ? files[0].name : '');
        }
    };

    const getFileIcon = (filePath) => {
        if (!filePath) {
            return { src: '/default-icon.png', alt: 'فایل' };
        }
        const extension = filePath.toLowerCase().split('.').pop();
        switch (extension) {
            case 'doc':
            case 'docx':
                return { src: '/word-icon.png', alt: 'ورد' };
            case 'ppt':
            case 'pptx':
                return { src: '/powerpoint-icon.png', alt: 'پاورپوینت' };
            case 'psd':
                return { src: '/photoshop-icon.png', alt: 'فتوشاپ' };
            case 'ai':
                return { src: '/illustrator-icon.png', alt: 'ایلاستریتور' };
            case 'pdf':
                return { src: '/pdf-icon.png', alt: 'پی‌دی‌اف' };
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return { src: '/image-icon.png', alt: 'عکس' };
            default:
                return { src: '/default-icon.png', alt: 'فایل' };
        }
    };

    const loadFileWithAuth = async (filePath) => {
        try {
            const token = localStorage.getItem('token');
            const relativePath = filePath.replace('http://localhost:8000', '');
            const decodedPath = decodeURIComponent(relativePath);
            const response = await axios.get(`http://localhost:8000/api/files${decodedPath}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('خطا در لود فایل:', error);
            return null;
        }
    };

    const PDFWithAuth = ({ filePath }) => {
        const [pdfSrc, setPdfSrc] = React.useState(null);

        React.useEffect(() => {
            const fetchPDF = async () => {
                const src = await loadFileWithAuth(filePath);
                setPdfSrc(src);
            };
            fetchPDF();
        }, [filePath]);

        if (!pdfSrc) return <p>در حال لود PDF...</p>;
        return <embed src={pdfSrc} type="application/pdf" />;
    };

    const renderFilePreview = (filePath) => {
        if (!filePath) {
            return null;
        }
        const extension = filePath.toLowerCase().split('.').pop();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <img src={filePath} alt="پیش‌نمایش" onError={() => console.log('خطا در لود عکس:', filePath)} />;
            case 'pdf':
                return <PDFWithAuth filePath={filePath} />;
            case 'ppt':
            case 'pptx':
                return <p>پیش‌نمایش برای فایل‌های پاورپوینت در دسترس نیست.</p>;
            default:
                return <p>پیش‌نمایش برای این نوع فایل در دسترس نیست.</p>;
        }
    };

    return (
        <div className="dashboard">
            <header className="header">
                <div className="profile-pic-container" onClick={toggleMenu}>
                    <div
                        className={profilePic ? 'profile-pic profile-pic-preview' : 'profile-pic'}
                        style={{
                            backgroundImage: `url(${profilePic ? URL.createObjectURL(profilePic) : (user?.profile_picture_url || 'https://via.placeholder.com/100')})`
                        }}
                    />
                </div>
                <div className={`menu ${menuOpen ? 'open' : ''}`}>
                    {isEditing ? (
                        <>
                            <input
                                type="file"
                                name="profile_picture"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <input
                                type="text"
                                name="first_name"
                                value={editedUser.first_name}
                                onChange={handleInputChange}
                                placeholder="نام"
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="last_name"
                                value={editedUser.last_name}
                                onChange={handleInputChange}
                                placeholder="نام خانوادگی"
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="username"
                                value={editedUser.username}
                                onChange={handleInputChange}
                                placeholder="نام کاربری"
                                className="input-field"
                            />
                            <input
                                type="email"
                                name="email"
                                value={editedUser.email || ''}
                                onChange={handleInputChange}
                                placeholder="ایمیل"
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="phone_number"
                                value={editedUser.phone_number}
                                onChange={handleInputChange}
                                placeholder="شماره تلفن"
                                className="input-field"
                            />
                        </>
                    ) : (
                        <>
                            <p>
                                {user?.first_name} {user?.last_name}
                                <span className={`status-light ${user?.is_online ? 'online' : 'offline'}`}></span>
                            </p>
                            <p>نام کاربری: {user?.username}</p>
                            <p>ایمیل: {user?.email || 'ثبت نشده'}</p>
                            <p>شماره تلفن: {user?.phone_number}</p>
                        </>
                    )}
                    <button className="action-btn edit-btn" onClick={handleEditToggle}>
                        {isEditing ? 'ذخیره' : 'ویرایش'}
                    </button>
                    <button className="action-btn logout-btn" onClick={handleLogoutClick}>
                        خروج
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {showWelcome && initialLogin && (
                    <div className="welcome-message">
                        <h1>خوش آمدید، {user?.first_name}!</h1>
                        <p>این اولین ورود شما به داشبورد است.</p>
                    </div>
                )}

                <div className="upload-box">
                    <h2>آپلود فایل</h2>
                    <form onSubmit={handleDocumentUpload}>
                        <div className="upload-field">
                            <label className="upload-label">نام پروژه:</label>
                            <input
                                type="text"
                                name="project_name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="upload-input"
                                required
                            />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">نوع پروژه:</label>
                            <select
                                name="project_type"
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                className="upload-input"
                                required
                            >
                                <option value="">-- انتخاب کنید --</option>
                                <option value="استوری اینستاگرام">استوری اینستاگرام</option>
                                <option value="پست اینستاگرام">پست اینستاگرام</option>
                                <option value="پست لینکدین">پست لینکدین</option>
                                <option value="پرزنتیشن">پرزنتیشن</option>
                                <option value="تقدیرنامه">تقدیرنامه</option>
                                <option value="نامه اداری">نامه اداری</option>
                                <option value="طرح تجاری">طرح تجاری</option>
                                <option value="پوستر">پوستر</option>
                                <option value="بیزینس مدل">بیزینس مدل</option>
                            </select>
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">فایل مادر:</label>
                            <input
                                type="file"
                                name="mother_file"
                                accept=".doc,.docx,.ppt,.pptx,.psd,.ai,.pdf"
                                onChange={handleFileInputChange}
                                className="upload-input"
                            />
                            {motherFileSelected && <span className="upload-text">{motherFileName}</span>}
                            <p className="file-hint">حداکثر حجم: 25 مگابایت - نام فایل باید فقط شامل حروف انگلیسی و عدد باشد</p>
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">فایل کاربردی:</label>
                            <input
                                type="file"
                                name="user_file"
                                accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                                onChange={handleFileInputChange}
                                className="upload-input"
                            />
                            {userFileSelected && <span className="upload-text">{userFileName}</span>}
                            <p className="file-hint">حداکثر حجم: 25 مگابایت - نام فایل باید فقط شامل حروف انگلیسی و عدد باشد</p>
                        </div>
                        <button
                            type="submit"
                            className="upload-btn"
                            disabled={!motherFileSelected || !userFileSelected || !projectName || !projectType}
                        >
                            آپلود
                        </button>
                    </form>
                </div>

                <div className="documents-section">
                    <h2>مستندات شما</h2>
                    {documents.length === 0 ? (
                        <p>هنوز مستندی آپلود نشده است.</p>
                    ) : (
                        <div className="document-categories">
                            {documents.map((doc, index) => (
                                <div key={index} className="document-category">
                                    <h3>مستند {index + 1}</h3>
                                    <div className="document-pair">
                                        <h4>فایل مادر:</h4>
                                        {doc.mother && doc.mother.file_path ? (
                                            <div className="file-info">
                                                <img
                                                    src={getFileIcon(doc.mother.file_path).src}
                                                    alt={getFileIcon(doc.mother.file_path).alt}
                                                    className="file-icon"
                                                />
                                                <p>{doc.mother.file_path.split('/').pop()}</p>
                                                <a href={doc.mother.file_path} download>
                                                    دانلود
                                                </a>
                                            </div>
                                        ) : (
                                            <p>فایل مادر در دسترس نیست.</p>
                                        )}
                                        <h4>فایل کاربردی:</h4>
                                        {doc.user && doc.user.file_path ? (
                                            <>
                                                <div className="file-info">
                                                    <img
                                                        src={getFileIcon(doc.user.file_path).src}
                                                        alt={getFileIcon(doc.user.file_path).alt}
                                                        className="file-icon"
                                                    />
                                                    <p>{doc.user.file_path.split('/').pop()}</p>
                                                    <a href={doc.user.file_path} download>
                                                        دانلود
                                                    </a>
                                                </div>
                                                <div className="file-preview">
                                                    {renderFilePreview(doc.user.file_path)}
                                                </div>
                                            </>
                                        ) : (
                                            <p>فایل کاربردی در دسترس نیست.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isLoading && <div className="loading">در حال بارگذاری...</div>}
        </div>
    );
}

export default Dashboard;
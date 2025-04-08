require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// File Storage Configurations
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === 'mother_file' ? 'uploads/documents/mother/' : 'uploads/documents/user/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const decodedFileName = iconv.decode(file.originalname, 'utf8');
    cb(null, `${Date.now()}-${decodedFileName}`);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileName = iconv.decode(file.originalname, 'utf8');
    const fileNameRegex = /^[a-zA-Z0-9-_\.]+$/;
    if (!fileNameRegex.test(fileName)) {
      return cb(new Error('نام فایل باید فقط شامل حروف انگلیسی و عدد باشد (کاراکترهای فارسی یا خاص مجاز نیستند).'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'mother_file', maxCount: 1 },
  { name: 'user_file', maxCount: 1 }
]);

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const decodedFileName = iconv.decode(file.originalname, 'utf8');
    cb(null, `${Date.now()}-${decodedFileName}`);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileName = iconv.decode(file.originalname, 'utf8');
    const fileNameRegex = /^[a-zA-Z0-9-_\.]+$/;
    if (!fileNameRegex.test(fileName)) {
      return cb(new Error('نام فایل باید فقط شامل حروف انگلیسی و عدد باشد (کاراکترهای فارسی یا خاص مجاز نیستند).'));
    }
    cb(null, true);
  }
});

// Database Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '10071007',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'Parsa'
});

// تنظیم انکودینگ کلاینت به UTF-8
pool.on('connect', (client) => {
  client.query('SET client_encoding TO "UTF8"');
});

pool.connect((err) => {
  if (err) {
    console.error('خطا در اتصال به دیتابیس:', err.stack);
    return;
  }
  console.log('اتصال به دیتابیس با موفقیت انجام شد');
});

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'دسترسی غیرمجاز' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('خطا در اعتبارسنجی توکن:', err.message);
    res.status(401).json({ success: false, message: 'توکن نامعتبر یا منقضی شده' });
  }
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, phone_number } = req.body;
    if (!username || !first_name || !last_name || !password || !phone_number) {
      return res.status(400).json({ success: false, message: 'همه فیلدها الزامی هستند' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users 
        (first_name, last_name, username, email, password, phone_number, 
         account_creation_date, is_first_login, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), TRUE, NOW(), NOW()) 
       RETURNING *`,
      [first_name, last_name, username, email, hashedPassword, phone_number]
    );
    res.status(201).json({ success: true, message: 'ثبت‌نام موفقیت‌آمیز', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1 OR phone_number = $1',
      [identifier]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'شناسه یا رمز اشتباه' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    await pool.query(
      'UPDATE users SET is_online = TRUE, last_login_date = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );
    const updatedUser = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
    const { password: _, ...userData } = updatedUser.rows[0];
    res.json({ success: true, message: 'ورود موفقیت‌آمیز', token, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.get('/dashboard', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }
    const user = result.rows[0];
    const userToSend = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      profile_picture_url: user.profile_picture_url,
      is_first_login: user.is_first_login,
      is_online: user.is_online
    };
    if (user.is_first_login === true) {
      await pool.query(
        'UPDATE users SET is_first_login = FALSE, updated_at = NOW() WHERE id = $1',
        [req.userId]
      );
    }
    res.json({ success: true, user: userToSend });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/logout', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_online = FALSE, updated_at = NOW() WHERE id = $1',
      [req.userId]
    );
    res.json({ success: true, message: 'خروج موفقیت‌آمیز' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'ایمیل یا شماره موبایل الزامی است' });
    }
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone_number = $1',
      [identifier]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر با این ایمیل یا شماره موبایل یافت نشد' });
    }
    const user = result.rows[0];
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, message: 'درخواست ریست رمز ارسال شد', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { identifier, newPassword, resetToken } = req.body;
    if (!identifier || !newPassword || !resetToken) {
      return res.status(400).json({ success: false, message: 'شناسه، رمز جدید و توکن الزامی هستند' });
    }
    let userId;
    try {
      const decoded = jwt.verify(resetToken, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'توکن ریست نامعتبر یا منقضی شده' });
    }
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND (email = $2 OR phone_number = $2)',
      [userId, identifier]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    res.json({ success: true, message: 'رمز عبور با موفقیت ریست شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.put('/user', authenticate, profileUpload.single('profile_picture'), async (req, res) => {
  try {
    const { first_name, last_name, username, email, phone_number } = req.body;
    let profilePictureUrl = null;
    if (req.file) {
      profilePictureUrl = `http://localhost:8000/uploads/profile/${req.file.filename}`;
    }

    const currentUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }
    const currentUser = currentUserResult.rows[0];

    const updatedFields = {
      first_name: first_name !== undefined ? first_name : currentUser.first_name,
      last_name: last_name !== undefined ? last_name : currentUser.last_name,
      username: username !== undefined ? username : currentUser.username,
      email: email !== undefined ? email : currentUser.email,
      phone_number: phone_number !== undefined ? phone_number : currentUser.phone_number,
      profile_picture_url: profilePictureUrl || currentUser.profile_picture_url
    };

    if (updatedFields.phone_number && updatedFields.phone_number.length > 11) {
      return res.status(400).json({ success: false, message: 'شماره موبایل باید حداکثر ۱۱ رقم باشد' });
    }

    const result = await pool.query(
      `UPDATE users SET 
        first_name = $1, last_name = $2, username = $3, email = $4, phone_number = $5,
        profile_picture_url = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        updatedFields.first_name,
        updatedFields.last_name,
        updatedFields.username,
        updatedFields.email,
        updatedFields.phone_number,
        updatedFields.profile_picture_url,
        req.userId
      ]
    );
    const updatedUser = result.rows[0];
    const { password: _, ...userData } = updatedUser;
    res.json({ success: true, message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد', user: userData });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'نام کاربری، ایمیل یا شماره موبایل قبلاً استفاده شده' });
    }
    if (error.message.includes('نام فایل باید فقط شامل حروف انگلیسی و عدد باشد')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('File too large')) {
      return res.status(400).json({ success: false, message: 'حجم فایل باید کمتر از 25 مگابایت باشد' });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/upload-document', authenticate, documentUpload, async (req, res) => {
  try {
    console.log('Reached /upload-document route');
    const files = req.files;
    console.log('Files received:', files);
    console.log('Raw req.body:', req.body);
    const { project_name, project_type } = req.body;

    console.log('Extracted project_name:', project_name);
    console.log('Extracted project_type:', project_type);

    console.log('Validating project_name and project_type');
    if (!project_name || !project_type) {
      console.log('Validation failed: project_name or project_type is missing');
      if (files?.mother_file) fs.unlinkSync(files.mother_file[0].path);
      if (files?.user_file) fs.unlinkSync(files.user_file[0].path);
      return res.status(400).json({ 
        success: false, 
        message: 'نام پروژه و نوع پروژه الزامی هستند' 
      });
    }

    console.log('Validating files');
    if (!files?.mother_file || !files?.user_file) {
      console.log('Validation failed: mother_file or user_file is missing');
      if (files?.mother_file) fs.unlinkSync(files.mother_file[0].path);
      if (files?.user_file) fs.unlinkSync(files.user_file[0].path);
      return res.status(400).json({ success: false, message: 'هر دو فایل (مادر و کاربردی) الزامی هستند' });
    }

    const motherFile = files.mother_file[0];
    const userFile = files.user_file[0];

    console.log('Validating mother file type');
    const allowedMotherTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/vnd.adobe.photoshop',
      'application/postscript'
    ];
    
    if (!allowedMotherTypes.includes(motherFile.mimetype)) {
      console.log('Validation failed: Invalid mother file type');
      fs.unlinkSync(motherFile.path);
      fs.unlinkSync(userFile.path);
      return res.status(400).json({ success: false, message: 'فایل مادر باید ورد، پاورپوینت، فتوشاپ یا ایلاستریتور باشد' });
    }

    console.log('Validating user file type');
    const allowedUserTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (!allowedUserTypes.includes(userFile.mimetype)) {
      console.log('Validation failed: Invalid user file type');
      fs.unlinkSync(motherFile.path);
      fs.unlinkSync(userFile.path);
      return res.status(400).json({ success: false, message: 'فایل کاربردی باید PDF، پاورپوینت یا تصویر (jpg, png, gif) باشد' });
    }

    console.log('Generating pairId');
    const pairResult = await pool.query('SELECT MAX(pair_id) as max_pair FROM documents WHERE user_id = $1', [req.userId]);
    const pairId = (pairResult.rows[0].max_pair || 0) + 1;

    const motherFileName = iconv.decode(Buffer.from(motherFile.originalname, 'binary'), 'utf8');
    const userFileName = iconv.decode(Buffer.from(userFile.originalname, 'binary'), 'utf8');

    console.log('Inserting mother file into database');
    const motherFilePath = `http://localhost:8000/uploads/documents/mother/${motherFile.filename}`;
    await pool.query(
      'INSERT INTO documents (user_id, file_name, file_path, file_type, pair_id, project_name, project_type, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [req.userId, motherFileName, motherFilePath, 'mother', pairId, project_name, project_type]
    );

    console.log('Inserting user file into database');
    const userFilePath = `http://localhost:8000/uploads/documents/user/${userFile.filename}`;
    await pool.query(
      'INSERT INTO documents (user_id, file_name, file_path, file_type, pair_id, project_name, project_type, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [req.userId, userFileName, userFilePath, 'user', pairId, project_name, project_type]
    );

    console.log('Sending response');
    res.json({ 
      success: true, 
      message: 'فایل‌ها با موفقیت آپلود شدند',
      pairId,
      project_name,
      project_type
    });
  } catch (error) {
    console.log('Error in /upload-document:', error.message);
    if (req.files?.mother_file) fs.unlinkSync(req.files.mother_file[0].path);
    if (req.files?.user_file) fs.unlinkSync(req.files.user_file[0].path);
    
    if (error.message.includes('نام فایل باید فقط شامل حروف انگلیسی و عدد باشد')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('File too large')) {
      return res.status(400).json({ success: false, message: 'حجم فایل باید کمتر از 25 مگابایت باشد' });
    }
    console.error('خطا در آپلود فایل:', error);
    res.status(500).json({ success: false, message: 'خطای سرور در آپلود فایل' });
  }
});

app.get('/get-documents', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.username 
       FROM documents d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.user_id = $1 
       ORDER BY d.pair_id, d.file_type`,
      [req.userId]
    );

    const documents = result.rows;
    const pairs = {};

    documents.forEach(doc => {
      if (!pairs[doc.pair_id]) {
        pairs[doc.pair_id] = { 
          username: doc.username,
          project_name: doc.project_name,
          project_type: doc.project_type
        };
      }
      pairs[doc.pair_id][doc.file_type] = {
        id: doc.id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        uploaded_at: doc.uploaded_at
      };
    });

    res.json({ success: true, pairs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// روت برای گرفتن فایل‌های کاربردی همه کاربران بر اساس project_type
app.get('/get-user-files-by-project-type/:projectType', authenticate, async (req, res) => {
  try {
    let { projectType } = req.params;
    console.log('Fetching user files for project_type:', projectType); // دیباگ

    // دیکود کردن projectType برای پشتیبانی از کاراکترهای فارسی
    projectType = decodeURIComponent(projectType);
    console.log('Decoded project_type:', projectType); // دیباگ

    // نادیده گرفتن فاصله‌های اضافی
    projectType = projectType.trim();

    const result = await pool.query(
      `SELECT d.id, d.file_name, d.file_path, d.project_name, d.project_type, d.uploaded_at,
              u.username, u.profile_picture_url
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.file_type = 'user' AND TRIM(d.project_type) = $1
       ORDER BY d.uploaded_at DESC`,
      [projectType]
    );

    const userFiles = result.rows;
    console.log('User files found:', userFiles); // دیباگ

    res.json({ success: true, userFiles });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ success: false, message: 'خطای سرور در گرفتن فایل‌ها' });
  }
});

app.get('/api/files/*', authenticate, (req, res) => {
  try {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.join(__dirname, decodedPath.replace('/api/files', ''));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'فایل یافت نشد' });
    }
    const fileExtension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      contentType = `image/${fileExtension.replace('.', '')}`;
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('خطا در استریم فایل:', err);
      res.status(500).json({ success: false, message: 'خطا در استریم فایل' });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('خطا در لود فایل:', error);
    res.status(500).json({ success: false, message: 'خطای سرور در لود فایل' });
  }
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`سرور روی پورت ${PORT} اجرا شد`);
});
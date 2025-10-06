const path = require('path');
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();

const pool = require('./db');
const { ensureLegacyTables, legacyTables } = require('./lib/legacy/tableManager');
const { ensureAuthTables } = require('./lib/auth/usersTable');
const { seedOptionTablesFromDbf } = require('./lib/legacy/optionSeeder');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const customersRouter = require('./routes/customers');
const shipmentsRouter = require('./routes/shipments');
const mediaRouter = require('./routes/media');
const paymentsRouter = require('./routes/payments');
const invoicesRouter = require('./routes/invoices');
const legacyCustomersRouter = require('./routes/legacyCustomers');
const legacyDeliveriesRouter = require('./routes/legacyDeliveries');
const legacyProductsRouter = require('./routes/legacyProducts');
const workflowRouter = require('./routes/workflow');
const dashboardRouter = require('./routes/dashboard');

const app = express();

// View engine: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request size limits and parsing
const maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
app.use(express.json({ limit: maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: maxRequestSize }));

// Log request body for debugging workflow save
app.use('/workflow/api/save-workflow', (req, res, next) => {
  console.log('🔍 Workflow save request received:', {
    method: req.method,
    url: req.url,
    bodySize: JSON.stringify(req.body).length,
    hasCustomerData: !!req.body.customerData,
    hasProductData: !!req.body.productData
  });
  next();
});

// Simple rate limiting (in-memory)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100; // 100 requests per window

const rateLimit = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientId);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Apply rate limiting to API routes (excluding workflow save)
app.use('/api', (req, res, next) => {
  // Skip rate limiting for workflow save API
  if (req.path.includes('/workflow/api/save-workflow')) {
    return next();
  }
  return rateLimit(req, res, next);
});

// Cleanup rate limit map every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Sessions (for demo/dev only; use persistent store in production)
console.log('🔍 Session Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET',
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Fix for Railway HTTPS
    },
    name: 'siamdrug.sid', // เปลี่ยนชื่อ cookie
  })
);

// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Cache cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Expose current user to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Database health check (separate endpoint)
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// API endpoint for dashboard deliveries with pagination
app.get('/api/deliveries', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // จำกัดสูงสุด 100
    const offset = (page - 1) * limit;
    
    // Optimized query with pagination and JOIN to avoid N+1 problem
    const [deliveries] = await pool.execute(`
      SELECT 
        d.id,
        d.delivernum,
        d.operator as saleid,
        d.prename,
        d.firstname,
        d.lastname,
        d.apptdate,
        d.mediadesc,
        d.total,
        d.shipdesc,
        d.apptaddr,
        d.customerid,
        d.gender,
        d.age,
        d.weight,
        d.height,
        d.tag,
        d.disease1,
        d.disease2,
        d.lineid,
        d.symptoms,
        d.pain_level,
        d.keyword,
        d.followup,
        d.method,
        d.remark1,
        d.channel,
        d.datadesc,
        d.workdate,
        d.worktime,
        d.created_at,
        COUNT(p.id) as product_count
      FROM legacy_deliveries d
      LEFT JOIN legacy_deliveries p ON d.delivernum = p.delivernum AND p.datadesc IN ('ขาย', 'ของแถม')
      WHERE (DATE(d.apptdate) = ? OR ? = '') AND d.datadesc = 'ขาย'
      GROUP BY d.id
      ORDER BY d.delivernum DESC
      LIMIT ? OFFSET ?
    `, [date, date, limit, offset]);

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM legacy_deliveries 
      WHERE (DATE(apptdate) = ? OR ? = '') AND datadesc = 'ขาย'
    `, [date, date]);

    // Get products for delivered items only (optimized)
    const deliveryNums = deliveries.map(d => d.delivernum);
    let products = [];
    if (deliveryNums.length > 0) {
      const placeholders = deliveryNums.map(() => '?').join(',');
      const [productRows] = await pool.execute(`
        SELECT 
          delivernum,
          code,
          title,
          price,
          qty,
          amount,
          datadesc
        FROM legacy_deliveries 
        WHERE delivernum IN (${placeholders}) AND datadesc IN ('ขาย', 'ของแถม', 'ค่าส่ง')
        ORDER BY delivernum, 
          CASE datadesc 
            WHEN 'ขาย' THEN 1 
            WHEN 'ค่าส่ง' THEN 2 
            WHEN 'ของแถม' THEN 3 
            ELSE 4 
          END
      `, deliveryNums);
      products = productRows;
    }

    res.json({
      deliveries,
      products,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
        hasMore: offset + limit < countResult[0].total
      }
    });
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch delivery data' });
  }
});

// Cached API endpoint for option tables (frequently accessed)
app.get('/api/options/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const cacheKey = `options_${table}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Valid option tables
    const validTables = ['media', 'channel', 'finance', 'shipping', 'coupon', 'products'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    const [rows] = await pool.execute(`SELECT * FROM legacy_${table} ORDER BY ${table === 'products' ? 'title' : `${table}name`}`);
    
    const data = {
      success: true,
      data: rows,
      cached_at: new Date().toISOString()
    };
    
    // Cache the result
    setCachedData(cacheKey, data);
    
    res.json(data);
  } catch (err) {
    console.error(`Error fetching ${req.params.table} options:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch options data',
      message: err.message 
    });
  }
});

// API endpoint to get all deliveries without date filter
app.get('/api/deliveries/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const offset = (page - 1) * limit;
    
    let deliveries = [];
    let products = [];
    
    try {
      // Try to get data from database
      const [deliveryRows] = await pool.execute(`
        SELECT 
          id,
          delivernum,
          operator as saleid,
          prename,
          firstname,
          lastname,
          apptdate,
          mediadesc,
          total,
          shipdesc,
          apptaddr,
          customerid,
          datadesc,
          0 as previous_purchases
        FROM legacy_deliveries
        ORDER BY delivernum DESC
      `);
      
      deliveries = deliveryRows;
      
      // Get products for all deliveries
      const deliveryIds = deliveries.map(d => d.id);
      if (deliveryIds.length > 0) {
        const [productRows] = await pool.execute(`
          SELECT 
            delivernum,
            code,
            title,
            price,
            qty,
            amount,
            datadesc
          FROM legacy_deliveries 
          WHERE id IN (${deliveryIds.map(() => '?').join(',')})
          ORDER BY delivernum, id
        `, deliveryIds);
        products = productRows;
      }
      
    } catch (dbError) {
      console.log('Database query failed, using sample data:', dbError.message);
      
      // Fallback to sample data
      deliveries = [
        {
          id: 1,
          delivernum: '0000170001',
          saleid: '1013',
          prename: 'คุณ',
          firstname: 'นัทวุฒิ',
          lastname: 'วงศ์สุภา',
          apptdate: '2025-09-22',
          mediadesc: 'SEM',
          total: 3600.00,
          shipdesc: 'E.M.S',
          apptaddr: '126/297 ม.2 บ้านของเรา ตำบลท่าตูม อำเภอศรีมหาโพธิ',
          customerid: '0000053232',
          previous_purchases: 0
        },
        {
          id: 2,
          delivernum: '0000170002',
          saleid: '0880',
          prename: 'คุณ',
          firstname: 'ทิพวรรณ',
          lastname: 'เสรีชัยทวีพงศ์',
          apptdate: '2025-09-22',
          mediadesc: 'Lazada',
          total: 1850.00,
          shipdesc: 'LEX EXP',
          apptaddr: '9/191-192 ถ.รามอินทรา แขวงอนุสาวรีย์ เขตบางเขน กท',
          customerid: '0000053233',
          previous_purchases: 3
        },
        {
          id: 3,
          delivernum: '0000170003',
          saleid: '1007',
          prename: 'คุณ',
          firstname: 'สมชาย',
          lastname: 'ใจดี',
          apptdate: '2025-09-22',
          mediadesc: 'Shopee',
          total: 4900.00,
          shipdesc: 'E.M.S',
          apptaddr: '123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ',
          customerid: '0000053234',
          previous_purchases: 2
        }
      ];
      
      products = [
        {
          delivernum: '0000170001',
          code: '67404',
          title: 'OVOCAL BOTT 4*30\'S FREE ACTIVA+K2 30\'',
          price: 5200.00,
          qty: 1,
          amount: 5200.00
        },
        {
          delivernum: '0000170002',
          code: '67416',
          title: 'COUPON NEW 0300 LINE:OVOSCIENCE',
          price: -300.00,
          qty: 1,
          amount: -300.00
        }
      ];
    }

    res.json({
      deliveries,
      products
    });
  } catch (err) {
    console.error('Error fetching all deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch delivery data' });
  }
});

// API routes
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/legacy/customers', requireApiAuth, legacyCustomersRouter);
app.use('/api/legacy/deliveries', requireApiAuth, legacyDeliveriesRouter);
app.use('/api/legacy/products', requireApiAuth, legacyProductsRouter);

// Auth routes (register/login/logout)
app.use('/', authRouter);

// Simple auth guard
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  const nextUrl = encodeURIComponent(req.originalUrl || '/');
  res.redirect(`/login?next=${nextUrl}`);
}

// API auth guard - returns JSON error instead of redirect
function requireApiAuth(req, res, next) {
  console.log('🔍 API Auth Check:', {
    hasSession: !!req.session,
    hasUser: !!(req.session && req.session.user),
    sessionId: req.sessionID,
    path: req.path,
    method: req.method
  });
  
  if (req.session && req.session.user) {
    console.log('✅ API Auth: User authenticated');
    return next();
  }
  
  console.log('❌ API Auth: Authentication required');
  res.status(401).json({ error: 'Authentication required' });
}

app.get('/', requireAuth, (req, res) => {
  res.redirect('/workflow');
});

// Use requireApiAuth for API routes, requireAuth for page routes
app.use('/workflow', (req, res, next) => {
  // API routes should use requireApiAuth
  if (req.path.startsWith('/api/')) {
    return requireApiAuth(req, res, next);
  }
  // Page routes should use requireAuth
  return requireAuth(req, res, next);
}, workflowRouter);
app.use('/dashboard', requireAuth, dashboardRouter);

// Basic error handler
// Enhanced error handling with logging
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  console.error('🚨 Application Error:', errorInfo);
  
  // Log database connection errors specifically
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('💾 Database connection error detected');
  }
  
  // Send appropriate error response
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp
    });
  } else {
    res.status(500).render('error', { 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// 404 handler
app.use((req, res) => {
  const timestamp = new Date().toISOString();
  console.warn(`⚠️  404 Not Found: ${req.method} ${req.originalUrl} - ${req.ip}`);
  
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found',
      timestamp
    });
  } else {
    res.status(404).render('error', {
      error: 'The page you are looking for does not exist.'
    });
  }
});

// Bootstrap and start server
const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_RETRIES = Number(process.env.PORT_RETRY_LIMIT || 10);

async function bootstrap() {
  await ensureLegacyTables(pool);
  await ensureAuthTables(pool);
  const optionSeedResults = await seedOptionTablesFromDbf(pool, console);
  optionSeedResults.forEach((result) => {
    if (result.skipped) {
      const extra = typeof result.existing === 'number' ? ' existing=' + result.existing : '';
      console.log(`Skipped seeding ${result.tableName} (${result.reason})${extra}`);
    } else {
      console.log(`Seeded ${result.tableName} with ${result.inserted} records`);
    }
  });
}

function startServer(port, attemptsLeft) {
  const server = app.listen(port, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${port}`);
    console.log(`📊 Health check available at: http://${HOST}:${port}/health`);
    console.log(`🗄️  Database health check: http://${HOST}:${port}/health/db`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
    } else {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  });

  // Handle process termination gracefully
  process.on('SIGTERM', () => {
    console.log('📝 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

// Start the server first, then bootstrap database
startServer(DEFAULT_PORT, MAX_PORT_RETRIES);

// Bootstrap database in background (non-blocking)
bootstrap()
  .then(() => {
    console.log('✅ Database bootstrap completed successfully');
  })
  .catch((err) => {
    console.error('❌ Database bootstrap failed:', err.message);
    console.log('⚠️  App will continue running without database initialization');
  });

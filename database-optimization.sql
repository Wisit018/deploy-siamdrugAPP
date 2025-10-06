-- Database Optimization Script
-- เพิ่ม indexes เพื่อเพิ่มประสิทธิภาพการ query

-- Indexes สำหรับ legacy_deliveries table
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_workdate ON legacy_deliveries(workdate);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_customerid ON legacy_deliveries(customerid);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_delivernum ON legacy_deliveries(delivernum);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_apptdate ON legacy_deliveries(apptdate);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_operator ON legacy_deliveries(operator);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_datadesc ON legacy_deliveries(datadesc);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_created_at ON legacy_deliveries(created_at);

-- Composite indexes สำหรับ queries ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_workdate_customerid ON legacy_deliveries(workdate, customerid);
CREATE INDEX IF NOT EXISTS idx_legacy_deliveries_delivernum_datadesc ON legacy_deliveries(delivernum, datadesc);

-- Indexes สำหรับ legacy_customers table
CREATE INDEX IF NOT EXISTS idx_legacy_customers_customerid ON legacy_customers(customerid);
CREATE INDEX IF NOT EXISTS idx_legacy_customers_firstname ON legacy_customers(firstname);
CREATE INDEX IF NOT EXISTS idx_legacy_customers_lastname ON legacy_customers(lastname);
CREATE INDEX IF NOT EXISTS idx_legacy_customers_mobiletel ON legacy_customers(mobiletel);
CREATE INDEX IF NOT EXISTS idx_legacy_customers_email ON legacy_customers(email);

-- Indexes สำหรับ legacy_products table
CREATE INDEX IF NOT EXISTS idx_legacy_products_code ON legacy_products(code);
CREATE INDEX IF NOT EXISTS idx_legacy_products_title ON legacy_products(title);
CREATE INDEX IF NOT EXISTS idx_legacy_products_active ON legacy_products(active);
CREATE INDEX IF NOT EXISTS idx_legacy_products_scancode ON legacy_products(scancode);

-- Indexes สำหรับ users table
CREATE INDEX IF NOT EXISTS idx_users_operator ON users(operator);
CREATE INDEX IF NOT EXISTS idx_users_pn_id ON users(pn_id);

-- Indexes สำหรับ media table
CREATE INDEX IF NOT EXISTS idx_media_medianame ON legacy_media(medianame);

-- Indexes สำหรับ channel table
CREATE INDEX IF NOT EXISTS idx_channel_channelname ON legacy_channel(channelname);

-- Indexes สำหรับ finance table
CREATE INDEX IF NOT EXISTS idx_finance_financetype ON legacy_finance(financetype);

-- Indexes สำหรับ shipping table
CREATE INDEX IF NOT EXISTS idx_shipping_shipcode ON legacy_shipping(shipcode);

-- Indexes สำหรับ coupon table
CREATE INDEX IF NOT EXISTS idx_coupon_couponid ON legacy_coupon(couponid);

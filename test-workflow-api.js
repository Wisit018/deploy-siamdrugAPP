// Test script for workflow API
const fetch = require('node-fetch');

async function testWorkflowAPI() {
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  
  const testData = {
    customerData: {
      customerid: 'TEST001',
      prename: 'นาย',
      firstname: 'ทดสอบ',
      lastname: 'ระบบ',
      mobiletel: '0812345678',
      email: 'test@example.com'
    },
    deliveryData: {
      apptdate: new Date().toISOString().split('T')[0],
      appttime: '14:00:00',
      apptperson: 'ทดสอบ ระบบ',
      appttel: '0812345678',
      apptaddr: 'ที่อยู่ทดสอบ'
    },
    mediaChannelData: {
      mediaId: 1,
      mediaName: 'Facebook',
      channelId: 1,
      channelName: 'Website'
    },
    productData: {
      products: [
        {
          code: 'TEST001',
          title: 'สินค้าทดสอบ',
          price: 1000,
          qty: 1,
          amount: 1000,
          datadesc: 'ขาย'
        }
      ],
      shipping: {
        shippingCost: 50,
        noCharge: false,
        method: 'EMS'
      }
    },
    paymentData: {
      financeType: 1,
      financeDesc: 'เงินสด',
      remark: 'การทดสอบระบบ'
    }
  };

  try {
    console.log('🧪 Testing workflow save API...');
    console.log('📊 Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${baseURL}/workflow/api/save-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Test passed!');
    } else {
      console.log('❌ Test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testWorkflowAPI();
}

module.exports = testWorkflowAPI;

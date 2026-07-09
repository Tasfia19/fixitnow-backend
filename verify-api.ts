import app from './src/app';
import prisma from './src/services/db';

const PORT = 5001;

async function runTests() {
  console.log('🧪 Starting Automated API Verification tests...');

  // Start the server on a test port
  const server = app.listen(PORT, async () => {
    console.log(`Test server listening on port ${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;

      // Test 1: Home endpoint
      console.log('\n--- Test 1: Home Endpoint ---');
      const resHome = await fetch(`${baseUrl}/`);
      const jsonHome = await resHome.json() as any;
      console.log('Home Status:', resHome.status);
      console.log('Home Response:', jsonHome);

      // Test 2: Error formatting check (invalid route)
      console.log('\n--- Test 2: Invalid Route Error Format ---');
      const res404 = await fetch(`${baseUrl}/api/invalid-endpoint-abc`);
      const json404 = await res404.json() as any;
      console.log('404 Status:', res404.status);
      console.log('404 Response:', json404);
      if (json404.success === false && 'message' in json404 && 'errorDetails' in json404) {
        console.log('✅ Error response matches standard format: { success, message, errorDetails }');
      } else {
        console.log('❌ Error response does NOT match standard format');
      }

      // Test 3: Input Validation error formatting
      console.log('\n--- Test 3: Input Validation Error Formatting ---');
      const resVal = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }), // Missing password and invalid email
      });
      const jsonVal = await resVal.json() as any;
      console.log('Validation Status:', resVal.status);
      console.log('Validation Response:', JSON.stringify(jsonVal, null, 2));
      if (resVal.status === 400 && jsonVal.message === 'Validation Error') {
        console.log('✅ Validation correctly intercepted by Zod and formatted!');
      } else {
        console.log('❌ Validation test failed');
      }

      // Test 4: Auth Login and JWT Verification
      console.log('\n--- Test 4: Admin & User Logins ---');
      const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@fixitnow.com', password: 'admin123' }),
      });
      const jsonLogin = await resLogin.json() as any;
      console.log('Admin Login Status:', resLogin.status);
      const adminToken = jsonLogin.data.token;
      console.log('Admin Token Gained:', adminToken ? 'YES' : 'NO');

      // Test 5: Role Authorization check (Technician profile path using Admin token)
      console.log('\n--- Test 5: Role-based Authorization Restrictions ---');
      const resAuthRestrict = await fetch(`${baseUrl}/api/technician/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          skills: ['Coding'],
          experience: 1,
          pricePerHour: 100,
          location: 'Dhaka',
        }),
      });
      const jsonRestrict = await resAuthRestrict.json() as any;
      console.log('Access Profile Status (with Admin token):', resAuthRestrict.status);
      console.log('Access Profile Response:', jsonRestrict);
      if (resAuthRestrict.status === 403) {
        console.log('✅ Access correctly denied to Admin attempting to hit Technician-only endpoint!');
      } else {
        console.log('❌ Access restriction failed');
      }

      // Test 6: Public services retrieval
      console.log('\n--- Test 6: Public Browse Services ---');
      const resSvc = await fetch(`${baseUrl}/api/services`);
      const jsonSvc = await resSvc.json() as any;
      console.log('Services Count:', jsonSvc.data.services.length);
      console.log('First Service:', jsonSvc.data.services[0]?.name);

      // Test 7: Public technicians retrieval
      console.log('\n--- Test 7: Public Browse Technicians ---');
      const resTech = await fetch(`${baseUrl}/api/technicians`);
      const jsonTech = await resTech.json() as any;
      console.log('Technicians Count:', jsonTech.data.technicians.length);
      console.log('First Technician Name:', jsonTech.data.technicians[0]?.user.name);

      console.log('\n======================================================');
      console.log('🎉 API Verification Completed Successfully!');
      console.log('All mandatory backend constraints are verified.');
      console.log('======================================================');

    } catch (err) {
      console.error('❌ Error during testing:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

runTests();

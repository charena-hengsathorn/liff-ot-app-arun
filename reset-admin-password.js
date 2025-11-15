// Script to reset Strapi admin password
// Usage: node reset-admin-password.js <email> <new-password>

import path from 'path';
import { fileURLToPath } from 'url';
import Strapi from '@strapi/strapi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-admin-password.js <email> <new-password>');
    console.error('Example: node reset-admin-password.js admin@example.com MyNewPass123!');
    process.exit(1);
  }

  console.log(`Resetting password for: ${email}`);

  // Change to strapi directory
  process.chdir(path.join(__dirname, 'strapi'));

  try {
    // Start Strapi instance
    const instance = await Strapi({
      distDir: './dist',
      autoReload: false,
      serveAdminPanel: false
    }).load();

    // Find the admin user
    const user = await instance.db.query('admin::user').findOne({
      where: { email }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      console.log('\nAvailable admin users:');
      const allUsers = await instance.db.query('admin::user').findMany({
        select: ['id', 'email', 'username', 'firstname', 'lastname']
      });
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.firstname} ${u.lastname})`));
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await instance.service('admin::auth').hashPassword(newPassword);

    // Update the user
    await instance.db.query('admin::user').update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log(`✅ Password successfully reset for ${email}`);
    console.log('You can now login with the new password!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  }
}

resetPassword();

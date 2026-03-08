import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const saltRounds = 12;

  // Create test users for each role
  const testUsers = [
    {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: Role.ADMIN,
    },
    {
      name: 'Editor User', 
      username: 'editor',
      email: 'editor@test.com',
      password: 'editor123',
      role: Role.EDITOR,
    },
    {
      name: 'Reporter User',
      username: 'reporter',
      email: 'reporter@test.com', 
      password: 'reporter123',
      role: Role.REPORTER,
    },
  ];

  for (const userData of testUsers) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`👤 User ${userData.email} already exists, skipping...`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });

    console.log(`✅ Created ${userData.role} user: ${userData.email}`);
  }

  // Create some test categories
  const testCategories = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Latest tech news and updates',
    },
    {
      name: 'Politics',
      slug: 'politics', 
      description: 'Political news and analysis',
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports coverage and updates',
    },
  ];

  for (const categoryData of testCategories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categoryData.slug },
    });

    if (existingCategory) {
      console.log(`📁 Category ${categoryData.slug} already exists, skipping...`);
      continue;
    }

    await prisma.category.create({
      data: categoryData,
    });

    console.log(`✅ Created category: ${categoryData.name}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
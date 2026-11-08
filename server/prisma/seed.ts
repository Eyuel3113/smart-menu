import { PrismaClient, StaffRole, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Upsert Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'rest-addis-001' },
    update: {
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      phone: '+251 911 234 567',
      address: 'Bole Medhanialem Road, Addis Ababa, Ethiopia',
    },
    create: {
      id: 'rest-addis-001',
      name: 'Taste of Addis Lounge',
      currency: 'ETB',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      phone: '+251 911 234 567',
      address: 'Bole Medhanialem Road, Addis Ababa, Ethiopia',
    },
  });

  // 1b. Seed Initial Areas
  const areaMain = await prisma.area.upsert({
    where: { id: 'area-main-dining' },
    update: { name: 'Main Dining Hall', sortOrder: 1 },
    create: {
      id: 'area-main-dining',
      restaurantId: restaurant.id,
      name: 'Main Dining Hall',
      sortOrder: 1,
    },
  });

  const areaTerrace = await prisma.area.upsert({
    where: { id: 'area-terrace' },
    update: { name: 'Terrace & Garden', sortOrder: 2 },
    create: {
      id: 'area-terrace',
      restaurantId: restaurant.id,
      name: 'Terrace & Garden',
      sortOrder: 2,
    },
  });

  const areaVip = await prisma.area.upsert({
    where: { id: 'area-vip' },
    update: { name: 'VIP Lounge', sortOrder: 3 },
    create: {
      id: 'area-vip',
      restaurantId: restaurant.id,
      name: 'VIP Lounge',
      sortOrder: 3,
    },
  });

  console.log(`✅ Restaurant configured: ${restaurant.name} (${restaurant.id})`);

  // 2. Seed Staff Members
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const staffData = [
    {
      email: 'admin@smartmenu.com',
      name: 'Solomon Haile (Admin)',
      role: StaffRole.ADMIN,
      passwordHash,
    },
    {
      email: 'manager@smartmenu.com',
      name: 'Selamawit Tadesse (Manager)',
      role: StaffRole.MANAGER,
      passwordHash,
    },
    {
      email: 'kitchen@smartmenu.com',
      name: 'Chef Dawit (Kitchen Head)',
      role: StaffRole.KITCHEN,
      passwordHash,
    },
    {
      email: 'waiter@smartmenu.com',
      name: 'Biruk Kebede (Head Waiter)',
      role: StaffRole.WAITER,
      passwordHash,
    },
  ];

  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: { email: staff.email },
      update: {
        role: staff.role,
        name: staff.name,
      },
      create: {
        restaurantId: restaurant.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        passwordHash: staff.passwordHash,
      },
    });
  }
  console.log(`✅ Staff members created (Admin, Manager, Kitchen, Waiter with pass: password123)`);

  // 3. Seed Categories & Menu Items
  const categoriesData = [
    {
      id: 'cat-appetizers',
      name: 'Appetizers & Bites',
      sortOrder: 1,
      items: [
        {
          name: 'Sambusa Duo (Beef & Lentil)',
          description: 'Crispy pastry parcels packed with spiced minced beef and green lentils with awaze dip.',
          price: 180.0,
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Timatim Salata',
          description: 'Fresh diced plum tomatoes, shallots, jalapeños tossed in olive oil, lime, and berbere vinaigrette.',
          price: 150.0,
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Crispy Garlic Wings',
          description: 'Flash-fried chicken wings glazed with garlic honey and mitmita spice.',
          price: 320.0,
          imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'cat-mains',
      name: 'Traditional Mains & Platters',
      sortOrder: 2,
      items: [
        {
          name: 'Special Doro Wat Platter',
          description: 'Slow-simmered chicken drumstick in rich berbere sauce with hard-boiled egg and teff injera.',
          price: 650.0,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Special Siga Tibs (Sizzling Beef)',
          description: 'Prime ribeye cubes flash-sautéed in clarified niter kibbeh with onions, rosemary, and green chili.',
          price: 720.0,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Addis Special Kitfo',
          description: 'Finely minced lean prime beef warmed in niter kibbeh spiced with mitmita, served with ayib and gomen.',
          price: 680.0,
          imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Vegetarian Bayenetu Feast',
          description: 'Grand rainbow platter of misir wat, shiro, atkilt wot, gomen, and fosolia over injera.',
          price: 450.0,
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'cat-grills',
      name: 'Gourmet Grills & Burgers',
      sortOrder: 3,
      items: [
        {
          name: 'Smoked Gouda Wagyu Burger',
          description: 'Angus beef patty topped with smoked gouda, caramelized red onions, truffle aioli on brioche.',
          price: 580.0,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Flame-Grilled Lamb Chops',
          description: 'Herb-marinated lamb chops charred over open charcoal, accompanied by roasted baby potatoes.',
          price: 850.0,
          imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'cat-beverages',
      name: 'Drinks & Ethiopian Coffee',
      sortOrder: 4,
      items: [
        {
          name: 'Traditional Clay Pot Jebena Coffee',
          description: 'Freshly roasted Yirgacheffe coffee beans brewed in clay jebena, served with popcorn.',
          price: 90.0,
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Fresh Avocado Mango Spris Juice',
          description: 'Layered fresh avocado puree and tropical mango smoothie topped with fresh lime squeeze.',
          price: 160.0,
          imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Sparkling Mint Mojito',
          description: 'Muddled fresh spearmint leaves, cane syrup, freshly squeezed lime, and effervescent sparkling soda.',
          price: 220.0,
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'cat-desserts',
      name: 'Desserts & Sweets',
      sortOrder: 5,
      items: [
        {
          name: 'Warm Belgian Chocolate Lava Cake',
          description: 'Rich dark molten chocolate center served with Madagascar vanilla gelato.',
          price: 260.0,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
        {
          name: 'Honey Baklava Squares',
          description: 'Flaky phyllo pastry layers loaded with crushed walnuts and orange blossom honey syrup.',
          price: 190.0,
          imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
          isAvailable: true,
        },
      ],
    },
  ];

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
      create: {
        id: cat.id,
        restaurantId: restaurant.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });

    for (const item of cat.items) {
      const existing = await prisma.menuItem.findFirst({
        where: {
          restaurantId: restaurant.id,
          name: item.name,
        },
      });

      if (!existing) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            isAvailable: item.isAvailable,
          },
        });
      } else {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            categoryId: category.id,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            isAvailable: item.isAvailable,
          },
        });
      }
    }
  }
  console.log(`✅ Menu categories and dishes populated`);

  // 4. Seed Tables (Tables 1 through 10)
  for (let tableNumber = 1; tableNumber <= 10; tableNumber++) {
    const existingTable = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber,
        },
      },
    });

    const secretToken = existingTable ? existingTable.secretToken : `tbl-token-secret-${tableNumber}`;
    const tableId = existingTable ? existingTable.id : `tbl-uuid-${tableNumber.toString().padStart(2, '0')}`;
    const qrTargetUrl = `${CLIENT_URL}/table/${tableId}?token=${encodeURIComponent(secretToken)}`;
    const qrCodeUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    const areaId =
      tableNumber <= 4
        ? 'area-main-dining'
        : tableNumber <= 8
        ? 'area-terrace'
        : 'area-vip';
    const capacity = tableNumber >= 9 ? 6 : 4;

    await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber,
        },
      },
      update: {
        qrCodeUrl,
        areaId,
        capacity,
        status: TableStatus.AVAILABLE,
      },
      create: {
        id: tableId,
        restaurantId: restaurant.id,
        tableNumber,
        areaId,
        capacity,
        secretToken,
        qrCodeUrl,
        status: TableStatus.AVAILABLE,
      },
    });
  }
  console.log(`✅ Tables 1-10 created with unique secretTokens and QR code data URLs`);

  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

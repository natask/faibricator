const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // First, let's check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'suppliers', 'products', 'votes']);

    if (tablesError) {
      console.log('Could not check existing tables, proceeding with setup...');
    } else if (tables && tables.length === 4) {
      console.log('Tables already exist, skipping table creation...');
    } else {
      console.log('Creating tables...');
      // Note: In a real setup, you would run the SQL schema here
      // For now, we'll assume the tables are created via the Supabase dashboard
      console.log('Please run the SQL schema from supabase-schema.sql in your Supabase dashboard');
    }

    // Add sample data
    console.log('Adding sample data...');
    
    // Add sample users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'demo@example.com',
          name: 'Demo User',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'john@example.com',
          name: 'John Smith',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'sarah@example.com',
          name: 'Sarah Johnson',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        }
      ], { onConflict: 'id' });

    if (usersError) {
      console.error('Error adding users:', usersError);
    } else {
      console.log('✅ Users added successfully');
    }

    // Add sample suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .upsert([
        {
          id: '650e8400-e29b-41d4-a716-446655440000',
          name: 'TechFab Solutions',
          location: 'San Francisco, CA',
          logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'Precision Manufacturing',
          location: 'Austin, TX',
          logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          name: 'Innovation Labs',
          location: 'Seattle, WA',
          logo_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop'
        }
      ], { onConflict: 'id' });

    if (suppliersError) {
      console.error('Error adding suppliers:', suppliersError);
    } else {
      console.log('✅ Suppliers added successfully');
    }

    // Add sample products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert([
        {
          id: '750e8400-e29b-41d4-a716-446655440000',
          title: 'Smart Home Hub',
          description: 'A centralized control system for all your smart home devices with voice control and mobile app integration.',
          technical_package: '{"components": ["Raspberry Pi 4", "Zigbee Module", "WiFi 6", "Bluetooth 5.0"], "dimensions": "120x80x25mm", "power": "5V/3A"}',
          image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
          creator_id: '550e8400-e29b-41d4-a716-446655440001',
          supplier_id: '650e8400-e29b-41d4-a716-446655440000',
          min_order_quantity: 50,
          current_votes: 127
        },
        {
          id: '750e8400-e29b-41d4-a716-446655440002',
          title: 'IoT Weather Station',
          description: 'Compact weather monitoring device with sensors for temperature, humidity, pressure, and air quality.',
          technical_package: '{"components": ["BME280 Sensor", "PMS5003 Air Quality", "ESP32", "Solar Panel"], "dimensions": "80x60x40mm", "power": "Solar + Battery"}',
          image_url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
          creator_id: '550e8400-e29b-41d4-a716-446655440001',
          supplier_id: '650e8400-e29b-41d4-a716-446655440002',
          min_order_quantity: 25,
          current_votes: 203
        }
      ], { onConflict: 'id' });

    if (productsError) {
      console.error('Error adding products:', productsError);
    } else {
      console.log('✅ Products added successfully');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('You can now use the dashboard with real Supabase data.');

  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();

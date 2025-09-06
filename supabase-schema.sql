-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technical_package TEXT NOT NULL,
  image_url TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  min_order_quantity INTEGER NOT NULL DEFAULT 1,
  current_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_votes_product_id ON votes(product_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Create function to update current_votes when votes change
CREATE OR REPLACE FUNCTION update_product_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET current_votes = current_votes + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products 
    SET current_votes = current_votes - OLD.quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET current_votes = current_votes - OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_product_votes
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_product_votes();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access for suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access for votes" ON votes FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update votes
CREATE POLICY "Authenticated users can insert votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

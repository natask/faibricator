import { supabase } from '../lib/supabase';
import { Product, Vote, User, Supplier } from '../types';

export class ProductService {
  // Get all products with their related data
  static async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          creator:users(*),
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Vote for a product
  static async voteForProduct(productId: string, userId: string, quantity: number): Promise<void> {
    try {
      // First, try to update existing vote
      const { data: existingVote, error: fetchError } = await supabase
        .from('votes')
        .select('id, quantity')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingVote) {
        // Update existing vote
        const { error: updateError } = await supabase
          .from('votes')
          .update({ quantity })
          .eq('id', existingVote.id);

        if (updateError) throw updateError;
      } else {
        // Create new vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({
            product_id: productId,
            user_id: userId,
            quantity
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error voting for product:', error);
      throw error;
    }
  }

  // Get user's votes
  static async getUserVotes(userId: string): Promise<Vote[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user votes:', error);
      throw error;
    }
  }

  // Create a new product
  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'current_votes'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select(`
          *,
          creator:users(*),
          supplier:suppliers(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Get suppliers
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      return profile;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
}

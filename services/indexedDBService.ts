import { Product, User, Vote, SpeclyProject } from '../types';

const DB_NAME = 'FabricatorDB';
const DB_VERSION = 1;
const PRODUCTS_STORE = 'products';
const VOTES_STORE = 'votes';
const USERS_STORE = 'users';

export class IndexedDBService {
  private static db: IDBDatabase | null = null;

  // Initialize IndexedDB
  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create products store
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
          const productsStore = db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
          productsStore.createIndex('created_at', 'created_at', { unique: false });
          productsStore.createIndex('creator_id', 'creator_id', { unique: false });
        }

        // Create votes store
        if (!db.objectStoreNames.contains(VOTES_STORE)) {
          const votesStore = db.createObjectStore(VOTES_STORE, { keyPath: 'id' });
          votesStore.createIndex('product_id', 'product_id', { unique: false });
          votesStore.createIndex('user_id', 'user_id', { unique: false });
          votesStore.createIndex('product_user', ['product_id', 'user_id'], { unique: true });
        }

        // Create users store
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          db.createObjectStore(USERS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  // Ensure database is initialized
  private static async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Compress image to reduce storage size
  static async compressImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Convert base64 to File for compression
  static base64ToFile(base64: string, mimeType: string, filename: string): File {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  // Products CRUD operations
  static async saveProduct(product: Product): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getProducts(): Promise<Product[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);
    const index = store.index('created_at');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Sort by created_at descending
      const products: Product[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          products.push(cursor.value);
          cursor.continue();
        } else {
          resolve(products);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  static async getProduct(id: string): Promise<Product | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Vote operations
  static async voteForProduct(productId: string, userId: string, quantity: number): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      // First, check if vote already exists
      const voteTransaction = db.transaction([VOTES_STORE], 'readwrite');
      const votesStore = voteTransaction.objectStore(VOTES_STORE);
      const index = votesStore.index('product_user');
      const getRequest = index.get([productId, userId]);

      getRequest.onsuccess = () => {
        const existingVote = getRequest.result;
        
        if (existingVote) {
          // Update existing vote - calculate the difference
          const oldQuantity = existingVote.quantity;
          const difference = quantity - oldQuantity;
          
          existingVote.quantity = quantity;
          const updateRequest = votesStore.put(existingVote);
          updateRequest.onsuccess = () => {
            // Add the difference to the product counts (preserving mock data)
            this.addToProductCounts(productId, difference).then(resolve).catch(reject);
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // Create new vote - add the full quantity to product counts (preserving mock data)
          const newVote: Vote = {
            id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            product_id: productId,
            user_id: userId,
            quantity,
            created_at: new Date().toISOString()
          };
          
          const addRequest = votesStore.add(newVote);
          addRequest.onsuccess = () => {
            // Add the full quantity to the product counts (preserving mock data)
            this.addToProductCounts(productId, quantity).then(resolve).catch(reject);
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private static async addToProductCounts(productId: string, quantityToAdd: number): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      // Get the product
      const productTransaction = db.transaction([PRODUCTS_STORE], 'readwrite');
      const productsStore = productTransaction.objectStore(PRODUCTS_STORE);
      const getRequest = productsStore.get(productId);
      
      getRequest.onsuccess = () => {
        const product = getRequest.result;
        if (product) {
          const oldVotes = product.current_votes || 0;
          const oldUnits = product.products_ordered || 0;
          
          // Add the quantity to existing values (preserving mock data)
          product.current_votes = oldVotes + quantityToAdd;
          product.products_ordered = oldUnits + quantityToAdd;
          product.updated_at = new Date().toISOString();
          
          console.log(`Product ${productId}: Adding ${quantityToAdd} units`);
          console.log(`  Votes: ${oldVotes} → ${product.current_votes}`);
          console.log(`  Units: ${oldUnits} → ${product.products_ordered}`);
          
          const updateRequest = productsStore.put(product);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async getUserVotes(userId: string): Promise<Vote[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([VOTES_STORE], 'readonly');
    const store = transaction.objectStore(VOTES_STORE);
    const index = store.index('user_id');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(userId));
      const votes: Vote[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          votes.push(cursor.value);
          cursor.continue();
        } else {
          resolve(votes);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // User operations
  static async saveUser(user: User): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([USERS_STORE], 'readwrite');
    const store = transaction.objectStore(USERS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getUser(id: string): Promise<User | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([USERS_STORE], 'readonly');
    const store = transaction.objectStore(USERS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Create product from studio project
  static async createProductFromStudio(project: SpeclyProject, creatorId: string = 'user_studio'): Promise<Product> {
    const latestImage = project.history[0];
    const description = project.chatHistory.find(msg => msg.sender === 'ai')?.text || 'AI-generated product concept';
    
    // Compress the image for storage
    const compressedImage = await this.compressImage(
      this.base64ToFile(`data:${latestImage.mimeType};base64,${latestImage.base64}`, latestImage.mimeType, latestImage.name),
      800, 600, 0.8
    );

    const product: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: project.name,
      description: description,
      product_image: compressedImage,
      creator_id: creatorId,
      min_order_quantity: 50, // Default minimum order
      current_votes: 0,
      products_ordered: 0,
      created_at: new Date(project.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        id: creatorId,
        name: 'Studio User',
        email: 'studio@fabricator.com',
        created_at: new Date().toISOString()
      }
    };

    await this.saveProduct(product);
    return product;
  }

  // Clear all data from IndexedDB
  static async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    // Clear products
    const productsTransaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const productsStore = productsTransaction.objectStore(PRODUCTS_STORE);
    await new Promise((resolve, reject) => {
      const clearRequest = productsStore.clear();
      clearRequest.onsuccess = () => resolve(undefined);
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Clear votes
    const votesTransaction = db.transaction([VOTES_STORE], 'readwrite');
    const votesStore = votesTransaction.objectStore(VOTES_STORE);
    await new Promise((resolve, reject) => {
      const clearRequest = votesStore.clear();
      clearRequest.onsuccess = () => resolve(undefined);
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Clear users
    const usersTransaction = db.transaction([USERS_STORE], 'readwrite');
    const usersStore = usersTransaction.objectStore(USERS_STORE);
    await new Promise((resolve, reject) => {
      const clearRequest = usersStore.clear();
      clearRequest.onsuccess = () => resolve(undefined);
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Debug method to show mock data vs user additions
  static async debugDataState(): Promise<void> {
    const products = await this.getProducts();
    const votes = await this.getUserVotes('user_voter');
    
    console.log('=== DATA STATE DEBUG ===');
    console.log('Products:');
    products.forEach(product => {
      console.log(`  ${product.title}:`);
      console.log(`    Current votes: ${product.current_votes}`);
      console.log(`    Units ordered: ${product.products_ordered}`);
      console.log(`    Min order: ${product.min_order_quantity}`);
    });
    
    console.log('User votes:');
    votes.forEach(vote => {
      console.log(`  Product ${vote.product_id}: ${vote.quantity} units`);
    });
    console.log('========================');
  }

  // Initialize with mock data
  static async initializeWithMockData(): Promise<void> {
    // Clear existing data first
    await this.clearAllData();
    
    const mockProducts: Product[] = [
      {
        id: 'mock_1',
        title: 'Smart Home Hub',
        description: 'A centralized control system for all your smart home devices with voice control and mobile app integration.',
        product_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
        creator_id: 'user_1',
        min_order_quantity: 50,
        current_votes: 127,
        products_ordered: 45,
        created_at: '2025-08-10T00:00:00Z',
        updated_at: '2025-08-10T00:00:00Z',
        creator: {
          id: 'user_1',
          name: 'John Smith',
          email: 'john@example.com',
          created_at: '2025-08-01T00:00:00Z'
        }
      },
      {
        id: 'mock_2',
        title: 'IoT Weather Station',
        description: 'Compact weather monitoring device with sensors for temperature, humidity, pressure, and air quality.',
        product_image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&crop=center',
        creator_id: 'user_2',
        min_order_quantity: 25,
        current_votes: 203,
        products_ordered: 156,
        created_at: '2025-08-11T00:00:00Z',
        updated_at: '2025-08-11T00:00:00Z',
        creator: {
          id: 'user_2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          created_at: '2025-08-01T00:00:00Z'
        }
      },
      {
        id: 'mock_3',
        title: 'Portable Bluetooth Speaker',
        description: 'Waterproof portable speaker with 360-degree sound and 12-hour battery life.',
        product_image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop&crop=center',
        creator_id: 'user_3',
        min_order_quantity: 200,
        current_votes: 156,
        products_ordered: 89,
        created_at: '2025-08-31T00:00:00Z',
        updated_at: '2025-08-31T00:00:00Z',
        creator: {
          id: 'user_3',
          name: 'Mike Chen',
          email: 'mike@example.com',
          created_at: '2025-08-01T00:00:00Z'
        }
      },
      {
        id: 'mock_4',
        title: 'Smart Plant Monitor',
        description: 'Automated plant care device that monitors soil moisture, light levels, and nutrients.',
        product_image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center',
        creator_id: 'user_1',
        min_order_quantity: 30,
        current_votes: 94,
        products_ordered: 34,
        created_at: '2025-08-23T00:00:00Z',
        updated_at: '2025-08-23T00:00:00Z',
        creator: {
          id: 'user_1',
          name: 'John Smith',
          email: 'john@example.com',
          created_at: '2025-08-01T00:00:00Z'
        }
      },
      {
        id: 'mock_5',
        title: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with color temperature control and USB charging port.',
        product_image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
        creator_id: 'user_2',
        min_order_quantity: 100,
        current_votes: 78,
        products_ordered: 23,
        created_at: '2025-08-11T00:00:00Z',
        updated_at: '2025-08-11T00:00:00Z',
        creator: {
          id: 'user_2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          created_at: '2025-08-01T00:00:00Z'
        }
      }
    ];

    // Save mock products to IndexedDB
    for (const product of mockProducts) {
      await this.saveProduct(product);
    }

    // Save mock users
    const mockUsers: User[] = [
      {
        id: 'user_1',
        name: 'John Smith',
        email: 'john@example.com',
        created_at: '2025-08-01T00:00:00Z'
      },
      {
        id: 'user_2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        created_at: '2025-08-01T00:00:00Z'
      },
      {
        id: 'user_3',
        name: 'Mike Chen',
        email: 'mike@example.com',
        created_at: '2025-08-01T00:00:00Z'
      }
    ];

    for (const user of mockUsers) {
      await this.saveUser(user);
    }
  }
}

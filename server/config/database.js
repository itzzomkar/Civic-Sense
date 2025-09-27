const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.fallbackMode = false;
    this.dataPath = path.join(__dirname, '../data');
  }

  async connect() {
    // Try MongoDB connection first
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians';
    
    try {
      await mongoose.connect(mongoUri);
      
      this.isConnected = true;
      this.fallbackMode = false;
      console.log('✅ Connected to MongoDB successfully');
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });
      
      return true;
    } catch (error) {
      console.log('⚠️ MongoDB connection failed, switching to local JSON storage');
      console.log('Error:', error.message);
      this.fallbackMode = true;
      await this.initializeLocalStorage();
      return false;
    }
  }

  async initializeLocalStorage() {
    // Create data directory if it doesn't exist
    try {
      await fs.access(this.dataPath);
    } catch {
      await fs.mkdir(this.dataPath, { recursive: true });
    }

    // Initialize JSON files if they don't exist
    const files = ['users.json', 'reports.json', 'comments.json', 'analytics.json'];
    
    for (const file of files) {
      const filePath = path.join(this.dataPath, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, '[]', 'utf8');
        console.log(`Created local storage file: ${file}`);
      }
    }
    
    console.log('✅ Local JSON storage initialized');
  }

  async disconnect() {
    if (!this.fallbackMode && this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // Local storage CRUD operations (fallback)
  async readLocalData(collection) {
    const filePath = path.join(this.dataPath, `${collection}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  async writeLocalData(collection, data) {
    const filePath = path.join(this.dataPath, `${collection}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error);
      return false;
    }
  }

  async findLocal(collection, query = {}) {
    const data = await this.readLocalData(collection);
    
    if (Object.keys(query).length === 0) {
      return data;
    }
    
    return data.filter(item => {
      return Object.keys(query).every(key => {
        if (query[key].$in) {
          return query[key].$in.includes(item[key]);
        }
        return item[key] === query[key];
      });
    });
  }

  async findOneLocal(collection, query) {
    const data = await this.readLocalData(collection);
    return data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async createLocal(collection, document) {
    const data = await this.readLocalData(collection);
    const newDoc = {
      ...document,
      _id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    await this.writeLocalData(collection, data);
    return newDoc;
  }

  async updateLocal(collection, query, update) {
    const data = await this.readLocalData(collection);
    let updated = false;
    
    const updatedData = data.map(item => {
      const match = Object.keys(query).every(key => item[key] === query[key]);
      if (match) {
        updated = true;
        return {
          ...item,
          ...update,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    if (updated) {
      await this.writeLocalData(collection, updatedData);
    }
    
    return updated;
  }

  async deleteLocal(collection, query) {
    const data = await this.readLocalData(collection);
    const filteredData = data.filter(item => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });
    
    const deleted = data.length !== filteredData.length;
    if (deleted) {
      await this.writeLocalData(collection, filteredData);
    }
    
    return deleted;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export data functionality
  async exportData(format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(this.dataPath, 'exports');
    
    try {
      await fs.mkdir(exportDir, { recursive: true });
    } catch (error) {
      console.error('Error creating export directory:', error);
    }

    if (format === 'json') {
      return await this.exportToJSON(exportDir, timestamp);
    } else if (format === 'csv') {
      return await this.exportToCSV(exportDir, timestamp);
    }
  }

  async exportToJSON(exportDir, timestamp) {
    const collections = ['users', 'reports', 'comments'];
    const exportData = {};
    
    for (const collection of collections) {
      if (this.fallbackMode) {
        exportData[collection] = await this.readLocalData(collection);
      } else {
        const Model = mongoose.model(collection.slice(0, -1).charAt(0).toUpperCase() + collection.slice(1, -1));
        exportData[collection] = await Model.find({}).lean();
      }
    }
    
    const fileName = `urban_guardians_export_${timestamp}.json`;
    const filePath = path.join(exportDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    
    return { success: true, path: filePath, fileName };
  }

  async exportToCSV(exportDir, timestamp) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const files = [];
    
    // Export Reports to CSV
    const reports = this.fallbackMode 
      ? await this.readLocalData('reports')
      : await mongoose.model('Report').find({}).lean();
    
    if (reports.length > 0) {
      const csvWriter = createCsvWriter({
        path: path.join(exportDir, `reports_${timestamp}.csv`),
        header: [
          { id: '_id', title: 'ID' },
          { id: 'title', title: 'Title' },
          { id: 'description', title: 'Description' },
          { id: 'category', title: 'Category' },
          { id: 'status', title: 'Status' },
          { id: 'priority', title: 'Priority' },
          { id: 'location.address', title: 'Location' },
          { id: 'createdAt', title: 'Created Date' },
          { id: 'updatedAt', title: 'Updated Date' }
        ]
      });
      
      await csvWriter.writeRecords(reports);
      files.push(`reports_${timestamp}.csv`);
    }
    
    return { success: true, files };
  }
}

module.exports = new DatabaseService();
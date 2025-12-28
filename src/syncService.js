const API_KEY = '$2a$10$.2T4W.JpA.xDFe9KZtZ46OA.II8y0pJVvNkRiBkNf031kezCRliLm';
const BIN_ID = 'pos_shop_data'; // You can change this to any unique name

class SyncService {
  constructor() {
    this.binId = null;
    this.syncInterval = null;
  }

  async createOrGetBin() {
    try {
      // Try to get existing bin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.binId = BIN_ID;
        return data.record;
      }
    } catch (error) {
      console.log('Bin not found, creating new one...');
    }

    // Create new bin
    const initialData = {
      categories: [],
      products: [],
      sales: [],
      engineerCredits: [],
      customers: [],
      creditSales: [],
      lastUpdated: new Date().toISOString()
    };

    try {
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
          'X-Bin-Name': BIN_ID
        },
        body: JSON.stringify(initialData)
      });

      const data = await response.json();
      this.binId = data.metadata.id;
      return initialData;
    } catch (error) {
      console.error('Error creating bin:', error);
      return null;
    }
  }

  async uploadData(data) {
    if (!this.binId) await this.createOrGetBin();

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({
          ...data,
          lastUpdated: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Upload failed:', error);
      return false;
    }
  }

  async downloadData() {
    if (!this.binId) await this.createOrGetBin();

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.record;
      }
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    }
  }

  startAutoSync(callback, intervalMs = 10000) {
    this.stopAutoSync();
    this.syncInterval = setInterval(async () => {
      const data = await this.downloadData();
      if (data && callback) {
        callback(data);
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default new SyncService();

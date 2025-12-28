import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, TrendingUp, History, Users, Settings, Lock, Plus, X, Calendar, DollarSign, Award, Search, CreditCard } from 'lucide-react';
import syncService from './syncService';

const OfflineShopPOS = () => {
  // State Management
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('1234'); // Default PIN
  const [pinError, setPinError] = useState('');
  const [activeSection, setActiveSection] = useState('sales');
  const [darkMode, setDarkMode] = useState(false);
const [syncEnabled, setSyncEnabled] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    stock: 0,
    costPrice: 0,
    sellingPrice: 0
  });
  const [reportType, setReportType] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [reportDate, setReportDate] = useState(new Date());
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [engineerCredits, setEngineerCredits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [creditSales, setCreditSales] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCreditSaleModal, setShowCreditSaleModal] = useState(false);
  const [creditForm, setCreditForm] = useState({
    engineerName: '',
    items: [],
    totalAmount: 0,
    notes: ''
  });
  const [customerName, setCustomerName] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPin = localStorage.getItem('pos_pin');
    const savedCategories = localStorage.getItem('pos_categories');
    const savedProducts = localStorage.getItem('pos_products');
    const savedSales = localStorage.getItem('pos_sales');
    const savedTheme = localStorage.getItem('pos_theme');
    const savedCredits = localStorage.getItem('pos_credits');
    const savedCustomers = localStorage.getItem('pos_customers');
    const savedCreditSales = localStorage.getItem('pos_credit_sales');

    if (savedPin) setStoredPin(savedPin);
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedTheme) setDarkMode(savedTheme === 'dark');
const savedSync = localStorage.getItem('pos_sync_enabled');
    const savedViewOnly = localStorage.getItem('pos_view_only');
    
    if (savedSync === 'true') {
      setSyncEnabled(true);
      toggleSync(true);
    }
    
    if (savedViewOnly === 'true') {
      setIsViewOnly(true);
    }
    if (savedCredits) setEngineerCredits(JSON.parse(savedCredits));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedCreditSales) setCreditSales(JSON.parse(savedCreditSales));

    // Demo data if empty
    if (!savedCategories) {
      const demoCategories = [
        { id: 1, name: 'Screens' },
        { id: 2, name: 'Chargers' },
        { id: 3, name: 'Accessories' }
      ];
      setCategories(demoCategories);
      localStorage.setItem('pos_categories', JSON.stringify(demoCategories));
    }

    if (!savedProducts) {
      const demoProducts = [
        { id: 1, categoryId: 1, name: 'iPhone 7 Screen', stock: 10, costPrice: 5000, sellingPrice: 8500 },
        { id: 2, categoryId: 1, name: 'iPhone X Screen', stock: 8, costPrice: 12000, sellingPrice: 18000 },
        { id: 3, categoryId: 2, name: 'Type-C Charger', stock: 25, costPrice: 500, sellingPrice: 1000 },
        { id: 4, categoryId: 3, name: 'Phone Case', stock: 15, costPrice: 300, sellingPrice: 800 }
      ];
      setProducts(demoProducts);
      localStorage.setItem('pos_products', JSON.stringify(demoProducts));
    }
  }, []);

  // PIN Check
  const checkPin = () => {
    if (pin === storedPin) {
      setIsLocked(false);
      setPinError('');
      setPin('');
    } else {
      setPinError('Incorrect PIN');
      setPin('');
    }
  };

  // Save data to localStorage
  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Add to Cart
  const addToCart = (product, price) => {
    const newCartItem = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      costPrice: product.costPrice,
      sellingPrice: price,
      profit: price - product.costPrice,
      timestamp: new Date().toISOString()
    };
    setCart([...cart, newCartItem]);
    setShowPriceModal(false);
    setSelectedProduct(null);
    setCustomPrice('');
  };

  // Remove from Cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Complete Sale
  const completeSale = (isCredit = false) => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    // Ask for customer name
    const buyerName = prompt(isCredit ? 'Enter customer name for credit sale:' : 'Enter customer name (optional):');
    
    if (isCredit && !buyerName) {
      alert('Customer name is required for credit sales');
      return;
    }

    // Calculate totals
    const totalAmount = cart.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);

    if (isCredit) {
      // Create credit sale record
      const creditSale = {
        id: Date.now(),
        customerName: buyerName,
        items: cart,
        totalAmount,
        totalProfit,
        itemCount: cart.length,
        amountPaid: 0,
        balance: totalAmount,
        isPaid: false,
        dateIssued: new Date().toISOString(),
        datePaid: null,
        payments: []
      };

      // Update products stock
      const updatedProducts = products.map(product => {
        const soldItems = cart.filter(item => item.productId === product.id);
        if (soldItems.length > 0) {
          return {
            ...product,
            stock: product.stock - soldItems.length
          };
        }
        return product;
      });

      const newCreditSales = [...creditSales, creditSale];
      setCreditSales(newCreditSales);
      setProducts(updatedProducts);
      saveData('pos_credit_sales', newCreditSales);
      saveData('pos_products', updatedProducts);
      
      setCart([]);
      alert(`Credit sale created! Balance: ₦${totalAmount.toLocaleString()}`);
    } else {
      // Regular cash sale
      const sale = {
        id: Date.now(),
        items: cart,
        totalAmount,
        totalProfit,
        itemCount: cart.length,
        date: new Date().toISOString(),
        customerName: buyerName || 'Walk-in Customer',
        locked: true
      };

      const updatedProducts = products.map(product => {
        const soldItems = cart.filter(item => item.productId === product.id);
        if (soldItems.length > 0) {
          return {
            ...product,
            stock: product.stock - soldItems.length
          };
        }
        return product;
      });

      if (buyerName) {
        const existingCustomer = customers.find(c => c.name.toLowerCase() === buyerName.toLowerCase());
        let updatedCustomers;
        
        if (existingCustomer) {
          updatedCustomers = customers.map(c =>
            c.name.toLowerCase() === buyerName.toLowerCase()
              ? {
                  ...c,
                  totalPurchases: c.totalPurchases + totalAmount,
                  purchaseCount: c.purchaseCount + 1,
                  lastPurchase: new Date().toISOString()
                }
              : c
          );
        } else {
          const newCustomer = {
            id: Date.now(),
            name: buyerName,
            totalPurchases: totalAmount,
            purchaseCount: 1,
            firstPurchase: new Date().toISOString(),
            lastPurchase: new Date().toISOString()
          };
          updatedCustomers = [...customers, newCustomer];
        }
        
        setCustomers(updatedCustomers);
        saveData('pos_customers', updatedCustomers);
      }

      const newSales = [...sales, sale];
      setSales(newSales);
      setProducts(updatedProducts);
      saveData('pos_sales', newSales);
      saveData('pos_products', updatedProducts);

      setCart([]);
      alert(`Sale completed! Total: ₦${totalAmount.toLocaleString()}, Profit: ₦${totalProfit.toLocaleString()}`);
    }
  };

  // Open price modal
  const openPriceModal = (product) => {
    setSelectedProduct(product);
    setCustomPrice(product.sellingPrice.toString());
    setShowPriceModal(true);
  };

  // Category Management
  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryName(category ? category.name : '');
    setShowCategoryModal(true);
  };

  const saveCategory = () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    let updatedCategories;
    if (editingCategory) {
      // Edit existing
      updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id ? { ...cat, name: categoryName } : cat
      );
    } else {
      // Add new
      const newCategory = {
        id: Date.now(),
        name: categoryName
      };
      updatedCategories = [...categories, newCategory];
    }

    setCategories(updatedCategories);
    saveData('pos_categories', updatedCategories);
    setShowCategoryModal(false);
    setCategoryName('');
    setEditingCategory(null);
  };

  const deleteCategory = (categoryId) => {
    if (!confirm('Delete this category? Products in it will remain but need reassignment.')) return;
    
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    saveData('pos_categories', updatedCategories);
  };

  // Product Management
  const openProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setProductForm({
        name: product.name,
        categoryId: product.categoryId,
        stock: product.stock,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice
      });
    } else {
      setProductForm({
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        stock: 0,
        costPrice: 0,
        sellingPrice: 0
      });
    }
    setShowProductModal(true);
  };

  const saveProduct = () => {
    if (!productForm.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (!productForm.categoryId) {
      alert('Please select a category');
      return;
    }
    if (productForm.costPrice < 0 || productForm.sellingPrice < 0) {
      alert('Prices cannot be negative');
      return;
    }

    let updatedProducts;
    if (editingProduct) {
      // Edit existing
      updatedProducts = products.map(prod =>
        prod.id === editingProduct.id ? { ...prod, ...productForm } : prod
      );
    } else {
      // Add new
      const newProduct = {
        id: Date.now(),
        ...productForm,
        categoryId: parseInt(productForm.categoryId),
        stock: parseInt(productForm.stock),
        costPrice: parseFloat(productForm.costPrice),
        sellingPrice: parseFloat(productForm.sellingPrice)
      };
      updatedProducts = [...products, newProduct];
    }

    setProducts(updatedProducts);
    saveData('pos_products', updatedProducts);
    setShowProductModal(false);
    setProductForm({ name: '', categoryId: '', stock: 0, costPrice: 0, sellingPrice: 0 });
    setEditingProduct(null);
  };

  const deleteProduct = (productId) => {
    if (!confirm('Delete this product?')) return;
    
    const updatedProducts = products.filter(prod => prod.id !== productId);
    setProducts(updatedProducts);
    saveData('pos_products', updatedProducts);
  };

  const updateStock = (productId, newStock) => {
    const updatedProducts = products.map(prod =>
      prod.id === productId ? { ...prod, stock: parseInt(newStock) } : prod
    );
    setProducts(updatedProducts);
    saveData('pos_products', updatedProducts);
  };

  // Engineer Credit Management
  const addEngineerCredit = (engineerName, selectedItems, notes) => {
    if (!engineerName.trim()) {
      alert('Please enter engineer name');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

    const newCredit = {
      id: Date.now(),
      engineerName,
      items: selectedItems,
      totalAmount,
      notes,
      isPaid: false,
      dateIssued: new Date().toISOString(),
      datePaid: null
    };

    // Update product stock
    const updatedProducts = products.map(product => {
      const creditedItems = selectedItems.filter(item => item.productId === product.id);
      if (creditedItems.length > 0) {
        return {
          ...product,
          stock: product.stock - creditedItems.length
        };
      }
      return product;
    });

    const newCredits = [...engineerCredits, newCredit];
    setEngineerCredits(newCredits);
    setProducts(updatedProducts);
    saveData('pos_credits', newCredits);
    saveData('pos_products', updatedProducts);
    setShowCreditModal(false);
  };

  const markCreditAsPaid = (creditId) => {
    const credit = engineerCredits.find(c => c.id === creditId);
    if (!credit) return;

    // Add to sales when marked as paid
    const sale = {
      id: Date.now(),
      items: credit.items.map(item => ({
        id: Date.now() + Math.random(),
        productId: item.productId,
        productName: item.productName,
        costPrice: item.costPrice,
        sellingPrice: item.price,
        profit: item.price - item.costPrice,
        timestamp: new Date().toISOString()
      })),
      totalAmount: credit.totalAmount,
      totalProfit: credit.items.reduce((sum, item) => sum + (item.price - item.costPrice), 0),
      itemCount: credit.items.length,
      date: new Date().toISOString(),
      customerName: credit.engineerName + ' (Engineer)',
      locked: true
    };

    const updatedCredits = engineerCredits.map(c =>
      c.id === creditId ? { ...c, isPaid: true, datePaid: new Date().toISOString() } : c
    );

    const newSales = [...sales, sale];
    setEngineerCredits(updatedCredits);
    setSales(newSales);
    saveData('pos_credits', updatedCredits);
    saveData('pos_sales', newSales);
  };

  const deleteCredit = (creditId) => {
    if (!confirm('Delete this credit record?')) return;
    
    const updatedCredits = engineerCredits.filter(c => c.id !== creditId);
    setEngineerCredits(updatedCredits);
    saveData('pos_credits', updatedCredits);
  };

  // Credit Payment Tracking
  const addPaymentToCreditSale = (creditSaleId, paymentAmount) => {
    const payment = parseFloat(paymentAmount);
    if (!payment || payment <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const updatedCreditSales = creditSales.map(cs => {
      if (cs.id === creditSaleId) {
        const newAmountPaid = cs.amountPaid + payment;
        const newBalance = cs.totalAmount - newAmountPaid;
        const isPaid = newBalance <= 0;

        const updatedSale = {
          ...cs,
          amountPaid: newAmountPaid,
          balance: newBalance,
          isPaid,
          datePaid: isPaid ? new Date().toISOString() : cs.datePaid,
          payments: [...cs.payments, {
            amount: payment,
            date: new Date().toISOString(),
            id: Date.now()
          }]
        };

        // If fully paid, add to regular sales
        if (isPaid && !cs.isPaid) {
          const sale = {
            id: Date.now(),
            items: cs.items,
            totalAmount: cs.totalAmount,
            totalProfit: cs.totalProfit,
            itemCount: cs.itemCount,
            date: new Date().toISOString(),
            customerName: cs.customerName + ' (Credit Paid)',
            locked: true
          };

          const newSales = [...sales, sale];
          setSales(newSales);
          saveData('pos_sales', newSales);

          // Update customer tracking
          const existingCustomer = customers.find(c => c.name.toLowerCase() === cs.customerName.toLowerCase());
          let updatedCustomers;
          
          if (existingCustomer) {
            updatedCustomers = customers.map(c =>
              c.name.toLowerCase() === cs.customerName.toLowerCase()
                ? {
                    ...c,
                    totalPurchases: c.totalPurchases + cs.totalAmount,
                    purchaseCount: c.purchaseCount + 1,
                    lastPurchase: new Date().toISOString()
                  }
                : c
            );
          } else {
            const newCustomer = {
              id: Date.now(),
              name: cs.customerName,
              totalPurchases: cs.totalAmount,
              purchaseCount: 1,
              firstPurchase: new Date().toISOString(),
              lastPurchase: new Date().toISOString()
            };
            updatedCustomers = [...customers, newCustomer];
          }
          
          setCustomers(updatedCustomers);
          saveData('pos_customers', updatedCustomers);
        }

        return updatedSale;
      }
      return cs;
    });

    setCreditSales(updatedCreditSales);
    saveData('pos_credit_sales', updatedCreditSales);
    alert(`Payment of ₦${payment.toLocaleString()} recorded successfully!`);
  };

  const deleteCreditSale = (creditSaleId) => {
    if (!confirm('Delete this credit sale?')) return;
    
    const updatedCreditSales = creditSales.filter(cs => cs.id !== creditSaleId);
    setCreditSales(updatedCreditSales);
    saveData('pos_credit_sales', updatedCreditSales);
  };

  // Settings Functions
  const changePin = () => {
    const oldPin = prompt('Enter current PIN:');
    if (oldPin !== storedPin) {
      alert('Incorrect PIN');
      return;
    }
    
    const newPin = prompt('Enter new 4-digit PIN:');
    if (!newPin || newPin.length !== 4 || isNaN(newPin)) {
      alert('PIN must be 4 digits');
      return;
    }
    
    const confirmPin = prompt('Confirm new PIN:');
    if (newPin !== confirmPin) {
      alert('PINs do not match');
      return;
    }
    
    setStoredPin(newPin);
    localStorage.setItem('pos_pin', newPin);
    alert('PIN changed successfully!');
  };

  const exportData = () => {
    const data = {
      categories,
      products,
      sales,
      engineerCredits,
      customers,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Data exported successfully!');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          if (!confirm('This will overwrite all current data. Continue?')) return;
          
          if (data.categories) {
            setCategories(data.categories);
            saveData('pos_categories', data.categories);
          }
          if (data.products) {
            setProducts(data.products);
            saveData('pos_products', data.products);
          }
          if (data.sales) {
            setSales(data.sales);
            saveData('pos_sales', data.sales);
          }
          if (data.engineerCredits) {
            setEngineerCredits(data.engineerCredits);
            saveData('pos_credits', data.engineerCredits);
          }
          if (data.customers) {
            setCustomers(data.customers);
            saveData('pos_customers', data.customers);
          }
          
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetDaily = () => {
    if (!confirm('Reset daily sales data? This will clear today\'s sales from reports but keep history.')) return;
    alert('Daily data reset (sales history preserved)');
  };

  const clearAllData = () => {
    const confirmation = prompt('Type "DELETE ALL" to clear all data:');
    if (confirmation !== 'DELETE ALL') return;
    
    if (!confirm('This will permanently delete ALL data. Are you absolutely sure?')) return;
    
    setCategories([]);
    setProducts([]);
    setSales([]);
    setEngineerCredits([]);
    setCustomers([]);
    
    localStorage.removeItem('pos_categories');
    localStorage.removeItem('pos_products');
    localStorage.removeItem('pos_sales');
    localStorage.removeItem('pos_credits');
    localStorage.removeItem('pos_customers');
    
    alert('All data cleared!');
  };
// Sync Functions
  const toggleSync = async (enable) => {
    setSyncEnabled(enable);
    localStorage.setItem('pos_sync_enabled', enable);

    if (enable) {
      // Upload current data
      await uploadToCloud();
      
      // Start auto-sync every 10 seconds
      syncService.startAutoSync((cloudData) => {
        if (!isViewOnly) return; // Only auto-download in view-only mode
        
        setCategories(cloudData.categories || []);
        setProducts(cloudData.products || []);
        setSales(cloudData.sales || []);
        setEngineerCredits(cloudData.engineerCredits || []);
        setCustomers(cloudData.customers || []);
        setCreditSales(cloudData.creditSales || []);
        setLastSyncTime(new Date().toISOString());
      });
    } else {
      syncService.stopAutoSync();
    }
  };

  const uploadToCloud = async () => {
    const data = {
      categories,
      products,
      sales,
      engineerCredits,
      customers,
      creditSales
    };

    const success = await syncService.uploadData(data);
    if (success) {
      setLastSyncTime(new Date().toISOString());
      alert('Data synced to cloud!');
    } else {
      alert('Sync failed. Check internet connection.');
    }
  };

  const downloadFromCloud = async () => {
    const data = await syncService.downloadData();
    if (data) {
      setCategories(data.categories || []);
      setProducts(data.products || []);
      setSales(data.sales || []);
      setEngineerCredits(data.engineerCredits || []);
      setCustomers(data.customers || []);
      setCreditSales(data.creditSales || []);
      
      // Save to localStorage
      saveData('pos_categories', data.categories);
      saveData('pos_products', data.products);
      saveData('pos_sales', data.sales);
      saveData('pos_credits', data.engineerCredits);
      saveData('pos_customers', data.customers);
      saveData('pos_credit_sales', data.creditSales);
      
      setLastSyncTime(new Date().toISOString());
      alert('Data downloaded from cloud!');
    } else {
      alert('Download failed. Check internet connection.');
    }
  };

  const enableViewOnlyMode = () => {
    const viewPin = prompt('Enter View-Only PIN (default: 0000):');
    if (viewPin === '0000') {
      setIsViewOnly(true);
      localStorage.setItem('pos_view_only', 'true');
      alert('View-Only Mode Enabled! You can only view data, not edit.');
      
      // Auto-enable sync in view-only mode
      toggleSync(true);
    } else {
      alert('Incorrect PIN');
    }
  };

  const disableViewOnlyMode = () => {
    setIsViewOnly(false);
    localStorage.removeItem('pos_view_only');
    alert('View-Only Mode Disabled!');
  };

  // Navigation
  const showSection = (section) => {
    setActiveSection(section);
  };

  // PIN Lock Screen
  if (isLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-center mb-4">
            <Lock className={`w-12 h-12 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Enter PIN
          </h2>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && checkPin()}
            maxLength="4"
            placeholder="4-digit PIN"
            className={`w-full px-4 py-2 border rounded mb-2 text-center text-xl tracking-widest ${
              darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
          />
          {pinError && <p className="text-red-500 text-sm mb-2">{pinError}</p>}
          <p className="text-xs text-gray-500 mb-4">Default PIN: 1234</p>
          <button
            onClick={checkPin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="font-bold text-xl">Offline Shop POS</div>
            <div className="flex space-x-2">
              <NavButton icon={ShoppingCart} label="Sales" active={activeSection === 'sales'} onClick={() => showSection('sales')} darkMode={darkMode} />
              <NavButton icon={Package} label="Inventory" active={activeSection === 'inventory'} onClick={() => showSection('inventory')} darkMode={darkMode} />
              <NavButton icon={TrendingUp} label="Reports" active={activeSection === 'reports'} onClick={() => showSection('reports')} darkMode={darkMode} />
              <NavButton icon={History} label="History" active={activeSection === 'history'} onClick={() => showSection('history')} darkMode={darkMode} />
              <NavButton icon={CreditCard} label="Credit" active={activeSection === 'credit'} onClick={() => showSection('credit')} darkMode={darkMode} />
              <NavButton icon={Users} label="Customers" active={activeSection === 'customers'} onClick={() => showSection('customers')} darkMode={darkMode} />
              <NavButton icon={Settings} label="Settings" active={activeSection === 'settings'} onClick={() => showSection('settings')} darkMode={darkMode} />
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {activeSection === 'sales' && (
          <SalesSection
            categories={categories}
            products={products}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            cart={cart}
            openPriceModal={openPriceModal}
            removeFromCart={removeFromCart}
            completeSale={completeSale}
            darkMode={darkMode}
          />
        )}
        {activeSection === 'inventory' && (
          <InventorySection
            categories={categories}
            products={products}
            openCategoryModal={openCategoryModal}
            openProductModal={openProductModal}
            deleteCategory={deleteCategory}
            deleteProduct={deleteProduct}
            updateStock={updateStock}
            darkMode={darkMode}
          />
        )}
        {activeSection === 'reports' && (
          <ReportsSection 
            sales={sales} 
            products={products} 
            reportType={reportType}
            setReportType={setReportType}
            reportDate={reportDate}
            setReportDate={setReportDate}
            darkMode={darkMode} 
          />
        )}
        {activeSection === 'history' && (
          <HistorySection 
            sales={sales}
            historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter}
            historyStartDate={historyStartDate}
            setHistoryStartDate={setHistoryStartDate}
            historyEndDate={historyEndDate}
            setHistoryEndDate={setHistoryEndDate}
            selectedSale={selectedSale}
            setSelectedSale={setSelectedSale}
            darkMode={darkMode} 
          />
        )}
        {activeSection === 'customers' && <CustomersSection sales={sales} darkMode={darkMode} />}
{activeSection === 'credit' && (
          <CreditPaymentSection
            creditSales={creditSales}
            addPaymentToCreditSale={addPaymentToCreditSale}
            deleteCreditSale={deleteCreditSale}
            darkMode={darkMode}
          />
        )}
{activeSection === 'settings' && (
          <SettingsSection
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setIsLocked={setIsLocked}
            changePin={changePin}
            exportData={exportData}
            importData={importData}
            resetDaily={resetDaily}
            clearAllData={clearAllData}
syncEnabled={syncEnabled}
  toggleSync={toggleSync}
  uploadToCloud={uploadToCloud}
  downloadFromCloud={downloadFromCloud}
  isViewOnly={isViewOnly}
  enableViewOnlyMode={enableViewOnlyMode}
  disableViewOnlyMode={disableViewOnlyMode}
  lastSyncTime={lastSyncTime}
          />
        )}
      </div>

      {/* Price Modal */}
      {showPriceModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Set Selling Price</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
<div className="mb-4">
              <p className="text-sm text-gray-500">Product: {selectedProduct.name}</p>
              <p className="text-sm text-gray-500">Default Price: ₦{selectedProduct.sellingPrice.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Cost Price: ₦{selectedProduct.costPrice.toLocaleString()}</p>
            </div>
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Enter selling price"
              className={`w-full px-4 py-3 border rounded mb-4 text-lg ${
                darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
              }`}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const price = parseFloat(customPrice);
                  if (price && price >= selectedProduct.costPrice) {
                    addToCart(selectedProduct, price);
                  } else {
                    alert('Price must be at least ₦' + selectedProduct.costPrice);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingCategory ? 'Edit' : 'Add'} Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className={`w-full px-4 py-3 border rounded mb-4 ${
                darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
              }`}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Product name"
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              />
              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                placeholder="Stock quantity"
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              />
              <input
                type="number"
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                placeholder="Cost price (₦)"
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              />
              <input
                type="number"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                placeholder="Selling price (₦)"
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Button Component
const NavButton = ({ icon: Icon, label, active, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-1 px-3 py-2 rounded transition ${
      active
        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm hidden md:inline">{label}</span>
  </button>
);

// Sales Section
const SalesSection = ({ categories, products, selectedCategory, setSelectedCategory, cart, openPriceModal, removeFromCart, completeSale, darkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products by search or category
  const getFilteredProducts = () => {
    let filtered = products.filter(p => p.stock > 0);
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const cartTotal = cart.reduce((sum, item) => sum + item.sellingPrice, 0);
  const cartProfit = cart.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">New Sale</h2>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setSelectedCategory(null); // Clear category when searching
              }
            }}
            placeholder="Search products by name..."
            className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-white' : 'text-gray-800'}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-3`}>
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map(cat => {
              const categoryProductCount = products.filter(p => p.categoryId === cat.id && p.stock > 0).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery(''); // Clear search when selecting category
                  }}
                  className={`w-full text-left px-4 py-3 rounded transition ${
                    selectedCategory === cat.id && !searchQuery
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-75">({categoryProductCount})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-5`}>
          <h3 className="font-semibold mb-3">
            {searchQuery ? `Search Results (${filteredProducts.length})` : 
             selectedCategory ? 'Select Product' : 'Select a category or search'}
          </h3>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openPriceModal(product)}
                className={`p-4 rounded border text-left ${
                  darkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-500'
                } transition`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500 mt-1">Stock: {product.stock}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">₦{product.sellingPrice.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Cost: ₦{product.costPrice.toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                {searchQuery ? 'No products found matching your search' : 
                 selectedCategory ? 'No products in stock' : 'Select a category to view products'}
              </p>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-4`}>
          <h3 className="font-semibold mb-3">Cart ({cart.length} items)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {cart.map(item => (
              <div key={item.id} className={`p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.productName}</div>
                    <div className="text-xs text-gray-500">Profit: ₦{item.profit.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">₦{item.sellingPrice.toLocaleString()}</div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            )}
          </div>

          {cart.length > 0 && (
            <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">₦{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm text-gray-500">Profit:</span>
                <span className="text-sm font-semibold text-green-600">₦{cartProfit.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => completeSale(false)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold active:bg-green-800"
                >
                  💵 Cash Sale
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    completeSale(true);
                  }}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-bold active:bg-orange-800"
                >
                  💳 Credit Sale
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inventory Section
const InventorySection = ({ categories, products, openCategoryModal, openProductModal, deleteCategory, deleteProduct, updateStock, darkMode }) => {
  const [viewMode, setViewMode] = useState('products'); // 'products' or 'categories'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Inventory Management</h2>
      
      {/* Search Bar for Products */}
      {viewMode === 'products' && (
        <div className="mb-4">
          <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-white' : 'text-gray-800'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-3 mb-6">
        <button
          onClick={() => openCategoryModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </button>
        <button
          onClick={() => openProductModal()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </button>
        <div className="flex-1"></div>
        <button
          onClick={() => setViewMode('products')}
          className={`px-4 py-2 rounded ${viewMode === 'products' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Products
        </button>
        <button
          onClick={() => setViewMode('categories')}
          className={`px-4 py-2 rounded ${viewMode === 'categories' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Categories
        </button>
      </div>

      {viewMode === 'products' ? (
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow overflow-x-auto`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="text-left py-3">Product</th>
                <th className="text-left py-3">Category</th>
                <th className="text-right py-3">Stock</th>
                <th className="text-right py-3">Cost</th>
                <th className="text-right py-3">Price</th>
                <th className="text-right py-3">Margin</th>
                <th className="text-center py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const margin = product.sellingPrice - product.costPrice;
                const marginPercent = ((margin / product.costPrice) * 100).toFixed(1);
                
                return (
                  <tr key={product.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3">{category?.name || 'N/A'}</td>
                    <td className="text-right py-3">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => updateStock(product.id, e.target.value)}
                        className={`w-20 px-2 py-1 border rounded text-center ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="text-right py-3">₦{product.costPrice.toLocaleString()}</td>
                    <td className="text-right py-3 font-semibold">₦{product.sellingPrice.toLocaleString()}</td>
                    <td className="text-right py-3">
<span className="text-green-600 font-medium">
                        ₦{margin.toLocaleString()} ({marginPercent}%)
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <button
                        onClick={() => openProductModal(product)}
                        className="text-blue-600 hover:text-blue-800 px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No products found matching your search' : 'No products yet. Click "Add Product" to get started.'}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            return (
              <div key={category.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold">{category.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{categoryProducts.length} products</p>
                <div className="mt-2 space-y-1">
                  {categoryProducts.slice(0, 3).map(prod => (
                    <p key={prod.id} className="text-sm text-gray-600">• {prod.name}</p>
                  ))}
                  {categoryProducts.length > 3 && (
                    <p className="text-sm text-gray-500">+ {categoryProducts.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className={`p-8 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow col-span-full`}>
              <p className="text-center text-gray-500">No categories yet. Click "Add Category" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Other sections (simplified for now)
const ReportsSection = ({ sales, products, reportType, setReportType, reportDate, setReportDate, darkMode }) => {
  // Helper functions
  const getDateString = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const isSameDay = (date1, date2) => {
    return getDateString(date1) === getDateString(date2);
  };

  const isSameMonth = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  };

  const isSameYear = (date1, date2) => {
    return new Date(date1).getFullYear() === new Date(date2).getFullYear();
  };

  // Filter sales based on report type
  const getFilteredSales = () => {
    if (reportType === 'daily') {
      return sales.filter(sale => isSameDay(sale.date, reportDate));
    } else if (reportType === 'monthly') {
      return sales.filter(sale => isSameMonth(sale.date, reportDate));
    } else {
      return sales.filter(sale => isSameYear(sale.date, reportDate));
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.itemCount, 0);
  const totalTransactions = filteredSales.length;

  // Get best selling items
  const itemSales = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!itemSales[item.productName]) {
        itemSales[item.productName] = {
          name: item.productName,
          count: 0,
          revenue: 0,
          profit: 0
        };
      }
      itemSales[item.productName].count += 1;
      itemSales[item.productName].revenue += item.sellingPrice;
      itemSales[item.productName].profit += item.profit;
    });
  });

  const bestSellers = Object.values(itemSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Date navigation
  const changeDate = (direction) => {
    const newDate = new Date(reportDate);
    if (reportType === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (reportType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setReportDate(newDate);
  };

  const formatDateLabel = () => {
    const date = new Date(reportDate);
    if (reportType === 'daily') {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (reportType === 'monthly') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else {
      return date.getFullYear().toString();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reports & Analytics</h2>
      
      {/* Report Type Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setReportType('daily')}
          className={`px-4 py-2 rounded ${
            reportType === 'daily'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-4 py-2 rounded ${
            reportType === 'monthly'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setReportType('yearly')}
          className={`px-4 py-2 rounded ${
            reportType === 'yearly'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Date Navigation */}
      <div className={`flex items-center justify-between p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <button
          onClick={() => changeDate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ← Previous
        </button>
        <div className="text-lg font-semibold">{formatDateLabel()}</div>
        <button
          onClick={() => changeDate(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Next →
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">₦{totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">₦{totalProfit.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Items Sold</p>
              <p className="text-2xl font-bold text-purple-600">{totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-orange-600">{totalTransactions}</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Best Selling Items
          </h3>
          {bestSellers.length > 0 ? (
            <div className="space-y-3">
              {bestSellers.map((item, index) => (
                <div key={item.name} className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.count} units sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">₦{item.revenue.toLocaleString()}</div>
                      <div className="text-sm text-green-600">₦{item.profit.toLocaleString()} profit</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data for this period</p>
          )}
        </div>

        {/* Performance Metrics */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Profit Margin</span>
                <span className="text-sm font-semibold">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Average Transaction</span>
                <span className="text-sm font-semibold">
                  ₦{totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(0).toLocaleString() : 0}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Average Items/Transaction</span>
                <span className="text-sm font-semibold">
                  {totalTransactions > 0 ? (totalItems / totalTransactions).toFixed(1) : 0}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Average Profit/Item</span>
                <span className="text-sm font-semibold">
                  ₦{totalItems > 0 ? (totalProfit / totalItems).toFixed(0).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistorySection = ({ 
  sales, 
  historyFilter, 
  setHistoryFilter, 
  historyStartDate, 
  setHistoryStartDate,
  historyEndDate,
  setHistoryEndDate,
  selectedSale,
  setSelectedSale,
  darkMode 
}) => {
  // Helper functions
  const getDateString = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const isToday = (date) => {
    return getDateString(date) === getDateString(new Date());
  };

  const isThisWeek = (date) => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(date) >= weekAgo;
  };

  const isThisMonth = (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  };

  // Filter sales
  const getFilteredSales = () => {
    let filtered = [...sales];

    if (historyFilter === 'today') {
      filtered = filtered.filter(sale => isToday(sale.date));
    } else if (historyFilter === 'week') {
      filtered = filtered.filter(sale => isThisWeek(sale.date));
    } else if (historyFilter === 'month') {
      filtered = filtered.filter(sale => isThisMonth(sale.date));
    } else if (historyFilter === 'custom' && historyStartDate && historyEndDate) {
      const start = new Date(historyStartDate);
      const end = new Date(historyEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredSales = getFilteredSales();

  // Calculate totals for filtered results
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0);

  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Sales History</h2>

      {/* Filters */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`px-4 py-2 rounded ${
              historyFilter === 'all'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setHistoryFilter('today')}
            className={`px-4 py-2 rounded ${
              historyFilter === 'today'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setHistoryFilter('week')}
            className={`px-4 py-2 rounded ${
              historyFilter === 'week'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setHistoryFilter('month')}
            className={`px-4 py-2 rounded ${
              historyFilter === 'month'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setHistoryFilter('custom')}
            className={`px-4 py-2 rounded ${
              historyFilter === 'custom'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {historyFilter === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={historyStartDate}
              onChange={(e) => setHistoryStartDate(e.target.value)}
              className={`px-3 py-2 border rounded ${
                darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
              }`}
            />
            <span className="py-2">to</span>
            <input
              type="date"
              value={historyEndDate}
              onChange={(e) => setHistoryEndDate(e.target.value)}
              className={`px-3 py-2 border rounded ${
                darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
              }`}
            />
          </div>
        )}
      </div>

      {/* Summary for filtered results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{filteredSales.length}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Profit</p>
          <p className="text-2xl font-bold text-purple-600">₦{totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Sales List */}
      <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>
        {filteredSales.length > 0 ? (
<div className="divide-y divide-gray-200">
            {filteredSales.map(sale => (
              <div
                key={sale.id}
                onClick={() => setSelectedSale(sale)}
                className={`p-4 cursor-pointer transition ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="font-semibold text-lg">Sale #{sale.id}</div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        Completed
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{formatDateTime(sale.date)}</div>
                    <div className="text-sm text-gray-500 mt-1">{sale.itemCount} items</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">₦{sale.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Profit: ₦{sale.totalProfit.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No transactions found for the selected period
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="sticky top-0 bg-inherit p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Sale #{selectedSale.id}</h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Sale Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold">{formatDateTime(selectedSale.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-semibold ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>Completed & Locked</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="font-bold mb-3">Items Sold</h4>
                <div className="space-y-2">
                  {selectedSale.items.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{item.productName}</div>
                          <div className="text-sm text-gray-500">Cost: ₦{item.costPrice.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">₦{item.sellingPrice.toLocaleString()}</div>
                          <div className="text-sm text-green-600">+₦{item.profit.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className={`p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">₦{selectedSale.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Total Profit:</span>
                  <span className="font-bold text-lg text-green-600">₦{selectedSale.totalProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Credit Payment Tracking Section
const CreditPaymentSection = ({ creditSales, addPaymentToCreditSale, deleteCreditSale, darkMode }) => {
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Ensure creditSales is an array
  const creditList = Array.isArray(creditSales) ? creditSales : [];

  const unpaidCredits = creditList.filter(cs => !cs.isPaid);
  const paidCredits = creditList.filter(cs => cs.isPaid);
  const totalUnpaid = unpaidCredits.reduce((sum, cs) => sum + cs.balance, 0);
  const totalPaid = paidCredits.reduce((sum, cs) => sum + cs.totalAmount, 0);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAddPayment = (creditId) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    addPaymentToCreditSale(creditId, paymentAmount);
    setPaymentAmount('');
    setSelectedCredit(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Credit Payment Tracking</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Outstanding Credits</p>
          <p className="text-2xl font-bold text-red-600">{unpaidCredits.length}</p>
        </div>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">₦{totalUnpaid.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Outstanding Credits */}
      {unpaidCredits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">Outstanding Credits</h3>
          <div className="space-y-3">
            {unpaidCredits.map(credit => (
              <div key={credit.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">{credit.customerName}</div>
                    <div className="text-sm text-gray-500">Date: {formatDate(credit.dateIssued)}</div>
                    <div className="text-sm text-gray-500">{credit.itemCount} items</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total: ₦{credit.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Paid: ₦{credit.amountPaid.toLocaleString()}</div>
                    <div className="text-xl font-bold text-red-600">Balance: ₦{credit.balance.toLocaleString()}</div>
                  </div>
                </div>

                {/* Payment History */}
                {credit.payments && credit.payments.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold mb-2">Payment History:</div>
                    <div className="space-y-1">
                      {credit.payments.map(payment => (
                        <div key={payment.id} className="text-sm flex justify-between text-gray-600">
                          <span>{formatDate(payment.date)}</span>
                          <span className="text-green-600">₦{payment.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                <details className="mb-3">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600">View Items</summary>
                  <div className="mt-2 space-y-1">
                    {credit.items.map(item => (
                      <div key={item.id} className="text-sm flex justify-between">
                        <span>• {item.productName}</span>
                        <span>₦{item.sellingPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedCredit(credit)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Add Payment
                  </button>
                  <button
                    onClick={() => deleteCreditSale(credit.id)}
                    className="px-4 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid Credits */}
      {paidCredits.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Paid Credits</h3>
          <div className="space-y-3">
            {paidCredits.map(credit => (
              <div key={credit.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow opacity-70`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{credit.customerName}</div>
                    <div className="text-sm text-gray-500">Paid on: {formatDate(credit.datePaid)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₦{credit.totalAmount.toLocaleString()}</div>
                    <div className={`px-2 py-1 rounded text-xs mt-1 ${
                      darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    }`}>
                      Fully Paid
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creditList.length === 0 && (
        <div className={`p-8 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow text-center`}>
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No credit sales yet.</p>
          <p className="text-sm text-gray-400">Go to Sales section and click "💳 Credit Sale" to create a credit sale.</p>
        </div>
      )}

      {/* Payment Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Payment</h3>
              <button
                onClick={() => {
                  setSelectedCredit(null);
                  setPaymentAmount('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Customer: <span className="font-semibold">{selectedCredit.customerName}</span></p>
                <p className="text-sm text-gray-500">Balance: <span className="font-bold text-red-600">₦{selectedCredit.balance.toLocaleString()}</span></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={`w-full px-4 py-3 border rounded text-lg ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedCredit(null);
                    setPaymentAmount('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddPayment(selectedCredit.id)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomersSection = ({ customers, sales, darkMode }) => {
  // Get current date info
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Ensure customers is an array
  const customerList = Array.isArray(customers) ? customers : [];

  // Filter customers by month and year
  const getTopBuyerOfMonth = () => {
    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    const customerTotals = {};
    monthSales.forEach(sale => {
      const name = sale.customerName || 'Walk-in Customer';
      if (!customerTotals[name]) {
        customerTotals[name] = 0;
      }
      customerTotals[name] += sale.totalAmount;
    });

    const sorted = Object.entries(customerTotals)
      .sort((a, b) => b[1] - a[1])
      .filter(([name]) => name !== 'Walk-in Customer');

    return sorted[0] || null;
  };

  const getTopBuyerOfYear = () => {
    const yearSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === currentYear;
    });

    const customerTotals = {};
    yearSales.forEach(sale => {
      const name = sale.customerName || 'Walk-in Customer';
      if (!customerTotals[name]) {
        customerTotals[name] = 0;
      }
      customerTotals[name] += sale.totalAmount;
    });

    const sorted = Object.entries(customerTotals)
      .sort((a, b) => b[1] - a[1])
      .filter(([name]) => name !== 'Walk-in Customer');

    return sorted[0] || null;
  };

  const topMonthBuyer = getTopBuyerOfMonth();
  const topYearBuyer = getTopBuyerOfYear();

  const sortedCustomers = [...customerList].sort((a, b) => b.totalPurchases - a.totalPurchases);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customer Tracking</h2>

      {/* Top Buyers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-bold">Top Buyer of the Month</h3>
          </div>
          {topMonthBuyer ? (
            <div>
              <p className="text-2xl font-bold text-blue-600">{topMonthBuyer[0]}</p>
              <p className="text-gray-500">Total Spent: ₦{topMonthBuyer[1].toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 text-orange-500 mr-2" />
            <h3 className="text-lg font-bold">Top Buyer of the Year</h3>
          </div>
          {topYearBuyer ? (
            <div>
              <p className="text-2xl font-bold text-blue-600">{topYearBuyer[0]}</p>
              <p className="text-gray-500">Total Spent: ₦{topYearBuyer[1].toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* All Customers */}
      <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">All Customers</h3>
          {sortedCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3">Rank</th>
                    <th className="text-left py-3">Customer Name</th>
                    <th className="text-right py-3">Purchases</th>
                    <th className="text-right py-3">Total Spent</th>
                    <th className="text-right py-3">Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((customer, index) => (
                    <tr key={customer.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className="py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 font-semibold">{customer.name}</td>
                      <td className="text-right py-3">{customer.purchaseCount}</td>
                      <td className="text-right py-3 font-bold text-blue-600">₦{customer.totalPurchases.toLocaleString()}</td>
                      <td className="text-right py-3 text-sm text-gray-500">{formatDate(customer.lastPurchase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
<p className="text-gray-500 text-center py-8">No customer data yet. Start tracking by entering customer names during sales.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Engineer Credit Section
const EngineerSection = ({ 
  engineerCredits, 
  products, 
  categories,
  markCreditAsPaid, 
  deleteCredit,
  showCreditModal,
  setShowCreditModal,
  addEngineerCredit,
  darkMode 
}) => {
  const [engineerName, setEngineerName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const unpaidCredits = engineerCredits.filter(c => !c.isPaid);
  const paidCredits = engineerCredits.filter(c => c.isPaid);
  const totalUnpaid = unpaidCredits.reduce((sum, c) => sum + c.totalAmount, 0);

  const handleAddItem = (product) => {
    const newItem = {
      id: Date.now() + Math.random(),
      productId: product.id,
      productName: product.name,
      costPrice: product.costPrice,
      price: product.sellingPrice
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const handleSaveCredit = () => {
    addEngineerCredit(engineerName, selectedItems, notes);
    setEngineerName('');
    setSelectedItems([]);
    setNotes('');
    setSelectedCategory(null);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory && p.stock > 0)
    : [];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Engineer Credit</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Unpaid Credits</p>
          <p className="text-2xl font-bold text-orange-600">{unpaidCredits.length}</p>
        </div>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Total Unpaid Amount</p>
          <p className="text-2xl font-bold text-red-600">₦{totalUnpaid.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-sm text-gray-500">Paid Credits</p>
          <p className="text-2xl font-bold text-green-600">{paidCredits.length}</p>
        </div>
      </div>

      <button
        onClick={() => setShowCreditModal(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 mb-6 flex items-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        New Credit
      </button>

      {/* Credits List */}
      <div className="space-y-4">
        {unpaidCredits.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Unpaid Credits</h3>
            {unpaidCredits.map(credit => (
              <div key={credit.id} className={`p-4 rounded-lg mb-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">{credit.engineerName}</div>
                    <div className="text-sm text-gray-500">Issued: {formatDate(credit.dateIssued)}</div>
                    {credit.notes && <div className="text-sm text-gray-500 mt-1">Notes: {credit.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-red-600">₦{credit.totalAmount.toLocaleString()}</div>
                    <div className={`px-2 py-1 rounded text-xs mt-1 ${
                      darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                    }`}>
                      Unpaid
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm text-gray-500 mb-2">Items ({credit.items.length}):</div>
                  <div className="space-y-1">
                    {credit.items.map(item => (
                      <div key={item.id} className="text-sm flex justify-between">
                        <span>• {item.productName}</span>
                        <span>₦{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => markCreditAsPaid(credit.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => deleteCredit(credit.id)}
                    className="px-4 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {paidCredits.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Paid Credits</h3>
            {paidCredits.map(credit => (
              <div key={credit.id} className={`p-4 rounded-lg mb-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow opacity-70`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{credit.engineerName}</div>
                    <div className="text-sm text-gray-500">Paid: {formatDate(credit.datePaid)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₦{credit.totalAmount.toLocaleString()}</div>
                    <div className={`px-2 py-1 rounded text-xs mt-1 ${
                      darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    }`}>
                      Paid
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {engineerCredits.length === 0 && (
          <div className={`p-8 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className="text-gray-500 text-center">No credit records yet. Click "New Credit" to start tracking.</p>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="sticky top-0 bg-inherit p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">New Engineer Credit</h3>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setEngineerName('');
                  setSelectedItems([]);
                  setNotes('');
                  setSelectedCategory(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Engineer Name</label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Enter engineer name"
                  className={`w-full px-4 py-2 border rounded ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Products</label>
                  <div className="space-y-2 mb-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {selectedCategory && (
                    <div className="space-y-2">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleAddItem(product)}
                          className={`w-full text-left p-3 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-500'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>{product.name}</span>
                            <span className="font-bold">₦{product.sellingPrice.toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Items */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Selected Items</label>
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <span>{item.productName}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">₦{item.price.toLocaleString()}</span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedItems.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No items selected</p>
                    )}
                  </div>
                  {selectedItems.length > 0 && (
                    <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">
                          ₦{selectedItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows="3"
                  className={`w-full px-4 py-2 border rounded ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setEngineerName('');
                    setSelectedItems([]);
                    setNotes('');
                    setSelectedCategory(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCredit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Save Credit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsSection = ({ darkMode, setDarkMode, setIsLocked, changePin, exportData, importData, resetDaily, clearAllData, syncEnabled, toggleSync, uploadToCloud, downloadFromCloud, isViewOnly, enableViewOnlyMode, disableViewOnlyMode, lastSyncTime  }) => {
  const [shopName, setShopName] = useState(localStorage.getItem('pos_shop_name') || 'My Shop');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  const saveShopName = () => {
    localStorage.setItem('pos_shop_name', shopName);
    alert('Shop name saved!');
  };

  const sampleReceipt = {
    id: 123456,
    date: new Date().toISOString(),
    items: [
      { productName: 'iPhone 7 Screen', sellingPrice: 8500 },
      { productName: 'Type-C Charger', sellingPrice: 1000 }
    ],
    totalAmount: 9500
  };

  const printReceipt = (sale) => {
    const receiptWindow = window.open('', '', 'width=300,height=600');
    const shopNameValue = localStorage.getItem('pos_shop_name') || 'My Shop';
    
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 12px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>${shopNameValue}</h2>
            <p>Receipt #${sale.id}</p>
            <p>${new Date(sale.date).toLocaleString()}</p>
          </div>
          <div class="line"></div>
          ${sale.items.map(item => `
            <div class="item">
              <span>${item.productName}</span>
              <span>₦${item.sellingPrice.toLocaleString()}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="item total">
            <span>TOTAL</span>
            <span>₦${sale.totalAmount.toLocaleString()}</span>
          </div>
          <div class="line"></div>
          <div class="center">
            <p>Thank you for your business!</p>
          </div>
          <script>
            window.print();
            setTimeout(() => window.close(), 100);
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Settings */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Shop Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={`w-full px-4 py-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                }`}
              />
              <button
                onClick={saveShopName}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
              >
                Save Shop Name
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Appearance</h3>
          <button
            onClick={() => {
              setDarkMode(!darkMode);
              localStorage.setItem('pos_theme', !darkMode ? 'dark' : 'light');
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 w-full"
          >
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Security */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Security</h3>
          <div className="space-y-3">
            <button
              onClick={changePin}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-full"
            >
              Change PIN
            </button>
            <button
              onClick={() => setIsLocked(true)}
              className="bg-orange-600 text-white px-6 py-3 rounded hover:bg-orange-700 w-full"
            >
              Lock App
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Data Management</h3>
          <div className="space-y-3">
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 w-full"
            >
              Export Data (Backup)
            </button>
            <button
              onClick={importData}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-full"
            >
              Import Data (Restore)
            </button>
            <button
              onClick={resetDaily}
              className="bg-yellow-600 text-white px-6 py-3 rounded hover:bg-yellow-700 w-full"
            >
              Reset Daily Data
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 w-full"
            >
              Clear All Data
            </button>
          </div>
        </div>
{/* Cloud Sync */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold mb-4">Cloud Sync (Multi-Device)</h3>
          <div className="space-y-3">
            <div className={`p-3 rounded ${syncEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <p className="text-sm font-semibold mb-1">
                Status: {syncEnabled ? '✅ Sync Enabled' : '❌ Sync Disabled'}
              </p>
              {lastSyncTime && (
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(lastSyncTime).toLocaleString()}
                </p>
              )}
            </div>
            
            <button
              onClick={() => toggleSync(!syncEnabled)}
              className={`w-full py-3 rounded ${
                syncEnabled 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {syncEnabled ? 'Disable Sync' : 'Enable Sync'}
            </button>
            
            {syncEnabled && (
              <>
                <button
                  onClick={uploadToCloud}
                  disabled={isViewOnly}
                  className={`w-full py-3 rounded ${
                    isViewOnly 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  📤 Upload to Cloud
                </button>
                
                <button
                  onClick={downloadFromCloud}
                  className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700"
                >
                  📥 Download from Cloud
                </button>
              </>
            )}
            
            <div className={`p-3 rounded ${isViewOnly ? 'bg-orange-100 dark:bg-orange-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <p className="text-sm font-semibold mb-2">
                Mode: {isViewOnly ? '👁️ View-Only' : '✏️ Full Access'}
              </p>
              {!isViewOnly ? (
                <button
                  onClick={enableViewOnlyMode}
                  className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 text-sm"
                >
                  Enable View-Only Mode
                </button>
              ) : (
                <button
                  onClick={disableViewOnlyMode}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                >
                  Disable View-Only Mode
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              📱 Phone 1 (Main): Keep full access, enable sync<br/>
              📱 Phone 2 (View): Enable view-only mode + sync
            </p>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-2`}>
          <h3 className="text-lg font-bold mb-4">Receipt Settings</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowReceiptPreview(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700"
            >
              Preview Receipt
            </button>
            <button
              onClick={() => printReceipt(sampleReceipt)}
              className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
            >
              Test Print
            </button>
          </div>
        </div>

        {/* App Info */}
<div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-2`}>
          <h3 className="text-lg font-bold mb-4">App Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>App Name:</strong> Offline Shop POS</p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Mode:</strong> Offline-first (Single Device)</p>
            <p><strong>Storage:</strong> Browser Local Storage</p>
            <p className="text-gray-500 mt-4">
              This app works completely offline. All data is stored on your device. 
              Make sure to export backups regularly to prevent data loss.
            </p>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Receipt Preview</h3>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{shopName}</h2>
                <p>Receipt #{sampleReceipt.id}</p>
                <p>{new Date(sampleReceipt.date).toLocaleString()}</p>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
              {sampleReceipt.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>{item.productName}</span>
                  <span>₦{item.sellingPrice.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                <span>TOTAL</span>
                <span>₦{sampleReceipt.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
              <div style={{ textAlign: 'center' }}>
                <p>Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineShopPOS;


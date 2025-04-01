const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');
const Expense = require('../models/Expense');
const Home = require('../models/Home');
const { verifyToken } = require('./auth');
const User = require('../models/User');

// Mock data for development
const mockExpenses = [
  {
    _id: 'mock-expense-1',
    homeId: 'mock-home-id',
    payer: 'Test User',
    amount: 75.50,
    reason: 'Groceries',
    splitType: 'equal',
    debtors: [
      {
        name: 'Test User',
        amount: 37.75,
        paid: true
      },
      {
        name: 'Other User',
        amount: 37.75,
        paid: false
      }
    ],
    date: new Date(Date.now() - 86400000), // Yesterday
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mock-expense-2',
    homeId: 'mock-home-id',
    payer: 'Test User',
    amount: 60.00,
    reason: 'Internet Bill',
    splitType: 'equal',
    debtors: [
      {
        name: 'Test User',
        amount: 30.00,
        paid: true
      },
      {
        name: 'Other User',
        amount: 30.00,
        paid: false
      }
    ],
    date: new Date(Date.now() - 172800000), // 2 days ago
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper function to handle database operations
const handleDbOperation = async (operation, mockResponse) => {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    return mockResponse;
  }
};

// Get all expenses for a home
router.get('/home/:homeId', verifyToken, async (req, res) => {
  try {
    const homeId = req.params.homeId;
    console.log(`Getting expenses for home: ${homeId}`);
    
    if (global.useMockData) {
      console.log('Using mock data for expenses');
      return res.status(200).json({ expenses: mockExpenses });
    }
    
    const expenses = await Expense.find({ homeId }).sort({ date: -1 });
    res.status(200).json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new expense
router.post('/', verifyToken, async (req, res) => {
  try {
    const { homeId, payer, amount, reason, splitType, debtors } = req.body;
    console.log('Adding new expense:', req.body);
    
    // Validate required fields
    if (!homeId || !payer || !amount || !reason || !debtors || !Array.isArray(debtors)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate amount is a number
    if (isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Amount must be a valid number' });
    }
    
    if (global.useMockData) {
      console.log('Using mock data for adding expense');
      const newMockExpense = {
        _id: `mock-expense-${Date.now()}`,
        homeId,
        payer,
        amount: parseFloat(amount),
        reason: reason || '',
        splitType: splitType || 'equal',
        debtors: debtors || [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return res.status(201).json({ expense: newMockExpense });
    }
    
    // Verify home exists
    const home = await Home.findOne({ homeId });
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    
    // Check if user is a member of the home
    const isMember = home.members.some(member => member.uid === req.user.uid);
    if (!isMember) {
      return res.status(403).json({ message: 'User is not a member of this home' });
    }
    
    // Create debtors array if not provided or ensure it's valid
    let validDebtors = [];
    if (splitType === 'equal' && (!debtors || debtors.length === 0)) {
      // For equal split with no debtors, divide among all home members
      const perPersonAmount = parseFloat(amount) / home.members.length;
      validDebtors = home.members.map(member => ({
        name: member.name,
        amount: perPersonAmount.toFixed(2),
        paid: member.name === payer // Payer has already paid their portion
      }));
    } else if (Array.isArray(debtors) && debtors.length > 0) {
      // Validate existing debtors
      validDebtors = debtors.map(debtor => ({
        name: debtor.name,
        amount: parseFloat(debtor.amount || 0).toFixed(2),
        paid: !!debtor.paid
      }));
    } else {
      // Default: payer pays it all (self)
      validDebtors = [{
        name: payer,
        amount: parseFloat(amount).toFixed(2),
        paid: true
      }];
    }
    
    // Create new expense with validated data
    const newExpense = new Expense({
      homeId,
      payer,
      amount: parseFloat(amount),
      reason: reason || '',
      splitType: splitType || 'equal',
      debtors: validDebtors,
      date: new Date(),
      createdBy: req.user.uid
    });
    
    await newExpense.save();
    res.status(201).json({ expense: newExpense });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ 
      message: 'Server error adding expense',
      details: error.message
    });
  }
});

// Get expense by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const expenseId = req.params.id;
    console.log(`Getting expense with ID: ${expenseId}`);
    
    if (global.useMockData) {
      console.log('Using mock data for expense');
      return res.status(200).json({ expense: mockExpenses[0] });
    }
    
    const expense = await Expense.findOne({ _id: expenseId });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if user is a member of the home
    const home = await Home.findOne({ homeId: expense.homeId });
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    
    const isMember = home.members.some(member => member.uid === req.user.uid);
    if (!isMember) {
      return res.status(403).json({ message: 'User is not authorized to view this expense' });
    }
    
    res.status(200).json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a debtor's paid status
router.put('/:id/debtors/:debtorIndex', verifyToken, async (req, res) => {
  try {
    const { id, debtorIndex } = req.params;
    const { paid } = req.body;
    console.log(`Updating debtor ${debtorIndex} for expense ${id} to paid=${paid}`);
    
    if (global.useMockData) {
      console.log('Using mock data for updating debtor');
      const mockExpense = { ...mockExpenses[0] };
      
      if (mockExpense.debtors[debtorIndex]) {
        mockExpense.debtors[debtorIndex].paid = paid;
        mockExpense.updatedAt = new Date();
      }
      
      return res.status(200).json({ expense: mockExpense });
    }
    
    const expense = await Expense.findById(id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    if (!expense.debtors[debtorIndex]) {
      return res.status(404).json({ message: 'Debtor not found' });
    }
    
    expense.debtors[debtorIndex].paid = paid;
    await expense.save();
    
    res.status(200).json({ expense });
  } catch (error) {
    console.error('Update debtor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense by ID
router.put('/:id', verifyToken, async (req, res) => {
  // ... existing code ...
});

// Delete an expense
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.uid;
    console.log(`Deleting expense with ID: ${expenseId} by user: ${userId}`);
    
    if (global.useMockData) {
      console.log('Using mock data for deleting expense');
      return res.status(200).json({ message: 'Expense deleted successfully' });
    }
    
    // Find the expense
    const expense = await Expense.findById(expenseId);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Find the home to check permissions
    const home = await Home.findOne({ homeId: expense.homeId });
    
    if (!home) {
      return res.status(404).json({ message: 'Home not found for this expense' });
    }
    
    // Check if the user is the payer of this expense or the home creator
    const userMember = home.members.find(member => member.uid === userId);
    const isHomeCreator = home.createdBy === userId;
    const isExpensePayer = userMember && userMember.name === expense.payer;
    
    if (!isHomeCreator && !isExpensePayer) {
      return res.status(403).json({ 
        message: 'Only the payer of the expense or the home creator can delete it' 
      });
    }
    
    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);
    
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Mark a debt as paid by the payer (cash payment)
router.patch('/:expenseId/mark-paid', verifyToken, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { debtorName, paidMethod } = req.body;
    
    if (!debtorName) {
      return res.status(400).json({ message: 'Debtor name is required' });
    }
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if user is the payer of the expense
    const home = await Home.findById(expense.homeId);
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    
    const currentMember = home.members.find(member => member.uid === req.user.uid);
    if (!currentMember) {
      return res.status(403).json({ message: 'User is not a member of this home' });
    }
    
    if (currentMember.name !== expense.payer) {
      return res.status(403).json({ message: 'Only the payer can mark debts as paid' });
    }
    
    // Find the debtor in the expense
    const debtorIndex = expense.debtors.findIndex(d => d.name === debtorName);
    if (debtorIndex === -1) {
      return res.status(404).json({ message: 'Debtor not found in this expense' });
    }
    
    // Mark as paid
    expense.debtors[debtorIndex].paid = true;
    expense.debtors[debtorIndex].paidMethod = paidMethod || 'cash';
    expense.debtors[debtorIndex].paidDate = new Date();
    
    await expense.save();
    
    return res.json({ 
      message: 'Payment marked as paid',
      expense
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark own debt as paid (UPI payment)
router.patch('/:expenseId/mark-paid-self', verifyToken, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { debtorName, paidMethod } = req.body;
    
    if (!debtorName) {
      return res.status(400).json({ message: 'Debtor name is required' });
    }
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if user is a member of the home
    const home = await Home.findById(expense.homeId);
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    
    const currentMember = home.members.find(member => member.uid === req.user.uid);
    if (!currentMember) {
      return res.status(403).json({ message: 'User is not a member of this home' });
    }
    
    // Ensure the user is marking their own debt as paid
    if (currentMember.name !== debtorName) {
      return res.status(403).json({ message: 'You can only mark your own debts as paid' });
    }
    
    // Find the debtor in the expense
    const debtorIndex = expense.debtors.findIndex(d => d.name === debtorName);
    if (debtorIndex === -1) {
      return res.status(404).json({ message: 'Debtor not found in this expense' });
    }
    
    // Mark as paid
    expense.debtors[debtorIndex].paid = true;
    expense.debtors[debtorIndex].paidMethod = paidMethod || 'upi';
    expense.debtors[debtorIndex].paidDate = new Date();
    
    await expense.save();
    
    return res.json({ 
      message: 'Your payment has been marked as paid',
      expense
    });
  } catch (error) {
    console.error('Error marking self payment as paid:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
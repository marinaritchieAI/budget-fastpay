// Category catalogue data and default bucket configuration
// All category names use Australian English spelling

const CATALOGUE_GROUPS = [
  {
    id: 'housing-household',
    name: 'Housing and Household',
    categories: [
      { id: 'general-household', name: 'General Household' },
      { id: 'investment-property', name: 'Investment Property Expenses' },
      { id: 'mortgage', name: 'Mortgage' },
      { id: 'rent', name: 'Rent' },
      { id: 'utilities', name: 'Utilities' },
      { id: 'insurance', name: 'Insurance' },
      { id: 'home-maintenance', name: 'Home Maintenance' },
      { id: 'home-improvement', name: 'Home Improvement' },
      { id: 'cable-satellite', name: 'Cable / Satellite Services' }
    ]
  },
  {
    id: 'vehicles-transport',
    name: 'Vehicles and Transport',
    categories: [
      { id: 'vehicle-expenses', name: 'Vehicle Expenses' },
      { id: 'automotive-expenses', name: 'Automotive Expenses' },
      { id: 'petrol-fuel', name: 'Petrol / Fuel' },
      { id: 'mileage-fuel', name: 'Mileage / Fuel' }
    ]
  },
  {
    id: 'children-education',
    name: 'Children and Education',
    categories: [
      { id: 'child-dependent', name: 'Child / Dependent Expenses' },
      { id: 'education', name: 'Education' }
    ]
  },
  {
    id: 'shopping-lifestyle',
    name: 'Shopping and Lifestyle',
    categories: [
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'general-merchandise', name: 'General Merchandise' },
      { id: 'groceries', name: 'Groceries' },
      { id: 'personal-care', name: 'Personal Care' },
      { id: 'clothing-shoes', name: 'Clothing / Shoes' },
      { id: 'electronics', name: 'Electronics' },
      { id: 'restaurants-dining', name: 'Restaurants / Dining' },
      { id: 'travel', name: 'Travel' },
      { id: 'gifts', name: 'Gifts' }
    ]
  },
  {
    id: 'subscriptions-services',
    name: 'Subscriptions and Services',
    categories: [
      { id: 'dues-subscriptions', name: 'Dues and Subscriptions' },
      { id: 'online-services', name: 'Online Services' },
      { id: 'streaming', name: 'Streaming' },
      { id: 'telephone-services', name: 'Telephone Services' }
    ]
  },
  {
    id: 'financial-banking',
    name: 'Financial and Banking',
    categories: [
      { id: 'credit-card-payments', name: 'Credit Card Payments' },
      { id: 'service-charges', name: 'Service Charges / Fees' },
      { id: 'interest', name: 'Interest' },
      { id: 'loans', name: 'Loans' },
      { id: 'taxes', name: 'Taxes' },
      { id: 'transfers', name: 'Transfers' },
      { id: 'atm-cash', name: 'ATM / Cash Withdrawals' }
    ]
  },
  {
    id: 'savings-investments',
    name: 'Savings and Investments',
    categories: [
      { id: 'savings', name: 'Savings' },
      { id: 'retirement-contributions', name: 'Retirement Contributions' },
      { id: 'securities-trades', name: 'Securities Trades' }
    ]
  },
  {
    id: 'pets-animals',
    name: 'Pets and Animals',
    categories: [
      { id: 'pets-pet-care', name: 'Pets / Pet Care' }
    ]
  },
  {
    id: 'giving-community',
    name: 'Giving and Community',
    categories: [
      { id: 'charitable-giving', name: 'Charitable Giving' }
    ]
  },
  {
    id: 'admin-misc',
    name: 'Administrative and Miscellaneous',
    categories: [
      { id: 'personal-expenses', name: 'Personal Expenses' },
      { id: 'healthcare-medical', name: 'Healthcare / Medical' },
      { id: 'postage-shipping', name: 'Postage and Shipping' },
      { id: 'other-bills', name: 'Other Bills' },
      { id: 'cheques', name: 'Cheques' },
      { id: 'uncategorised', name: 'Uncategorised' }
    ]
  },
  {
    id: 'business-related',
    name: 'Business Related',
    categories: [
      { id: 'advertising', name: 'Advertising' },
      { id: 'business-misc', name: 'Business Miscellaneous' },
      { id: 'office-maintenance', name: 'Office Maintenance' },
      { id: 'office-supplies', name: 'Office Supplies' },
      { id: 'printing', name: 'Printing' }
    ]
  }
];

const DEFAULT_BUCKETS = [
  {
    id: 'fixed',
    name: 'Fixed Expenses',
    frequency: 'Monthly',
    isDefault: true,
    categories: [
      { id: 'general-household', name: 'General Household', isCustom: false },
      { id: 'investment-property', name: 'Investment Property Expenses', isCustom: false },
      { id: 'personal-expenses', name: 'Personal Expenses', isCustom: false },
      { id: 'vehicle-expenses', name: 'Vehicle Expenses', isCustom: false }
    ]
  },
  {
    id: 'uncategorised',
    name: 'Uncategorised',
    frequency: '',
    isDefault: true,
    categories: []
  },
  {
    id: 'discretionary',
    name: 'Discretionary Expenses',
    frequency: 'Weekly',
    isDefault: true,
    categories: [
      { id: 'entertainment', name: 'Entertainment', isCustom: false },
      { id: 'general-merchandise', name: 'General Merchandise', isCustom: false },
      { id: 'groceries', name: 'Groceries', isCustom: false },
      { id: 'healthcare-medical', name: 'Healthcare / Medical', isCustom: false },
      { id: 'personal-care', name: 'Personal Care', isCustom: false },
      { id: 'petrol-fuel', name: 'Petrol / Fuel', isCustom: false }
    ]
  }
];

// Map each default category to its original group for returning on removal
const CATEGORY_GROUP_MAP = {};
CATALOGUE_GROUPS.forEach(function(group) {
  group.categories.forEach(function(cat) {
    CATEGORY_GROUP_MAP[cat.id] = group.id;
  });
});

function generateId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
}

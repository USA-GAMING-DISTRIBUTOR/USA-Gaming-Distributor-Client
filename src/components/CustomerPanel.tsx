import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer, CustomerPricing, CustomerUsername } from '../types/customer';
import type { Platform } from '../types/platform';
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  X,
  DollarSign,
  Search,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { LoadingSpinner } from './common/Loader';
import Pagination from './common/Pagination';
import SearchableDropdown from './common/SearchableDropdown';

const CustomerPanel: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isUsernamesModalOpen, setIsUsernamesModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForPricing, setSelectedCustomerForPricing] = useState<Customer | null>(
    null,
  );
  const [selectedCustomerForUsernames, setSelectedCustomerForUsernames] = useState<Customer | null>(
    null,
  );
  const [customerPricing, setCustomerPricing] = useState<CustomerPricing[]>([]);
  const [customerUsernames, setCustomerUsernames] = useState<CustomerUsername[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [customersPage, setCustomersPage] = useState(1);
  const [customersItemsPerPage, setCustomersItemsPerPage] = useState(8);

  // Customer pricing pagination state
  const [pricingPage, setPricingPage] = useState(1);
  const [pricingItemsPerPage, setPricingItemsPerPage] = useState(8);
  const [formData, setFormData] = useState<{
    name: string;
    contact_numbers: string[];
  }>({
    name: '',
    contact_numbers: [''],
  });
  const [pricingForm, setPricingForm] = useState<{
    platform_id: string;
    min_quantity: number;
    max_quantity: number | null;
    unit_price: number;
    is_default: boolean;
  }>({
    platform_id: '',
    min_quantity: 1,
    max_quantity: null,
    unit_price: 0,
    is_default: false,
  });

  const [usernameForm, setUsernameForm] = useState<{
    platform_id: string;
    username: string;
    notes: string;
    is_active: boolean;
  }>({
    platform_id: '',
    username: '',
    notes: '',
    is_active: true,
  });

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Customers pagination logic
  const customersStartIndex = (customersPage - 1) * customersItemsPerPage;
  const customersEndIndex = customersStartIndex + customersItemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(customersStartIndex, customersEndIndex);

  const handleCustomersPageChange = (page: number) => {
    setCustomersPage(page);
  };

  const handleCustomersItemsPerPageChange = (newItemsPerPage: number) => {
    setCustomersItemsPerPage(newItemsPerPage);
    setCustomersPage(1);
  };

  // Customer pricing pagination logic
  const pricingStartIndex = (pricingPage - 1) * pricingItemsPerPage;
  const pricingEndIndex = pricingStartIndex + pricingItemsPerPage;
  const paginatedCustomerPricing = customerPricing.slice(pricingStartIndex, pricingEndIndex);

  const handlePricingPageChange = (page: number) => {
    setPricingPage(page);
  };

  const handlePricingItemsPerPageChange = (newItemsPerPage: number) => {
    setPricingItemsPerPage(newItemsPerPage);
    setPricingPage(1);
  };

  useEffect(() => {
    fetchCustomers();
    fetchPlatforms();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCustomersPage(1);
  }, [searchTerm]);

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('game_coins')
        .select('*')
        .is('deleted_at', null)
        .order('platform');

      if (error) throw error;

      // Transform data to match Platform interface
      const transformedPlatforms: Platform[] = (data || []).map(
        (platform: {
          id: string;
          platform: string;
          account_type?: string | null;
          inventory: number;
          cost_price: number;
          low_stock_alert?: number | null;
          created_at: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        }) => ({
          id: platform.id,
          platform: platform.platform,
          account_type: platform.account_type || 'Standard',
          inventory: platform.inventory,
          cost_price: platform.cost_price,
          low_stock_alert: platform.low_stock_alert || 10, // Default to 10 if not set
          is_visible_to_employee: true, // Default to true as this is admin view
          created_at: platform.created_at,
          updated_at: platform.updated_at || null,
          deleted_at: platform.deleted_at || null,
        }),
      );

      setPlatforms(transformedPlatforms);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchCustomerPricing = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_pricing')
        .select(
          `
          *,
          game_coins!platform_id (
            platform,
            account_type
          )
        `,
        )
        .eq('customer_id', customerId)
        .order('min_quantity');

      if (error) throw error;

      // Transform data to include platform_name
      const transformedPricing: CustomerPricing[] = (data || []).map(
        (pricing: {
          id: string;
          platform_id: string | null;
          min_quantity: number;
          max_quantity: number | null;
          unit_price: number;
          is_default: boolean | null;
          game_coins?: { platform?: string | null } | null;
        }) => ({
          id: pricing.id,
          customer_id: customerId,
          platform_id: pricing.platform_id || '',
          min_quantity: pricing.min_quantity,
          max_quantity: pricing.max_quantity,
          unit_price: pricing.unit_price,
          is_default: pricing.is_default ?? false,
          platform_name: pricing.game_coins?.platform || 'Unknown Platform',
          created_at: new Date().toISOString(),
          updated_at: null,
        }),
      );

      setCustomerPricing(transformedPricing);
    } catch (error) {
      console.error('Error fetching customer pricing:', error);
    }
  };

  const openPricingModal = async (customer: Customer) => {
    setSelectedCustomerForPricing(customer);
    await fetchCustomerPricing(customer.id);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setIsPricingModalOpen(false);
    setSelectedCustomerForPricing(null);
    setCustomerPricing([]);
    setPricingForm({
      platform_id: '',
      min_quantity: 1,
      max_quantity: null,
      unit_price: 0,
      is_default: false,
    });
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPricing) return;

    try {
      const { error } = await supabase.from('customer_pricing').insert({
        customer_id: selectedCustomerForPricing.id,
        platform_id: pricingForm.platform_id,
        min_quantity: pricingForm.min_quantity,
        max_quantity: pricingForm.max_quantity,
        unit_price: pricingForm.unit_price,
        is_default: pricingForm.is_default,
      });

      if (error) throw error;

      await fetchCustomerPricing(selectedCustomerForPricing.id);
      setPricingForm({
        platform_id: '',
        min_quantity: 1,
        max_quantity: null,
        unit_price: 0,
        is_default: false,
      });
    } catch (error) {
      console.error('Error saving customer pricing:', error);
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (!confirm('Are you sure you want to delete this pricing tier?')) return;
    if (!selectedCustomerForPricing) return;

    try {
      const { error } = await supabase.from('customer_pricing').delete().eq('id', pricingId);

      if (error) throw error;
      await fetchCustomerPricing(selectedCustomerForPricing.id);
    } catch (error) {
      console.error('Error deleting pricing:', error);
    }
  };

  // Username management functions
  const fetchCustomerUsernames = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_usernames')
        .select(
          `
          *,
          game_coins!platform_id (
            platform,
            account_type
          )
        `,
        )
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include platform info
      const transformedUsernames: CustomerUsername[] = (data || []).map(
        (username: {
          id: string;
          platform_id: string;
          username: string;
          notes: string | null;
          is_active: boolean | null;
          game_coins?: {
            platform?: string | null;
            account_type?: string | null;
          } | null;
        }) => ({
          id: username.id,
          customer_id: customerId,
          platform_id: username.platform_id,
          username: username.username,
          notes: username.notes,
          is_active: username.is_active ?? true,
          platform_name: username.game_coins?.platform || 'Unknown Platform',
          account_type: username.game_coins?.account_type || 'Standard',
          created_at: new Date().toISOString(),
          updated_at: null,
        }),
      );

      setCustomerUsernames(transformedUsernames);
    } catch (error) {
      console.error('Error fetching customer usernames:', error);
    }
  };

  const openUsernamesModal = async (customer: Customer) => {
    setSelectedCustomerForUsernames(customer);
    await fetchCustomerUsernames(customer.id);
    setIsUsernamesModalOpen(true);
  };

  const closeUsernamesModal = () => {
    setIsUsernamesModalOpen(false);
    setSelectedCustomerForUsernames(null);
    setCustomerUsernames([]);
    setUsernameForm({
      platform_id: '',
      username: '',
      notes: '',
      is_active: true,
    });
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForUsernames) return;

    try {
      const { error } = await supabase.from('customer_usernames').insert({
        customer_id: selectedCustomerForUsernames.id,
        platform_id: usernameForm.platform_id,
        username: usernameForm.username,
        notes: usernameForm.notes || null,
        is_active: usernameForm.is_active,
      });

      if (error) throw error;

      await fetchCustomerUsernames(selectedCustomerForUsernames.id);
      setUsernameForm({
        platform_id: '',
        username: '',
        notes: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving customer username:', error);
    }
  };

  const handleDeleteUsername = async (usernameId: string) => {
    if (!confirm('Are you sure you want to delete this username?')) return;
    if (!selectedCustomerForUsernames) return;

    try {
      const { error } = await supabase.from('customer_usernames').delete().eq('id', usernameId);

      if (error) throw error;
      await fetchCustomerUsernames(selectedCustomerForUsernames.id);
    } catch (error) {
      console.error('Error deleting username:', error);
    }
  };

  const handleToggleUsernameActive = async (usernameId: string, currentStatus: boolean) => {
    if (!selectedCustomerForUsernames) return;

    try {
      const { error } = await supabase
        .from('customer_usernames')
        .update({ is_active: !currentStatus })
        .eq('id', usernameId);

      if (error) throw error;
      await fetchCustomerUsernames(selectedCustomerForUsernames.id);
    } catch (error) {
      console.error('Error toggling username active status:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*').order('name');

      if (error) throw error;

      // Transform data to handle both old and new schema formats
      const transformedCustomers: Customer[] = (data || []).map(
        (customer: {
          id: string;
          name: string;
          contact_numbers?: string[] | null;
          contact_info?: { number?: string; phone?: string }[] | string | null;
          created_at: string | null;
          updated_at?: string | null;
        }) => ({
          id: customer.id,
          name: customer.name,
          // Handle both new contact_numbers array and old contact_info JSONB
          contact_numbers:
            customer.contact_numbers ||
            (customer.contact_info
              ? typeof customer.contact_info === 'string'
                ? JSON.parse(customer.contact_info).map(
                    (info: { number?: string; phone?: string }) => info.number || info.phone,
                  )
                : customer.contact_info.map(
                    (info: { number?: string; phone?: string }) => info.number || info.phone,
                  )
              : null),
          created_at: customer.created_at || new Date().toISOString(),
          updated_at: customer.updated_at || null,
        }),
      );

      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Filter out empty phone numbers
      const validNumbers = formData.contact_numbers.filter((num) => num.trim() !== '');

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            contact_numbers: validNumbers,
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert({
          name: formData.name,
          contact_numbers: validNumbers,
        });

        if (error) throw error;
      }

      await fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        contact_numbers:
          customer.contact_numbers && customer.contact_numbers.length > 0
            ? customer.contact_numbers
            : [''],
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        contact_numbers: [''],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      contact_numbers: [''],
    });
  };

  const addContactNumber = () => {
    setFormData((prev) => ({
      ...prev,
      contact_numbers: [...prev.contact_numbers, ''],
    }));
  };

  const removeContactNumber = (index: number) => {
    if (formData.contact_numbers.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contact_numbers: prev.contact_numbers.filter((_, i) => i !== index),
      }));
    }
  };

  const updateContactNumber = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_numbers: prev.contact_numbers.map((number, i) => (i === index ? value : number)),
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Customer Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg shadow-inner overflow-hidden">
        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact Numbers</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    {customers.length === 0
                      ? 'No customers found. Add your first customer to get started.'
                      : searchTerm
                        ? `No customers found matching "${searchTerm}".`
                        : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{customer.name}</td>
                    <td className="py-3 px-4">
                      {customer.contact_numbers?.map((number, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{number}</span>
                        </div>
                      ))}
                      {(!customer.contact_numbers || customer.contact_numbers.length === 0) && (
                        <span className="text-gray-400 italic">No contact numbers</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openPricingModal(customer)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Manage pricing for this customer"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openUsernamesModal(customer)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Manage usernames for this customer"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Customers Pagination */}
        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={customersPage}
            totalItems={filteredCustomers.length}
            itemsPerPage={customersItemsPerPage}
            onPageChange={handleCustomersPageChange}
            onItemsPerPageChange={handleCustomersItemsPerPageChange}
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                  </h2>
                  <p className="text-pink-100 text-sm mt-1">
                    {editingCustomer ? 'Update customer information' : 'Create a new customer'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-pink-100 hover:text-white p-2 rounded-lg hover:bg-pink-600/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Numbers
                  </label>
                  {formData.contact_numbers.map((number, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={number}
                        onChange={(e) => updateContactNumber(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.contact_numbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactNumber(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContactNumber}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Contact Number
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="customer-form"
                  disabled={loading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {isPricingModalOpen && selectedCustomerForPricing && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    Pricing for {selectedCustomerForPricing.name}
                  </h2>
                  <p className="text-pink-100 text-sm mt-1">
                    Set custom pricing for different platforms and quantities
                  </p>
                </div>
                <button
                  onClick={closePricingModal}
                  className="text-pink-100 hover:text-white p-2 rounded-lg hover:bg-pink-600/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Pricing Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium mb-3">Add New Pricing Tier</h3>
                <form
                  onSubmit={handlePricingSubmit}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <SearchableDropdown
                      options={platforms.map((p) => ({
                        value: p.id,
                        label: `${p.platform} (${p.account_type})`,
                      }))}
                      value={pricingForm.platform_id}
                      onChange={(value) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          platform_id: value,
                        }))
                      }
                      placeholder="Select Platform"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pricingForm.min_quantity}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          min_quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pricingForm.max_quantity || ''}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          max_quantity: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricingForm.unit_price}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          unit_price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Pricing
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Pricing Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Quantity Range
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Unit Price
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Default</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPricing.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No pricing tiers set for this customer.
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomerPricing.map((pricing) => (
                        <tr key={pricing.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{pricing.platform_name}</td>
                          <td className="py-3 px-4">
                            {pricing.min_quantity}
                            {pricing.max_quantity ? ` - ${pricing.max_quantity}` : '+'}
                          </td>
                          <td className="py-3 px-4">${pricing.unit_price}</td>
                          <td className="py-3 px-4">
                            {pricing.is_default ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                Default
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeletePricing(pricing.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Delete pricing tier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Customer Pricing Pagination */}
              {customerPricing.length > 0 && (
                <Pagination
                  currentPage={pricingPage}
                  totalItems={customerPricing.length}
                  itemsPerPage={pricingItemsPerPage}
                  onPageChange={handlePricingPageChange}
                  onItemsPerPageChange={handlePricingItemsPerPageChange}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <button
                onClick={closePricingModal}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Usernames Modal */}
      {isUsernamesModalOpen && selectedCustomerForUsernames && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    Manage Usernames - {selectedCustomerForUsernames.name}
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Add and manage platform usernames for this customer
                  </p>
                </div>
                <button
                  onClick={closeUsernamesModal}
                  className="text-purple-100 hover:text-white p-2 rounded-lg hover:bg-purple-600/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Username Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium mb-3">Add New Username</h3>
                <form
                  onSubmit={handleUsernameSubmit}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <SearchableDropdown
                      options={platforms.map((p) => ({
                        value: p.id,
                        label: `${p.platform} - ${p.account_type}`,
                      }))}
                      value={usernameForm.platform_id}
                      onChange={(value) =>
                        setUsernameForm({
                          ...usernameForm,
                          platform_id: value,
                        })
                      }
                      placeholder="Select Platform"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={usernameForm.username}
                      onChange={(e) =>
                        setUsernameForm({
                          ...usernameForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={usernameForm.notes}
                      onChange={(e) =>
                        setUsernameForm({
                          ...usernameForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={usernameForm.is_active}
                          onChange={(e) =>
                            setUsernameForm({
                              ...usernameForm,
                              is_active: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Add Username
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Usernames Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerUsernames.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No usernames added yet for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerUsernames.map((username) => (
                        <tr key={username.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {username.platform_name} - {username.account_type}
                          </td>
                          <td className="py-3 px-4 font-medium">{username.username}</td>
                          <td className="py-3 px-4 text-gray-600">{username.notes || '-'}</td>
                          <td className="py-3 px-4">
                            {username.is_active ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleToggleUsernameActive(username.id, username.is_active)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  username.is_active
                                    ? 'text-orange-600 hover:bg-orange-100'
                                    : 'text-green-600 hover:bg-green-100'
                                }`}
                                title={
                                  username.is_active ? 'Deactivate username' : 'Activate username'
                                }
                              >
                                {username.is_active ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUsername(username.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete username"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <button
                onClick={closeUsernamesModal}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPanel;

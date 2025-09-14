import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Customer, CustomerPricing } from "../types/customer";
import type { Platform } from "../types/platform";
import { Plus, Edit2, Trash2, Phone, X, DollarSign } from "lucide-react";

const CustomerPanel: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForPricing, setSelectedCustomerForPricing] =
    useState<Customer | null>(null);
  const [customerPricing, setCustomerPricing] = useState<CustomerPricing[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    contact_numbers: string[];
  }>({
    name: "",
    contact_numbers: [""],
  });
  const [pricingForm, setPricingForm] = useState<{
    platform_id: string;
    min_quantity: number;
    max_quantity: number | null;
    unit_price: number;
    is_default: boolean;
  }>({
    platform_id: "",
    min_quantity: 1,
    max_quantity: null,
    unit_price: 0,
    is_default: false,
  });

  useEffect(() => {
    fetchCustomers();
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from("game_coins")
        .select("*")
        .order("platform");

      if (error) throw error;

      // Transform data to match Platform interface
      const transformedPlatforms = (data || []).map((platform: any) => ({
        id: platform.id,
        platform_name: platform.platform,
        account_type: platform.account_type || "Standard",
        inventory: platform.inventory,
        cost_price: platform.cost_price,
        created_at: platform.created_at,
        updated_at: platform.updated_at || null,
      }));

      setPlatforms(transformedPlatforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
    }
  };

  const fetchCustomerPricing = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_pricing" as any)
        .select(
          `
          *,
          game_coins!platform_id (
            platform,
            account_type
          )
        `
        )
        .eq("customer_id", customerId)
        .order("min_quantity");

      if (error) throw error;

      // Transform data to include platform_name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedPricing = (data || []).map((pricing: any) => ({
        ...pricing,
        platform_name: pricing.game_coins?.platform || "Unknown Platform",
      }));

      setCustomerPricing(transformedPricing);
    } catch (error) {
      console.error("Error fetching customer pricing:", error);
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
      platform_id: "",
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
      const { error } = await supabase.from("customer_pricing" as any).insert({
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
        platform_id: "",
        min_quantity: 1,
        max_quantity: null,
        unit_price: 0,
        is_default: false,
      });
    } catch (error) {
      console.error("Error saving customer pricing:", error);
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (!confirm("Are you sure you want to delete this pricing tier?")) return;
    if (!selectedCustomerForPricing) return;

    try {
      const { error } = await supabase
        .from("customer_pricing" as any)
        .delete()
        .eq("id", pricingId);

      if (error) throw error;
      await fetchCustomerPricing(selectedCustomerForPricing.id);
    } catch (error) {
      console.error("Error deleting pricing:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;

      // Transform data to handle both old and new schema formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedCustomers = (data || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        // Handle both new contact_numbers array and old contact_info JSONB
        contact_numbers:
          customer.contact_numbers ||
          (customer.contact_info
            ? typeof customer.contact_info === "string"
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                JSON.parse(customer.contact_info).map(
                  (info: any) => info.number || info.phone
                )
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                customer.contact_info.map(
                  (info: any) => info.number || info.phone
                )
            : null),
        created_at: customer.created_at,
        updated_at: customer.updated_at || null,
      }));

      setCustomers(transformedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty phone numbers
      const validNumbers = formData.contact_numbers.filter(
        (num) => num.trim() !== ""
      );

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: formData.name,
            contact_numbers: validNumbers,
          })
          .eq("id", editingCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert({
          name: formData.name,
          contact_numbers: validNumbers,
        });

        if (error) throw error;
      }

      await fetchCustomers();
      closeModal();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
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
            : [""],
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        contact_numbers: [""],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      contact_numbers: [""],
    });
  };

  const addContactNumber = () => {
    setFormData((prev) => ({
      ...prev,
      contact_numbers: [...prev.contact_numbers, ""],
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
      contact_numbers: prev.contact_numbers.map((number, i) =>
        i === index ? value : number
      ),
    }));
  };

  if (isLoading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Customer Management
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg shadow-inner overflow-hidden">
        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Contact Numbers
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Pricing
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No customers found. Add your first customer to get started.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">{customer.name}</td>
                    <td className="py-3 px-4">
                      {customer.contact_numbers?.map((number, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 mb-1"
                        >
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{number}</span>
                        </div>
                      ))}
                      {(!customer.contact_numbers ||
                        customer.contact_numbers.length === 0) && (
                        <span className="text-gray-400 italic">
                          No contact numbers
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openPricingModal(customer)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        title="Manage pricing for this customer"
                      >
                        <DollarSign className="w-3 h-3" />
                        Pricing
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(customer)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
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
                      onChange={(e) =>
                        updateContactNumber(index, e.target.value)
                      }
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCustomer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {isPricingModalOpen && selectedCustomerForPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Pricing for {selectedCustomerForPricing.name}
              </h2>
              <button
                onClick={closePricingModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Pricing Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-md font-medium mb-3">Add New Pricing Tier</h3>
              <form
                onSubmit={handlePricingSubmit}
                className="grid grid-cols-1 md:grid-cols-5 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={pricingForm.platform_id}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        platform_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Platform</option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.platform_name} ({platform.account_type})
                      </option>
                    ))}
                  </select>
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
                    value={pricingForm.max_quantity || ""}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        max_quantity: e.target.value
                          ? parseInt(e.target.value)
                          : null,
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Platform
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Quantity Range
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Unit Price
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Default
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customerPricing.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No pricing tiers set for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerPricing.map((pricing) => (
                      <tr
                        key={pricing.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium">
                          {pricing.platform_name}
                        </td>
                        <td className="py-3 px-4">
                          {pricing.min_quantity}
                          {pricing.max_quantity
                            ? ` - ${pricing.max_quantity}`
                            : "+"}
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

            <div className="flex justify-end mt-6">
              <button
                onClick={closePricingModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
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

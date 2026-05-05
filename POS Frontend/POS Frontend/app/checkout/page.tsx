"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { getMyAddresses, addAddress, deleteAddress } from "@/lib/api/address";
import { useCart } from "@/lib/cart-context";

// Import your old checkout page UI components (adjust based on your actual imports)
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Truck,
  Store,
  Clock,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Trash2,
  ChevronRight,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";

function formatApiError(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const msg = "msg" in item ? String(item.msg) : "";
          const loc = Array.isArray((item as { loc?: unknown }).loc)
            ? (item as { loc?: Array<string | number> }).loc?.join(".")
            : "";
          return [loc, msg].filter(Boolean).join(": ");
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
    if (joined) return joined;
  }
  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {}
  }
  return "Please try again.";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { items, clearCart, getTotalPrice } = useCart();

  /* -------------------- STATE (From your old checkout) -------------------- */
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "dine_in">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // New state for table number and special instructions
  const [tableNumber, setTableNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  /* -------------------- ADDRESS FUNCTIONALITY (From new checkout) -------------------- */
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  /* -------- ADDRESS FORM STATE (CANADA) -------- */
  const [addressForm, setAddressForm] = useState({
    address_type: "home",
    label: "Home",
    full_name: "",
    street: "",
    apartment: "",
    city: "",
    province: "ON",
    postal_code: "",
    phone_number: "",
    instructions: "",
  });

  /* -------------------- PRICES (From your old checkout) -------------------- */
  const subtotal = getTotalPrice();
  const tax = subtotal * 0.13;
  const deliveryFee = orderType === "delivery" ? 4.99 : 0;
  const total = subtotal + tax + deliveryFee;

  /* -------------------- LOAD ADDRESSES -------------------- */
  useEffect(() => {
    if (!token) return;
    loadAddresses();
  }, [token]);

  const loadAddresses = async () => {
    if (!token) return;
    setIsLoadingAddresses(true);
    try {
      const data = await getMyAddresses(token);
      setSavedAddresses(data);
      
      // Set default address if available
      const defaultAddr = data.find((a: any) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  /* -------------------- ADD ADDRESS -------------------- */
  const handleSubmitAddress = async () => {
    if (!token) return;

    // Validate required fields
    if (!addressForm.street || !addressForm.city || !addressForm.postal_code) {
      alert("Please fill in all required address fields.");
      return;
    }

    if (savedAddresses.length >= 5) {
      alert("You can add a maximum of 5 addresses.");
      return;
    }

    try {
      await addAddress(token, {
        ...addressForm,
        full_name: addressForm.full_name || user?.name || "",
        phone_number: addressForm.phone_number || user?.phone || "",
      });

      setShowAddressForm(false);
      // Reset form
      setAddressForm({
        address_type: "home",
        label: "Home",
        full_name: "",
        street: "",
        apartment: "",
        city: "",
        province: "ON",
        postal_code: "",
        phone_number: "",
        instructions: "",
      });

      await loadAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      alert("Failed to add address. Please try again.");
    }
  };

  /* -------------------- DELETE ADDRESS -------------------- */
  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      await deleteAddress(token, id);
      if (selectedAddressId === id) {
        setSelectedAddressId(savedAddresses.length > 1 ? savedAddresses[0].id : null);
      }
      await loadAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Failed to delete address. Please try again.");
    }
  };

  /* -------------------- HELPER FUNCTIONS -------------------- */
  const getAddressIcon = (type: string) => {
    if (type === "home") return <Home className="w-4 h-4" />;
    if (type === "work") return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getAddressLabel = (type: string) => {
    if (type === "home") return "Home";
    if (type === "work") return "Work";
    return "Other";
  };

  /* -------------------- PLACE ORDER -------------------- */
  
  const handlePlaceOrder = async () => {
    if (!token) {
      alert("Please login to place an order");
      return;
    }

    // Validate based on order type
    if (orderType === "delivery" && !selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    if (orderType === "dine_in" && !tableNumber.trim()) {
      alert("Please enter a table number for dine-in");
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddress = savedAddresses.find(
        (a) => a.id === selectedAddressId
      );

      // Prepare order payload according to backend schema
      const payload = {
        customer_name: user?.name || "",
        customer_email: user?.email || "",
        customer_phone: user?.phone || "",
        order_type: orderType.toLowerCase(),

        delivery_address: orderType === "delivery" && selectedAddress 
          ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.postal_code}`
          : null,
        delivery_zip: orderType === "delivery" && selectedAddress 
          ? selectedAddress.postal_code 
          : null,
        table_number: orderType === "dine_in" ? tableNumber : null,
        delivery_instructions: orderType === "delivery" && selectedAddress
          ? selectedAddress.instructions || ""
          : "",
        notes: specialInstructions || "",
        payment_method: paymentMethod,
        cart_items: items.map((item) => {
          const fallbackMenuId = Number.parseInt(String(item.id).split("-")[0] || "", 10);
          const menuItemId = item.menuItemId ?? fallbackMenuId;
          if (!Number.isFinite(menuItemId)) {
            throw new Error(`Invalid menu item id for ${item.name}`);
          }

          const toppings =
            item.customizations?.toppings
              ?.map((topping) => ({
                topping_id: Number(topping.topping_id),
                quantity: Math.max(1, Math.floor(Number(topping.quantity || 1))),
              }))
              .filter((topping) => Number.isFinite(topping.topping_id)) || [];

          return {
            menu_item_id: menuItemId,
            size: item.size || "medium",
            quantity: item.quantity,
            crust: item.customizations?.crust || null,
            crust_option_id: item.customizations?.crustOptionId ?? null,
            sauce: item.customizations?.sauce?.toLowerCase() || "tomato",
            extra_cheese: item.customizations?.extraCheese || false,
            extra_sauce: item.customizations?.extraSauce || false,
            special_instructions: item.customizations?.specialInstructions || "",
            toppings,
          };
        }),
      };

      console.log("Sending order payload:", payload);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errorData.detail) || `Order failed: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Order created successfully:", data);
      
      // Clear cart after successful order
      clearCart();
      
      // Redirect to order confirmation
      router.push(`/order-confirmation?orderId=${encodeURIComponent(data.order_number)}`);
      
    } catch (error: any) {
      console.error("Error placing order:", error);
      alert(`Failed to place order: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Keep your old checkout header */}
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto px-4">
          {/* Back Button - Keep your old style */}
          <BackButton label="Back to Menu" href="/" className="mb-6" />

          {/* Page Title - Keep your old style */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your order</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type Selection - Updated with Dine In option */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Order Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setOrderType("delivery")}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${orderType === "delivery" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Truck className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Delivery</div>
                        <div className="text-sm text-gray-500">30-45 min • $4.99 fee</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setOrderType("pickup")}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${orderType === "pickup" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Store className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Pickup</div>
                        <div className="text-sm text-gray-500">15-20 min • No fee</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setOrderType("dine_in")}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${orderType === "dine_in" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <UtensilsCrossed className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Dine In</div>
                        <div className="text-sm text-gray-500">Dine at restaurant • No fee</div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* DELIVERY ADDRESS SECTION - Enhanced with new functionality */}
              {orderType === "delivery" && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Delivery Address
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Address
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Loading State */}
                    {isLoadingAddresses && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading addresses...</p>
                      </div>
                    )}

                    {/* No Addresses State */}
                    {!isLoadingAddresses && savedAddresses.length === 0 && !showAddressForm && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-900 mb-1">No saved addresses</h3>
                        <p className="text-gray-500 mb-4">Add an address for faster checkout</p>
                        <Button onClick={() => setShowAddressForm(true)}>
                          Add Your First Address
                        </Button>
                      </div>
                    )}

                    {/* Address Form */}
                    {showAddressForm && (
                      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                              id="full_name"
                              placeholder="John Doe"
                              value={addressForm.full_name}
                              onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              placeholder="(555) 123-4567"
                              value={addressForm.phone_number}
                              onChange={(e) => setAddressForm({ ...addressForm, phone_number: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="street">Street Address *</Label>
                          <Input
                            id="street"
                            placeholder="123 Main St"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="apartment">Apartment/Suite (Optional)</Label>
                          <Input
                            id="apartment"
                            placeholder="Apt 4B"
                            value={addressForm.apartment}
                            onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              placeholder="Toronto"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="province">Province *</Label>
                            <Input
                              id="province"
                              placeholder="ON"
                              value={addressForm.province}
                              onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="postal_code">Postal Code *</Label>
                            <Input
                              id="postal_code"
                              placeholder="M5V 2T6"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                          <Textarea
                            id="instructions"
                            placeholder="Gate code, building instructions, etc."
                            value={addressForm.instructions}
                            onChange={(e) => setAddressForm({ ...addressForm, instructions: e.target.value })}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <Label className="mb-2 block">Address Type</Label>
                            <div className="flex gap-2">
                              {["home", "work", "other"].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setAddressForm({
                                    ...addressForm,
                                    address_type: type,
                                    label: getAddressLabel(type)
                                  })}
                                  className={`px-3 py-2 rounded-md text-sm ${addressForm.address_type === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                  {getAddressLabel(type)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSubmitAddress}>
                            Save Address
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Saved Addresses List */}
                    {!isLoadingAddresses && savedAddresses.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">Saved Addresses</h3>
                        <RadioGroup
                          value={selectedAddressId?.toString() ?? ""}
                          onValueChange={(v) => setSelectedAddressId(Number(v))}
                          className="space-y-3"
                        >
                          {savedAddresses.map((addr) => (
                            <div key={addr.id} className="relative">
                              <RadioGroupItem
                                value={addr.id.toString()}
                                id={`addr-${addr.id}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`addr-${addr.id}`}
                                className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    {getAddressIcon(addr.address_type)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{addr.label}</span>
                                    {addr.is_default && (
                                      <Badge variant="outline" className="text-xs">
                                        Default
                                      </Badge>
                                    )}
                                    <span className="text-sm text-gray-500">
                                      ({getAddressLabel(addr.address_type)})
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {addr.full_name} • {addr.phone_number}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {addr.street}
                                    {addr.apartment && `, ${addr.apartment}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {addr.city}, {addr.province} {addr.postal_code}
                                  </p>
                                  {addr.instructions && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium">Note:</span> {addr.instructions}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="flex-shrink-0 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteAddress(addr.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TABLE NUMBER SECTION FOR DINE IN */}
              {orderType === "dine_in" && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                      Dine In Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="table_number">Table Number *</Label>
                        <Input
                          id="table_number"
                          placeholder="e.g., Table 12, Booth 5"
                          className="mt-1 max-w-md"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Required for dine-in orders
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="dine_in_instructions">Special Instructions (Optional)</Label>
                        <Textarea
                          id="dine_in_instructions"
                          placeholder="Any special requests or allergies..."
                          className="mt-1"
                          rows={3}
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SPECIAL INSTRUCTIONS SECTION FOR ALL ORDER TYPES */}
              {orderType !== "dine_in" && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="order_instructions">Instructions for the kitchen (Optional)</Label>
                      <Textarea
                        id="order_instructions"
                        placeholder="Any special requests, allergies, or instructions..."
                        className="mt-1"
                        rows={3}
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method - Keep your old UI */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      <span className="font-medium">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                      disabled
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      <span className="font-medium">Card</span>
                      <Badge className="ml-2" variant="secondary">Coming Soon</Badge>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Add any additional sections from your old checkout here */}
              {/* e.g., Delivery Time, Special Instructions, etc. */}
            </div>

            {/* RIGHT COLUMN - Order Summary (Keep your old UI) */}
            <div className="lg:col-span-1">
              <Card className="border shadow-sm sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Items</h3>
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.size && `${item.size} • `}
                            Qty: {item.quantity}
                          </p>
                          {(() => {
                            const dynamicToppings =
                              item.customizations?.toppings?.map((topping) =>
                                topping.quantity > 1 ? `${topping.name} x${topping.quantity}` : topping.name
                              ) || [];
                            const legacyToppings = item.customizations?.extraToppings || [];
                            const toppingNames = dynamicToppings.length > 0 ? dynamicToppings : legacyToppings;
                            if (toppingNames.length === 0) return null;
                            return (
                              <p className="text-sm text-gray-500">
                                Toppings: {toppingNames.join(", ")}
                              </p>
                            );
                          })()}
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (13%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    {orderType === "delivery" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || 
                      (orderType === "delivery" && !selectedAddressId) ||
                      (orderType === "dine_in" && !tableNumber.trim())
                    }
                    className="w-full py-6 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Place Order • $${total.toFixed(2)}`
                    )}
                  </Button>

                  {/* Order Type Reminder */}
                  <div className="text-sm text-gray-500 text-center">
                    {orderType === "delivery" ? (
                      <p className="flex items-center justify-center gap-1">
                        <Truck className="w-4 h-4" />
                        Delivery • 30-45 minutes
                      </p>
                    ) : orderType === "pickup" ? (
                      <p className="flex items-center justify-center gap-1">
                        <Store className="w-4 h-4" />
                        Pickup • 15-20 minutes
                      </p>
                    ) : (
                      <p className="flex items-center justify-center gap-1">
                        <UtensilsCrossed className="w-4 h-4" />
                        Dine In • Ready at your table
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Keep your old footer */}
      <Footer />
    </div>
  );
}

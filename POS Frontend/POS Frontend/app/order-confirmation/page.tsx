"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle, Copy, Clock, MapPin, Store, UtensilsCrossed } from "lucide-react";
import { getCustomerOrder } from "@/lib/api/customerOrders";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const orderStatus = String(order?.status || "").toLowerCase();
  const confirmationMessage =
    orderStatus === "pending"
      ? "Your order is placed and waiting for employee approval."
      : "Thank you for your order. We're preparing it now.";

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    try {
      const data = await getCustomerOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderId = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy order number:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 mb-4">
              {confirmationMessage}
            </p>
            
            {orderId && (
              <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <span className="font-mono font-bold text-lg">#{orderId}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleCopyOrderId}
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="font-medium capitalize">
                        {(order?.payment_method || "cash").replace(/_/g, " ")} - {(order?.payment_status || "pending").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Type:</span>
                      <span className="font-medium capitalize">{order.order_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-lg">${order?.total?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {order?.order_type === "delivery" ? (
                    <MapPin className="w-5 h-5" />
                  ) : order?.order_type === "pickup" ? (
                    <Store className="w-5 h-5" />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5" />
                  )}
                  {order?.order_type === "delivery" ? "Delivery Info" : 
                   order?.order_type === "pickup" ? "Pickup Info" : "Dine In Info"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order?.order_type === "delivery" && order?.delivery_address && (
                  <p className="text-gray-700">{order.delivery_address}</p>
                )}
                {order?.order_type === "pickup" && (
                  <div>
                    <p className="font-medium mb-1">Pickup at:</p>
                    <p className="text-gray-700">Fresh Pizza Store</p>
                    <p className="text-gray-600 text-sm">123 Pizza Street, Toronto</p>
                    <p className="text-gray-600 text-sm mt-2">Estimated ready in 15-20 minutes</p>
                  </div>
                )}
                {order?.order_type === "dine_in" && order?.table_number && (
                  <div>
                    <p className="font-medium">Your Table:</p>
                    <p className="text-2xl font-bold text-primary mt-1">{order.table_number}</p>
                    <p className="text-gray-600 text-sm mt-2">Your order will be served at your table</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {order?.items && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{item.menu_item_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.size && `${item.size} - `}
                          Qty: {item.quantity}
                        </p>
                        {item.toppings && item.toppings.length > 0 && (
                          <p className="text-sm text-gray-500">
                            Toppings:{" "}
                            {item.toppings
                              .map((t: any) => {
                                const name = t?.topping?.name || t?.name || "Topping";
                                const qty = Number(t?.quantity || 1);
                                return qty > 1 ? `${name} x${qty}` : name;
                              })
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() =>
                router.push(orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order")
              }
              className="px-8"
              variant="outline"
            >
              Track Order
            </Button>
            <Button 
              onClick={() => router.push("/")}
              className="px-8"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

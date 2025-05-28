
// Defines the structure for shipping details included in an order.
// This should match the fields collected in the ShippingFormValues from checkout.
export interface ShippingDetails {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phoneNumber: string;
  phoneCountryCode?: string;
}

// Defines the structure for a single item within an order.
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  imageHint?: string;
}

// Defines the structure for an entire order.
export interface Order {
  id: string; // Unique identifier for the order
  date: string; // Date the order was placed, typically in 'DD/MM/YYYY' or ISO format
  items: OrderItem[]; // Array of items included in the order
  totalAmount: number; // Total cost of the order
  shippingDetails: ShippingDetails; // Shipping information for the order
  status: 'Processing' | 'Shipped' | 'Delivered'; // Current status of the order
}

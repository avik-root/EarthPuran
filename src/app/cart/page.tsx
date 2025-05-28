
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  // In a real app, you would fetch cart items
  const cartItems: any[] = []; // Placeholder, e.g. [{ product: { id: '1', name: 'Velvet Lipstick', price: 2800, imageUrl: '...' }, quantity: 1 }]

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = cartItems.length > 0 ? 50.00 : 0; // Example shipping in INR
  const total = subtotal + shipping;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-primary">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Your Cart is Empty</h2>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => (
              <Card key={index} className="flex items-center p-4 gap-4">
                <Image src={item.product.imageUrl} alt={item.product.name} width={80} height={80} className="rounded-md" data-ai-hint="product item" />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">₹{item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quantity controls would go here */}
                  <Input type="number" defaultValue={item.quantity} className="w-16 text-center" />
                </div>
                <p className="font-semibold w-20 text-right">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
          <Card className="lg:col-span-1 h-fit sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

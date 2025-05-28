
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, RefreshCw, ShieldCheck } from "lucide-react";

export default function ShippingReturnsPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Shipping & Returns</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Information about how we ship your Earth Puran products and handle returns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Package className="mr-3 h-7 w-7 text-primary" /> Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>At Earth Puran, we are committed to getting your natural beauty products to you as quickly and efficiently as possible. All our products are shipped directly from our Earth Puran facilities.</p>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Shipping Times:</h3>
            <ul className="list-disc list-inside pl-4">
              <li><strong>Standard Shipping:</strong> Typically 5-7 business days within India.</li>
              <li><strong>Express Shipping:</strong> Typically 2-3 business days (available at an additional cost, coming soon!).</li>
              <li>Orders are processed within 1-2 business days.</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Shipping Costs:</h3>
            <ul className="list-disc list-inside pl-4">
              <li>Free standard shipping on all orders over ₹500.</li>
              <li>A flat rate of ₹50 for standard shipping on orders under ₹500.</li>
              <li>Shipping costs are non-refundable.</li>
            </ul>
          </section>
           <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">International Shipping:</h3>
            <p>Currently, Earth Puran products are only shipped within India. We are working on expanding our shipping to other countries soon!</p>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <RefreshCw className="mr-3 h-7 w-7 text-primary" /> Return Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>We want you to be completely satisfied with your Earth Puran purchase. If you are not entirely happy with your order, we are here to help.</p>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Conditions for Returns:</h3>
            <ul className="list-disc list-inside pl-4">
              <li>You have 14 calendar days to return an item from the date you received it.</li>
              <li>To be eligible for a return, your item must be unused and in the same condition that you received it.</li>
              <li>Your item must be in the original packaging.</li>
              <li>Only products purchased directly from Earth Puran are eligible for return.</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Non-Returnable Items:</h3>
            <ul className="list-disc list-inside pl-4">
              <li>Gift cards.</li>
              <li>Opened or used products (due to hygiene reasons).</li>
              <li>Products not in their original condition, damaged, or missing parts for reasons not due to our error.</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Refunds:</h3>
            <p>Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.</p>
            <p>If your return is approved, we will initiate a refund to your original method of payment (or provide store credit). You will receive the credit within a certain amount of days, depending on your card issuer's policies.</p>
          </section>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Return Shipping:</h3>
            <p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund, if applicable.</p>
          </section>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">How to Initiate a Return:</h3>
            <p>Please contact our customer support team at <a href="mailto:support@earthpuran.example.com" className="text-primary hover:underline">support@earthpuran.example.com</a> with your order number and details about the product you would like to return. We will guide you through the process.</p>
          </section>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <ShieldCheck className="mr-3 h-7 w-7 text-primary" /> Our Guarantee
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>Earth Puran stands behind the quality of its exclusive products. We strive to ensure every item meets our high standards for natural and organic beauty. If you have any concerns about a product you received, please don't hesitate to contact us.</p>
        </CardContent>
      </Card>
    </div>
  );
}

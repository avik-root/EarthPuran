
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "What makes Earth Puran products different?",
    answer: "All Earth Puran products are crafted with a focus on natural and organic ingredients, sustainability, and ethical practices. We exclusively feature products from the Earth Puran brand, ensuring quality and purity.",
  },
  {
    question: "Are Earth Puran products cruelty-free?",
    answer: "Yes, all Earth Puran products are 100% cruelty-free. We are committed to ethical practices and do not test any of our products on animals.",
  },
  {
    question: "Where are Earth Puran products made?",
    answer: "Earth Puran products are proudly formulated and produced with care, adhering to high-quality standards. (Specific location details can be added here if desired, e.g., 'Made in India').",
  },
  {
    question: "What is your shipping policy?",
    answer: "We offer standard shipping across India. Typically, orders arrive within 5-7 business days. For more details, please visit our Shipping & Returns page.",
  },
  {
    question: "What is your return policy?",
    answer: "We want you to love your Earth Puran products. If you're not satisfied, you can return unused products in their original packaging within 14 days of receipt. Please see our Shipping & Returns page for full details.",
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive an email with tracking information. You can also track your order status from your account's order history page if you are logged in.",
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, Earth Puran products are only shipped within India. We are working on expanding our shipping to other countries in the future.",
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about Earth Puran, our products, shipping, and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <HelpCircle className="mr-3 h-7 w-7 text-primary" /> Common Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-lg hover:text-primary text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      <Card className="bg-secondary/20 dark:bg-secondary/10">
        <CardHeader>
            <CardTitle className="text-center text-xl">Can't find your answer?</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
            <p>If you have other questions, feel free to <a href="/contact" className="text-primary hover:underline">contact us</a> directly.</p>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Users, Target } from "lucide-react";
import Image from "next/image";

export default function AboutUsPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">About Earth Puran</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover our journey, mission, and the values that drive us to bring you the best in natural beauty.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Leaf className="mr-3 h-7 w-7 text-primary" /> Our Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div className="md:flex md:gap-8 items-center">
            <div className="md:w-1/2">
              <p>Founded on the principles of purity and sustainability, Earth Puran was born from a desire to offer beauty solutions that are both effective and kind to the planet. We believe that nature holds the key to true radiance, and all our products are exclusively crafted under the Earth Puran brand to reflect this philosophy.</p>
              <p className="mt-4">Our journey began with a simple idea: to create a line of beauty products that harness the power of natural ingredients without compromising on quality or luxury. Every Earth Puran product is a testament to our commitment to ethical sourcing, eco-friendly practices, and the well-being of our customers.</p>
            </div>
            <div className="md:w-1/2 mt-6 md:mt-0">
                <Image 
                    src="https://placehold.co/600x400.png" 
                    alt="Earth Puran natural ingredients" 
                    width={600} 
                    height={400} 
                    className="rounded-lg shadow-md"
                    data-ai-hint="nature ingredients"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Target className="mr-3 h-6 w-6 text-primary" /> Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>To provide high-quality, natural, and organic beauty products under the Earth Puran brand that enhance your well-being while respecting the environment. We aim to inspire a conscious lifestyle through products that are pure, ethical, and effective.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="mr-3 h-6 w-6 text-primary" /> Our Values
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Purity:</strong> Using the finest natural and organic ingredients.</li>
              <li><strong>Sustainability:</strong> Committing to eco-friendly packaging and practices.</li>
              <li><strong>Integrity:</strong> Being transparent about our ingredients and processes.</li>
              <li><strong>Cruelty-Free:</strong> Ensuring no Earth Puran products are tested on animals.</li>
              <li><strong>Customer Focus:</strong> Prioritizing the satisfaction and well-being of our community.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-secondary/20 dark:bg-secondary/10">
        <CardHeader>
            <CardTitle className="text-center text-xl">Join the Earth Puran Family</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
            <p>We are more than just a brand; we are a community passionate about natural beauty and conscious living. Explore our exclusive Earth Puran collection and experience the difference.</p>
        </CardContent>
      </Card>
    </div>
  );
}

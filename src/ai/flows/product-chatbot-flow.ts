
'use server';
/**
 * @fileOverview Provides an AI chatbot for answering product-related questions.
 *
 * - productChatbot - A function that handles chatbot interactions.
 * - ProductChatbotInput - The input type for the productChatbot function.
 * - ProductChatbotOutput - The return type for the productChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getProducts } from '@/app/actions/productActions'; // Import getProducts

const ProductChatbotInputSchema = z.object({
  question: z.string().describe('The user_s question about Earth Puran products.'),
});
export type ProductChatbotInput = z.infer<typeof ProductChatbotInputSchema>;

const ProductChatbotOutputSchema = z.object({
  answer: z.string().describe('The AI_s answer to the user_s question.'),
});
export type ProductChatbotOutput = z.infer<typeof ProductChatbotOutputSchema>;

export async function productChatbot(input: ProductChatbotInput): Promise<ProductChatbotOutput> {
  return productChatbotFlow(input);
}

const PromptInputSchema = z.object({
  question: ProductChatbotInputSchema.shape.question,
  inventoryList: z.string().describe('A comma-separated list of available Earth Puran product names.'),
});

const prompt = ai.definePrompt({
  name: 'productChatbotPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: ProductChatbotOutputSchema},
  prompt: `You are a friendly and knowledgeable AI assistant for Earth Puran.
Earth Puran is a brand that exclusively sells high-quality, natural, and organic beauty products.
Your role is to answer customer questions about Earth Puran products, their benefits, general ingredient information (related to natural/organic products), and how to use them.

Here is a list of current Earth Puran products available in our inventory:
{{{inventoryList}}}

Key instructions:
- Always maintain a polite and helpful tone.
- Base your answers primarily on the products listed in the "inventoryList" above.
- If a user asks about a product NOT in the "inventoryList", politely state that you don't have specific information on that product at the moment, or that it might not be an Earth Puran product we currently offer. Do not make up information about products not listed.
- Do not mention or recommend products from other brands.
- If you don't know the answer to a very specific product detail that hasn't been provided to you (even for listed products), it's okay to say you don't have that specific information and suggest the user check the product page on the Earth Puran website or contact customer support.
- Do not make up information. If a question is outside your scope (e.g., medical advice, personal opinions), politely decline to answer.

User's question: {{{question}}}

Please provide a helpful answer based on the available Earth Puran products and the instructions above.`,
});

const productChatbotFlow = ai.defineFlow(
  {
    name: 'productChatbotFlow',
    inputSchema: ProductChatbotInputSchema, // External input remains simple
    outputSchema: ProductChatbotOutputSchema,
  },
  async (input) => {
    const products = await getProducts();
    const productNamesString = products.length > 0 
      ? products.map(p => p.name).join(', ') 
      : "Currently, we don't have a specific list of products to show from our inventory system.";

    const {output} = await prompt({
      question: input.question,
      inventoryList: productNamesString,
    });

    if (!output) {
      return { answer: "I'm sorry, I couldn't generate a response at this moment. Please try again." };
    }
    return output;
  }
);

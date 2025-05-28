
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

const ProductChatbotInputSchema = z.object({
  question: z.string().describe('The user_s question about Earth Puran products.'),
  // Optional: In a more advanced version, you could include chat history or specific product context.
  // chatHistory: z.array(z.object({sender: z.enum(['user', 'ai']), message: z.string()})).optional(),
});
export type ProductChatbotInput = z.infer<typeof ProductChatbotInputSchema>;

const ProductChatbotOutputSchema = z.object({
  answer: z.string().describe('The AI_s answer to the user_s question.'),
});
export type ProductChatbotOutput = z.infer<typeof ProductChatbotOutputSchema>;

export async function productChatbot(input: ProductChatbotInput): Promise<ProductChatbotOutput> {
  return productChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productChatbotPrompt',
  input: {schema: ProductChatbotInputSchema},
  output: {schema: ProductChatbotOutputSchema},
  prompt: `You are a friendly and knowledgeable AI assistant for Earth Puran.
Earth Puran is a brand that exclusively sells high-quality, natural, and organic beauty products.
Your role is to answer customer questions about Earth Puran products, their benefits, general ingredient information (related to natural/organic products), and how to use them.

Key instructions:
- Always maintain a polite and helpful tone.
- Focus exclusively on Earth Puran products. Do not mention or recommend products from other brands.
- If you don't know the answer to a very specific product detail that hasn't been provided to you, it's okay to say you don't have that specific information and suggest the user check the product page on the Earth Puran website or contact customer support.
- Do not make up information. If a question is outside your scope (e.g., medical advice, personal opinions), politely decline to answer.

User's question: {{{question}}}

Please provide a helpful answer.`,
});

const productChatbotFlow = ai.defineFlow(
  {
    name: 'productChatbotFlow',
    inputSchema: ProductChatbotInputSchema,
    outputSchema: ProductChatbotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return { answer: "I'm sorry, I couldn't generate a response at this moment. Please try again." };
    }
    return output;
  }
);

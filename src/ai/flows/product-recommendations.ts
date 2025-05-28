'use server';

/**
 * @fileOverview Provides personalized product recommendations based on user browsing history and preferences.
 *
 * - getProductRecommendations - A function that generates personalized product recommendations.
 * - ProductRecommendationsInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationsOutput - The return type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('A description of the user\u2019s product preferences.'),
  browsingHistory: z.string().describe('The user\u2019s browsing history.'),
  trendingProducts: z.string().describe('Currently trending products.'),
});
export type ProductRecommendationsInput = z.infer<typeof ProductRecommendationsInputSchema>;

const ProductRecommendationsOutputSchema = z.object({
  recommendedProducts: z.array(z.string()).describe('A list of recommended products.'),
  reasoning: z.string().describe('The reasoning behind the product recommendations.'),
});
export type ProductRecommendationsOutput = z.infer<typeof ProductRecommendationsOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  return productRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productRecommendationsPrompt',
  input: {schema: ProductRecommendationsInputSchema},
  output: {schema: ProductRecommendationsOutputSchema},
  prompt: `You are an expert e-commerce product recommender.

  Based on the user's preferences, browsing history, and trending products, you will recommend a list of products that the user might be interested in.

  User Preferences: {{{userPreferences}}}
  Browsing History: {{{browsingHistory}}}
  Trending Products: {{{trendingProducts}}}

  Reasoning: Explain why you are recommending these products.
  Recommended Products: A list of product names that the user might be interested in.
  `,
});

const productRecommendationsFlow = ai.defineFlow(
  {
    name: 'productRecommendationsFlow',
    inputSchema: ProductRecommendationsInputSchema,
    outputSchema: ProductRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

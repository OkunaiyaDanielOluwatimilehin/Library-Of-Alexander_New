import * as contentful from "contentful";

// Statically access VITE_ variables so Vite bundler replaces them at build time
const space = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CONTENTFUL_SPACE_ID) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_CONTENTFUL_SPACE_ID || process.env.CONTENTFUL_SPACE_ID));

const accessToken = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_CONTENTFUL_ACCESS_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN));

const environment = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CONTENTFUL_ENVIRONMENT) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_CONTENTFUL_ENVIRONMENT || process.env.CONTENTFUL_ENVIRONMENT)) ||
  "master";

export const contentfulClient = (space && accessToken) 
  ? contentful.createClient({
      space,
      accessToken,
      environment,
    })
  : null;

// Helper to fetch entries directly on client side if needed
export const fetchEntries = async <T>(contentType: string, queryParams: any = {}) => {
  if (!contentfulClient) {
    console.warn("Contentful client not initialized. Missing API keys.");
    return [];
  }
  
  try {
    const response = await contentfulClient.getEntries({
      content_type: contentType,
      ...queryParams,
    });
    return response.items as unknown as T[];
  } catch (error) {
    console.error("Error fetching from Contentful:", error);
    return [];
  }
};

import { extractTextFromRichText } from './utils';
import { Book, BlogPost, RankingList, Author, OriginalBook, Category, HomepageConfig } from './types';
import { fetchEntries as fetchContentfulDirect, contentfulClient } from './lib/contentful';

export const fetchEntries = async <T>(contentType: string, params: Record<string, any> = {}): Promise<T[]> => {
  const queryParams = new URLSearchParams({
    content_type: contentType,
    ...params,
  });
  
  try {
    const res = await fetch(`/api/cms/entries?${queryParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return processRichText(data.items);
      }
    }
  } catch (error) {
    console.warn(`API server fetch failed for ${contentType}, falling back to direct client fetch:`, error);
  }

  // Direct client fallback for localhost or client SPA mode
  try {
    const directItems = await fetchContentfulDirect<T>(contentType, params);
    return processRichText(directItems || []);
  } catch (err) {
    console.error(`Direct Contentful fetch failed for ${contentType}:`, err);
    return [];
  }
};

export const fetchEntry = async <T>(id: string): Promise<T | null> => {
  try {
    const res = await fetch(`/api/cms/entry/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return processRichText(data);
      }
    }
  } catch (error) {
    console.warn(`API server fetch failed for entry ${id}, falling back to direct client fetch:`, error);
  }

  // Direct client fallback
  if (contentfulClient) {
    try {
      const entry = await contentfulClient.getEntry(id);
      return processRichText(entry);
    } catch (e) {
      console.error(`Error fetching entry ${id}:`, e);
    }
  }

  return null;
};

function processRichText(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(processRichText);
  if (typeof obj === 'object') {
    if (obj.nodeType === 'document') {
      return extractTextFromRichText(obj);
    }
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = processRichText(obj[key]);
    }
    return newObj;
  }
  return obj;
}

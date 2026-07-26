import { Book } from './types';

export function getBookUrl(book: Book): string {
  if (!book) return '#';
  const slug = book.fields?.slug;
  if (slug) {
    const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    return `/books/${safeSlug}-${book.sys.id}`;
  }
  if (book.fields?.title && book.sys?.id) {
    const titleSlug = String(book.fields.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return `/books/${titleSlug}-${book.sys.id}`;
  }
  return `/books/${book.sys?.id}`;
}

export function getImageUrl(url: string | any): string {
  if (!url) return '';
  if (Array.isArray(url) && url.length > 0) {
    return getImageUrl(url[0]);
  }
  if (typeof url === 'string') {
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    return url;
  }
  if (url?.fields?.file?.url) {
    if (url.fields.file.url.startsWith('//')) {
      return `https:${url.fields.file.url}`;
    }
    return url.fields.file.url;
  }
  return '';
}

export function extractTextFromRichText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.nodeType === 'text') return node.value || '';
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromRichText).join(node.nodeType === 'paragraph' ? '\n\n' : '');
  }
  return '';
}

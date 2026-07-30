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

export function contentToMarkdown(content: any): string {
  if (!content) return '';

  if (typeof content === 'string') {
    const trimmed = content.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return contentToMarkdown(parsed);
        }
      } catch (e) {
        // Not valid JSON, return raw string as markdown
      }
    }
    let res = content.replace(/\r\n/g, '\n');
    if (!res.includes('\n\n') && res.includes('\n')) {
      res = res.replace(/\n+/g, '\n\n');
    }
    return res;
  }

  if (typeof content !== 'object') return String(content);

  // If nodeType is text
  if (content.nodeType === 'text') {
    let val = content.value || '';
    if (Array.isArray(content.marks)) {
      for (const mark of content.marks) {
        if (mark.type === 'bold') val = `**${val}**`;
        else if (mark.type === 'italic') val = `*${val}*`;
        else if (mark.type === 'code') val = `\`${val}\``;
        else if (mark.type === 'underline') val = `<u>${val}</u>`;
      }
    }
    return val;
  }

  // Hyperlink
  if (content.nodeType === 'hyperlink') {
    const linkText = Array.isArray(content.content)
      ? content.content.map(contentToMarkdown).join('')
      : '';
    const uri = content.data?.uri || '#';
    return `[${linkText}](${uri})`;
  }

  // Embedded asset
  if (content.nodeType === 'embedded-asset-block') {
    const imgUrl = getImageUrl(content.data?.target);
    const title = content.data?.target?.fields?.title || 'Embedded Image';
    return imgUrl ? `\n\n![${title}](${imgUrl})\n\n` : '';
  }

  // HR
  if (content.nodeType === 'hr') {
    return '\n\n---\n\n';
  }

  // Process children if content is an array
  if (Array.isArray(content.content)) {
    const children = content.content.map(contentToMarkdown);

    switch (content.nodeType) {
      case 'document':
        return children.join('\n\n');
      case 'paragraph':
        return children.join('');
      case 'heading-1':
        return `# ${children.join('')}`;
      case 'heading-2':
        return `## ${children.join('')}`;
      case 'heading-3':
        return `### ${children.join('')}`;
      case 'heading-4':
        return `#### ${children.join('')}`;
      case 'heading-5':
        return `##### ${children.join('')}`;
      case 'heading-6':
        return `###### ${children.join('')}`;
      case 'unordered-list':
        return children.map(item => item.startsWith('- ') ? item : `- ${item}`).join('\n');
      case 'ordered-list':
        return children.map((item, i) => `${i + 1}. ${item}`).join('\n');
      case 'list-item':
        return children.join(' ').trim();
      case 'blockquote':
        return children.map(line => `> ${line}`).join('\n');
      default:
        return children.join('\n\n');
    }
  }

  return '';
}

export function extractTextFromRichText(node: any): string {
  if (!node) return '';
  const markdown = contentToMarkdown(node);
  // Strip markdown tags if pure text is needed
  return markdown.replace(/[*_#`~[\]()]/g, '').trim();
}

export function extractCategoryNames(cat: any): string[] {
  if (!cat) return [];

  if (typeof cat === 'string') {
    const trimmed = cat.trim();
    if (!trimmed || trimmed === '[object Object]') return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.flatMap(extractCategoryNames);
      } catch (e) {}
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }

  if (Array.isArray(cat)) {
    return cat.flatMap(extractCategoryNames);
  }

  if (typeof cat === 'object' && cat !== null) {
    if (cat.fields && typeof cat.fields === 'object') {
      const f = cat.fields;
      const priority = f.name || f.title || f.categoryName || f.categoryTag || f.category || f.tag || f.slug || f.Name || f.Title;
      if (priority) {
        const extracted = extractCategoryNames(priority);
        if (extracted.length > 0) return extracted;
      }
      for (const k of Object.keys(f)) {
        const val = f[k];
        if (typeof val === 'string' && val.trim() && val !== '[object Object]') {
          return [val.trim()];
        }
        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          const res = extractCategoryNames(val);
          if (res.length > 0) return res;
        }
      }
    }

    if (cat.name) return extractCategoryNames(cat.name);
    if (cat.title) return extractCategoryNames(cat.title);
    if (cat.categoryName) return extractCategoryNames(cat.categoryName);
    if (cat.categoryTag) return extractCategoryNames(cat.categoryTag);
    if (cat.category) return extractCategoryNames(cat.category);
    if (cat.tag) return extractCategoryNames(cat.tag);
    if (cat.value) return extractCategoryNames(cat.value);

    const vals = Object.values(cat);
    if (vals.length > 0) {
      const res = vals.flatMap(extractCategoryNames);
      if (res.length > 0) return res;
    }

    if (cat.sys && cat.sys.id && typeof cat.sys.id === 'string' && !cat.sys.id.startsWith('c_')) {
      return [cat.sys.id];
    }
  }

  return [];
}

export function getPostCategories(p: any): string[] {
  if (!p || !p.fields) return [];
  const f = p.fields as any;

  const candidates: any[] = [
    f.category,
    f.categoryTag,
    f.category_tag,
    f.categoryName,
    f.category_name,
    f["category tag"],
    f["Category Tag"],
    f.categories,
    f.tags,
    f.topic,
    f.topics,
    f.Category,
    f.CategoryTag,
    f.CategoryName,
    f.Tag,
    f.Tags,
  ];

  for (const key of Object.keys(f)) {
    const lkey = key.toLowerCase();
    if (lkey.includes('cat') || lkey.includes('tag')) {
      candidates.push(f[key]);
    }
  }

  for (const raw of candidates) {
    if (raw !== undefined && raw !== null) {
      const extracted = extractCategoryNames(raw);
      const valid = extracted.filter(c => c && c.toUpperCase() !== 'GENERAL' && c !== '[object Object]');
      if (valid.length > 0) return valid;
    }
  }

  return [];
}

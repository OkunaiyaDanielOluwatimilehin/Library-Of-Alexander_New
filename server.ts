import 'dotenv/config';
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as contentful from "contentful";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Contentful client safely
const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID || process.env.VITE_CONTENTFUL_SPACE_ID;
const contentfulAccessToken = process.env.CONTENTFUL_ACCESS_TOKEN || process.env.VITE_CONTENTFUL_ACCESS_TOKEN;
const contentfulEnvironment = process.env.CONTENTFUL_ENVIRONMENT || process.env.VITE_CONTENTFUL_ENVIRONMENT || "master";

let client: contentful.ContentfulClientApi<undefined> | null = null;
if (contentfulSpaceId && contentfulAccessToken) {
  client = contentful.createClient({
    space: contentfulSpaceId,
    accessToken: contentfulAccessToken,
    environment: contentfulEnvironment,
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Ratings API endpoints
app.get("/api/ratings/:bookId", async (req, res) => {
  if (!supabase) {
    return res.json({ average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
  }
  
  try {
    let count = 0;
    let sum = 0;
    const breakdown: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };

    // Try 'ratings' table first
    const { data: ratingsData, error: rErr } = await supabase
      .from('ratings')
      .select('rating')
      .eq('book_id', req.params.bookId);
      
    if (!rErr && ratingsData && ratingsData.length > 0) {
      ratingsData.forEach((r: any) => {
        const val = Number(r.rating);
        if (val >= 1 && val <= 5) {
          count++;
          sum += val;
          breakdown[val] = (breakdown[val] || 0) + 1;
        }
      });
    } else {
      // Fallback to 'comments' table
      const { data: commentsData } = await supabase
        .from('comments')
        .select('comment')
        .eq('name', 'RATING')
        .eq('content_key', req.params.bookId);

      if (commentsData) {
        commentsData.forEach((r: any) => {
          const val = parseInt(r.comment);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            count++;
            sum += val;
            breakdown[val] = (breakdown[val] || 0) + 1;
          }
        });
      }
    }
    
    const average = count > 0 ? sum / count : 0;
    res.json({ average, count, breakdown });
  } catch (error) {
    res.json({ average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
  }
});

app.post("/api/ratings/:bookId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid rating" });
  }
  
  try {
    const { error: rErr } = await supabase
      .from('ratings')
      .insert([{ book_id: req.params.bookId, rating: Number(rating) }]);
      
    if (rErr) {
      const { error: cErr } = await supabase
        .from('comments')
        .insert([{ content_key: req.params.bookId, name: 'RATING', comment: String(rating) }]);
      if (cErr) throw cErr;
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit rating", details: error.message });
  }
});

// Reviews API endpoints
app.get("/api/reviews/:bookId", async (req, res) => {
  if (!supabase) {
    return res.json([]);
  }
  
  try {
    const { data: reviewsData, error: rErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('book_id', req.params.bookId)
      .order('created_at', { ascending: false });
      
    if (!rErr && reviewsData && reviewsData.length > 0) {
      return res.json(reviewsData);
    }

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('content_key', req.params.bookId)
      .neq('name', 'RATING')
      .order('created_at', { ascending: false });
      
    if (commentsData) {
      const mapped = commentsData.map((c: any) => ({
        id: c.id,
        book_id: c.content_key,
        author_name: c.name,
        content: c.comment,
        created_at: c.created_at
      }));
      return res.json(mapped);
    }

    res.json([]);
  } catch (error) {
    res.json([]);
  }
});

app.post("/api/reviews/:bookId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  
  const { author_name, content } = req.body;
  if (!author_name || !content) {
    return res.status(400).json({ error: "Missing author_name or content" });
  }
  
  try {
    const { data: rData, error: rErr } = await supabase
      .from('reviews')
      .insert([{ book_id: req.params.bookId, author_name, content }])
      .select();
      
    if (!rErr && rData && rData.length > 0) {
      return res.json(rData[0]);
    }

    const { data: cData, error: cErr } = await supabase
      .from('comments')
      .insert([{ content_key: req.params.bookId, name: author_name, comment: content }])
      .select();

    if (cErr) throw cErr;

    const mapped = {
      id: cData[0].id,
      book_id: cData[0].content_key,
      author_name: cData[0].name,
      content: cData[0].comment,
      created_at: cData[0].created_at
    };
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit review", details: error.message });
  }
});

// Shelf Progress API endpoints
app.get("/api/progress/:bookId", async (req, res) => {
  if (!supabase) {
    return res.json({ want_to_read: 0, reading: 0, completed: 0 });
  }
  
  try {
    const counts = { want_to_read: 0, reading: 0, completed: 0 };

    const { data: pData, error: pErr } = await supabase
      .from('shelf_progress')
      .select('status')
      .eq('book_id', req.params.bookId);

    if (!pErr && pData && pData.length > 0) {
      pData.forEach((r: any) => {
        if (r.status === 'want_to_read') counts.want_to_read++;
        if (r.status === 'reading') counts.reading++;
        if (r.status === 'completed') counts.completed++;
      });
      return res.json(counts);
    }

    const { data: rData } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('content_key', req.params.bookId);

    if (rData) {
      rData.forEach((r: any) => {
        if (r.reaction_type === 'like' || r.reaction_type === 'want_to_read') counts.want_to_read++;
        if (r.reaction_type === 'love' || r.reaction_type === 'reading') counts.reading++;
        if (r.reaction_type === 'fire' || r.reaction_type === 'completed') counts.completed++;
      });
    }

    res.json(counts);
  } catch (error) {
    res.json({ want_to_read: 0, reading: 0, completed: 0 });
  }
});

app.post("/api/progress/:bookId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  
  const { status } = req.body;
  if (!status || !['want_to_read', 'reading', 'completed'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  
  try {
    const { error: pErr } = await supabase
      .from('shelf_progress')
      .insert([{ book_id: req.params.bookId, status }]);

    if (pErr) {
      const mappedStatus = status === 'want_to_read' ? 'like' : status === 'reading' ? 'love' : 'fire';
      const { error: rErr } = await supabase
        .from('reactions')
        .insert([{ content_key: req.params.bookId, reaction_type: mappedStatus, fingerprint: req.ip || 'anonymous' }]);
      if (rErr) throw rErr;
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update progress", details: error.message });
  }
});

// API proxy endpoints for Contentful
app.get("/api/cms/entries", async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: "Contentful client not initialized", items: [] });
  }
  
  try {
    const query: any = {};
    const qs = req.url.split('?')[1];
    if (qs) {
      const urlParams = new URLSearchParams(qs);
      for (const [key, value] of urlParams.entries()) {
        if (key === 'limit' || key === 'include') {
          query[key] = Number(value);
        } else if (value === 'true') {
          query[key] = true;
        } else if (value === 'false') {
          query[key] = false;
        } else {
          query[key] = value;
        }
      }
    }

    const entries = await client.getEntries(query);
    res.json(entries);
  } catch (error) {
    console.error("Contentful error:", error);
    res.status(500).json({ error: "Failed to fetch from CMS", items: [] });
  }
});

app.get("/api/cms/entry/:id", async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: "Contentful client not initialized" });
  }
  
  try {
    const entry = await client.getEntry(req.params.id);
    res.json(entry);
  } catch (error) {
    console.error("Contentful error:", error);
    res.status(500).json({ error: "Failed to fetch entry", items: [] });
  }
});

// Dynamic Open Graph Meta Tag Injection for Social Sharing (WhatsApp, Twitter, Facebook)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff2?)$/)) {
    return next();
  }

  if (req.path.startsWith('/blog/')) {
    const slug = req.path.replace('/blog/', '').trim();
    if (slug && client) {
      try {
        const entries = await client.getEntries({
          content_type: 'blogPost',
          'fields.slug': slug,
          limit: 1,
        });

        if (entries.items && entries.items.length > 0) {
          const item: any = entries.items[0];
          const rawTitle = String(item.fields.title || 'Library of Alexander');
          const title = rawTitle.replace(/"/g, '&quot;');
          const rawSummary = String(item.fields.summary || item.fields.excerpt || 'Read this article on Library of Alexander.');
          const summary = rawSummary.replace(/"/g, '&quot;');
          
          let imageUrl = '';
          const rawImage = item.fields.coverImage || item.fields.imageUrl;
          if (rawImage?.fields?.file?.url) {
            const urlStr = String(rawImage.fields.file.url);
            imageUrl = urlStr.startsWith('//') ? `https:${urlStr}` : urlStr;
          }

          const ogTags = `
    <title>${title} | Library of Alexander</title>
    <meta name="description" content="${summary}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${summary}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${summary}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}
          `;

          const indexPath = process.env.NODE_ENV === 'production' 
            ? path.join(process.cwd(), 'dist', 'index.html') 
            : path.join(process.cwd(), 'index.html');

          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            html = html.replace(/<title>.*?<\/title>/, ogTags);
            return res.send(html);
          }
        }
      } catch (e) {
        console.error("OG tag injection error:", e);
      }
    }
  }
  next();
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

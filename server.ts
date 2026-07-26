import 'dotenv/config';
import express from "express";
import path from "path";
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
    const { data, error } = await supabase
      .from('comments').select('comment').eq('name', 'RATING')
      .eq('content_key', req.params.bookId);
      
    
    if (error) {
      
      return res.json({ average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
    }
    
    if (!data || data.length === 0) {
      return res.json({ average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
    }
    
    let count = 0;
    let sum = 0;
    const breakdown = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    
    data.forEach(r => {
      const val = parseInt(r.comment);
      if (!isNaN(val) && val >= 1 && val <= 5) {
        count++;
        sum += val;
        breakdown[val]++;
      }
    });
    
    const average = count > 0 ? sum / count : 0;
    
    res.json({ average, count, breakdown });
  } catch (error) {
    
    res.status(500).json({ error: "Failed to fetch ratings" });
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
    const { error } = await supabase
      .from('comments').insert([{ content_key: req.params.bookId, name: 'RATING', comment: String(rating) }]);
      
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    
    res.status(500).json({ error: "Failed to submit rating", details: error.message });
  }
});

// Reviews API endpoints
app.get("/api/reviews/:bookId", async (req, res) => {
  if (!supabase) {
    return res.json([]);
  }
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_key', req.params.bookId)
      .neq('name', 'RATING')
      .order('created_at', { ascending: false });
      
    if (error) {
      
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    
    res.status(500).json({ error: "Failed to fetch reviews" });
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
    const { data, error } = await supabase
      .from('comments')
      .insert([
        { content_key: req.params.bookId, name: author_name, comment: content }
      ])
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    
    res.status(500).json({ error: "Failed to submit review", details: error.message });
  }
});

// Shelf Progress API endpoints
app.get("/api/progress/:bookId", async (req, res) => {
  if (!supabase) {
    return res.json({ want_to_read: 0, reading: 0, completed: 0 });
  }
  
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('content_key', req.params.bookId)
      .in('reaction_type', ['like', 'love', 'fire']);
      
    if (error) {
      return res.json({ want_to_read: 0, reading: 0, completed: 0 });
    }
    
    const counts = { want_to_read: 0, reading: 0, completed: 0 };
    if (data) {
      data.forEach(r => {
        if (r.reaction_type === 'like') counts.want_to_read++;
        if (r.reaction_type === 'love') counts.reading++;
        if (r.reaction_type === 'fire') counts.completed++;
      });
    }
    
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress" });
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
  
  const mappedStatus = status === 'want_to_read' ? 'like' : status === 'reading' ? 'love' : 'fire';
  
  try {
    // Delete existing reaction from this IP/fingerprint to simulate "upsert" or distinct progress state
    await supabase
      .from('reactions')
      .delete()
      .eq('content_key', req.params.bookId)
      .eq('fingerprint', req.ip || 'anonymous');
      
    const { error } = await supabase
      .from('reactions')
      .insert([
        { content_key: req.params.bookId, reaction_type: mappedStatus, fingerprint: req.ip || 'anonymous' }
      ]);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
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

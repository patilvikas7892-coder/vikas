import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { DISTRICT_DATABASE, BIS_STANDARDS } from './src/data/groundwaterData.ts';
import { INITIAL_COMMUNITY_ALERTS } from './src/data/communityAlertsData.ts';
import { CommunityAlert } from './src/types.ts';

let communityAlerts: CommunityAlert[] = [...INITIAL_COMMUNITY_ALERTS];

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize server-side Gemini client with required telemetry User-Agent
const rawApiKey = process.env.GEMINI_API_KEY || '';
const apiKey = rawApiKey && rawApiKey !== 'MY_GEMINI_API_KEY' ? rawApiKey : '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// System instruction for Jal-Jeevan groundwater specialist
const SYSTEM_INSTRUCTION = `You are "Jal-Doot" (Water Messenger), an expert senior hydrogeologist, water quality engineer, and conservation advisor dedicated to the Jal Jeevan initiative.
You provide precise, science-backed, actionable advice on:
1. Groundwater table levels, aquifer recharge, and stage of groundwater extraction (CGWB standards: Safe <70%, Semi-Critical 70-90%, Critical 90-100%, Over-Exploited >100%).
2. Drinking water quality according to Bureau of Indian Standards (BIS IS 10500:2012) and WHO benchmarks:
   - TDS (Desirable <500 mg/L, Max 2000 mg/L)
   - pH (6.5 to 8.5)
   - Fluoride (Desirable <1.0 mg/L, Max 1.5 mg/L; warning on dental & skeletal fluorosis)
   - Nitrate (Max 45 mg/L; warning on infant methemoglobinemia / Blue Baby syndrome)
   - Arsenic (Strict Max 0.01 mg/L / 10 ppb; carcinogen alert)
   - Hardness (Desirable <200 mg/L, Max 600 mg/L)
   - Iron (Max 1.0 mg/L)
3. Practical, cost-effective conservation and artificial recharge techniques:
   - Rooftop Rainwater Harvesting (RWH) and calculation of harvestable volume
   - Recharge pits and filter trenches for borewells (gravel, coarse sand, charcoal, boulder layers)
   - Farm ponds, percolation tanks, and check dams for rural / peri-urban farmers
   - Micro-irrigation (Drip / Sprinkler saving 40-60% groundwater)
   - Rational water purification: Warn when RO is unnecessary and wasteful (e.g., if TDS is already under 300-400 ppm, RO wastes 60-70% water and strips healthy minerals like Calcium and Magnesium). Recommend Activated Alumina for Fluoride, Iron Removal Units (IRU) for Iron, and simple filtration/UV when heavy metals are absent.

Tone & Style:
- Warm, knowledgeable, authoritative, yet easy to understand for ordinary homeowners, farmers, and community leaders.
- Use formatting effectively: bullet points, clear bold headings, metric units (ppm, mg/L, m BGL, liters), and alert badges (e.g. ⚠️ HEALTH ADVISORY, 💡 CONSERVATION ACTION).
- If the user asks in Hindi, Kannada, Telugu, Tamil, Marathi, Bengali, or Gujarati, or requests a specific language, respond in that language warmly while keeping technical terms clear.
- Ground your answers in real Indian hydrogeology (Central Ground Water Board, Jal Shakti Ministry, Atal Bhujal Yojana).
`;

// API: Groundwater District Directory
app.get('/api/districts', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const category = (req.query.category as string || '').trim();

  let filtered = DISTRICT_DATABASE;

  if (category && category !== 'All') {
    filtered = filtered.filter((d) => d.cgwbCategory.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    filtered = filtered.filter(
      (d) =>
        d.district.toLowerCase().includes(query) ||
        d.state.toLowerCase().includes(query) ||
        d.keyContaminants.some((c) => c.toLowerCase().includes(query)) ||
        d.primaryAquiferType.toLowerCase().includes(query)
    );
  }

  res.json({
    total: filtered.length,
    districts: filtered,
    bisStandards: BIS_STANDARDS,
  });
});

// API: Specific District Details
app.get('/api/districts/:id', (req: Request, res: Response) => {
  const district = DISTRICT_DATABASE.find(
    (d) => d.id.toLowerCase() === req.params.id.toLowerCase()
  );
  if (!district) {
    return res.status(404).json({ error: 'District not found in database' });
  }
  return res.json(district);
});

// API: Get Community Alerts (filtered by district, category, status, or search query)
app.get('/api/alerts', (req: Request, res: Response) => {
  const district = (req.query.district as string || '').trim().toLowerCase();
  const category = (req.query.category as string || '').trim();
  const severity = (req.query.severity as string || '').trim();
  const status = (req.query.status as string || '').trim();
  const query = (req.query.q as string || '').trim().toLowerCase();

  let filtered = [...communityAlerts];

  if (district && district !== 'all') {
    filtered = filtered.filter(
      (a) => a.district.toLowerCase() === district || a.district.toLowerCase().includes(district)
    );
  }

  if (category && category !== 'All') {
    filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }

  if (severity && severity !== 'All') {
    filtered = filtered.filter((a) => a.severity.toLowerCase() === severity.toLowerCase());
  }

  if (status && status !== 'All') {
    filtered = filtered.filter((a) => a.status.toLowerCase() === status.toLowerCase());
  }

  if (query) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.locality.toLowerCase().includes(query) ||
        a.district.toLowerCase().includes(query)
    );
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    total: filtered.length,
    alerts: filtered,
  });
});

// API: Post a new Community Alert
app.post('/api/alerts', (req: Request, res: Response) => {
  const {
    title,
    category,
    severity,
    district,
    state,
    locality,
    description,
    reportedBy,
    authorRole,
    authorOrganization,
    metrics,
    actionAdvised,
  } = req.body;

  if (!title || !district || !description) {
    return res.status(400).json({ error: 'Title, district, and description are required.' });
  }

  const newAlert: CommunityAlert = {
    id: `alert-${Date.now()}`,
    title: title.trim(),
    category: category || 'Chemical Contamination',
    severity: severity || 'Warning',
    status: 'Open',
    district: district.trim(),
    state: state || 'India',
    locality: locality ? locality.trim() : 'Locality not specified',
    description: description.trim(),
    reportedBy: reportedBy || 'Concerned Citizen',
    authorRole: authorRole || 'citizen',
    authorOrganization,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    upvotes: 1,
    upvotedBy: reportedBy ? [reportedBy] : [],
    verifiedByOfficial: authorRole === 'officer' || authorRole === 'technician',
    officialNote: authorRole === 'officer' ? 'Report filed by registered groundwater officer.' : undefined,
    metrics: metrics || {},
    actionAdvised,
  };

  communityAlerts.unshift(newAlert);
  return res.status(201).json(newAlert);
});

// API: Upvote/Confirm an alert
app.post('/api/alerts/:id/upvote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  const alertIndex = communityAlerts.findIndex((a) => a.id === id);
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const alert = communityAlerts[alertIndex];
  const userIdentifier = userId || 'anonymous-citizen';

  const alreadyUpvoted = alert.upvotedBy.includes(userIdentifier);
  if (alreadyUpvoted) {
    // Remove upvote
    alert.upvotes = Math.max(0, alert.upvotes - 1);
    alert.upvotedBy = alert.upvotedBy.filter((u) => u !== userIdentifier);
  } else {
    // Add upvote
    alert.upvotes += 1;
    alert.upvotedBy.push(userIdentifier);
  }

  return res.json({ upvotes: alert.upvotes, upvoted: !alreadyUpvoted });
});

// API: Verify or add official advisory to an alert
app.post('/api/alerts/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { officialNote, status, actionAdvised } = req.body;

  const alert = communityAlerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  alert.verifiedByOfficial = true;
  if (officialNote) alert.officialNote = officialNote;
  if (status) alert.status = status;
  if (actionAdvised) alert.actionAdvised = actionAdvised;

  return res.json(alert);
});

// API: Chat with Gemini 3.8 Flash (Streaming via SSE)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { messages, districtContext, userLanguage } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // If no API key configured, provide structured hydrogeologist fallback
  if (!ai) {
    const fallbackText = `**Notice**: Gemini API key is currently loading or unattached. 

Here is immediate hydrogeological guidance based on verified **CGWB (Central Ground Water Board)** data:

${districtContext ? `### Analysis for Selected Region:\n${districtContext}\n\n` : ''}
* **Safe Drinking Water Thresholds (BIS IS 10500:2012)**:
  - **TDS**: <500 mg/L desirable (Max 2,000 mg/L). If TDS < 300, DO NOT use RO (wastes up to 70% water and depletes calcium/magnesium).
  - **Fluoride**: Max 1.0 mg/L (dental/skeletal fluorosis danger above 1.5 mg/L).
  - **Nitrate**: Max 45 mg/L (Blue Baby syndrome risk for infants).
  - **Arsenic**: Max 0.01 mg/L (10 ppb) strictly.
* **Conservation Priority**: Implement Rooftop Rainwater Harvesting with dual-chamber sand & gravel filters to recharge your local borewell.`;

    res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  try {
    // Build context-rich prompt
    let contextualSystemPrompt = SYSTEM_INSTRUCTION;
    if (userLanguage && userLanguage !== 'English') {
      contextualSystemPrompt += `\nCRITICAL: Respond in ${userLanguage} language.`;
    }

    if (districtContext) {
      contextualSystemPrompt += `\n\nCURRENT DISTRICT CONTEXT GROUNDING:\n${districtContext}\nIncorporate these exact metrics and hydrogeological reality into your answer.`;
    }

    // Format conversation history for Gemini SDK: Gemini multi-turn requires starting with 'user'
    let validMessages = messages.filter((m: { role: string; content: string }) => m.content && m.content.trim().length > 0);
    while (validMessages.length > 0 && validMessages[0].role === 'assistant') {
      validMessages = validMessages.slice(1);
    }
    if (validMessages.length === 0) {
      validMessages = [{ role: 'user', content: 'Hello' }];
    }

    const formattedContents = validMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: contextualSystemPrompt,
        temperature: 0.65,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error('Gemini Stream Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown generation error';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

// Non-streaming fallback API
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, districtContext, userLanguage } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  if (!ai) {
    return res.json({
      reply: `Gemini API Key is not configured yet. Please configure GEMINI_API_KEY in the Secrets panel.`,
    });
  }

  try {
    let contextualSystemPrompt = SYSTEM_INSTRUCTION;
    if (userLanguage && userLanguage !== 'English') {
      contextualSystemPrompt += `\nCRITICAL: Respond in ${userLanguage} language.`;
    }
    if (districtContext) {
      contextualSystemPrompt += `\n\nCURRENT DISTRICT CONTEXT:\n${districtContext}`;
    }

    let validMessages = messages.filter((m: { role: string; content: string }) => m.content && m.content.trim().length > 0);
    while (validMessages.length > 0 && validMessages[0].role === 'assistant') {
      validMessages = validMessages.slice(1);
    }
    if (validMessages.length === 0) {
      validMessages = [{ role: 'user', content: 'Hello' }];
    }

    const formattedContents = validMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: contextualSystemPrompt,
      },
    });

    res.json({ reply: response.text || '' });
  } catch (err: unknown) {
    console.error('Gemini API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
    res.status(500).json({ error: errorMessage });
  }
});

// Start server and mount Vite
async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve compiled assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌊 Jal-Jeevan Groundwater Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

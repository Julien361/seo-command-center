const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const Anthropic = require('@anthropic-ai/sdk').default;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// MCP Tools definitions (basé sur tes MCPs existants)
const MCP_TOOLS = [
  {
    name: 'wordpress_get_posts',
    description: 'Récupère les articles d\'un site WordPress du portfolio',
    input_schema: {
      type: 'object',
      properties: {
        site_alias: { type: 'string', description: 'Alias du site WordPress (ex: srat, pro-formation)' },
        per_page: { type: 'number', description: 'Nombre d\'articles', default: 10 },
        status: { type: 'string', description: 'Statut des articles', default: 'publish' },
      },
      required: ['site_alias'],
    },
  },
  {
    name: 'wordpress_create_post',
    description: 'Crée un nouvel article sur un site WordPress',
    input_schema: {
      type: 'object',
      properties: {
        site_alias: { type: 'string', description: 'Alias du site WordPress' },
        title: { type: 'string', description: 'Titre de l\'article' },
        content: { type: 'string', description: 'Contenu HTML de l\'article' },
        status: { type: 'string', description: 'Statut (draft, publish)', default: 'draft' },
      },
      required: ['site_alias', 'title', 'content'],
    },
  },
  {
    name: 'supabase_query',
    description: 'Exécute une requête sur la base Supabase SEO Engine',
    input_schema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Nom de la table' },
        select: { type: 'string', description: 'Colonnes à sélectionner', default: '*' },
        limit: { type: 'number', description: 'Limite de résultats', default: 100 },
      },
      required: ['table'],
    },
  },
  {
    name: 'seo_keyword_analysis',
    description: 'Analyse SEO complète d\'un keyword : volume, difficulté, intent, concurrents',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Le keyword à analyser' },
        site_alias: { type: 'string', description: 'Alias du site' },
        location: { type: 'string', description: 'Localisation', default: 'France' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'quick_wins_detect',
    description: 'Détecte les opportunités quick win (position 11-20, volume > 100, difficulté < 40)',
    input_schema: {
      type: 'object',
      properties: {
        site_alias: { type: 'string', description: 'Alias du site ou "all"' },
        min_volume: { type: 'number', default: 100 },
        max_difficulty: { type: 'number', default: 40 },
      },
    },
  },
  {
    name: 'n8n_execute_workflow',
    description: 'Exécute un workflow n8n',
    input_schema: {
      type: 'object',
      properties: {
        workflow_id: { type: 'string', description: 'ID du workflow n8n' },
        inputs: { type: 'object', description: 'Données d\'entrée' },
      },
      required: ['workflow_id'],
    },
  },
  {
    name: 'n8n_list_workflows',
    description: 'Liste les workflows n8n disponibles',
    input_schema: {
      type: 'object',
      properties: {
        active_only: { type: 'boolean', default: true },
      },
    },
  },
];

// System prompt pour Claude
const SYSTEM_PROMPT = `Tu es l'assistant SEO de Julio Sikoutris. Tu gères un portfolio de 15 sites WordPress répartis sur 4 entités business :
- SRAT (diagnostic immobilier)
- PRO FORMATION (formations Qualiopi)
- METIS Digital (services seniors et annuaires)
- Sites d'actualités locales

Tu as accès aux outils suivants :
- WordPress : lire et créer des articles sur tous les sites
- Supabase : base de données SEO avec keywords, positions, articles
- n8n : workflows d'automatisation SEO
- Analyse SEO : keywords, quick wins, concurrents

Sois concis et efficace. Utilise les outils pour répondre aux questions et exécuter les actions demandées.`;

// Handler pour les tool calls (bridge vers MCP local via HTTP)
async function executeTool(toolName, toolInput) {
  const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${MCP_BRIDGE_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, input: toolInput }),
    });

    if (!response.ok) {
      throw new Error(`MCP Bridge error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Fallback: mock response pour démo
    console.log(`Tool ${toolName} called with:`, toolInput);
    return {
      success: true,
      message: `Tool ${toolName} exécuté (mode démo)`,
      data: toolInput
    };
  }
}

// WebSocket handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  let conversationHistory = [];

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'chat') {
        conversationHistory.push({
          role: 'user',
          content: message.content,
        });

        // Send typing indicator
        ws.send(JSON.stringify({ type: 'typing', status: true }));

        // Call Claude with tools
        let response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: MCP_TOOLS,
          messages: conversationHistory,
        });

        // Handle tool use loop
        while (response.stop_reason === 'tool_use') {
          const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
          const toolResults = [];

          for (const toolUse of toolUseBlocks) {
            // Notify frontend about tool execution
            ws.send(JSON.stringify({
              type: 'tool_use',
              tool: toolUse.name,
              input: toolUse.input,
            }));

            const result = await executeTool(toolUse.name, toolUse.input);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          }

          // Add assistant response and tool results to history
          conversationHistory.push({
            role: 'assistant',
            content: response.content,
          });
          conversationHistory.push({
            role: 'user',
            content: toolResults,
          });

          // Continue conversation
          response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: MCP_TOOLS,
            messages: conversationHistory,
          });
        }

        // Extract text response
        const textContent = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });

        ws.send(JSON.stringify({
          type: 'response',
          content: textContent,
        }));

        ws.send(JSON.stringify({ type: 'typing', status: false }));
      }

      if (message.type === 'clear') {
        conversationHistory = [];
        ws.send(JSON.stringify({ type: 'cleared' }));
      }
    } catch (error) {
      console.error('Error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message,
      }));
      ws.send(JSON.stringify({ type: 'typing', status: false }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// REST endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tools', (req, res) => {
  res.json(MCP_TOOLS);
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`SEO Command Center Backend running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});

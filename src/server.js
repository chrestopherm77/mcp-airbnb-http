import { handleAirbnbSearch } from './handlers/search.js';
import { handleAirbnbListingDetails } from './handlers/details.js';

// MCP Tools definitions
const TOOLS = [
  {
    name: "airbnb_search",
    description: "Search for Airbnb listings with various filters and pagination",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Location to search for (city, state, etc.)"
        },
        placeId: {
          type: "string",
          description: "Google Maps Place ID (overrides the location parameter)"
        },
        checkin: {
          type: "string",
          description: "Check-in date (YYYY-MM-DD)"
        },
        checkout: {
          type: "string",
          description: "Check-out date (YYYY-MM-DD)"
        },
        adults: {
          type: "number",
          description: "Number of adults"
        },
        children: {
          type: "number",
          description: "Number of children"
        },
        infants: {
          type: "number",
          description: "Number of infants"
        },
        pets: {
          type: "number",
          description: "Number of pets"
        },
        minPrice: {
          type: "number",
          description: "Minimum price for the stay"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price for the stay"
        },
        cursor: {
          type: "string",
          description: "Base64-encoded string used for pagination"
        }
      },
      required: ["location"]
    }
  },
  {
    name: "airbnb_listing_details",
    description: "Get detailed information about a specific Airbnb listing",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Airbnb listing ID"
        },
        checkin: {
          type: "string",
          description: "Check-in date (YYYY-MM-DD)"
        },
        checkout: {
          type: "string",
          description: "Check-out date (YYYY-MM-DD)"
        },
        adults: {
          type: "number",
          description: "Number of adults"
        },
        children: {
          type: "number",
          description: "Number of children"
        },
        infants: {
          type: "number",
          description: "Number of infants"
        },
        pets: {
          type: "number",
          description: "Number of pets"
        }
      },
      required: ["id"]
    }
  }
];

export function setupRoutes(app) {
  // List available tools
  app.get('/tools', (req, res) => {
    res.json({ tools: TOOLS });
  });

  // Execute tool
  app.post('/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const params = req.body;

    try {
      let result;
      
      switch (toolName) {
        case 'airbnb_search':
          result = await handleAirbnbSearch(params);
          break;
        case 'airbnb_listing_details':
          result = await handleAirbnbListingDetails(params);
          break;
        default:
          return res.status(404).json({
            error: 'Tool not found',
            message: `Tool '${toolName}' is not available`
          });
      }

      if (result.isError) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      res.status(500).json({
        error: 'Tool execution failed',
        message: error.message
      });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'MCP Airbnb HTTP Server',
      version: '1.0.0',
      description: 'HTTP server for Airbnb MCP integration',
      endpoints: {
        health: '/health',
        tools: '/tools',
        execute: '/tools/:toolName'
      }
    });
  });
}

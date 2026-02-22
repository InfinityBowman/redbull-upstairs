// Tool definitions for the LLM (OpenAI function calling format)

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: Array<string>
    }
  }
}

export const TOOL_DEFINITIONS: Array<ToolDefinition> = [
  {
    type: 'function',
    function: {
      name: 'set_layers',
      description:
        'Enable or disable map layers. Only include layers you want to change. Available layers: complaints, crime, transit, vacancy, foodAccess, arpa, demographics.',
      parameters: {
        type: 'object',
        properties: {
          layers: {
            type: 'object',
            properties: {
              complaints: { type: 'boolean' },
              crime: { type: 'boolean' },
              transit: { type: 'boolean' },
              vacancy: { type: 'boolean' },
              foodAccess: { type: 'boolean' },
              arpa: { type: 'boolean' },
              demographics: { type: 'boolean' },
            },
          },
        },
        required: ['layers'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_filters',
      description:
        'Set sub-toggle filters for active layers. Only include filters you want to change.',
      parameters: {
        type: 'object',
        properties: {
          complaintsCategory: {
            type: 'string',
            description: 'Filter complaints by category (e.g. "Trash", "Derelict", "all")',
          },
          complaintsMode: {
            type: 'string',
            enum: ['choropleth', 'heatmap'],
            description: 'Complaints visualization mode',
          },
          crimeCategory: {
            type: 'string',
            description: 'Filter crime by category (e.g. "Assault", "Theft", "all")',
          },
          crimeMode: {
            type: 'string',
            enum: ['choropleth', 'heatmap'],
            description: 'Crime visualization mode',
          },
          demographicsMetric: {
            type: 'string',
            enum: ['population', 'vacancyRate', 'popChange'],
            description: 'Demographics choropleth metric',
          },
          arpaCategory: {
            type: 'string',
            description: 'Filter ARPA spending by category',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_neighborhood',
      description:
        'Select a neighborhood by name. Uses fuzzy matching. This opens the detail panel with neighborhood info.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Neighborhood name (e.g. "Dutchtown", "Downtown", "The Ville")',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_entity',
      description: 'Select a specific entity on the map by type and ID.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['stop', 'grocery', 'foodDesert'],
            description: 'Entity type',
          },
          id: {
            type: 'string',
            description: 'Entity ID (string for stops/food deserts, number as string for grocery)',
          },
        },
        required: ['type', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_analytics',
      description: 'Open or close the analytics panel at the bottom of the dashboard.',
      parameters: {
        type: 'object',
        properties: {
          expanded: {
            type: 'boolean',
            description: 'Whether the analytics panel should be open',
          },
        },
        required: ['expanded'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'configure_chart',
      description:
        'Switch the chart builder to a specific dataset and optionally apply a preset. Opens the analytics panel if not already open.',
      parameters: {
        type: 'object',
        properties: {
          datasetKey: {
            type: 'string',
            description:
              'Dataset key (e.g. "complaints-daily", "crime-category", "vacancy-by-neighborhood", "arpa-monthly", "demographics-population", "food-desert-tracts")',
          },
          presetName: {
            type: 'string',
            description: 'Optional preset name to apply (e.g. "Trend + Weather", "Category Breakdown")',
          },
        },
        required: ['datasetKey'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_selection',
      description: 'Clear any selected entity and close the detail panel.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

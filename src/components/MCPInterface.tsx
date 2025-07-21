import React, { useState } from 'react';
import { Brain, Wand2, BarChart3, Lightbulb, Loader2 } from 'lucide-react';

interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const MCPInterface: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tools: MCPTool[] = [
    {
      name: 'generate_sprite',
      description: 'Generate a character sprite with AI-enhanced prompting',
      parameters: {
        character: { type: 'string', required: true },
        pose: { type: 'string', required: false },
        style: { type: 'string', required: false },
        use_training_data: { type: 'boolean', required: false }
      }
    },
    {
      name: 'enhance_prompt',
      description: 'Enhance a sprite generation prompt using training data',
      parameters: {
        prompt: { type: 'string', required: true }
      }
    },
    {
      name: 'analyze_sprite_quality',
      description: 'Analyze sprite quality and get improvement suggestions',
      parameters: {
        sprite_id: { type: 'string', required: true }
      }
    },
    {
      name: 'get_style_recommendations',
      description: 'Get style recommendations based on successful generations',
      parameters: {
        character: { type: 'string', required: true }
      }
    }
  ];

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setToolParams({});
    setResult(null);
    setError(null);
  };

  const handleParamChange = (paramName: string, value: any) => {
    setToolParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_name: selectedTool,
          parameters: toolParams
        }),
      });

      if (!response.ok) {
        throw new Error('Tool execution failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedToolData = tools.find(t => t.name === selectedTool);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'generate_sprite': return <Wand2 size={20} />;
      case 'enhance_prompt': return <Brain size={20} />;
      case 'analyze_sprite_quality': return <BarChart3 size={20} />;
      case 'get_style_recommendations': return <Lightbulb size={20} />;
      default: return <Brain size={20} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tool Selection */}
        <div className="space-y-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
            <h2 className="text-xl font-semibold text-amber-100 mb-6 flex items-center gap-2">
              <Brain size={20} className="text-amber-400" />
              MCP AI Tools
            </h2>

            <div className="space-y-3">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => handleToolSelect(tool.name)}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedTool === tool.name
                      ? 'bg-amber-400/20 border-amber-400/40 text-amber-100'
                      : 'bg-black/30 border-amber-400/20 text-amber-200 hover:bg-amber-400/10 hover:border-amber-400/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-amber-400 mt-1">
                      {getToolIcon(tool.name)}
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">
                        {tool.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm opacity-80">{tool.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Parameters & Execution */}
        <div className="space-y-6">
          {selectedToolData && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
              <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                {getToolIcon(selectedTool)}
                {selectedToolData.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>

              <div className="space-y-4">
                {Object.entries(selectedToolData.parameters).map(([paramName, paramConfig]) => (
                  <div key={paramName}>
                    <label className="block text-amber-200 text-sm font-medium mb-2">
                      {paramName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {paramConfig.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    
                    {paramConfig.type === 'boolean' ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={toolParams[paramName] || false}
                          onChange={(e) => handleParamChange(paramName, e.target.checked)}
                          className="rounded border-amber-400/30 bg-black/30 text-amber-400 focus:ring-amber-400/20"
                        />
                        <span className="text-amber-200 text-sm">Enable</span>
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={toolParams[paramName] || ''}
                        onChange={(e) => handleParamChange(paramName, e.target.value)}
                        placeholder={`Enter ${paramName.replace('_', ' ')}`}
                        className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        required={paramConfig.required}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={executeTool}
                  disabled={isExecuting}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold py-3 px-6 rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      {getToolIcon(selectedTool)}
                      Execute Tool
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {(result || error) && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
              <h3 className="text-lg font-semibold text-amber-100 mb-4">Results</h3>
              
              {error ? (
                <div className="p-4 bg-red-900/20 border border-red-400/20 rounded-xl">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.image_base64 && (
                    <div className="text-center">
                      <img
                        src={`data:image/png;base64,${result.image_base64}`}
                        alt="Generated sprite"
                        className="max-w-64 max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <pre className="text-amber-200 text-sm whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPInterface;
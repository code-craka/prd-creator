# PRD Creator

import React, { useState } from 'react';
import { FileText, Copy, Download, Loader2 } from 'lucide-react';

const PRDCreator = () => {
  const [formData, setFormData] = useState({
    question1: '',
    question2: '',
    question3: ''
  });
  const [generatedPRD, setGeneratedPRD] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  // Sample examples
  const sampleExamples = [
    {
      name: 'Team Dashboard',
      icon: '📊',
      data: {
        question1: 'A real-time team collaboration dashboard that shows current work status, upcoming deadlines, and team availability',
        question2: 'Remote team leads and project managers who struggle with visibility into who\'s working on what and when projects will be completed',
        question3: 'Live status updates, team availability calendar, automated task assignments, and drag-and-drop timeline view. Success measured by 30% reduction in status meetings and 25% faster project delivery times'
      }
    },
    {
      name: 'Shopping App',
      icon: '🛍️',
      data: {
        question1: 'A mobile shopping app with AI-powered personalized recommendations and instant checkout',
        question2: 'Busy professionals aged 25-45 who want to shop efficiently and discover products tailored to their style without spending hours browsing',
        question3: 'AI style recommendations, one-tap checkout, size prediction, AR try-on feature, price tracking, and wishlist sharing. Success measured by 40% increase in average order value and 60% reduction in cart abandonment'
      }
    },
    {
      name: 'Fitness Tracker',
      icon: '💪',
      data: {
        question1: 'A fitness tracking app that combines workout planning, nutrition logging, and social motivation features',
        question2: 'Fitness enthusiasts and beginners who want an all-in-one solution to plan workouts, track progress, and stay motivated through community support',
        question3: 'Custom workout builder, meal tracking with barcode scanning, progress photos, community challenges, and coaching tips. Success measured by 70% user retention after 3 months and 45% improvement in workout consistency'
      }
    }
  ];

  const handleExampleClick = () => {
    const nextIndex = (currentExampleIndex + 1) % sampleExamples.length;
    setCurrentExampleIndex(nextIndex);
    setFormData(sampleExamples[nextIndex].data);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convert markdown to HTML
  const renderMarkdown = (text) => {
    // First, handle code blocks and inline code
    let html = text
      .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre class="bg-gray-100 p-4 rounded mb-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/\`(.*?)\`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');

    // Split into lines for better processing
    const lines = html.split('\n');
    const processedLines = [];
    let lists = []; // Stack to handle nested lists
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Determine indentation level
      const indentMatch = line.match(/^(\s*)([\*\-\+]|\d+\.)\s/);
      
      if (indentMatch) {
        // This is a list item
        const indent = indentMatch[1].length;
        const level = Math.floor(indent / 2); // 2 spaces = 1 level
        const marker = indentMatch[2];
        const listType = marker.match(/\d+\./) ? 'ol' : 'ul';
        const cleanItem = line.replace(/^(\s*)([\*\-\+]|\d+\.)\s/, '');
        
        // Handle nested lists
        if (level > currentLevel) {
          // Going deeper - start new nested list
          for (let j = currentLevel; j < level; j++) {
            lists.push({ type: listType, items: [] });
          }
          currentLevel = level;
        } else if (level < currentLevel) {
          // Going back up - close nested lists
          while (currentLevel > level) {
            const completedList = lists.pop();
            const listClass = completedList.type === 'ol' ? 'list-decimal' : 'list-disc';
            const nestedList = `<${completedList.type} class="${listClass} list-inside mb-2 ml-4">${completedList.items.join('')}</${completedList.type}>`;
            
            if (lists.length > 0) {
              // Append to parent list
              lists[lists.length - 1].items[lists[lists.length - 1].items.length - 1] += nestedList;
            } else {
              // Add to processed lines
              processedLines.push(nestedList);
            }
            currentLevel--;
          }
          currentLevel = level;
        }
        
        // Initialize level if needed
        if (lists.length === 0 || level >= lists.length) {
          lists.push({ type: listType, items: [] });
        }
        
        // Add item to current level
        lists[level].items.push(`<li class="mb-1">${cleanItem}</li>`);
      } else {
        // Not a list item - close all open lists
        while (lists.length > 0) {
          const completedList = lists.pop();
          const listClass = completedList.type === 'ol' ? 'list-decimal' : 'list-disc';
          const listElement = `<${completedList.type} class="${listClass} list-inside mb-4 ${lists.length > 0 ? 'ml-4' : ''}">${completedList.items.join('')}</${completedList.type}>`;
          
          if (lists.length > 0) {
            // Append to parent list
            lists[lists.length - 1].items[lists[lists.length - 1].items.length - 1] += listElement;
          } else {
            // Add to processed lines
            processedLines.push(listElement);
          }
        }
        currentLevel = 0;
        
        // Process non-list lines
        if (trimmedLine) {
          // Headers
          if (line.startsWith('# ')) {
            processedLines.push(`<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${line.substring(2)}</h1>`);
          } else if (line.startsWith('## ')) {
            processedLines.push(`<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">${line.substring(3)}</h2>`);
          } else if (line.startsWith('### ')) {
            processedLines.push(`<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">${line.substring(4)}</h3>`);
          } else {
            // Regular paragraph
            processedLines.push(`<p class="mb-4">${line}</p>`);
          }
        } else {
          // Empty line
          processedLines.push('');
        }
      }
    }
    
    // Close any remaining lists
    while (lists.length > 0) {
      const completedList = lists.pop();
      const listClass = completedList.type === 'ol' ? 'list-decimal' : 'list-disc';
      const listElement = `<${completedList.type} class="${listClass} list-inside mb-4 ${lists.length > 0 ? 'ml-4' : ''}">${completedList.items.join('')}</${completedList.type}>`;
      
      if (lists.length > 0) {
        // Append to parent list
        lists[lists.length - 1].items[lists[lists.length - 1].items.length - 1] += listElement;
      } else {
        // Add to processed lines
        processedLines.push(listElement);
      }
    }
    
    // Join processed lines
    html = processedLines.join('\n');
    
    // Handle inline formatting
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/__(.*?)__/g, '<strong>$1</strong>') // Alternative bold
      .replace(/_(.*?)_/g, '<em>$1</em>') // Alternative italic
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>'); // Links

    return html;
  };

  const generatePRD = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedPRD(''); // Clear previous PRD
    
    const prompt = `Create a professional one-pager PRD based on these inputs:

    1. Product/Feature: ${formData.question1}
    2. Target Users & Problem: ${formData.question2}
    3. Key Functionality & Success Metrics: ${formData.question3}

    Please format the PRD exactly following this template using proper markdown headers:

    # One-pager: [NAME]

    ## 1. TL;DR
    A short summary—what is this, who's it for, and why does it matter?

    ## 2. Goals
    ### Business Goals
    * [List business goals]
    
    ### User Goals
    * [List user goals]
    
    ### Non-Goals
    * [List non-goals]

    ## 3. User stories
    Personas and their jobs-to-be-done.

    ## 4. Functional requirements
    Grouped features by priority.

    ## 5. User experience
    * Bullet-pointed user journeys
    * Edge cases and UI notes

    ## 6. Narrative
    A day-in-the-life (Make it sing.)

    ## 7. Success metrics
    * [List key metrics]

    ## 8. Milestones & sequencing
    Lean roadmap, small team (keep it scrappy!), phases.

    Make it professional yet approachable. Be specific and actionable. Use proper markdown formatting with # for main title, ## for main sections, and ### for subsections.`;

    try {
      // Stream the response
      let fullResponse = '';
      const response = await window.claude.complete(prompt);
      
      // Simulate streaming effect
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        fullResponse += words[i] + ' ';
        setGeneratedPRD(fullResponse);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    } catch (err) {
      setError('Failed to generate PRD. Please try again.');
      console.error('Error generating PRD:', err);
    }
    
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPRD);
  };

  const downloadPRD = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedPRD], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'prd.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex overflow-hidden relative">
      {/* Glassmorphism background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Side - Input Section */}
      <div className="w-1/2 p-8 overflow-y-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">One-pager PRD</h1>
          <p className="text-gray-700">Turn your vague thoughts into a clear and concise one-pager</p>
        </div>

        {/* Input Form with glassmorphism */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">3 questions</h2>
              <button
                onClick={handleExampleClick}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-white/60 hover:bg-white/80 text-gray-700 rounded-full transition-all backdrop-blur-sm border border-white/40 hover:shadow-md"
              >
                <span>{sampleExamples[currentExampleIndex].icon}</span>
                <span>Try: {sampleExamples[currentExampleIndex].name}</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. What product or feature are you building?
              </label>
              <textarea
                value={formData.question1}
                onChange={(e) => handleInputChange('question1', e.target.value)}
                className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                rows="3"
                placeholder="e.g., A real-time collaboration dashboard for remote teams..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Who are the target users and what problem does this solve?
              </label>
              <textarea
                value={formData.question2}
                onChange={(e) => handleInputChange('question2', e.target.value)}
                className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                rows="3"
                placeholder="e.g., Remote team managers who struggle with visibility into project progress..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. What are the key features and how will you measure success?
              </label>
              <textarea
                value={formData.question3}
                onChange={(e) => handleInputChange('question3', e.target.value)}
                className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                rows="3"
                placeholder="e.g., Live status updates, team activity feed... Success measured by 40% reduction in status meeting time..."
              />
            </div>

            <button
              onClick={generatePRD}
              disabled={isGenerating || !formData.question1 || !formData.question2 || !formData.question3}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PRD...
                </>
              ) : (
                'Generate PRD'
              )}
            </button>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Document Section with glassmorphism */}
      <div className="w-1/2 bg-white/90 backdrop-blur-lg border-l border-white/50 flex flex-col relative z-10">
        {/* Document Header - Fixed */}
        {generatedPRD && (
          <div className="border-b border-white/50 p-4 flex items-center justify-end bg-white/90 backdrop-blur-sm">
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-md transition-colors backdrop-blur-sm"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={downloadPRD}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50/80 rounded-md transition-colors backdrop-blur-sm"
                title="Download as markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Document Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {generatedPRD ? (
              <div 
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedPRD) }}
              />
            ) : (
              <div className="text-gray-500 text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Your PRD will appear here after answering the questions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default PRDCreator;
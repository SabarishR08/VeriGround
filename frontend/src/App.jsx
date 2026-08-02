import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkflowStepper from './components/WorkflowStepper';
import Module1Input from './components/Module1Input';
import Module2Extraction from './components/Module2Extraction';
import Module3Preview from './components/Module3Preview';
import SampleDataSelector from './components/SampleDataSelector';
import ArchitectureModal from './components/ArchitectureModal';
import { checkBackendHealth, fetchSampleDatasets, preprocessText, extractClaims } from './services/api';

export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [backendOnline, setBackendOnline] = useState(false);
  
  // Input & Preprocess States
  const [inputText, setInputText] = useState('');
  const [preprocessResult, setPreprocessResult] = useState(null);
  const [isPreprocessLoading, setIsPreprocessLoading] = useState(false);

  // Claim Extraction States
  const [extractionResult, setExtractionResult] = useState(null);
  const [isExtractionLoading, setIsExtractionLoading] = useState(false);

  // Modal States
  const [samples, setSamples] = useState([]);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Check health & load sample on startup
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendOnline(health.online);

      const loadedSamples = await fetchSampleDatasets();
      setSamples(loadedSamples);

      // Auto-load default prompt sample if text is empty
      if (loadedSamples && loadedSamples.length > 0) {
        setInputText(loadedSamples[0].text);
      }
    }
    init();
  }, []);

  // Preprocess Handler
  const handlePreprocess = async (sourceType) => {
    if (!inputText.trim()) return;
    setIsPreprocessLoading(true);
    try {
      const result = await preprocessText(inputText, sourceType);
      setPreprocessResult(result);
    } catch (err) {
      console.error("Preprocess error:", err);
    } finally {
      setIsPreprocessLoading(false);
    }
  };

  // Claim Extraction Handler
  const handleExtractClaims = async () => {
    const textToExtract = preprocessResult?.cleaned_text || inputText;
    if (!textToExtract.trim()) return;
    
    setIsExtractionLoading(true);
    try {
      const result = await extractClaims(textToExtract);
      setExtractionResult(result);
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtractionLoading(false);
    }
  };

  // Select Sample Handler
  const handleSelectSample = (sample) => {
    setInputText(sample.text);
    setPreprocessResult(null);
    setExtractionResult(null);
    setActiveStep(1);
  };

  // Clear Handler
  const handleClear = () => {
    setInputText('');
    setPreprocessResult(null);
    setExtractionResult(null);
    setActiveStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Bar */}
      <Header
        backendOnline={backendOnline}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        onSelectSample={() => setIsSampleModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Workflow Stepper */}
        <WorkflowStepper
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          isPreprocessed={!!preprocessResult}
          isExtracted={!!extractionResult}
        />

        {/* Step Views */}
        {activeStep === 1 && (
          <Module1Input
            inputText={inputText}
            setInputText={setInputText}
            onPreprocess={handlePreprocess}
            preprocessResult={preprocessResult}
            isLoading={isPreprocessLoading}
            onContinueToModule2={() => setActiveStep(2)}
            onClear={handleClear}
          />
        )}

        {activeStep === 2 && (
          <Module2Extraction
            processedText={preprocessResult?.cleaned_text || inputText}
            sentences={preprocessResult?.sentences || []}
            onExtractClaims={handleExtractClaims}
            extractionResult={extractionResult}
            isLoading={isExtractionLoading}
            onContinueToModule3={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <Module3Preview
            claims={extractionResult?.claims || []}
            onReset={handleClear}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060912] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>VeriGround Framework</strong> — Identifying Unsupported Claims in AI-Generated Content
          </div>
          <div>
            Module 1 & 2 Prototype Demonstration Engine
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SampleDataSelector
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        samples={samples}
        onSelectSample={handleSelectSample}
      />

      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

    </div>
  );
}

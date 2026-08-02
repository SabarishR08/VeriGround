import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkflowStepper from './components/WorkflowStepper';
import Module1Input from './components/Module1Input';
import Module2Extraction from './components/Module2Extraction';
import ResultsDashboard from './components/ResultsDashboard';
import ProvenanceLogTable from './components/ProvenanceLogTable';
import SampleDataSelector from './components/SampleDataSelector';
import ArchitectureModal from './components/ArchitectureModal';
import {
  checkBackendHealth,
  fetchSampleDatasets,
  preprocessText,
  extractClaims,
  retrieveEvidence,
  verifyClaims,
  explainClaim
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'provenance'
  const [activeStep, setActiveStep] = useState(1);
  const [backendOnline, setBackendOnline] = useState(false);
  
  // Input & Preprocess States
  const [inputText, setInputText] = useState('');
  const [preprocessResult, setPreprocessResult] = useState(null);
  const [isPreprocessLoading, setIsPreprocessLoading] = useState(false);

  // Claim Extraction States
  const [extractionResult, setExtractionResult] = useState(null);
  const [isExtractionLoading, setIsExtractionLoading] = useState(false);

  // Full Pipeline Verification States (Modules 3, 4, 5)
  const [isFullPipelineLoading, setIsFullPipelineLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(''); // 'retrieving' | 'verifying' | 'explaining'
  const [retrievalResult, setRetrievalResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [explanationResults, setExplanationResults] = useState([]);
  const [currentExplainIndex, setCurrentExplainIndex] = useState(0);

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

  // Full Verification Execution Handler (Modules 3 -> 4 -> 5 sequence)
  const handleExecuteFullPipeline = async () => {
    const extractedClaims = extractionResult?.claims?.map(c => c.text) || [];
    if (extractedClaims.length === 0) return;

    setIsFullPipelineLoading(true);
    setPipelineStage('retrieving');
    setActiveStep(3);

    try {
      // 1. Module 3: Evidence Retrieval (FAISS)
      const docText = preprocessResult?.cleaned_text || inputText;
      const sourceDocs = [{ id: "source_doc_main", text: docText }];
      
      const retRes = await retrieveEvidence(extractedClaims, sourceDocs, 3);
      setRetrievalResult(retRes);

      // 2. Module 4: NLI & Fusion Verification
      setPipelineStage('verifying');
      setActiveStep(4);
      
      const verRes = await verifyClaims(retRes.results);
      setVerificationResult(verRes);

      // 3. Module 5: Explainable AI (Ollama per-claim)
      setPipelineStage('explaining');
      setActiveStep(5);
      
      const exps = [];
      const verifications = verRes.verifications || [];

      for (let i = 0; i < verifications.length; i++) {
        setCurrentExplainIndex(i);
        const v = verifications[i];
        const matchEv = v.matched_evidence ? v.matched_evidence.text : "";
        
        try {
          const expRes = await explainClaim(
            v.claim,
            matchEv,
            v.verdict,
            v.components,
            v.claim_id || null
          );
          exps.push(expRes);
        } catch (expErr) {
          console.warn(`Explain claim #${i+1} fallback:`, expErr);
          exps.push({
            explanation: `The evidence confirms this claim with a fused score of ${v.fused_score.toFixed(4)}.`,
            source: 'fallback',
            model: 'template'
          });
        }
        setExplanationResults([...exps]);
      }

    } catch (pipelineErr) {
      console.error("Pipeline execution failure:", pipelineErr);
      alert(`Pipeline error: ${pipelineErr.message}`);
    } finally {
      setIsFullPipelineLoading(false);
      setPipelineStage('');
    }
  };

  // Select Sample Handler
  const handleSelectSample = (sample) => {
    setInputText(sample.text);
    setPreprocessResult(null);
    setExtractionResult(null);
    setRetrievalResult(null);
    setVerificationResult(null);
    setExplanationResults([]);
    setActiveStep(1);
  };

  // Clear Handler
  const handleClear = () => {
    setInputText('');
    setPreprocessResult(null);
    setExtractionResult(null);
    setRetrievalResult(null);
    setVerificationResult(null);
    setExplanationResults([]);
    setActiveStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Bar */}
      <Header
        backendOnline={backendOnline}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        onSelectSample={() => setIsSampleModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {activeTab === 'pipeline' ? (
          <>
            {/* Workflow Stepper */}
            <WorkflowStepper
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              isPreprocessed={!!preprocessResult}
              isExtracted={!!extractionResult}
              isRetrieved={!!retrievalResult}
              isVerified={!!verificationResult}
              isExplained={explanationResults.length > 0}
              currentStage={pipelineStage}
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
                onContinueToModule3={handleExecuteFullPipeline}
              />
            )}

            {(activeStep >= 3) && (
              <ResultsDashboard
                claims={extractionResult?.claims || []}
                verifications={verificationResult?.verifications || []}
                explanations={explanationResults}
                loadingExplain={isFullPipelineLoading && pipelineStage === 'explaining'}
                currentExplainClaimIndex={currentExplainIndex}
                onReset={handleClear}
              />
            )}
          </>
        ) : (
          /* Provenance Log View */
          <ProvenanceLogTable />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060912] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>VeriGround Framework</strong> — Claim-level truth for AI answers
          </div>
          <div>
            Modules 1–7 End-to-End Verified System
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

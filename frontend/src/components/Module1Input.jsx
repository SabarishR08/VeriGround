import React, { useState } from 'react';
import { FileText, Upload, Globe, CheckCircle2, Trash2, ArrowRight, Loader2, FileCheck, Layers } from 'lucide-react';
import { parseUploadedFile, fetchUrlContent } from '../services/api';

export default function Module1Input({ 
  inputText, 
  setInputText, 
  onPreprocess, 
  preprocessResult, 
  isLoading, 
  onContinueToModule2,
  onClear 
}) {
  const [inputSource, setInputSource] = useState('paste'); // 'paste' | 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileError('');
    setUploadedFileName(file.name);
    try {
      const res = await parseUploadedFile(file);
      if (res.success && res.extracted_text) {
        setInputText(res.extracted_text);
      }
    } catch (err) {
      setFileError(err.message || "Failed to extract text from file");
    }
  };

  // URL Fetch Handler
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setFileError('');
    try {
      const res = await fetchUrlContent(urlInput);
      if (res.success && res.extracted_text) {
        setInputText(res.extracted_text);
      }
    } catch (err) {
      setFileError(err.message || "Failed to fetch content from URL");
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header Card */}
      <div className="text-center py-6 rounded-2xl border border-gray-200 bg-white shadow-sm relative overflow-hidden">
        

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          Module 1
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
          AI Content Input Module
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2">
          Accept AI-generated content from ChatGPT, Gemini, Claude, Copilot, DeepSeek, PDF, DOCX, TXT, or Website URL, then preprocess it before claim extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Source Controls */}
        <div className="lg:col-span-7 rounded-2xl p-6 border border-gray-100 bg-white shadow-sm space-y-6">
          
          {/* Radio Source Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Select Input Source
            </label>
            <div className="grid grid-cols-3 gap-3">
              
              <button
                type="button"
                onClick={() => setInputSource('paste')}
                className={`flex items-center justify-center space-x-2.5 p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  inputSource === 'paste'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-50 border border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${inputSource === 'paste' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`}>
                  {inputSource === 'paste' && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                </div>
                <FileText className="w-4 h-4" />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                onClick={() => setInputSource('upload')}
                className={`flex items-center justify-center space-x-2.5 p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  inputSource === 'upload'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-50 border border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${inputSource === 'upload' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`}>
                  {inputSource === 'upload' && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                </div>
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setInputSource('url')}
                className={`flex items-center justify-center space-x-2.5 p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  inputSource === 'url'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-50 border border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${inputSource === 'url' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`}>
                  {inputSource === 'url' && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                </div>
                <Globe className="w-4 h-4" />
                <span>Website URL</span>
              </button>

            </div>
          </div>

          {/* Error Notification */}
          {fileError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              ⚠️ {fileError}
            </div>
          )}

          {/* Conditional Input UI: Paste Text */}
          {inputSource === 'paste' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Paste AI Generated Content
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {inputText.length} characters
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Artificial Intelligence was invented in 1955 by John McCarthy... Paste response from ChatGPT, Gemini, Claude, etc."
                rows={9}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-800 placeholder-gray-400 font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>
          )}

          {/* Conditional Input UI: Upload File */}
          {inputSource === 'upload' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Upload File
              </label>
              
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center transition-all bg-[#0B1120]/50 group">
                <input
                  type="file"
                  id="fileInput"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer space-y-3 block">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:bg-cyan-400 transition-colors">
                      Choose File
                    </span>
                  </div>
                  {uploadedFileName ? (
                    <p className="text-xs font-mono text-emerald-400 font-semibold flex items-center justify-center space-x-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Loaded: {uploadedFileName}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Supported formats: <strong className="text-slate-300">PDF | DOCX | TXT</strong>
                    </p>
                  )}
                </label>
              </div>

              {inputText && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Extracted Document Preview:</span>
                  <div className="p-3 bg-[#0B1120] rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-36 overflow-y-auto">
                    {inputText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Input UI: Website URL */}
          {inputSource === 'url' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Website URL
              </label>

              <div className="flex space-x-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={urlLoading || !urlInput.trim()}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shrink-0"
                >
                  {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Fetch URL</span>
                </button>
              </div>

              {inputText && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Scraped Article Preview:</span>
                  <div className="p-3 bg-[#0B1120] rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-36 overflow-y-auto">
                    {inputText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onPreprocess(inputSource)}
              disabled={isLoading || !inputText.trim()}
              className="flex-1 flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preprocessing Text...</span>
                </>
              ) : (
                <>
                  <span>[ Preprocess Text ]</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClear}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-sm transition-all"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
              <span>Clear</span>
            </button>
          </div>

        </div>

        {/* Right Column: Preprocess Results Card */}
        <div className="lg:col-span-5">
          {preprocessResult ? (
            <div className="rounded-2xl p-6 border border-gray-100 bg-white shadow-sm space-y-6 relative overflow-hidden">
              
              {/* Success Badge */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">
                    ✓ Text Loaded Successfully
                  </h3>
                  <p className="text-xs text-slate-400">Text cleaned and structured for claim extraction</p>
                </div>
              </div>

              {/* Statistics Grid matching exact specification */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    Source
                  </span>
                  <span className="text-sm font-semibold text-primary font-mono">
                    {preprocessResult.source}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    Characters
                  </span>
                  <span className="text-base font-semibold text-gray-900 font-mono">
                    {preprocessResult.characters}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    Sentences
                  </span>
                  <span className="text-base font-semibold text-gray-900 font-mono">
                    {preprocessResult.sentences_count}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    Words
                  </span>
                  <span className="text-base font-semibold text-gray-900 font-mono">
                    {preprocessResult.words}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800/80 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Language
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {preprocessResult.language}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="text-xs font-semibold text-success block truncate">
                    Ready for Claim Extraction
                  </span>
                </div>

              </div>

              {/* Segmented Sentence Preview */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center justify-between">
                  <span>Segmented Sentences ({preprocessResult.sentences?.length || 0})</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Module 2 Input Stream</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {preprocessResult.sentences?.map((sent, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#0B1120] border border-slate-800/80 text-xs font-mono text-slate-300 flex space-x-2">
                      <span className="text-slate-500 font-bold select-none">{idx + 1}.</span>
                      <span className="flex-1">{sent}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={onContinueToModule2}
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-success text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>[ Continue → ]</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ) : (
            /* Standby Card */
            <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500">
                <Layers className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-300">Preprocessing Standby</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Input or paste AI content on the left, then click <strong>Preprocess Text</strong> to generate sentence segments and metrics.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

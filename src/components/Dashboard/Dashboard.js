'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Sparkles, 
  LogOut, 
  User, 
  Clock,
  Trash2,
  Download,
  Loader
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// New Animation Component
const ProcessingAnimation = ({ stepMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    >
      <div className="relative w-24 h-24">
        <motion.div 
          className="absolute inset-0 border-4 border-gray-700 rounded-full"
        />
        <motion.div
          className="absolute inset-0 border-4 border-blue-500 rounded-full"
          style={{ clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stepMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-white text-lg mt-6 font-medium"
        >
          {stepMessage}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};


export default function Dashboard({ user, onSignOut }) {
  const [file, setFile] = useState(null)
  // Replaced 'loading' with a more detailed processing state
  const [processingState, setProcessingState] = useState({ active: false, step: 0 });
  const [summary, setSummary] = useState('')
  const [summaries, setSummaries] = useState([])
  const [dragOver, setDragOver] = useState(false)

  const processingSteps = [
    "Initializing analysis...",
    "Parsing PDF structure...",
    "Extracting text content...",
    "Identifying key topics...",
    "Generating summary...",
    "Finalizing...",
  ];

  // Effect to cycle through animation steps
  useEffect(() => {
    let interval;
    if (processingState.active) {
      interval = setInterval(() => {
        setProcessingState(prevState => {
          const nextStep = prevState.step + 1;
          if (nextStep >= processingSteps.length) {
            clearInterval(interval); // Stop at the last step
            return prevState;
          }
          return { ...prevState, step: nextStep };
        });
      }, 1200); // Change step every 1.2 seconds
    }
    return () => clearInterval(interval);
  }, [processingState.active]);


  useEffect(() => {
    fetchSummaries()
  }, [])

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSummaries(data || [])
    } catch (error) {
      console.error('Error fetching summaries:', error)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === 'application/pdf')
    if (pdfFile) {
      setFile(pdfFile)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

 // src/components/Dashboard/Dashboard.js


  const handleUpload = async () => {
    if (!file) return;

    setProcessingState({ active: true, step: 0 });
    setSummary('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const apiCallPromise = fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });

      const minAnimationTimePromise = new Promise(resolve => setTimeout(resolve, 3000));
      
      const [response] = await Promise.all([apiCallPromise, minAnimationTimePromise]);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const data = await response.json();
      setSummary(data.summary);

      // --- FIX: Correctly save to the database ---
      // This now includes the user's ID and the filename
      const { error: dbError } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id, // The ID of the logged-in user
          filename: file.name, // The name of the uploaded PDF
          summary_text: data.summary,
        });

      if (dbError) {
        // This will now give a more specific error in the console
        console.error("Database save error:", dbError);
        alert(`Summary generated, but failed to save: ${dbError.message}`);
      }

      await fetchSummaries();
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingState({ active: false, step: 0 });
    }
  };

  // const handleUpload = async () => {
  //   if (!file) return;

  //   setProcessingState({ active: true, step: 0 });
  //   setSummary('');

  //   try {
  //     const formData = new FormData();
  //     formData.append('pdf', file);

  //     const apiCallPromise = fetch('/api/summarize', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const minAnimationTimePromise = new Promise(resolve => setTimeout(resolve, 5000));
      
  //     const [response] = await Promise.all([apiCallPromise, minAnimationTimePromise]);

  //     // **IMPROVED ERROR HANDLING**
  //     // This will now catch the specific error message from the server
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       // The error from Groq will be shown directly in the alert
  //       throw new Error(errorData.error || 'An unknown error occurred.');
  //     }

  //     const data = await response.json();
  //     setSummary(data.summary);

  //     // Save to database
  //     const { error: dbError } = await supabase
  //       .from('summaries')
  //       .insert({
  //         summary_text: data.summary,
  //         // user_id: user.id, // We'll fix this next
  //         filename: file.name,
  //       });

  //     if (dbError) {
  //       console.error("Database error:", dbError);
  //       alert("Summary generated, but failed to save to your history.");
  //     }

  //     await fetchSummaries();
  //     setFile(null);
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     // The alert will now be much more informative
  //     alert(`Error: ${error.message}`);
  //   } finally {
  //     setProcessingState({ active: false, step: 0 });
  //   }
  // };

  const deleteSummary = async (id) => {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSummaries()
    } catch (error) {
      console.error('Error deleting summary:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Animation Overlay */}
      <AnimatePresence>
        {processingState.active && (
          <ProcessingAnimation 
            stepMessage={processingSteps[processingState.step]} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ExamPrep Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload PDF
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">
                  Drag and drop your PDF here, or click to select
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={handleUpload}
                    disabled={processingState.active}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                  >
                    {processingState.active ? 'Processing...' : 'Generate Summary'}
                  </button>
                </motion.div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-900/20 border border-green-800/50 rounded-lg"
                >
                  <h3 className="text-green-400 font-medium mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generated Summary
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Previous Summaries */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Summaries
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {summaries.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-medium truncate">
                          {item.filename}
                        </h3>
                        <div className="flex space-x-2 ml-2">
                          <button
                            onClick={() => deleteSummary(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-3 mb-2">
                        {item.summary}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {summaries.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No summaries yet</p>
                    <p className="text-gray-500 text-sm">Upload a PDF to get started</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
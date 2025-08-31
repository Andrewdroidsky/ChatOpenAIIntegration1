import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Edit2, Trash2, Check, User, MessageCircle, Save, Brain, Upload, File, AlertCircle } from 'lucide-react';
import { validateFile } from '../lib/fileProcessing';

export const Personalities: React.FC = () => {
  const {
    personalities,
    activePersonality,
    togglePersonalities,
    createPersonality,
    updatePersonality,
    deletePersonality,
    setActivePersonality,
    uploadPersonalityFile,
    removePersonalityFile
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    has_memory: true,
    file_instruction: '',
    selectedFile: null as File | null
  });
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file');
        return;
      }
      
      setFormData(prev => ({ ...prev, selectedFile: file }));
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, selectedFile: null, file_instruction: '' }));
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) return;
    
    try {
      setIsProcessingFile(true);
      
      // Create personality first
      const newPersonality = await createPersonality(formData.name.trim(), formData.prompt.trim(), formData.has_memory);
      
      // If file was selected and personality was created successfully, upload file
      if (newPersonality && formData.selectedFile && formData.file_instruction.trim()) {
        await uploadPersonalityFile(
          newPersonality.id, 
          formData.selectedFile, 
          formData.file_instruction.trim()
        );
      }
      
      // Reset form
      setFormData({ name: '', prompt: '', has_memory: true, file_instruction: '', selectedFile: null });
      setFileError(null);
      setShowCreateForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to create personality');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleEdit = (personality: any) => {
    setEditingId(personality.id);
    setFormData({
      name: personality.name,
      prompt: personality.prompt,
      has_memory: personality.has_memory,
      file_instruction: personality.file_instruction || '',
      selectedFile: null // Don't pre-populate with existing file
    });
    setFileError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name.trim() || !formData.prompt.trim()) return;
    
    try {
      setIsProcessingFile(true);
      
      // Update personality basic info
      await updatePersonality(editingId, {
        name: formData.name.trim(),
        prompt: formData.prompt.trim(),
        has_memory: formData.has_memory,
        file_instruction: formData.file_instruction.trim() || undefined
      });
      
      // Handle file upload if new file selected
      if (formData.selectedFile && formData.file_instruction.trim()) {
        await uploadPersonalityFile(
          editingId, 
          formData.selectedFile, 
          formData.file_instruction.trim()
        );
      }
      
      // Reset form
      setEditingId(null);
      setFormData({ name: '', prompt: '', has_memory: true, file_instruction: '', selectedFile: null });
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to save personality');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemovePersonalityFile = async (personalityId: string) => {
    try {
      setIsProcessingFile(true);
      await removePersonalityFile(personalityId);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to remove file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', prompt: '', has_memory: true, file_instruction: '', selectedFile: null });
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this personality?')) {
      await deletePersonality(id);
    }
  };

  const handleSetActive = async (id: string) => {
    if (activePersonality?.id === id) {
      // Deactivate current personality
      await updatePersonality(id, { is_active: false });
    } else {
      await setActivePersonality(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Personalities</h2>
          </div>
          <button
            onClick={togglePersonalities}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Personality
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Personality</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Helpful Assistant, Creative Writer, Code Expert"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Personality Prompt
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe how the AI should behave, its tone, expertise, and approach..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.has_memory}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_memory: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Brain className="w-4 h-4" />
                    Enable Memory
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    When enabled, the AI will remember previous messages in the conversation
                  </p>
                </div>
                
                {/* File Upload Section */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Knowledge File (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".txt,.md,.pdf,.docx"
                        className="hidden"
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>
                      {formData.selectedFile && (
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formData.selectedFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supported: TXT, MD, PDF, DOCX (max 5MB)
                    </p>
                    {formData.selectedFile && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          File Usage Instructions
                        </label>
                        <textarea
                          value={formData.file_instruction}
                          onChange={(e) => setFormData(prev => ({ ...prev, file_instruction: e.target.value }))}
                          placeholder="Describe how the AI should use this file (e.g., 'Use this as reference for answering questions about our company policies')"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    )}
                    {fileError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {fileError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!formData.name.trim() || !formData.prompt.trim()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '', prompt: '', has_memory: true, file_instruction: '', selectedFile: null });
                      setFileError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Personalities List */}
          <div className="space-y-4">
            {personalities.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No personalities yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first AI personality to customize how the assistant responds
                </p>
              </div>
            ) : (
              personalities.map((personality) => (
                <div
                  key={personality.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    personality.is_active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  {editingId === personality.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Personality Prompt
                        </label>
                        <textarea
                          value={formData.prompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      {/* File Upload Section for Edit Form */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Knowledge File
                        </label>
                        {personality.file_name ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <File className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 dark:text-green-300">
                                {personality.file_name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePersonalityFile(personality.id)}
                                disabled={isProcessingFile}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {personality.file_instruction && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <strong>Instructions:</strong> {personality.file_instruction}
                              </p>
                            )}
                            <div className="text-sm text-gray-500">
                              To replace this file, upload a new one below:
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            No file attached
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileSelect}
                              accept=".txt,.md,.pdf,.docx"
                              className="hidden"
                              id={`file-input-edit-${personality.id}`}
                            />
                            <label
                              htmlFor={`file-input-edit-${personality.id}`}
                              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              {personality.file_name ? 'Replace File' : 'Choose File'}
                            </label>
                            {formData.selectedFile && (
                              <div className="flex items-center gap-2">
                                <File className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formData.selectedFile.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleRemoveFile}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Supported: TXT, MD, PDF, DOCX (max 5MB)
                          </p>
                          {formData.selectedFile && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                File Usage Instructions
                              </label>
                              <textarea
                                value={formData.file_instruction}
                                onChange={(e) => setFormData(prev => ({ ...prev, file_instruction: e.target.value }))}
                                placeholder="Describe how the AI should use this file"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          )}
                          {fileError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              {fileError}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!formData.name.trim() || !formData.prompt.trim()}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {personality.name}
                            </h3>
                            {personality.is_active && (
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {personality.prompt}
                          </p>
                          {personality.file_name && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                              <File className="w-3 h-3" />
                              <span>Knowledge: {personality.file_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => handleEdit(personality)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(personality.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={personality.has_memory}
                              onChange={(e) => updatePersonality(personality.id, { has_memory: e.target.checked })}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <Brain className="w-4 h-4" />
                            Enable Memory
                          </label>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Updated {new Date(personality.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSetActive(personality.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            personality.is_active
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                          }`}
                        >
                          {personality.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
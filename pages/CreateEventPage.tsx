import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Info, Loader2, CheckCircle } from 'lucide-react';
import { HistoricalEvent, Category, Era, Significance } from '../types';
import { CATEGORY_METADATA, ERA_LABELS, SIGNIFICANCE_LABELS } from '../constants';
import { generateSummary } from '../services/geminiService';

interface CreateEventPageProps {
  addEvent: (event: Omit<HistoricalEvent, 'id'>) => Promise<HistoricalEvent>;
  onEventCreated: () => void;
}

const CreateEventPage: React.FC<CreateEventPageProps> = ({ addEvent, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    summary: '',
    date: '',
    year: '',
    category: Category.Political,
    era: Era.Modern,
    location: '',
    image_url: '',
    significance: Significance.Medium,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateSummary = async () => {
    if (!formData.description) {
      setError('Please provide a description to generate a summary.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setSummaryGenerated(false);
    try {
      const summary = await generateSummary(formData.description);
      setFormData(prev => ({ ...prev, summary }));
      setSummaryGenerated(true);
    } catch (err) {
      setError('Failed to generate summary.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.date || !formData.year) {
        setError("Please fill in all required fields.");
        return;
    }
    setError('');
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    
    const newEvent: Omit<HistoricalEvent, 'id'> = {
        ...formData,
        date: new Date(formData.date),
        year: parseInt(formData.year, 10),
        image_url: formData.image_url || `https://picsum.photos/seed/${formData.title.replace(/\s+/g, '')}/800/600`,
    };
    
    await addEvent(newEvent);
    
    setSubmissionSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
        // Reset form
        setFormData({
            title: '',
            description: '',
            summary: '',
            date: '',
            year: '',
            category: Category.Political,
            era: Era.Modern,
            location: '',
            image_url: '',
            significance: Significance.Medium,
        });
        setSummaryGenerated(false);
        setSubmissionSuccess(false);
        onEventCreated();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-5xl font-serif font-bold text-brand-text-primary mb-8">Create New Event</h1>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-parchment-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={isSubmitting || submissionSuccess}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Title" name="title" value={formData.title} onChange={handleInputChange} required />
                    <InputField label="Year" name="year" type="number" value={formData.year} onChange={handleInputChange} required />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-brand-text-secondary mb-2">Description</label>
                    <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"
                    />
                </div>

                <div className="p-4 bg-brand-gold/10 border-l-4 border-brand-gold rounded-r-md flex items-start space-x-3">
                    <Info className="text-brand-gold h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                    <h4 className="font-bold text-brand-gold font-serif">AI-Powered Summarization</h4>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Provide a detailed description above, and our AI will generate a concise 2-3 sentence summary for you.
                    </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={handleGenerateSummary}
                        disabled={isGenerating}
                        className="flex items-center justify-center px-4 py-2 bg-brand-red text-white font-semibold rounded-md hover:bg-brand-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="animate-spin mr-2" size={20}/> : <Sparkles className="mr-2" size={20} />}
                        {isGenerating ? 'Generating...' : 'Generate AI Summary'}
                    </button>
                    {summaryGenerated && <span className="text-green-400">Summary generated successfully!</span>}
                </div>

                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-brand-text-secondary mb-2">AI Generated Summary</label>
                    <textarea
                    id="summary"
                    name="summary"
                    rows={3}
                    value={formData.summary}
                    onChange={handleInputChange}
                    readOnly={summaryGenerated}
                    placeholder="AI summary will appear here..."
                    className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                    <SelectField label="Category" name="category" value={formData.category} onChange={handleInputChange} options={Object.entries(CATEGORY_METADATA).map(([key, {label}])=>({value: key, label}))} />
                    <SelectField label="Era" name="era" value={formData.era} onChange={handleInputChange} options={Object.entries(ERA_LABELS).map(([key, label])=>({value: key, label}))} />
                    <InputField label="Location" name="location" value={formData.location} onChange={handleInputChange} />
                    <InputField label="Image URL (optional)" name="image_url" value={formData.image_url} onChange={handleInputChange} />
                    <SelectField label="Significance" name="significance" value={formData.significance} onChange={handleInputChange} options={Object.entries(SIGNIFICANCE_LABELS).map(([key, label])=>({value: key, label}))} />
                </div>
            </div>
          </fieldset>

          {error && <p className="text-red-400">{error}</p>}
          
          <div className="text-right pt-4 border-t border-brand-gold/20">
              <button
                  type="submit"
                  disabled={isSubmitting || submissionSuccess}
                  className={`px-8 py-3 w-40 font-bold rounded-md transition-all disabled:opacity-70 flex justify-center items-center ${
                      submissionSuccess 
                        ? 'bg-green-600 text-white' 
                        : 'bg-brand-gold text-white hover:opacity-90'
                    }`}
              >
                  {isSubmitting && <Loader2 className="animate-spin" size={24} />}
                  {submissionSuccess && <CheckCircle size={24} />}
                  {!isSubmitting && !submissionSuccess && 'Create Event'}
              </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const InputField: React.FC<{label: string, name: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void, required?: boolean}> = ({ label, name, type="text", value, onChange, required=false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-2">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none disabled:opacity-50" />
    </div>
);

const SelectField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>)=>void, options: {value:string, label:string}[]}> = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-2">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none disabled:opacity-50">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

export default CreateEventPage;

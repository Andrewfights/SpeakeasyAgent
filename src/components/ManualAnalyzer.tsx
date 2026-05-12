import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Callout } from './ui';
import { ScoreGauge } from './ui/ScoreBadge';
import { IconSparkles, IconHeart, IconX } from './ui/Icons';

interface AnalysisResult {
  overall_score: number;
  budget_status: 'within_budget' | 'over_budget' | 'great_deal';
  why_it_fits: string;
  concerns: string;
  recommended_action: 'buy_now' | 'consider' | 'skip' | 'negotiate';
  interest_question: string;
}

export function ManualAnalyzer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title, price, description, condition, source: 'Manual' })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getBudgetLabel = (status: string) => {
    switch (status) {
      case 'great_deal': return { text: 'Great deal', color: 'var(--color-leaf-soft)' };
      case 'within_budget': return { text: 'Within budget', color: 'var(--color-leaf-soft)' };
      case 'over_budget': return { text: 'Over budget', color: 'var(--color-rust)' };
      default: return { text: status, color: 'var(--color-muted)' };
    }
  };

  return (
    <div className="p-4 md:p-5 h-full overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        {/* Left: Form */}
        <div>
          <div className="eyebrow">Analyzer</div>
          <h1 className="heading-2 mt-1 mb-4">Score a listing</h1>

          <form onSubmit={handleAnalyze} className="space-y-3">
            <div>
              <label className="input-label">Listing URL</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="input"
                placeholder="ebay.com/itm/..."
              />
            </div>

            <div>
              <label className="input-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="input"
                placeholder="Hollywood regency velvet stools"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Price</label>
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  className="input"
                  placeholder="$140"
                />
              </div>
              <div>
                <label className="input-label">Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="input"
                  placeholder="Very good"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="input"
                placeholder="Pair of vintage velvet stools, brass-toned legs..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isAnalyzing || !title || !price}
              className="w-full justify-center mt-2"
            >
              <IconSparkles size={14} />
              {isAnalyzing ? 'Analyzing...' : 'Score it'}
            </Button>
          </form>
        </div>

        {/* Right: Results */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-64 lg:h-full rounded-lg flex flex-col items-center justify-center text-center"
                style={{
                  border: '1px dashed var(--color-border-strong)',
                  background: 'var(--color-bg-card)'
                }}
              >
                <IconSparkles size={24} style={{ color: 'var(--color-dim)' }} className="mb-3" />
                <p className="text-sm" style={{ color: 'var(--color-dim)' }}>
                  Fill in the details and click<br />"Score it" to analyze
                </p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-64 lg:h-full rounded-lg flex flex-col items-center justify-center"
                style={{ background: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-strong)' }}
              >
                <div className="flex gap-1 mb-3">
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--color-gold)', animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--color-gold)', animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--color-gold)', animationDelay: '300ms' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
                  Analyzing listing...
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg overflow-hidden"
                style={{ background: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-strong)' }}
              >
                {/* Score header */}
                <div
                  className="p-4 flex items-center gap-4"
                  style={{ borderBottom: '0.5px solid var(--color-border)' }}
                >
                  <ScoreGauge score={result.overall_score} size={68} />

                  <div className="ml-auto text-right">
                    <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-display)' }}>
                      Budget
                    </div>
                    <div
                      className="text-sm font-medium tabular-nums"
                      style={{ color: getBudgetLabel(result.budget_status).color, fontFamily: 'var(--font-display)' }}
                    >
                      {price} / $200
                    </div>
                  </div>
                </div>

                {/* Analysis body */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="input-label" style={{ color: 'var(--color-gold)' }}>Aesthetic fit</div>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-warm)', lineHeight: 1.55 }}>
                      {result.why_it_fits}
                    </p>
                  </div>

                  {result.budget_status === 'great_deal' && (
                    <Callout type="good" title="Pricing.">
                      Below median of recent sold listings.
                    </Callout>
                  )}

                  {result.concerns && (
                    <Callout type="warn" title="Note.">
                      {result.concerns}
                    </Callout>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" className="flex-1 justify-center">
                      <IconHeart size={12} />
                      Save
                    </Button>
                    {result.recommended_action === 'negotiate' && (
                      <Button variant="gold-ghost">
                        Negotiate
                      </Button>
                    )}
                    <Button variant="ghost">
                      <IconX size={12} />
                      Skip
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ManualAnalyzer;

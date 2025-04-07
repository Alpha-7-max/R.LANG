
import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { correctText } from "@/services/textCorrectionService";
import { Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const TextCorrector = () => {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [untranslatableWords, setUntranslatableWords] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Focus the textarea on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Process text when input changes
  useEffect(() => {
    const processText = async () => {
      if (!inputText) {
        setCorrectedText("");
        setIsProcessing(false);
        setUntranslatableWords([]);
        return;
      }

      setIsProcessing(true);
      
      try {
        const result = await correctText(inputText);
        setCorrectedText(result.correctedText);
        setIsTranslated(result.isTranslated);
        setUntranslatableWords(result.untranslatableWords || []);
      } finally {
        setIsProcessing(false);
      }
    };

    processText();
  }, [inputText]);

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    if (!correctedText || !outputRef.current) return;
    
    // Get the text content while excluding the untranslatable words
    const selection = window.getSelection();
    const range = document.createRange();
    const clonedOutput = outputRef.current.cloneNode(true) as HTMLElement;
    
    // Remove untranslatable (red) spans before copying
    const untranslatableSpans = clonedOutput.querySelectorAll('.untranslatable');
    untranslatableSpans.forEach(span => {
      span.innerHTML = span.textContent || '';
    });
    
    // Get clean text without HTML tags
    const cleanText = clonedOutput.textContent || '';
    
    navigator.clipboard.writeText(cleanText)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Render corrected text with untranslatable words highlighted
  const renderCorrectedText = () => {
    if (!correctedText) return null;
    
    let renderedText = correctedText;
    
    // Replace untranslatable words with span elements
    untranslatableWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      renderedText = renderedText.replace(regex, `<span class="untranslatable">${word}</span>`);
    });
    
    return (
      <p 
        ref={outputRef}
        className="whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: renderedText }}
      />
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-6 shadow-sm border border-slate-200 bg-white">
        <h2 className="text-xl font-semibold mb-4 text-center text-slate-800">
          Smart Text Assistant
        </h2>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Type in any language. Text will be corrected and translated in real-time.
        </p>
        
        <div className="space-y-4">
          {/* Input area with updated styling */}
          <div>
            <Textarea
              ref={inputRef}
              placeholder="Start typing here..."
              className="min-h-[150px] resize-none text-lg p-4 border-slate-200 focus-visible:ring-app-purple focus-visible:border-app-purple focus-visible:ring-offset-1"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          
          {/* Output area with improved loading state */}
          <div className="relative">
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {isProcessing && (
                <Loader2 className="h-5 w-5 animate-spin text-app-blue" />
              )}
            </div>
            
            <div className={`min-h-[150px] p-4 rounded-md border ${
              isProcessing 
                ? "bg-blue-50/50 border-blue-100 transition-colors duration-300" 
                : "bg-slate-50 border-slate-200"
            }`}>
              {correctedText && !isProcessing && renderCorrectedText()}
              {!correctedText && !isProcessing && inputText && (
                <span className="text-muted-foreground italic">
                  Processing text...
                </span>
              )}
              {!correctedText && !isProcessing && !inputText && (
                <span className="text-muted-foreground italic">
                  Corrected text will appear here
                </span>
              )}
            </div>
            
            {correctedText && (
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="text-sm font-normal border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 py-1 px-3 rounded shadow-sm"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{isCopied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            )}
            
            {isTranslated && correctedText && (
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="bg-primary/10 text-primary/80 px-2 py-0.5 rounded-full">
                  Translated to English
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TextCorrector;

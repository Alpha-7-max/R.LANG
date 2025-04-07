
import TextCorrector from "@/components/TextCorrector";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          Smart Text Editor
        </h1>
        <p className="text-slate-600">
          Grammar corrections & translations in real-time
        </p>
      </div>
      
      <TextCorrector />
      
      <footer className="mt-8 text-xs text-slate-500 text-center">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default Index;

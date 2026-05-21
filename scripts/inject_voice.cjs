const fs = require('fs');
let code = fs.readFileSync('DynamicFormRenderer.jsx', 'utf8');

const voiceInputCode = `
  const VoiceInput = ({ value, onChange, placeholder, type="text", inputMode }) => {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const recognitionRef = React.useRef(null);
    const isListeningRef = React.useRef(false);
    const valueRef = React.useRef(value);

    useEffect(() => {
       valueRef.current = value;
    }, [value]);

    useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event) => {
          let currentFinal = "";
          let currentInterim = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript + " ";
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (currentFinal) {
             const prevVal = valueRef.current ? valueRef.current.trim() + " " : "";
             const newVal = prevVal + currentFinal.trim();
             valueRef.current = newVal;
             onChange(newVal);
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed' || event.error === 'network') {
              isListeningRef.current = false;
              setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
             try { recognition.start(); } 
             catch(e) { 
               isListeningRef.current = false; 
               setIsListening(false); 
             }
          } else {
             setIsListening(false);
             setInterimText("");
          }
        };
        
        recognitionRef.current = recognition;
      }
      
      return () => {
         if (recognitionRef.current) {
            recognitionRef.current.onend = null; 
            recognitionRef.current.stop();
         }
      };
    }, [onChange]);

    const toggleListen = () => {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current?.stop();
        setInterimText("");
      } else {
        if (recognitionRef.current) {
          try {
            isListeningRef.current = true;
            setIsListening(true);
            recognitionRef.current.start();
          } catch(e) {
            console.error(e);
          }
        } else {
          alert("Browser Anda tidak mendukung fitur Voice Recognition.");
        }
      }
    };

    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const displayValue = isListening && interimText ? (value ? value + " " + interimText : interimText) : value;

    return (
      <div className="relative mt-2 flex w-full items-center">
        <input 
          type={type} 
          value={displayValue || ''} 
          onChange={e => {
              onChange(e.target.value);
              if (isListeningRef.current) toggleListen(); 
          }}
          required={false} 
          placeholder={isListening ? "Mendengarkan... (bisa jeda/napas)" : placeholder}
          inputMode={inputMode}
          className={\`w-full bg-white border font-bold text-xs py-4 pl-4 pr-12 rounded-xl outline-none focus:ring-2 shadow-sm transition-all \${isListening ? 'border-rose-500 ring-2 ring-rose-200 placeholder-rose-400 text-rose-700' : 'border-slate-200 text-slate-800'}\`}
        />
        {isSupported && (
            <button 
               type="button" 
               onClick={toggleListen}
               className={\`absolute right-2 p-2.5 rounded-lg transition-all shadow-sm \${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}\`}
               title={isListening ? "Matikan Mic" : "Mulai Bicara"}
            >
               {isListening ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="5" width="10" height="10" /></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2z" clipRule="evenodd" /></svg>
               )}
            </button>
        )}
      </div>
    );
  };

  const CustomToggle`;

code = code.replace('  const CustomToggle', voiceInputCode);

const oldInput = `    return (
      <input type={question.answer_type === 'number' ? 'number' : 'text'} value={value} 
        onChange={(e) => onChange(question.id, e.target.value)} required={false} placeholder="Ketik hasil..." 
        inputMode={question.answer_type === 'number' ? 'decimal' : undefined}
        className="w-full bg-white border border-slate-200 text-slate-800 font-bold text-xs py-4 px-4 rounded-xl mt-2 outline-none focus:ring-2 shadow-sm"
      />
    );`;

const voiceInputUsage = `    return (
      <VoiceInput 
        type={question.answer_type === 'number' ? 'number' : 'text'} 
        value={value} 
        onChange={(val) => onChange(question.id, val)} 
        placeholder="Ketik hasil..." 
        inputMode={question.answer_type === 'number' ? 'decimal' : undefined}
      />
    );`;

if (code.includes('const CustomToggle') && code.includes('placeholder="Ketik hasil..."')) {
    code = code.replace(oldInput, voiceInputUsage);
    fs.writeFileSync('DynamicFormRenderer.jsx', code);
    console.log('Successfully injected VoiceInput!');
} else {
    console.log('Injection failed. Anchors not found.');
}

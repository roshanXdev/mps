import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, Download, FileText, CheckCircle2, ChevronRight, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full relative py-20 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 md:left-20 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 md:right-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-8 relative"
        >
          <div className="text-7xl md:text-9xl drop-shadow-xl z-10 relative">📚🎓🇮🇳</div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full scale-150 -z-10"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-800 font-bold mb-4 shadow-sm border border-orange-200">
            <Zap className="w-4 h-4" />
            <span>इग्नू पीजी राजनीति विज्ञान के छात्रों के लिए</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-serif text-foreground leading-tight tracking-tight">
            आपके <span className="text-primary relative inline-block">
              असाइनमेंट
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-green-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span> की चिंता खत्म!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            हिंदी माध्यम के सभी छात्रों के लिए उच्चतम गुणवत्ता वाले हल किए गए असाइनमेंट। 
            सिर्फ ₹11 में डाउनलोड करें और पढ़ाई का जश्न मनाएं।
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/assignments">
              <Button size="lg" className="h-14 px-8 text-xl font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 w-full sm:w-auto group">
                असाइनमेंट देखें
                <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pay">
              <Button size="lg" variant="outline" className="h-14 px-8 text-xl font-bold border-2 border-secondary text-secondary hover:bg-secondary hover:text-white rounded-xl w-full sm:w-auto">
                सीधे भुगतान करें
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-serif text-foreground mb-4">यह कैसे काम करता है?</h2>
            <p className="text-xl text-muted-foreground font-medium">3 आसान चरणों में अपने असाइनमेंट प्राप्त करें</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "असाइनमेंट चुनें",
                desc: "हमारी सूची से अपने विषय और वर्ष के अनुसार असाइनमेंट ढूंढें।",
                icon: FileText,
                color: "bg-blue-100 text-blue-600 border-blue-200",
              },
              {
                step: "2",
                title: "₹11 का भुगतान करें",
                desc: "UPI QR कोड स्कैन करें और मात्र ₹11 का सुरक्षित भुगतान करें।",
                icon: BookOpen,
                color: "bg-orange-100 text-orange-600 border-orange-200",
              },
              {
                step: "3",
                title: "तुरंत डाउनलोड करें",
                desc: "भुगतान सत्यापित होने पर तुरंत PDF डाउनलोड करें।",
                icon: Download,
                color: "bg-green-100 text-green-600 border-green-200",
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-24 h-24 rounded-3xl ${item.color} border-2 flex items-center justify-center mb-6 rotate-3 group-hover:rotate-6 transition-transform shadow-md`}>
                  <item.icon className="w-10 h-10" />
                </div>
                <div className="relative">
                  <span className="absolute -top-10 -left-6 text-6xl font-black text-gray-100 -z-10">{item.step}</span>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                </div>
                <p className="text-muted-foreground font-medium text-lg">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features/Trust Section */}
      <section className="w-full py-20 bg-orange-50/50 border-y border-orange-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-black font-serif text-foreground mb-12">
            IGNOU Assignment Wala ही क्यों?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              "पूर्ण रूप से हिंदी माध्यम के छात्रों के लिए समर्पित",
              "सटीक और विश्वविद्यालय के मानकों के अनुसार उत्तर",
              "सबसे कम कीमत — मात्र ₹11 प्रति विषय",
              "सुरक्षित UPI भुगतान प्रणाली",
              "तुरंत डाउनलोड की सुविधा",
              "मोबाइल फ्रेंडली PDF फॉर्मेट"
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-orange-100 shadow-sm hover-elevate">
                <div className="w-8 h-8 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-lg font-bold text-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bottom CTA */}
      <section className="w-full py-24 bg-primary text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black font-serif">क्या आप तैयार हैं?</h2>
          <p className="text-xl md:text-2xl font-medium opacity-90">
            हजारों छात्र पहले ही हमारे असाइनमेंट से लाभ उठा चुके हैं। 
            अब आपकी बारी है।
          </p>
          <Link href="/assignments">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-white text-primary hover:bg-orange-50 rounded-xl shadow-2xl mt-4">
              असाइनमेंट खोजना शुरू करें
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

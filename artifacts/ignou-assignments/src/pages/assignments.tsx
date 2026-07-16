import { useState } from "react";
import { useListAssignments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Lock, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Assignments() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: assignments, isLoading } = useListAssignments();

  const filteredAssignments = assignments?.filter((a) => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black font-serif text-foreground mb-4">
          असाइनमेंट सूची
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
          अपने विषय और वर्ष के अनुसार असाइनमेंट खोजें। सभी असाइनमेंट सुरक्षित हैं।
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-12 relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-6 w-6" />
          </div>
          <Input
            type="text"
            className="pl-12 h-14 text-lg rounded-2xl border-2 border-orange-200 focus-visible:ring-primary shadow-sm bg-white"
            placeholder="विषय, शीर्षक या वर्ष खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-orange-100 p-6 h-64 animate-pulse flex flex-col">
              <div className="h-6 bg-orange-100 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-orange-50 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-orange-50 rounded w-full mb-auto"></div>
              <div className="h-10 bg-orange-100 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredAssignments?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-orange-200">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">कोई असाइनमेंट नहीं मिला</h3>
          <p className="text-muted-foreground text-lg mb-6">इस खोज के लिए कोई परिणाम नहीं मिला। कृपया कुछ और खोजें।</p>
          <Button onClick={() => setSearchTerm("")} variant="outline" className="rounded-xl">
            खोज मिटाएं
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments?.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border-2 border-orange-100 p-6 flex flex-col hover-elevate transition-all group hover:border-primary/30 relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out -z-10" />
              
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-800 text-sm font-bold border border-orange-200">
                  {assignment.subject}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm font-bold border border-green-200">
                  {assignment.year}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 leading-tight">
                {assignment.title}
              </h3>
              
              {assignment.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {assignment.description}
                </p>
              )}
              
              <div className="mt-auto pt-6 flex items-center gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center text-gray-500 font-medium text-sm">
                    <Lock className="w-4 h-4 mr-2" />
                    <span>लॉक्ड</span>
                  </div>
                  <span className="font-black text-lg text-primary">₹11</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center bg-orange-50/50 p-8 rounded-3xl border border-orange-100">
        <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">क्या आपको अपना असाइनमेंट मिल गया?</h3>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          डाउनलोड करने के लिए पहले भुगतान करें, फिर सत्यापन पेज पर जाकर अपने असाइनमेंट प्राप्त करें।
        </p>
        <Link href="/pay">
          <Button size="lg" className="h-14 px-8 text-lg font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg">
            भुगतान पेज पर जाएं
          </Button>
        </Link>
      </div>
    </div>
  );
}

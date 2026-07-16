import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Clock, XCircle, Download, ShieldCheck, AlertCircle } from "lucide-react";
import { useCheckPaymentStatus, useListAssignments } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Verify() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialPhone = searchParams.get("phone") || "";
  
  const [phone, setPhone] = useState(initialPhone);
  const [searchPhone, setSearchPhone] = useState(initialPhone);

  const { data: statusData, isLoading: isChecking, error, isError } = useCheckPaymentStatus(
    { phone: searchPhone },
    { query: { enabled: searchPhone.length === 10, retry: false } }
  );

  const { data: assignments, isLoading: isAssignmentsLoading } = useListAssignments({
    query: { enabled: statusData?.status === "approved" }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast({
        title: "अमान्य नंबर",
        description: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।",
        variant: "destructive",
      });
      return;
    }
    setSearchPhone(phone);
  };

  const handleDownload = (id: number, fileName: string) => {
    // Open in new tab or trigger download via direct URL
    const url = `/api/assignments/${id}/download?phone=${searchPhone}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // Hint for browser
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "डाउनलोड शुरू हो गया",
      description: "आपकी फाइल डाउनलोड हो रही है।",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black font-serif text-foreground mb-4">
          भुगतान सत्यापन
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
          अपना मोबाइल नंबर दर्ज करके भुगतान की स्थिति जांचें और असाइनमेंट डाउनलोड करें।
        </p>
      </div>

      <div className="max-w-md mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="10 अंकों का मोबाइल नंबर"
            maxLength={10}
            className="h-14 text-lg rounded-xl shadow-sm border-2 border-orange-200 focus-visible:ring-primary"
          />
          <Button type="submit" className="h-14 px-6 rounded-xl font-bold bg-primary shadow-md hover:bg-primary/90 text-white">
            जांचें
          </Button>
        </form>
      </div>

      {searchPhone.length === 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {isChecking ? (
            <Card className="border-2 border-orange-100 shadow-md">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xl font-bold text-muted-foreground mt-4">स्थिति की जांच की जा रही है...</p>
              </CardContent>
            </Card>
          ) : isError ? (
            <Card className="border-2 border-red-200 bg-red-50/50 shadow-md">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-2">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-red-700">कोई रिकॉर्ड नहीं मिला</h3>
                <p className="text-lg text-red-600/80 font-medium">
                  इस नंबर से कोई भुगतान अनुरोध नहीं मिला है। कृपया सही नंबर जांचें या पहले भुगतान करें।
                </p>
                <Button onClick={() => window.location.href='/pay'} variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">
                  भुगतान पेज पर जाएं
                </Button>
              </CardContent>
            </Card>
          ) : statusData ? (
            <div className="space-y-8">
              {/* Status Card */}
              <Card className={`border-2 shadow-lg overflow-hidden ${
                statusData.status === 'approved' ? 'border-green-300' :
                statusData.status === 'pending' ? 'border-orange-300' :
                'border-red-300'
              }`}>
                <div className={`p-3 text-center font-bold text-white ${
                  statusData.status === 'approved' ? 'bg-green-500' :
                  statusData.status === 'pending' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}>
                  {statusData.status === 'approved' && "✓ भुगतान सत्यापित"}
                  {statusData.status === 'pending' && "⌛ सत्यापन प्रगति पर है"}
                  {statusData.status === 'rejected' && "✕ भुगतान अस्वीकृत"}
                </div>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${
                        statusData.status === 'approved' ? 'bg-green-100 text-green-600' :
                        statusData.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {statusData.status === 'approved' && <CheckCircle2 className="w-8 h-8" />}
                        {statusData.status === 'pending' && <Clock className="w-8 h-8" />}
                        {statusData.status === 'rejected' && <XCircle className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          नमस्ते, {statusData.name}!
                        </h3>
                        <p className="text-muted-foreground font-medium">
                          मोबाइल: {statusData.phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-4 rounded-xl border border-gray-200 text-center w-full md:w-auto">
                      <p className="text-sm text-muted-foreground font-medium mb-1">वर्तमान स्थिति</p>
                      <p className={`text-xl font-black ${
                        statusData.status === 'approved' ? 'text-green-600' :
                        statusData.status === 'pending' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {statusData.status === 'approved' && "अनुमोदित"}
                        {statusData.status === 'pending' && "लंबित"}
                        {statusData.status === 'rejected' && "अस्वीकृत"}
                      </p>
                    </div>
                  </div>

                  {statusData.status === 'pending' && (
                    <div className="mt-8 bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200 font-medium text-center">
                      आपका भुगतान अनुरोध प्राप्त हो गया है। हमारी टीम इसकी जांच कर रही है। इसमें कुछ घंटे लग सकते हैं। कृपया बाद में दोबारा जांचें।
                    </div>
                  )}

                  {statusData.status === 'rejected' && (
                    <div className="mt-8 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 font-medium text-center">
                      आपके भुगतान की पुष्टि नहीं हो सकी है। कृपया सही UTR नंबर के साथ पुनः प्रयास करें या सहायता के लिए संपर्क करें।
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Downloads Section (Only if approved) */}
              {statusData.status === 'approved' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center justify-between border-b-2 border-green-100 pb-4">
                    <h2 className="text-2xl font-black font-serif text-foreground flex items-center gap-2">
                      <Download className="text-green-600" />
                      असाइनमेंट डाउनलोड करें
                    </h2>
                    <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-200">
                      <ShieldCheck className="w-4 h-4" /> एक्सेस खुला है
                    </span>
                  </div>

                  {isAssignmentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : assignments && assignments.length > 0 ? (
                    <div className="grid gap-4">
                      {assignments.map((assignment, index) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white border-2 border-orange-100 hover:border-primary/50 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors shadow-sm group hover:shadow-md"
                        >
                          <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                              <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded-md border border-orange-200">
                                {assignment.subject}
                              </span>
                              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-md border border-blue-200">
                                {assignment.year}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                              {assignment.title}
                            </h3>
                          </div>
                          
                          <Button
                            onClick={() => handleDownload(assignment.id, assignment.fileName)}
                            className="w-full sm:w-auto shrink-0 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-md gap-2"
                          >
                            <Download className="w-4 h-4" />
                            डाउनलोड (PDF)
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-muted-foreground font-medium text-lg">अभी कोई असाइनमेंट उपलब्ध नहीं है।</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}

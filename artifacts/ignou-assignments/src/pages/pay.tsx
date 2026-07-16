import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, QrCode, ShieldCheck, ArrowRight, Copy } from "lucide-react";
import { useSubmitPaymentRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

// Using an image from a reliable placeholder service as specified, or an absolute path if available.
// The prompt specifies a QR code file path, but in a real app it would be bundled. 
// We'll use a stylized div for the QR container, and add the real img if available.
import qrCodeImage from "@assets/WhatsApp_Image_2026-07-17_at_12.45.58_AM_1784229396894.jpeg";

const paymentSchema = z.object({
  name: z.string().min(2, "कृपया अपना पूरा नाम दर्ज करें"),
  phone: z.string().regex(/^[0-9]{10}$/, "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें"),
  utrNumber: z.string().min(12, "कृपया 12 अंकों का UTR / Transaction ID दर्ज करें"),
});

export default function Pay() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const submitPayment = useSubmitPaymentRequest();
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      name: "",
      phone: "",
      utrNumber: "",
    },
  });

  const upiId = "6299307396@pthdfc";

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({
      title: "UPI ID कॉपी हो गई",
      description: "आप इसे अपने पेमेंट ऐप में पेस्ट कर सकते हैं।",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = (data: z.infer<typeof paymentSchema>) => {
    submitPayment.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "पेमेंट रिक्वेस्ट सबमिट हो गई",
          description: "हम जल्द ही इसे वेरिफाई करेंगे।",
        });
        setLocation(`/verify?phone=${data.phone}`);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "त्रुटि",
          description: (err as any)?.data?.error || err.message || "कुछ गलत हो गया, कृपया फिर से प्रयास करें।",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black font-serif text-foreground mb-4">
          भुगतान करें
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
          सभी असाइनमेंट तक पहुँच के लिए मात्र ₹11 का सुरक्षित भुगतान करें।
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* Step 1: Payment Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              1
            </div>
            <h2 className="text-2xl font-bold text-foreground">QR कोड स्कैन करें</h2>
          </div>
          
          <Card className="border-2 border-orange-200 overflow-hidden shadow-lg rounded-2xl relative">
            <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-1 font-bold text-sm rounded-bl-xl z-10">
              सुरक्षित भुगतान
            </div>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative w-64 h-64 bg-white p-4 rounded-xl border-2 border-dashed border-orange-300 mb-6 flex items-center justify-center shadow-inner group">
                {/* Fallback styling in case image doesn't load */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-20 group-hover:opacity-10 transition-opacity">
                  <QrCode className="w-24 h-24 mb-2" />
                  <span className="font-bold">QR Loading...</span>
                </div>
                {/* Actual image */}
                <img 
                  src={qrCodeImage} 
                  alt="UPI QR Code for Payment" 
                  className="w-full h-full object-contain relative z-10 rounded-lg shadow-sm"
                  onError={(e) => {
                    // Hide broken image icon if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Decorative Elements */}
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
              
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 w-full text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">भुगतान राशि</p>
                <p className="text-4xl font-black text-primary mb-2">₹11</p>
                <div className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-bold">
                  <ShieldCheck className="w-3 h-3" /> 100% सुरक्षित
                </div>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">प्राप्तकर्ता का नाम</p>
                    <p className="font-bold text-foreground">Roshan Singh</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="truncate pr-2">
                    <p className="text-xs text-muted-foreground font-medium">UPI ID</p>
                    <p className="font-bold text-foreground truncate">{upiId}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyUpi}
                    className="shrink-0 rounded-lg bg-white"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              2
            </div>
            <h2 className="text-2xl font-bold text-foreground">विवरण भरें</h2>
          </div>
          
          <Card className="border-2 border-green-200 shadow-lg rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm font-medium">
                <strong>ध्यान दें:</strong> भुगतान करने के बाद, अपने पेमेंट ऐप से 12 अंकों का UTR या Transaction ID कॉपी करें और नीचे फॉर्म में भरें।
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">आपका पूरा नाम</FormLabel>
                        <FormControl>
                          <Input placeholder="उदा. राहुल कुमार" className="h-12 rounded-xl text-lg bg-gray-50 focus:bg-white transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold">व्हाट्सएप/मोबाइल नंबर</FormLabel>
                        <FormControl>
                          <Input placeholder="10 अंकों का नंबर" maxLength={10} className="h-12 rounded-xl text-lg bg-gray-50 focus:bg-white transition-colors tracking-widest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="utrNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-primary flex justify-between items-center">
                          <span>UTR / Transaction ID</span>
                          <span className="text-xs text-muted-foreground font-normal bg-gray-100 px-2 py-1 rounded">12 अंक</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="उदा. 412345678901" className="h-12 rounded-xl text-lg border-primary/50 focus:border-primary bg-orange-50/30 focus:bg-white transition-colors tracking-wider font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-xl mt-4 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/30"
                    disabled={submitPayment.isPending}
                  >
                    {submitPayment.isPending ? "सबमिट किया जा रहा है..." : (
                      <>विवरण सबमिट करें <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

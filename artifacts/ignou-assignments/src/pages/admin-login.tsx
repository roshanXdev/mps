import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, ShieldAlert, KeyRound } from "lucide-react";
import { useAdminLogin } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    loginMutation.mutate({ data: { password } }, {
      onSuccess: (data) => {
        // Store token in localStorage
        localStorage.setItem("ignou_admin_token", data.token);
        // Setup default Authorization header for future fetch requests or set to window
        (window as any).__adminToken = data.token;
        
        toast({
          title: "लॉगिन सफल",
          description: "व्यवस्थापक डैशबोर्ड में आपका स्वागत है।",
        });
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "लॉगिन विफल",
          description: "गलत पासवर्ड। कृपया पुनः प्रयास करें।",
        });
        setPassword("");
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 bg-gray-50/50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl relative z-10">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-md">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
        
        <CardHeader className="pt-14 text-center pb-2">
          <CardTitle className="text-2xl font-black font-serif text-foreground">
            व्यवस्थापक लॉगिन
          </CardTitle>
          <CardDescription className="text-base">
            केवल अधिकृत व्यक्तियों के लिए
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <KeyRound className="h-5 w-5" />
              </div>
              <Input
                type="password"
                placeholder="पासवर्ड दर्ज करें"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 text-lg rounded-xl"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg"
              disabled={loginMutation.isPending || !password}
            >
              {loginMutation.isPending ? "प्रमाणित किया जा रहा है..." : (
                <>लॉगिन करें <Lock className="ml-2 w-5 h-5" /></>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

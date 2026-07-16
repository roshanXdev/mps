import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  BarChart, 
  LogOut, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  useGetAdminStats, 
  useListPaymentRequests, 
  useApprovePaymentRequest, 
  useRejectPaymentRequest,
  useListAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  setAuthTokenGetter
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Setup auth token for admin calls
setAuthTokenGetter(() => {
  const token = localStorage.getItem("ignou_admin_token");
  return token;
});

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("ignou_admin_token");
    if (!token) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("ignou_admin_token");
    setLocation("/admin");
  };

  // Data fetching
  const { data: stats } = useGetAdminStats();
  const { data: payments, refetch: refetchPayments } = useListPaymentRequests();
  const { data: assignments, refetch: refetchAssignments } = useListAssignments();

  // Mutations
  const approveMutation = useApprovePaymentRequest();
  const rejectMutation = useRejectPaymentRequest();
  const deleteAssignmentMutation = useDeleteAssignment();
  const createAssignmentMutation = useCreateAssignment();

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "अनुमोदित", description: "भुगतान को सफलतापूर्वक अनुमोदित किया गया।" });
        refetchPayments();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "अस्वीकृत", description: "भुगतान को अस्वीकृत किया गया।" });
        refetchPayments();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    });
  };

  const handleDeleteAssignment = (id: number) => {
    if (confirm("क्या आप वाकई इस असाइनमेंट को हटाना चाहते हैं?")) {
      deleteAssignmentMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "हटाया गया", description: "असाइनमेंट को सफलतापूर्वक हटा दिया गया।" });
          refetchAssignments();
          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        }
      });
    }
  };

  // Upload state
  const [uploadData, setUploadData] = useState({
    title: "",
    subject: "",
    year: "",
    description: "",
    fileName: "",
    fileData: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadData(prev => ({ ...prev, fileName: file.name }));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      // Get base64 string without data:application/pdf;base64, prefix
      const base64 = event.target?.result?.toString().split(',')[1] || "";
      setUploadData(prev => ({ ...prev, fileData: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate({ data: uploadData }, {
      onSuccess: () => {
        toast({ title: "सफलता", description: "नया असाइनमेंट सफलतापूर्वक अपलोड किया गया।" });
        setIsUploadOpen(false);
        setUploadData({ title: "", subject: "", year: "", description: "", fileName: "", fileData: "" });
        refetchAssignments();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "त्रुटि", description: err.error?.error || "अपलोड विफल रहा" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black font-serif text-foreground flex items-center gap-2">
            <BarChart className="w-8 h-8 text-primary" />
            व्यवस्थापक डैशबोर्ड
          </h1>
          <p className="text-muted-foreground font-medium">पोर्टल का प्रबंधन करें</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="w-4 h-4 mr-2" />
          लॉग आउट
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-white border-blue-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-3xl font-black text-blue-600">{stats?.totalPayments || 0}</p>
            <p className="text-sm font-bold text-muted-foreground">कुल अनुरोध</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-orange-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-3xl font-black text-orange-600">{stats?.pendingPayments || 0}</p>
            <p className="text-sm font-bold text-muted-foreground">लंबित</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-green-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-3xl font-black text-green-600">{stats?.approvedPayments || 0}</p>
            <p className="text-sm font-bold text-muted-foreground">अनुमोदित</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-red-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-3xl font-black text-red-600">{stats?.rejectedPayments || 0}</p>
            <p className="text-sm font-bold text-muted-foreground">अस्वीकृत</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-purple-100 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-purple-500 mb-2" />
            <p className="text-3xl font-black text-purple-600">{stats?.totalAssignments || 0}</p>
            <p className="text-sm font-bold text-muted-foreground">कुल असाइनमेंट</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-orange-50">
          <TabsTrigger value="payments" className="text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <CreditCard className="w-5 h-5 mr-2" />
            भुगतान अनुरोध
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <FileText className="w-5 h-5 mr-2" />
            असाइनमेंट प्रबंधन
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">हाल के भुगतान अनुरोध</h2>
            <Button variant="outline" size="sm" onClick={() => refetchPayments()}>रीफ्रेश करें</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-4 font-bold">दिनांक</th>
                  <th className="p-4 font-bold">छात्र विवरण</th>
                  <th className="p-4 font-bold">UTR / Transaction ID</th>
                  <th className="p-4 font-bold">स्थिति</th>
                  <th className="p-4 font-bold text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody>
                {payments?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      कोई भुगतान अनुरोध नहीं मिला
                    </td>
                  </tr>
                ) : payments?.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {format(new Date(payment.createdAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-foreground">{payment.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.phone}</p>
                    </td>
                    <td className="p-4 font-mono font-medium text-primary">
                      {payment.utrNumber}
                    </td>
                    <td className="p-4">
                      {payment.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><Clock className="w-3 h-3 mr-1" /> लंबित</span>}
                      {payment.status === 'approved' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> अनुमोदित</span>}
                      {payment.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3 h-3 mr-1" /> अस्वीकृत</span>}
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                            onClick={() => handleApprove(payment.id)}
                            disabled={approveMutation.isPending}
                          >
                            अनुमोदित
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8"
                            onClick={() => handleReject(payment.id)}
                            disabled={rejectMutation.isPending}
                          >
                            अस्वीकृत
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">असाइनमेंट प्रबंधित करें</h2>
            
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  नया अपलोड करें
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold font-serif">नया असाइनमेंट अपलोड करें</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">शीर्षक</label>
                    <Input 
                      required 
                      value={uploadData.title} 
                      onChange={e => setUploadData({...uploadData, title: e.target.value})} 
                      placeholder="उदा. MPSE-001 (Hindi)" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">विषय कोड</label>
                      <Input 
                        required 
                        value={uploadData.subject} 
                        onChange={e => setUploadData({...uploadData, subject: e.target.value})} 
                        placeholder="उदा. MPSE-001" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">सत्र/वर्ष</label>
                      <Input 
                        required 
                        value={uploadData.year} 
                        onChange={e => setUploadData({...uploadData, year: e.target.value})} 
                        placeholder="उदा. 2023-24" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">विवरण (वैकल्पिक)</label>
                    <Textarea 
                      value={uploadData.description} 
                      onChange={e => setUploadData({...uploadData, description: e.target.value})} 
                      placeholder="असाइनमेंट के बारे में कुछ विवरण..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">PDF फाइल</label>
                    <Input 
                      required 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange} 
                      className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-secondary hover:bg-secondary/90 font-bold text-lg h-12"
                    disabled={createAssignmentMutation.isPending || !uploadData.fileData}
                  >
                    {createAssignmentMutation.isPending ? "अपलोड हो रहा है..." : "सेव करें"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-4 font-bold">शीर्षक</th>
                  <th className="p-4 font-bold">विषय</th>
                  <th className="p-4 font-bold">सत्र/वर्ष</th>
                  <th className="p-4 font-bold">फाइल का नाम</th>
                  <th className="p-4 font-bold text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody>
                {assignments?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      कोई असाइनमेंट नहीं मिला
                    </td>
                  </tr>
                ) : assignments?.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      {assignment.title}
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-bold">
                        {assignment.subject}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground font-medium">
                      {assignment.year}
                    </td>
                    <td className="p-4 text-sm text-blue-600 truncate max-w-[200px]" title={assignment.fileName}>
                      {assignment.fileName}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={deleteAssignmentMutation.isPending}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

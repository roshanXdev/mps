import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  LogOut,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Trash2,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import {
  useGetAdminStats,
  useListPaymentRequests,
  useApprovePaymentRequest,
  useRejectPaymentRequest,
  useListAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  getListAssignmentsQueryKey,
  getGetAdminStatsQueryKey,
  getListPaymentRequestsQueryKey,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Register the admin token getter once at module level
setAuthTokenGetter(() => localStorage.getItem("ignou_admin_token"));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
        <Clock className="w-3 h-3" /> लंबित
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
        <CheckCircle2 className="w-3 h-3" /> अनुमोदित
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
      <XCircle className="w-3 h-3" /> अस्वीकृत
    </span>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem("ignou_admin_token")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("ignou_admin_token");
    setLocation("/admin");
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: stats, refetch: refetchStats } = useGetAdminStats();
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } =
    useListPaymentRequests();
  const { data: assignments, isLoading: assignmentsLoading, refetch: refetchAssignments } =
    useListAssignments();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const approveMutation = useApprovePaymentRequest();
  const rejectMutation = useRejectPaymentRequest();
  const deleteMutation = useDeleteAssignment();
  const createMutation = useCreateAssignment();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPaymentRequestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          alert("✅ भुगतान अनुमोदित किया गया!");
          refetchPayments();
          refetchStats();
        },
        onError: (err: any) => alert("❌ त्रुटि: " + (err?.message || "अनुमोदन विफल")),
      }
    );
  };

  const handleReject = (id: number) => {
    if (!confirm("क्या आप इसे अस्वीकृत करना चाहते हैं?")) return;
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => {
          alert("❌ भुगतान अस्वीकृत किया गया।");
          refetchPayments();
          refetchStats();
        },
        onError: (err: any) => alert("❌ त्रुटि: " + (err?.message || "अस्वीकृत विफल")),
      }
    );
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`क्या आप "${title}" को हटाना चाहते हैं?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          alert("🗑️ असाइनमेंट हटा दिया गया।");
          refetchAssignments();
          refetchStats();
        },
        onError: (err: any) => alert("❌ त्रुटि: " + (err?.message || "हटाना विफल")),
      }
    );
  };

  // ── Upload Form State ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    year: "",
    description: "",
    fileName: "",
    fileData: "",
  });
  const [fileLabel, setFileLabel] = useState("कोई फाइल नहीं चुनी");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    setForm((prev) => ({ ...prev, fileName: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result?.toString().split(",")[1] || "";
      setForm((prev) => ({ ...prev, fileData: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileData) {
      alert("कृपया पहले एक PDF फाइल चुनें।");
      return;
    }
    createMutation.mutate(
      { data: form },
      {
        onSuccess: () => {
          alert("✅ असाइनमेंट सफलतापूर्वक अपलोड किया गया!");
          setForm({ title: "", subject: "", year: "", description: "", fileName: "", fileData: "" });
          setFileLabel("कोई फाइल नहीं चुनी");
          if (fileInputRef.current) fileInputRef.current.value = "";
          refetchAssignments();
          refetchStats();
        },
        onError: (err: any) => {
          alert("❌ अपलोड विफल: " + (err?.data?.error || err?.message || "कुछ गलत हुआ"));
        },
      }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            व्यवस्थापक डैशबोर्ड
          </h1>
          <p className="text-muted-foreground font-medium mt-1">IGNOU Assignment Wala — Admin Panel</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-red-200 text-red-600 hover:bg-red-50"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          लॉग आउट
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "कुल अनुरोध", value: stats?.totalPayments ?? 0, color: "blue", Icon: CreditCard },
          { label: "लंबित", value: stats?.pendingPayments ?? 0, color: "orange", Icon: Clock },
          { label: "अनुमोदित", value: stats?.approvedPayments ?? 0, color: "green", Icon: CheckCircle2 },
          { label: "अस्वीकृत", value: stats?.rejectedPayments ?? 0, color: "red", Icon: XCircle },
          { label: "असाइनमेंट", value: stats?.totalAssignments ?? 0, color: "purple", Icon: FileText },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label} className={`border-${color}-100 shadow-sm col-span-1`}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Icon className={`w-7 h-7 text-${color}-500 mb-1`} />
              <p className={`text-3xl font-black text-${color}-600`}>{value}</p>
              <p className="text-xs font-bold text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-orange-50 mb-6">
          <TabsTrigger
            value="payments"
            className="font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow"
            data-testid="tab-payments"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            भुगतान अनुरोध
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow"
            data-testid="tab-assignments"
          >
            <FileText className="w-4 h-4 mr-2" />
            असाइनमेंट जोड़ें / देखें
          </TabsTrigger>
        </TabsList>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold">भुगतान अनुरोध</h2>
              <Button variant="outline" size="sm" onClick={() => { refetchPayments(); refetchStats(); }}>
                <RefreshCw className="w-4 h-4 mr-1" /> रीफ्रेश
              </Button>
            </div>
            {paymentsLoading ? (
              <div className="p-8 text-center text-muted-foreground">लोड हो रहा है...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                      <th className="p-4 font-bold">दिनांक</th>
                      <th className="p-4 font-bold">छात्र</th>
                      <th className="p-4 font-bold">UTR</th>
                      <th className="p-4 font-bold">स्थिति</th>
                      <th className="p-4 font-bold text-right">कार्रवाई</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!payments || payments.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          अभी तक कोई भुगतान अनुरोध नहीं आया
                        </td>
                      </tr>
                    )}
                    {payments?.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-orange-50/30 transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap">{formatDate(p.createdAt)}</td>
                        <td className="p-4">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.phone}</p>
                        </td>
                        <td className="p-4 font-mono text-primary font-medium">{p.utrNumber}</td>
                        <td className="p-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-4 text-right">
                          {p.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                onClick={() => handleApprove(p.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${p.id}`}
                              >
                                ✅ अनुमोदित
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => handleReject(p.id)}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${p.id}`}
                              >
                                ❌ अस्वीकृत
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Assignments Tab ── */}
        <TabsContent value="assignments">
          {/* Upload Form — always visible */}
          <div className="bg-gradient-to-br from-orange-50 to-green-50 border-2 border-dashed border-orange-300 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2 mb-5">
              <PlusCircle className="w-6 h-6 text-primary" />
              नया असाइनमेंट अपलोड करें
            </h2>
            <form onSubmit={handleUpload} className="space-y-4" data-testid="form-upload-assignment">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">
                    शीर्षक <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="उदा. MPSE-001 Political Theory (Hindi)"
                    data-testid="input-assignment-title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">
                    विषय कोड <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="उदा. MPSE-001"
                    data-testid="input-assignment-subject"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">
                    सत्र / वर्ष <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="उदा. 2024-25"
                    data-testid="input-assignment-year"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">विवरण (वैकल्पिक)</label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="असाइनमेंट के बारे में..."
                    data-testid="input-assignment-description"
                  />
                </div>
              </div>

              {/* File Picker */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  PDF फाइल चुनें <span className="text-red-500">*</span>
                </label>
                <div
                  className="flex items-center gap-3 p-3 border-2 border-dashed border-orange-200 rounded-lg bg-white cursor-pointer hover:border-orange-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{fileLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {form.fileData ? "✅ फाइल तैयार है" : "यहाँ क्लिक करें या PDF खींचें"}
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-assignment-file"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending || !form.fileData}
                className="w-full h-12 text-lg font-black bg-primary hover:bg-primary/90 text-white"
                data-testid="button-upload-submit"
              >
                {createMutation.isPending ? (
                  "⏳ अपलोड हो रहा है..."
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    असाइनमेंट अपलोड करें
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Assignment List */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                अपलोड किए गए असाइनमेंट ({assignments?.length ?? 0})
              </h2>
              <Button variant="outline" size="sm" onClick={() => refetchAssignments()}>
                <RefreshCw className="w-4 h-4 mr-1" /> रीफ्रेश
              </Button>
            </div>
            {assignmentsLoading ? (
              <div className="p-8 text-center text-muted-foreground">लोड हो रहा है...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                      <th className="p-4 font-bold">शीर्षक</th>
                      <th className="p-4 font-bold">विषय</th>
                      <th className="p-4 font-bold">सत्र</th>
                      <th className="p-4 font-bold">फाइल</th>
                      <th className="p-4 font-bold text-right">हटाएं</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!assignments || assignments.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          अभी तक कोई असाइनमेंट अपलोड नहीं किया गया।
                          <br />
                          <span className="text-sm">ऊपर फॉर्म भरकर पहला असाइनमेंट जोड़ें।</span>
                        </td>
                      </tr>
                    )}
                    {assignments?.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-blue-50/30 transition-colors" data-testid={`row-assignment-${a.id}`}>
                        <td className="p-4 font-bold">{a.title}</td>
                        <td className="p-4">
                          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-sm font-bold">
                            {a.subject}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{a.year}</td>
                        <td className="p-4 text-sm text-blue-600 truncate max-w-[160px]" title={a.fileName}>
                          📄 {a.fileName}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(a.id, a.title)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${a.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";

export default function LayoutWrapper(props: any) {
  return <AppLayout>{props.children}</AppLayout>;
}

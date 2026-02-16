import { HeaderTraceDetail } from "@/components/layout/HeaderTraceDetail";
import { TraceTreeDetail } from "@/components/trace-detail/TraceTreeDetail";
import { DetailsDrawer } from "@/components/trace-detail/DetailsDrawer";

type PageProps = { params: Promise<{ hash: string }> };

export default async function TraceDetailPage({ params }: PageProps) {
  const { hash } = await params;
  const txShort =
    hash.length > 10 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

  return (
    <div className="bg-background-dark text-text-main min-h-screen h-screen overflow-hidden flex flex-col">
      <HeaderTraceDetail txHashShort={txShort} txHash={hash} />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
        <TraceTreeDetail />
        <DetailsDrawer />
      </main>
    </div>
  );
}

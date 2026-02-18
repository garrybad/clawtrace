import Link from "next/link";
import { HeaderDashboard } from "@/components/layout/HeaderDashboard";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { TraceTreePanel } from "@/components/dashboard/TraceTreePanel";
import { ClawAIPanel } from "@/components/dashboard/ClawAIPanel";
import { SimulationCard } from "@/components/dashboard/SimulationCard";
import { AlertTriangle, Copy, Calendar, Blocks, Share2, Bug } from "lucide-react";
import { getTraceData } from "@/lib/trace/trace-service";
// import { useEffect } from "react";

type PageProps = { params: Promise<{ hash: string }> };

export default async function TraceDashboardPage({ params }: PageProps) {
  const { hash } = await params;
  const txShort =
    hash.length > 10 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

  const data = await getTraceData(hash);

  // useEffect(() => {
  //   console.log(data, "ss");
  // }, [data]);

  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-cyber-grid"
        style={{ backgroundSize: "24px 24px" }}
        aria-hidden
      />
      <HeaderDashboard txHash={hash} />
      <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-6 gap-6">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-dim/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-error/15 border border-error/30 text-error text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-glow-error">
                <AlertTriangle className="size-3.5" />
                {data.transaction.summary.status === "success" ? "Success" : "Reverted"}
              </span>
              <h2 className="font-mono text-xl md:text-2xl text-white tracking-tight truncate">
                {hash}
              </h2>
              <button
                type="button"
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="Copy hash"
              >
                <Copy className="size-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {new Date(data.transaction.summary.timestamp * 1000).toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "UTC",
                  timeZoneName: "short",
                })}
              </span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span className="flex items-center gap-1">
                <Blocks className="size-4" />
                Block #{data.transaction.summary.blockNumber.toLocaleString()}
              </span>
            </div>
          </div>
          {/* <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-border-dim bg-surface hover:bg-surface-highlight text-sm font-medium text-text-main transition-colors flex items-center gap-2"
            >
              <Share2 className="size-5" />
              Share
            </button>
            <Link
              href={`/trace/${hash}/detail`}
              className="px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-sm font-bold text-primary transition-colors flex items-center gap-2 shadow-glow"
            >
              <Bug className="size-5" />
              Debug
            </Link>
          </div> */}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <OverviewCard summary={data.transaction.summary} />
          </div>
          <div className={`${data.transaction.summary.status !== "success" ? "lg:col-span-6" : "lg:col-span-9"} flex flex-col h-full min-h-[500px]`}>
            <TraceTreePanel
              hash={hash}
              roots={[]}
              allNodes={[]}
              metadata={data.metadata}
              tenderlyTrace={data.trace}
            />
          </div>
          {data.transaction.summary.status !== "success" && (
            <div className="lg:col-span-3 flex flex-col gap-4">
              <ClawAIPanel
                hash={hash}
                status={data.transaction.summary.status}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

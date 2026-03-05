import KnowledgeNav from '@/components/KnowledgeNav';
import NavBar from '@/components/NavBar';
import { getKnowledgeManifest } from '@/lib/knowledge';

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const manifest = getKnowledgeManifest();
  return (
    <>
      <NavBar />
      <div className="knowledge-docs-layout">
        <KnowledgeNav manifest={manifest} />
        <main className="knowledge-main">
          <div className="knowledge-main-wrap">{children}</div>
        </main>
      </div>
    </>
  );
}

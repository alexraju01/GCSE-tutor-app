import Navbar from "@components/Navbar";

const SiteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} GCSE Ace. All rights reserved.
      </footer>
    </div>
  );
};

export default SiteLayout;

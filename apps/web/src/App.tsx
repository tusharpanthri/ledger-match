import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { DEMO_MODE } from '@/lib/demo';
import { Layout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { TransactionsPage } from "@/pages/transactions";
import { ReconciliationsPage } from "@/pages/reconciliations";
import { ReconciliationDetailPage } from "@/pages/reconciliation-detail";
import { AskPage } from "@/pages/ask";

function App() {
  const Router = DEMO_MODE ? HashRouter : BrowserRouter;
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/reconciliations" element={<ReconciliationsPage />} />
          <Route path="/reconciliations/:id" element={<ReconciliationDetailPage />} />
          <Route path="/ask" element={<AskPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
